import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { LlmAgent } from '../agents/LlmAgent';
import { BaseArtifactService } from '../artifacts/BaseArtifactService';
import { InMemoryArtifactService } from '../artifacts/InMemoryArtifactService';
import { Content, Part } from '../models/types';
import { Runner } from '../runners';
import { BaseSessionService } from '../sessions/BaseSessionService';
import { InMemorySessionService } from '../sessions/InMemorySessionService';
import { SessionInterface as Session } from '../sessions/types';
import { State } from '../sessions/State';
import * as envs from './utils/envs';

interface InputFile {
  state: Record<string, any>;
  queries: string[];
}

/**
 * Run an agent using input from a file
 * 
 * @param appName Name of the application
 * @param rootAgent The root agent to run
 * @param artifactService Service for managing artifacts
 * @param session The session to use
 * @param sessionService Service for managing sessions
 * @param inputPath Path to the input file
 */
export async function runInputFile(
  appName: string,
  rootAgent: LlmAgent,
  artifactService: BaseArtifactService,
  session: Session,
  sessionService: BaseSessionService,
  inputPath: string
): Promise<void> {
  const runner = new Runner({
    appName,
    agent: rootAgent,
    artifactService,
    sessionService,
  });

  const inputFileRaw = await promisify(fs.readFile)(inputPath, 'utf-8');
  const inputFile: InputFile = JSON.parse(inputFileRaw);
  
  // Add time to state
  const state = new State({ ...inputFile.state, _time: new Date() });
  session.state = state;
  
  for (const query of inputFile.queries) {
    console.log(`user: ${query}`);
    const content: Content = { 
      role: 'user', 
      parts: [{ text: query } as Part] 
    };
    
    for await (const event of runner.runAsync({
      userId: session.userId,
      sessionId: session.id,
      newMessage: content,
    })) {
      if (event.content && event.content.parts) {
        const text = event.content.parts
          .map((part: Part) => part.text || '')
          .join('');
          
        if (text) {
          console.log(`[${event.author}]: ${text}`);
        }
      }
    }
  }
}

/**
 * Run an agent interactively via CLI
 * 
 * @param appName Name of the application
 * @param rootAgent The root agent to run
 * @param artifactService Service for managing artifacts
 * @param session The session to use
 * @param sessionService Service for managing sessions
 */
export async function runInteractively(
  appName: string,
  rootAgent: LlmAgent,
  artifactService: BaseArtifactService,
  session: Session,
  sessionService: BaseSessionService
): Promise<void> {
  const runner = new Runner({
    appName,
    agent: rootAgent,
    artifactService,
    sessionService,
  });
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));
  
  let isRunning = true;
  while (isRunning) {
    const query = (await ask('user: ')).trim();
    if (!query) continue;
    if (query === 'exit') {
      isRunning = false;
      break;
    }
    
    const content: Content = { 
      role: 'user', 
      parts: [{ text: query } as Part] 
    };
    
    for await (const event of runner.runAsync({
      userId: session.userId,
      sessionId: session.id,
      newMessage: content,
    })) {
      if (event.content && event.content.parts) {
        const text = event.content.parts
          .map((part: Part) => part.text || '')
          .join('');
          
        if (text) {
          console.log(`[${event.author}]: ${text}`);
        }
      }
    }
  }
  
  rl.close();
}

/**
 * Extract conversation contents from session events
 * 
 * @param session The session to extract contents from
 * @returns Array of conversation contents
 */
function getSessionContents(session: Session): Content[] {
  if (!session.events) return [];
  
  return session.events
    .filter(event => event.content && event.content.parts && event.content.parts.length > 0)
    .map(event => event.content as Content);
}

/**
 * Run the CLI for a specific agent
 * 
 * @param options Configuration options
 * @param options.agentParentDir The parent directory of the agent
 * @param options.agentFolderName The folder name of the agent
 * @param options.jsonFilePath Optional path to a JSON file
 * @param options.saveSession Whether to save the session after running
 */
export async function runCli({
  agentParentDir,
  agentFolderName,
  jsonFilePath,
  saveSession = false,
}: {
  agentParentDir: string;
  agentFolderName: string;
  jsonFilePath?: string;
  saveSession: boolean;
}): Promise<void> {
  // Add agent parent directory to the module search path
  if (!process.env.PYTHONPATH?.includes(agentParentDir)) {
    process.env.PYTHONPATH = (process.env.PYTHONPATH || '') + path.delimiter + agentParentDir;
  }

  // Initialize services
  const artifactService = new InMemoryArtifactService();
  const sessionService = new InMemorySessionService();
  const session = sessionService.createSession({
    appName: agentFolderName,
    userId: 'test_user',
  });

  // Resolve the agent path more carefully
  let agentModulePath: string;
  
  // Check if we're in the agent directory or parent directory
  const currentDir = process.cwd();
  const tentativeSrcPath = path.resolve(currentDir, agentFolderName, 'src');
  const directSrcPath = path.resolve(currentDir, 'src');
  
  // In TypeScript we use agent.ts directly instead of index.ts
  // This better matches the Python ADK where agent.py is the main file
  if (fs.existsSync(path.resolve(tentativeSrcPath, 'agent.ts'))) {
    // If we're in the parent directory and agent folder has src/agent.ts
    agentModulePath = path.resolve(tentativeSrcPath, 'agent.ts');
  } else if (fs.existsSync(path.resolve(directSrcPath, 'agent.ts'))) {
    // If we're already in the agent directory and src/agent.ts exists
    agentModulePath = path.resolve(directSrcPath, 'agent.ts');
  } else {
    // Fall back to directly looking for agent.ts in the specified path
    agentModulePath = path.resolve(process.cwd(), agentParentDir, agentFolderName, 'agent.ts');
  }
  
  console.log(`Loading agent from: ${agentModulePath}`);
  
  try {
    // Load environment variables for the agent
    envs.loadDotenvForAgent(agentFolderName, agentParentDir);
    
    // Use ts-node to load the TypeScript module
    try {
      // First try using ts-node/register to load the module
      require('ts-node/register');
      const agentModule = require(agentModulePath);
      
      // Get the rootAgent from the module
      const rootAgent = agentModule.rootAgent || (agentModule.default && agentModule.default.rootAgent);
      
      if (!rootAgent) {
        throw new Error(`Could not find rootAgent in module ${agentModulePath}. Make sure it exports a 'rootAgent' property.`);
      }
      
      if (jsonFilePath) {
        if (jsonFilePath.endsWith('.input.json')) {
          // Run with input file
          await runInputFile(
            agentFolderName,
            rootAgent,
            artifactService,
            session,
            sessionService,
            jsonFilePath
          );
        } else if (jsonFilePath.endsWith('.session.json')) {
          // Load session from file
          const sessionRaw = await promisify(fs.readFile)(jsonFilePath, 'utf-8');
          const loadedSession = JSON.parse(sessionRaw);
          
          // Merge session data into our session object
          session.id = loadedSession.id || session.id;
          session.appName = loadedSession.appName || session.appName;
          session.userId = loadedSession.userId || session.userId;
          session.state = loadedSession.state || session.state;
          session.events = loadedSession.events || session.events;
          
          // Print conversation history
          const contents = getSessionContents(session);
          for (const content of contents) {
            if (content.role === 'user') {
              console.log('user: ', content.parts[0].text);
            } else {
              console.log(content.parts[0].text);
            }
          }
          
          // Run interactively
          await runInteractively(
            agentFolderName,
            rootAgent,
            artifactService,
            session,
            sessionService
          );
        } else {
          console.error(`Unsupported file type: ${jsonFilePath}`);
          process.exit(1);
        }
      } else {
        // Run interactively without input file
        console.log(`Running agent ${rootAgent.name}, type exit to exit.`);
        await runInteractively(
          agentFolderName,
          rootAgent,
          artifactService,
          session,
          sessionService
        );
      }

      // Save session if requested
      if (saveSession) {
        let sessionPath: string;
        if (jsonFilePath) {
          sessionPath = jsonFilePath.replace('.input.json', '.session.json');
        } else {
          // Ask for session ID
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });
          const sessionId = await new Promise<string>(resolve => {
            rl.question('Session ID to save: ', resolve);
          });
          rl.close();
          
          sessionPath = path.join(agentModulePath, `${sessionId}.session.json`);
        }
        
        // Fetch updated session
        const updatedSession = sessionService.getSession({
          appName: session.appName,
          userId: session.userId,
          sessionId: session.id,
        }) || session;
        
        // Save session to file
        await promisify(fs.writeFile)(
          sessionPath, 
          JSON.stringify(updatedSession, null, 2)
        );
        
        console.log('Session saved to', sessionPath);
      }
    } catch (error) {
      console.error('Error loading agent module:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running CLI:', error);
    process.exit(1);
  }
} 