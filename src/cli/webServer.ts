// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import express, { Request, Response } from 'express';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { InMemorySessionService } from '../sessions/inMemorySessionService';
import { InMemoryArtifactService } from '../artifacts/InMemoryArtifactService';
import { Runner } from '../runners';
import { BaseAgent } from '../agents/BaseAgent';
import { Content, Part } from '../models/types';
import { LlmRegistry } from '../models';
import * as envs from './utils/envs';

/**
 * Checks if a directory is a valid agent directory (contains index.ts)
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
  
  // Check for index.ts file
  const indexPath = path.join(absolutePath, 'index.ts');
  console.log(`Checking for index.ts at ${indexPath}`);
  const indexExists = fs.existsSync(indexPath);
  
  if (indexExists) {
    console.log(`Found index.ts at ${indexPath}`);
  } else {
    console.log(`No index.ts found at ${indexPath}`);
    
    // Alternative: look for agent.ts as a fallback
    const agentPath = path.join(absolutePath, 'agent.ts');
    console.log(`Checking for agent.ts at ${agentPath}`);
    const agentExists = fs.existsSync(agentPath);
    
    if (agentExists) {
      console.log(`Found agent.ts at ${agentPath}`);
      return true;
    }
  }
  
  return indexExists;
}

/**
 * Gets all agent directories in a parent directory
 * 
 * @param parentDir Parent directory to search in
 * @returns Array of agent directory names
 */
function getAgentDirectories(parentDir: string): string[] {
  if (!fs.existsSync(parentDir)) return [];
  
  return fs.readdirSync(parentDir)
    .filter(name => {
      const dirPath = path.join(parentDir, name);
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
  
  // REST API Endpoints for session management
  
  // Create a new session
  app.post('/apps/:appName/users/:userId/sessions', (req: Request, res: Response) => {
    try {
      const { appName, userId } = req.params;
      const state = req.body.state || {};
      
      console.log(`Creating new session for app: ${appName}, user: ${userId}`);
      
      // Determine the agent path - use the appName as a subdirectory of agentDir
      // or use agentDir directly if the appName matches the last part of agentDir
      let agentPath = appName;
      if (path.basename(agentDir) !== appName) {
        agentPath = path.join(agentDir, appName);
      } else {
        agentPath = agentDir;
      }
      
      console.log(`Using agent path: ${agentPath}`);
      
      // Try to load the agent to verify it exists
      try {
        const rootAgent = loadAgent(agentPath);
        console.log(`Successfully loaded agent: ${rootAgent.name}`);
      } catch (agentError) {
        console.error('Error loading agent:', agentError);
        res.status(404).json({ error: `Agent '${appName}' not found or invalid` });
        return;
      }
      
      // Create a new session using the shared session service
      const session = sessionService.createSession({
        appName,
        userId,
        state
      });
      
      console.log(`Created session: ${session.id}`);
      
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
      
      // Fetch the session from the shared service
      const session = sessionService.getSession({
        appName,
        userId,
        sessionId
      });
      
      if (!session) {
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
  
  // Endpoint to list available agents
  app.get('/list-apps', (req: Request, res: Response) => {
    try {
      // If a specific relative path is provided in the query, use that
      // Otherwise use the agentDir that was passed to createWebServer
      const relativePath = req.query.relative_path as string || agentDir;
      const baseDir = path.resolve(process.cwd(), relativePath);
      
      console.log('List-apps request received');
      console.log('Agent directory parameter:', agentDir);
      console.log('Requested relative path:', relativePath);
      console.log('Resolved base directory:', baseDir);
      
      // Get all agent directories
      let agentDirs: string[] = [];
      
      // First check if the specified directory itself is an agent directory
      if (isAgentDirectory(baseDir)) {
        console.log(`Base directory ${baseDir} is itself an agent directory`);
        agentDirs = [path.basename(baseDir)];
      } else {
        // Otherwise look for agent directories inside it
        console.log(`Looking for agent directories inside ${baseDir}`);
        const potentialDirs = fs.readdirSync(baseDir);
        console.log('Potential directories found:', potentialDirs);
        
        potentialDirs.forEach(dir => {
          const fullPath = path.join(baseDir, dir);
          if (isAgentDirectory(fullPath)) {
            agentDirs.push(dir);
          }
        });
        
        console.log('Agent directories found:', agentDirs);
      }
      
      // If no agents were found, add a fallback option - use the directory itself
      if (agentDirs.length === 0) {
        console.log('No agent directories found, using fallback');
        const dirName = path.basename(baseDir);
        agentDirs = [dirName];
      }
      
      // Format response
      const agents = agentDirs.map(dir => ({
        name: dir,
        path: dir
      }));
      
      console.log('Sending response:', { agents });
      res.json({ agents });
    } catch (error) {
      console.error('Error listing agents:', error);
      res.status(500).json({ error: 'Failed to list agents' });
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
    
    // Determine the agent file path (either index.ts or agent.ts)
    let agentModulePath = path.join(absolutePath, 'index.ts');
    let useAgentTs = false;
    
    if (!fs.existsSync(agentModulePath)) {
      // Try agent.ts as a fallback
      const agentTsPath = path.join(absolutePath, 'agent.ts');
      if (fs.existsSync(agentTsPath)) {
        agentModulePath = agentTsPath;
        useAgentTs = true;
        console.log(`Using agent.ts instead of index.ts at ${agentModulePath}`);
      } else {
        throw new Error(`Could not find either index.ts or agent.ts in ${absolutePath}`);
      }
    }
    
    console.log(`Loading agent from: ${agentModulePath}`);
    
    // Get the base name and parent directory for loading environment variables
    const baseName = path.basename(agentDirectory);
    const parentDir = path.dirname(absolutePath);
    
    // Load environment variables for the agent
    envs.loadDotenvForAgent(baseName, parentDir);
    
    try {
      // Import agent module
      const agentModule = require(agentModulePath);
      
      // Get the rootAgent
      let rootAgent;
      
      if (useAgentTs) {
        // If using agent.ts, the rootAgent might be exported directly
        rootAgent = agentModule.rootAgent || 
                   (typeof agentModule === 'object' && 'name' in agentModule ? agentModule : null);
      } else {
        // For index.ts, look for rootAgent or check default export
        rootAgent = agentModule.rootAgent || 
                   (agentModule.default && agentModule.default.rootAgent);
      }
      
      if (!rootAgent) {
        throw new Error(`Could not find rootAgent in module ${agentModulePath}`);
      }
      
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
        const agentPath = data.agentPath || agentDir;
        console.log(`Initializing agent at path: ${agentPath}`);
        
        // Define the effective agent path - using similar logic to runCli function
        let effectiveAgentPath = agentPath;
        
        // Check for possible agent locations in order of priority
        const possiblePaths = [
          // Direct path (if absolute)
          path.isAbsolute(agentPath) ? agentPath : null,
          
          // Direct path as subdirectory of current directory
          path.resolve(process.cwd(), agentPath),
          
          // As subdirectory of agentDir
          path.join(agentDir, agentPath),
          
          // In examples/ subdirectory
          path.resolve(process.cwd(), 'examples', agentPath)
        ].filter(p => p !== null);
        
        // Find the first path that exists and contains an index.ts file
        let foundValidPath = false;
        for (const potentialPath of possiblePaths) {
          const indexPath = path.join(potentialPath!, 'index.ts');
          console.log(`Checking for agent at: ${potentialPath}, index: ${indexPath}`);
          
          if (fs.existsSync(indexPath)) {
            effectiveAgentPath = potentialPath!;
            foundValidPath = true;
            console.log(`Found valid agent path: ${effectiveAgentPath}`);
            break;
          }
        }
        
        if (!foundValidPath) {
          throw new Error(`Could not find agent at any of the potential paths: ${possiblePaths.join(', ')}`);
        }
        
        console.log(`Using effective agent path: ${effectiveAgentPath}`);
        
        const rootAgent = loadAgent(effectiveAgentPath);
        
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
        
        // Verify the session exists
        const session = sessionService.getSession({
          appName: runner.appName,
          userId: userIdsBySocketId.get(socket.id) || socket.id,
          sessionId
        });
        
        if (!session) {
          console.error(`Session not found: ${sessionId} for user ${userIdsBySocketId.get(socket.id) || socket.id} and app ${runner.appName}`);
          socket.emit('error', { message: 'Session not found. Try reconnecting.' });
          return;
        }
        
        const message = data.message.trim();
        if (!message) {
          socket.emit('error', { message: 'Empty message' });
          return;
        }
        
        console.log(`Processing message from ${socket.id} (user ${userIdsBySocketId.get(socket.id) || socket.id}) in session ${sessionId}: "${message}"`);
        
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
            userId: userIdsBySocketId.get(socket.id) || socket.id,
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
  const uiDir = path.join(__dirname, 'browser');
  
  if (fs.existsSync(uiDir)) {
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
              <p>No UI is available. UI directory not found at: ${uiDir}</p>
              <p>Make sure you've built the UI with: <code>npm run build-ui</code></p>
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