 

import express, { Request, Response } from 'express';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { InMemorySessionService } from '../sessions/InMemorySessionService';
import { InMemoryArtifactService } from '../artifacts/InMemoryArtifactService';
import { Runner } from '../runners';
import { BaseAgent } from '../agents/BaseAgent';
import { Content, Part } from '../models/types';
import { LlmRegistry } from '../models';
import * as envs from './utils/envs';

/**
 * Checks if a directory is a valid agent directory (contains agent.ts)
 * 
 * @param dirPath Path to directory to check
 * @returns True if directory is a valid agent directory
 */
function isAgentDirectory(dirPath: string): boolean {
  console.log(`Checking if ${dirPath} is an agent directory`);
  
  // Make sure we have an absolute path
  const absolutePath = path.isAbsolute(dirPath) ? dirPath : path.resolve(process.cwd(), dirPath);
  console.log(`Resolved absolute path: ${absolutePath}`);
  
  // Check if the directory exists
  if (!fs.existsSync(absolutePath)) {
    console.log(`Directory ${absolutePath} does not exist`);
    return false;
  }
  
  // Check if it's a directory
  if (!fs.statSync(absolutePath).isDirectory()) {
    console.log(`${absolutePath} is not a directory`);
    return false;
  }
  
  // First check: Is there a src/agent.ts file (preferred structure)
  const srcAgentPath = path.join(absolutePath, 'src', 'agent.ts');
  if (fs.existsSync(srcAgentPath)) {
    console.log(`Found agent.ts at ${srcAgentPath}`);
    return true;
  }
  
  // Second check: Is there a direct agent.ts file
  const agentPath = path.join(absolutePath, 'agent.ts');
  if (fs.existsSync(agentPath)) {
    console.log(`Found agent.ts at ${agentPath}`);
    return true;
  }
  
  // Third check: Look for the legacy index.ts file
  const srcIndexPath = path.join(absolutePath, 'src', 'index.ts');
  if (fs.existsSync(srcIndexPath)) {
    console.log(`Found index.ts at ${srcIndexPath}`);
    return true;
  }
  
  const indexPath = path.join(absolutePath, 'index.ts');
  if (fs.existsSync(indexPath)) {
    console.log(`Found index.ts at ${indexPath}`);
    return true;
  }
  
  console.log(`No agent files found in ${absolutePath}`);
  return false;
}

/**
 * Gets all agent directories in a parent directory
 * 
 * @param parentDir Parent directory to search in
 * @returns Array of agent directory names
 */
function getAgentDirectories(parentDir: string): string[] {
  if (!fs.existsSync(parentDir)) return [];
  
  // Directories to exclude (similar to Python's __pycache__)
  const excludeDirs = [
    'node_modules',
    'dist',
    '.git',
    '.github',
    '.vscode',
    '.idea',
  ];
  
  return fs.readdirSync(parentDir)
    .filter(name => {
      // Exclude dot directories (like .git)
      if (name.startsWith('.')) {
        return false;
      }
      
      // Exclude specific directories
      if (excludeDirs.includes(name)) {
        return false;
      }
      
      const dirPath = path.join(parentDir, name);
      
      // Must be a directory
      if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        return false;
      }
      
      // Must contain agent.ts or index.ts files
      return isAgentDirectory(dirPath);
    });
}

/**
 * Creates a web server for agents
 * 
 * @param params Configuration parameters
 * @param params.agentDir Directory containing agent modules
 * @param params.port Port to run the server on
 * @param params.allowOrigins Allowed origins for CORS
 * @returns Object containing Express app and HTTP server
 */
export function createWebServer(params: {
  agentDir: string;
  port: number;
  allowOrigins: string[];
}): { app: express.Express; server: http.Server } {
  const { agentDir, port, allowOrigins } = params;
  
  // Create Express app
  const app = express();
  
  // Setup CORS
  app.use(cors({
    origin: allowOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }));
  
  // Parse JSON request bodies
  app.use(express.json());
  
  // Create HTTP server
  const server = http.createServer(app);
  
  // Create Socket.IO server
  const io = new SocketIOServer(server, {
    cors: {
      origin: allowOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  
  // Create shared services
  const sessionService = new InMemorySessionService();
  const artifactService = new InMemoryArtifactService();
  
  // Map of agents by directory
  const agentsByDir = new Map<string, BaseAgent>();
  
  // Map of runners by socket ID
  const runnersBySocketId = new Map<string, Runner>();
  
  // Map of sessions by socket ID
  const sessionsBySocketId = new Map<string, string>();
  
  // Map of user IDs by socket ID
  const userIdsBySocketId = new Map<string, string>();
  
  /**
   * Helper function to find a session, trying multiple app names if needed
   * 
   * @param appName The app name to search for
   * @param userId The user ID
   * @param sessionId The session ID
   * @returns The session if found, or null
   */
  async function findSession(appName: string, userId: string, sessionId: string): Promise<any | null> {
    // First try with the provided app name
    let session = sessionService.getSession({
      appName,
      userId,
      sessionId
    });
    
    // If session not found, try loading the agent to get its actual name
    if (!session) {
      try {
        console.log(`Session not found with app name "${appName}", trying to load agent to get actual name`);
        
        // Try to load the agent from either the appName directory or directly
        let agentModulePath;
        const isSpecificAgentDir = !agentDir.endsWith('adk-typescript') && !agentDir.endsWith('src');
        
        if (isSpecificAgentDir && path.basename(agentDir) === appName) {
          agentModulePath = agentDir;
        } else {
          agentModulePath = path.join(agentDir, appName);
        }
        
        try {
          const rootAgent = loadAgent(agentModulePath);
          console.log(`Loaded agent with name: ${rootAgent.name}, trying this as app name`);
          
          // Try with the original app name from request instead of agent's name
          session = sessionService.getSession({
            appName,
            userId,
            sessionId
          });
          
          if (session) {
            console.log(`Found session using app name: ${appName}`);
          }
        } catch (agentError) {
          // Try loading from agent directory directly as fallback
          if (agentModulePath !== agentDir) {
            try {
              const rootAgent = loadAgent(agentDir);
              console.log(`Loaded agent directly with name: ${rootAgent.name}, trying this as app name`);
              
              // Try with the original app name from request instead of agent's name
              session = sessionService.getSession({
                appName,
                userId,
                sessionId
              });
              
              if (session) {
                console.log(`Found session using app name: ${appName}`);
              }
            } catch (directError) {
              console.error('Error loading agent directly:', directError);
            }
          }
        }
      } catch (error) {
        console.error('Error while trying agent name fallbacks:', error);
      }
    }
    
    return session;
  }
  
  // REST API Endpoints for session management
  
  // Endpoint to list available agents
  app.get('/list-apps', (req: Request, res: Response) => {
    try {
      // When a specific agent directory is provided on the command line (e.g., examples/simple_agent),
      // we should list only that agent or agents within that directory, not the entire project structure
      
      // If this is a specific agent directory (not the project root), prioritize it
      const isSpecificAgentDir = !agentDir.endsWith('adk-typescript') && !agentDir.endsWith('src');
      
      // Respect the command-line agent directory if specified
      const basePath = isSpecificAgentDir ? 
        path.resolve(agentDir) : 
        (req.query.relative_path ? path.resolve(process.cwd(), req.query.relative_path as string) : path.resolve(agentDir));
      
      console.log('List-apps request received');
      console.log('Agent directory specified:', agentDir);
      console.log('Resolved path for listing:', basePath);
      
      if (!fs.existsSync(basePath)) {
        return res.status(404).json({ error: 'Path not found' });
      }
      
      if (!fs.statSync(basePath).isDirectory()) {
        return res.status(400).json({ error: 'Not a directory' });
      }
      
      // If the requested path is a direct agent directory (has agent.ts or index.ts), return just that agent
      if (isAgentDirectory(basePath)) {
        const agentName = path.basename(basePath);
        console.log(`Detected direct agent directory: ${agentName}`);
        res.json([agentName]);
        return;
      }
      
      // Otherwise list directories that are valid agents
      const agentNames = getAgentDirectories(basePath).sort();
      
      console.log('Found agent directories:', agentNames);
      console.log('Sending response:', agentNames);
      res.json(agentNames);
    } catch (error) {
      console.error('Error listing agents:', error);
      res.status(500).json({ error: 'Failed to list agents' });
    }
  });
  
  // Create a new session
  app.post('/apps/:appName/users/:userId/sessions', (req: Request, res: Response) => {
    try {
      const { appName, userId } = req.params;
      const state = req.body.state || {};
      
      console.log(`Creating new session for app: ${appName}, user: ${userId}`);
      
      // Load the agent just to verify it exists (same as Python version)
      let agentModulePath;
      const isSpecificAgentDir = !agentDir.endsWith('adk-typescript') && !agentDir.endsWith('src');
      
      if (isSpecificAgentDir && path.basename(agentDir) === appName) {
        agentModulePath = agentDir;
        console.log(`Using agent directory directly: ${agentModulePath}`);
      } else {
        agentModulePath = path.join(agentDir, appName);
        console.log(`Looking for agent module at: ${agentModulePath}`);
      }
      
      // Try to load the agent to verify it exists (but we don't use its name for session)
      try {
        const rootAgent = loadAgent(agentModulePath);
        console.log(`Successfully loaded agent: ${rootAgent.name}`);
      } catch (agentError) {
        console.error('Error loading agent:', agentError);
        
        // If not found in the specific path, try to load directly from agentDir
        try {
          if (agentModulePath !== agentDir) {
            console.log(`Trying to load agent directly from: ${agentDir}`);
            const rootAgent = loadAgent(agentDir);
            console.log(`Successfully loaded agent directly: ${rootAgent.name}`);
          } else {
            throw agentError;
          }
        } catch (directError: any) {
          console.error('Error loading agent directly:', directError);
          res.status(404).json({ error: `Agent '${appName}' not found or invalid` });
          return;
        }
      }
      
      // Create a new session using the shared session service
      // IMPORTANT: Use the app name from the request parameters (like Python implementation)
      const session = sessionService.createSession({
        appName,  // Simply use appName as provided in the URL
        userId,
        state
      });
      
      console.log(`Created session: ${session.id} with app name: ${appName}`);
      
      // Return the session
      res.json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });
  
  // Get a specific session
  app.get('/apps/:appName/users/:userId/sessions/:sessionId', (req: Request, res: Response) => {
    try {
      const { appName, userId, sessionId } = req.params;
      
      console.log(`Getting session: app=${appName}, user=${userId}, session=${sessionId}`);
      
      // Direct lookup without fallbacks (like Python version)
      const session = sessionService.getSession({
        appName,
        userId,
        sessionId
      });
      
      if (!session) {
        console.log(`Session not found: ${sessionId}`);
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json(session);
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(404).json({ error: 'Session not found' });
    }
  });
  
  // List sessions for a user
  app.get('/apps/:appName/users/:userId/sessions', (req: Request, res: Response) => {
    try {
      const { appName, userId } = req.params;
      
      // Get sessions from the shared service
      const sessions = sessionService.listSessions({ appName, userId });
      
      // Return the sessions or an empty array
      res.json(sessions?.sessions || []);
    } catch (error) {
      console.error('Error listing sessions:', error);
      res.status(500).json({ error: 'Failed to list sessions' });
    }
  });
  
  // Delete a session
  app.delete('/apps/:appName/users/:userId/sessions/:sessionId', (req: Request, res: Response) => {
    try {
      const { appName, userId, sessionId } = req.params;
      
      // For simplicity, we'll just acknowledge the delete
      // since InMemorySessionService doesn't persist sessions across requests
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  });
  
  // Regular (non-streaming) agent run endpoint
  app.post('/run', async (req: Request, res: Response) => {
    try {
      const runRequest = req.body as {
        app_name: string;
        user_id: string;
        session_id: string;
        new_message: Content;
      };
      
      console.log(`Regular run request for app: ${runRequest.app_name}, user: ${runRequest.user_id}, session: ${runRequest.session_id}`);
      
      // Verify the session exists - direct lookup without fallbacks
      const session = sessionService.getSession({
        appName: runRequest.app_name,
        userId: runRequest.user_id,
        sessionId: runRequest.session_id
      });
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Try to load the agent - first from app_name subdirectory, then directly
      let rootAgent: BaseAgent;
      try {
        const agentModulePath = path.join(agentDir, runRequest.app_name);
        rootAgent = loadAgent(agentModulePath);
      } catch (error) {
        // Try loading directly from agentDir
        try {
          rootAgent = loadAgent(agentDir);
        } catch (directError: any) {
          res.status(404).json({ error: `Agent not found: ${directError.message}` });
          return;
        }
      }
      
      // Create a runner
      const runner = new Runner({
        appName: runRequest.app_name, // Use app_name directly from request
        agent: rootAgent,
        sessionService,
        artifactService
      });
      
      // Collect all events
      const events = [];
      for await (const event of runner.runAsync({
        userId: runRequest.user_id,
        sessionId: runRequest.session_id,
        newMessage: runRequest.new_message
      })) {
        events.push(event);
      }
      
      // Return all events
      res.json(events);
    } catch (error) {
      console.error('Error in run endpoint:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // SSE endpoint for streaming responses
  app.post('/run_sse', async (req: Request, res: Response) => {
    try {
      const runRequest = req.body as {
        app_name: string;
        user_id: string;
        session_id: string;
        new_message: Content;
        streaming?: boolean;
      };
      
      console.log(`SSE run request for app: ${runRequest.app_name}, user: ${runRequest.user_id}, session: ${runRequest.session_id}`);
      
      // Verify the session exists - direct lookup without fallbacks
      const session = sessionService.getSession({
        appName: runRequest.app_name,
        userId: runRequest.user_id,
        sessionId: runRequest.session_id
      });
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx
      
      // Helper to send SSE data
      const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };
      
      // Try to load the agent - first from app_name subdirectory, then directly
      let rootAgent: BaseAgent;
      try {
        const agentModulePath = path.join(agentDir, runRequest.app_name);
        rootAgent = loadAgent(agentModulePath);
      } catch (error) {
        // Try loading directly from agentDir
        try {
          rootAgent = loadAgent(agentDir);
        } catch (directError: any) {
          console.error(`Agent not found: ${directError.message}`);
          sendEvent({ error: `Agent not found: ${directError.message}` });
          return res.end();
        }
      }
      
      // Create a runner
      const runner = new Runner({
        appName: runRequest.app_name, // Use app_name directly from request
        agent: rootAgent,
        sessionService,
        artifactService
      });
      
      // Run and stream events
      try {
        for await (const event of runner.runAsync({
          userId: runRequest.user_id,
          sessionId: runRequest.session_id,
          newMessage: runRequest.new_message
        })) {
          sendEvent(event);
        }
        
        // End the response
        res.end();
      } catch (runError) {
        console.error('Error in SSE streaming:', runError);
        sendEvent({ error: String(runError) });
        res.end();
      }
    } catch (error) {
      console.error('Error in run_sse endpoint:', error);
      // For SSE, we need to send the error as an event
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
      }
      res.end();
    }
  });
  
  // Load agent from directory
  function loadAgent(agentDirectory: string): BaseAgent {
    if (agentsByDir.has(agentDirectory)) {
      console.log(`Using cached agent for ${agentDirectory}`);
      return agentsByDir.get(agentDirectory)!;
    }
    
    // Handle relative paths
    let absolutePath;
    if (path.isAbsolute(agentDirectory)) {
      absolutePath = agentDirectory;
    } else {
      absolutePath = path.resolve(process.cwd(), agentDirectory);
    }
    
    console.log(`Loading agent from directory: ${absolutePath}`);
    
    // Check multiple possible locations for the agent file
    const possibleAgentPaths = [
      // Check for src/agent.ts first (preferred structure)
      path.join(absolutePath, 'src', 'agent.ts'),
      // Then direct agent.ts
      path.join(absolutePath, 'agent.ts'),
      // Then legacy src/index.ts
      path.join(absolutePath, 'src', 'index.ts'),
      // Finally legacy index.ts
      path.join(absolutePath, 'index.ts')
    ];
    
    let agentModulePath = null;
    for (const filePath of possibleAgentPaths) {
      if (fs.existsSync(filePath)) {
        agentModulePath = filePath;
        console.log(`Found agent file at: ${filePath}`);
        break;
      }
    }
    
    if (!agentModulePath) {
      throw new Error(`Could not find agent file in ${absolutePath}. Checked: ${possibleAgentPaths.join(', ')}`);
    }
    
    // Get the base name and parent directory for loading environment variables
    const baseName = path.basename(agentDirectory);
    const parentDir = path.dirname(absolutePath);
    
    // Load environment variables for the agent
    envs.loadDotenvForAgent(baseName, parentDir);
    
    try {
      // Import agent module
      console.log(`Requiring agent module from: ${agentModulePath}`);
      
      // Use ts-node to handle TypeScript files if needed
      try {
        require('ts-node/register');
      } catch (err) {
        console.warn('Failed to register ts-node. If agent uses TypeScript, this might cause issues.');
      }
      
      const agentModule = require(agentModulePath);
      
      // Get the rootAgent
      let rootAgent;
      
      // Check multiple possible export patterns
      if (agentModule.rootAgent) {
        // Direct export of rootAgent
        rootAgent = agentModule.rootAgent;
      } else if (agentModule.default && agentModule.default.rootAgent) {
        // Default export with rootAgent property
        rootAgent = agentModule.default.rootAgent;
      } else if (typeof agentModule === 'object' && 'name' in agentModule) {
        // The module itself might be the agent
        rootAgent = agentModule;
      } else if (agentModule.default && typeof agentModule.default === 'object' && 'name' in agentModule.default) {
        // Default export might be the agent
        rootAgent = agentModule.default;
      }
      
      if (!rootAgent) {
        throw new Error(`Could not find rootAgent in module ${agentModulePath}. Available exports: ${Object.keys(agentModule).join(', ')}`);
      }
      
      console.log(`Successfully loaded agent: ${rootAgent.name}`);
      agentsByDir.set(agentDirectory, rootAgent);
      return rootAgent;
    } catch (error) {
      console.error(`Error loading agent from ${agentModulePath}:`, error);
      throw error;
    }
  }
  
  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Handle agent initialization
    socket.on('initialize_agent', async (data: { agentPath: string, sessionId?: string, userId?: string }) => {
      try {
        const agentPath = data.agentPath || path.basename(agentDir);
        console.log(`Initializing agent with path: ${agentPath}`);
        
        // Create paths to try in order of priority
        const pathsToTry = [
          // 1. As subdirectory of agentDir (the standard case)
          path.join(agentDir, agentPath),
          
          // 2. Direct path if it's absolute
          path.isAbsolute(agentPath) ? agentPath : null,
          
          // 3. Direct path as subdirectory of current directory
          path.resolve(process.cwd(), agentPath),
          
          // 4. The agentDir itself (if it is the agent)
          agentDir
        ].filter((p): p is string => p !== null); // Type assertion to make typescript happy
        
        console.log('Attempting to load agent from these paths:', pathsToTry);
        
        // Try each path in order
        let rootAgent: BaseAgent | null = null;
        let effectiveAgentPath: string | null = null;
        
        for (const tryPath of pathsToTry) {
          try {
            console.log(`Trying to load agent from: ${tryPath}`);
            rootAgent = loadAgent(tryPath);
            effectiveAgentPath = tryPath;
            console.log(`Successfully loaded agent from: ${tryPath}`);
            break;
          } catch (err: any) { // Type as any to allow message access
            console.log(`Failed to load agent from ${tryPath}: ${err.message || String(err)}`);
          }
        }
        
        if (!rootAgent || !effectiveAgentPath) {
          throw new Error(`Could not find agent at any of the paths: ${pathsToTry.join(', ')}`);
        }
        
        // Get session ID and user ID from the data or create defaults
        let sessionId = data.sessionId;
        const userId = data.userId || socket.id;
        
        // Verify the session exists
        if (sessionId) {
          const session = sessionService.getSession({
            appName: rootAgent.name,
            userId: userId,
            sessionId: sessionId
          });
          
          if (!session) {
            console.log(`Session ${sessionId} not found, creating a new one`);
            sessionId = undefined; // Force creation of a new session
          } else {
            console.log(`Found existing session: ${session.id}`);
          }
        }
        
        // Create a new session if needed
        if (!sessionId) {
          const session = sessionService.createSession({
            appName: rootAgent.name,
            userId: userId
          });
          sessionId = session.id;
          console.log(`Created new session: ${sessionId}`);
        }
        
        // Create runner using the shared services
        const runner = new Runner({
          appName: rootAgent.name,
          agent: rootAgent,
          sessionService,
          artifactService
        });
        
        // Store runner and session ID for this socket
        runnersBySocketId.set(socket.id, runner);
        sessionsBySocketId.set(socket.id, sessionId);
        userIdsBySocketId.set(socket.id, userId);
        
        socket.emit('agent_initialized', {
          agentName: rootAgent.name,
          sessionId: sessionId
        });
        
        console.log(`Agent initialized for ${socket.id}: ${rootAgent.name}, sessionId: ${sessionId}`);
      } catch (error) {
        console.error('Error initializing agent:', error);
        socket.emit('error', { message: 'Failed to initialize agent: ' + (error instanceof Error ? error.message : String(error)) });
      }
    });
    
    // Handle run_live WebSocket events (similar to Python's /run_live endpoint)
    socket.on('run_live', async (data: { 
      app_name: string, 
      user_id: string, 
      session_id: string, 
      modalities?: string[] 
    }) => {
      try {
        const { app_name, user_id, session_id } = data;
        
        // Verify the session exists
        const session = sessionService.getSession({
          appName: app_name,
          userId: user_id,
          sessionId: session_id
        });
        
        if (!session) {
          socket.emit('error', { error: 'Session not found' });
          return;
        }
        
        // Try to load the agent
        let rootAgent: BaseAgent;
        try {
          const agentModulePath = path.join(agentDir, app_name);
          rootAgent = loadAgent(agentModulePath);
        } catch (error) {
          // Try loading directly from agentDir
          try {
            rootAgent = loadAgent(agentDir);
          } catch (directError: any) {
            socket.emit('error', { error: `Agent not found: ${directError.message}` });
            return;
          }
        }
        
        // Create a runner
        const runner = new Runner({
          appName: app_name, // Use app_name directly from request
          agent: rootAgent,
          sessionService,
          artifactService
        });
        
        // Create a live request queue (simplified version as we don't have full LiveRequestQueue implementation)
        const messageQueue: any[] = [];
        let isProcessing = false;
        
        // Function to process the next message in the queue
        const processNextMessage = async () => {
          if (isProcessing || messageQueue.length === 0) return;
          
          isProcessing = true;
          const messageData = messageQueue.shift();
          
          try {
            // Process the message
            const content: Content = {
              role: 'user',
              parts: [{ text: messageData.text || messageData.content || '' }]
            };
            
            // Run the agent
            for await (const event of runner.runAsync({
              userId: user_id,
              sessionId: session_id,
              newMessage: content
            })) {
              // Send event to client
              socket.emit('event', event);
            }
          } catch (error) {
            console.error('Error processing message:', error);
            socket.emit('error', { error: String(error) });
          } finally {
            isProcessing = false;
            
            // Process next message if any
            if (messageQueue.length > 0) {
              processNextMessage();
            }
          }
        };
        
        // Set up event handler for messages
        socket.on('message', (messageData: any) => {
          messageQueue.push(messageData);
          processNextMessage();
        });
        
        // Inform client that live session is ready
        socket.emit('live_ready');
        
      } catch (error) {
        console.error('Error in run_live:', error);
        socket.emit('error', { error: String(error) });
      }
    });
    
    // Handle messages
    socket.on('message', async (data: { message: string }) => {
      try {
        const runner = runnersBySocketId.get(socket.id);
        const sessionId = sessionsBySocketId.get(socket.id);
        
        if (!runner) {
          socket.emit('error', { message: 'Agent not initialized' });
          return;
        }
        
        if (!sessionId) {
          socket.emit('error', { message: 'No session ID available' });
          return;
        }
        
        const userId = userIdsBySocketId.get(socket.id) || socket.id;
        
        // Verify the session exists - direct lookup without fallbacks
        const session = sessionService.getSession({
          appName: runner.appName,
          userId: userId,
          sessionId
        });
        
        if (!session) {
          console.error(`Session not found: ${sessionId} for user ${userId} and app ${runner.appName}`);
          socket.emit('error', { message: 'Session not found. Try reconnecting.' });
          return;
        }
        
        const message = data.message.trim();
        if (!message) {
          socket.emit('error', { message: 'Empty message' });
          return;
        }
        
        console.log(`Processing message from ${socket.id} (user ${userId}) in session ${sessionId}: "${message}"`);
        
        // Create user message
        const userMessage: Content = {
          role: 'user',
          parts: [{ text: message } as Part]
        };
        
        // Run the agent
        socket.emit('thinking', { status: 'Agent is thinking...' });
        
        let responseText = '';
        
        // Stream response events
        try {
          for await (const event of runner.runAsync({
            userId: userId,
            sessionId: sessionId,
            newMessage: userMessage
          })) {
            if (event.content?.parts) {
              const text = event.content.parts
                .filter((part: Part) => part.text)
                .map((part: Part) => part.text || '')
                .join('');
              
              if (text) {
                responseText = text;
                socket.emit('response_chunk', { 
                  text: text,
                  author: event.author,
                  partial: event.partial || false
                });
              }
            }
            
            // Handle function calls if needed
            if (event.getFunctionCalls && event.getFunctionCalls().length > 0) {
              socket.emit('function_calls', { 
                calls: event.getFunctionCalls()
              });
            }
            
            // Handle function responses if needed  
            if (event.getFunctionResponses && event.getFunctionResponses().length > 0) {
              socket.emit('function_responses', { 
                responses: event.getFunctionResponses()
              });
            }
          }
          
          // Send complete response
          socket.emit('response_complete', { 
            text: responseText
          });
        } catch (runError) {
          console.error('Error running agent:', runError);
          socket.emit('error', { 
            message: 'Error processing your message: ' + 
                    (runError instanceof Error ? runError.message : String(runError)) 
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('error', { 
          message: 'Error processing your message: ' + 
                  (error instanceof Error ? error.message : String(error)) 
        });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      runnersBySocketId.delete(socket.id);
      sessionsBySocketId.delete(socket.id);
      userIdsBySocketId.delete(socket.id);
    });
  });
  
  // Serve UI files
  // Check multiple possible locations for browser files
  const possibleUiDirs = [
    path.join(__dirname, 'browser'),                    // Regular dist location
    path.join(__dirname, '..', '..', 'src', 'cli', 'browser'), // Source location
    path.resolve(process.cwd(), 'src', 'cli', 'browser')      // Current working directory
  ];

  let uiDir = null;
  for (const dir of possibleUiDirs) {
    if (fs.existsSync(dir)) {
      uiDir = dir;
      console.log(`Found UI files at: ${dir}`);
      break;
    }
  }

  if (uiDir) {
    // Serve static files
    app.use(express.static(uiDir));
    
    // Serve index.html for all routes (SPA support)
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/') || req.path === '/list-apps') {
        // Let API endpoints be handled by their respective handlers
        return;
      }
      res.sendFile(path.join(uiDir, 'index.html'));
    });
    
    console.log(`Serving UI from: ${uiDir}`);
  } else {
    // If no UI is available, provide a simple status page
    app.get('/', (req: Request, res: Response) => {
      res.send(`
        <html>
          <head>
            <title>ADK Web Server</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #333; }
              .info { background: #f5f5f5; padding: 20px; border-radius: 5px; }
              code { background: #eee; padding: 2px 5px; border-radius: 3px; }
            </style>
          </head>
          <body>
            <h1>ADK Web Server</h1>
            <div class="info">
              <p>Server is running on port ${port}</p>
              <p>Agent directory: ${path.resolve(agentDir)}</p>
              <p>Connect via Socket.IO to interact with the agent</p>
              <p>No UI is available. UI directory not found.</p>
              <p>Checked these locations:</p>
              <ul>
                ${possibleUiDirs.map(dir => `<li><code>${dir}</code></li>`).join('\n              ')}
              </ul>
              <p>This likely means the browser folder was not included in the package.</p>
            </div>
          </body>
        </html>
      `);
    });
  }
  
  return { app, server };
}

/**
 * Starts a web server for the specified agent
 * 
 * @param params Configuration parameters
 * @param params.agentDir Directory containing the agent
 * @param params.port Port to run the server on
 * @param params.allowOrigins Allowed origins for CORS
 */
export function startWebServer(params: {
  agentDir: string;
  port: number;
  allowOrigins: string[];
}): void {
  const { agentDir, port, allowOrigins } = params;
  
  try {
    const { server } = createWebServer({
      agentDir,
      port,
      allowOrigins
    });
    
    server.listen(port, () => {
      console.log(`ADK Web Server running at http://localhost:${port}`);
      console.log(`Agent directory: ${path.resolve(agentDir)}`);
      console.log("Open your browser to interact with your agent!");
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down web server...');
      server.close(() => {
        console.log('Web server stopped');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error starting web server:', error);
    process.exit(1);
  }
} 