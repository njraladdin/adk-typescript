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

// Import ts-node programmatically to register TypeScript support
import { register } from 'ts-node';

interface InputFile {
  state: Record<string, any>;
  queries: string[];
}

/**
 * Run an agent using input from a file
 * 
 * @param appName Name of the application
 * @param userId User ID to create the session with
 * @param rootAgent The root agent to run
 * @param artifactService Service for managing artifacts
 * @param sessionService Service for managing sessions
 * @param inputPath Path to the input file
 * @returns The created session
 */
export async function runInputFile(
  appName: string,
  userId: string,
  rootAgent: LlmAgent,
  artifactService: BaseArtifactService,
  sessionService: BaseSessionService,
  inputPath: string
): Promise<Session> {
  const runner = new Runner({
    appName,
    agent: rootAgent,
    artifactService,
    sessionService,
  });

  const inputFileRaw = await promisify(fs.readFile)(inputPath, 'utf-8');
  const inputFile: InputFile = JSON.parse(inputFileRaw);
  
  // Add time to state
  const state = { ...inputFile.state, _time: new Date() };
  
  // Create a new session with the state
  const session = await sessionService.createSession({
    appName,
    userId,
    state,
  });
  
  for (const query of inputFile.queries) {
    console.log(`[user]: ${query}`);
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

  return session;
}

/**
 * Run an agent interactively via CLI
 * 
 * @param rootAgent The root agent to run
 * @param artifactService Service for managing artifacts
 * @param session The session to use
 * @param sessionService Service for managing sessions
 */
export async function runInteractively(
  rootAgent: LlmAgent,
  artifactService: BaseArtifactService,
  session: Session,
  sessionService: BaseSessionService
): Promise<void> {
  const runner = new Runner({
    appName: session.appName,
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
    const query = (await ask('[user]: ')).trim();
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
 * @param options.replayFile Optional path to a replay JSON file with initial state and queries
 * @param options.resumeFile Optional path to a previously saved session file
 * @param options.saveSession Whether to save the session after running
 * @param options.sessionId Optional session ID to save the session to on exit
 */
export async function runCli({
  agentParentDir,
  agentFolderName,
  replayFile,
  resumeFile,
  saveSession = false,
  sessionId,
}: {
  agentParentDir: string;
  agentFolderName: string;
  replayFile?: string;
  resumeFile?: string;
  saveSession: boolean;
  sessionId?: string;
}): Promise<void> {
  // Add agent parent directory to the module search path
  if (!process.env.PYTHONPATH?.includes(agentParentDir)) {
    process.env.PYTHONPATH = (process.env.PYTHONPATH || '') + path.delimiter + agentParentDir;
  }

  // Initialize services
  const artifactService = new InMemoryArtifactService();
  const sessionService = new InMemorySessionService();
  const userId = 'test_user';
  
  // Create a default session
  let session = await sessionService.createSession({
    appName: agentFolderName,
    userId,
  });

  // Resolve the agent path efficiently with early exit
  const currentDir = process.cwd();
  
  // Define search paths in order of preference (most common first)
  const searchPaths = [
    path.resolve(currentDir, agentFolderName, 'agent.ts'),
    path.resolve(currentDir, agentFolderName, 'src', 'agent.ts'),
    path.resolve(agentParentDir, agentFolderName, 'agent.ts'),
    path.resolve(agentParentDir, agentFolderName, 'src', 'agent.ts'),
  ];

  let agentModulePath: string | null = null;
  
  // Find the first existing path (early exit optimization)
  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      agentModulePath = searchPath;
      break;
    }
  }

  if (!agentModulePath) {
    throw new Error(
      `Could not find agent file for '${agentFolderName}'.\n` +
      `Looked for agent in current directory ('${currentDir}') and parent directory ('${agentParentDir}').`
    );
  }
  
  console.log(`Loading agent from: ${agentModulePath}`);
  
  try {
    // Load environment variables for the agent
    envs.loadDotenvForAgent(agentFolderName, agentParentDir);
    
    try {
      // Register TypeScript compiler with optimized settings
      register({
        transpileOnly: true,
        compilerOptions: {
          module: 'Node16',
          moduleResolution: 'Node16',
          target: 'ES2020',
          skipLibCheck: true,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
        },
      });
      
      // Load the agent module
      const agentModule = require(agentModulePath);
      
      // Get the rootAgent from the module
      const rootAgent = agentModule.rootAgent || (agentModule.default && agentModule.default.rootAgent);
      
      if (!rootAgent) {
        throw new Error(`Could not find rootAgent in module ${agentModulePath}. Make sure it exports a 'rootAgent' property.`);
      }
      
      if (replayFile) {
        // Run with replay file (creates a new session and runs queries)
        session = await runInputFile(
          agentFolderName,
          userId,
          rootAgent,
          artifactService,
          sessionService,
          replayFile
        );
      } else if (resumeFile) {
        // Load session from file and replay events
        const sessionRaw = await promisify(fs.readFile)(resumeFile, 'utf-8');
        const loadedSession = JSON.parse(sessionRaw);
        
        // Merge session data into our session object
        session.id = loadedSession.id || session.id;
        session.appName = loadedSession.appName || session.appName;
        session.userId = loadedSession.userId || session.userId;
        session.state = loadedSession.state || session.state;
        
        // Replay all events from the loaded session
        if (loadedSession.events && Array.isArray(loadedSession.events)) {
          for (const event of loadedSession.events) {
            await sessionService.appendEvent({ session, event });
            
            // Display the content for each event
            if (event.content && event.content.parts && event.content.parts.length > 0) {
              const text = event.content.parts[0].text;
              if (text) {
                if (event.author === 'user') {
                  console.log(`[user]: ${text}`);
                } else {
                  console.log(`[${event.author}]: ${text}`);
                }
              }
            }
          }
        }
        
        // Continue with interactive mode
        await runInteractively(
          rootAgent,
          artifactService,
          session,
          sessionService
        );
      } else {
        // Run interactively without input file
        console.log(`Running agent ${rootAgent.name}, type exit to exit.`);
        await runInteractively(
          rootAgent,
          artifactService,
          session,
          sessionService
        );
      }

      // Save session if requested
      if (saveSession) {
        let sessionPath: string;
        if (replayFile) {
          sessionPath = replayFile.replace('.input.json', '.session.json');
        } else {
          // Use provided session ID or ask for one
          const finalSessionId = sessionId || await new Promise<string>(resolve => {
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
            });
            rl.question('Session ID to save: ', (answer) => {
              rl.close();
              resolve(answer);
            });
          });
          
          sessionPath = path.join(path.dirname(agentModulePath), `${finalSessionId}.session.json`);
        }
        
        // Fetch updated session
        const updatedSession = await sessionService.getSession({
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