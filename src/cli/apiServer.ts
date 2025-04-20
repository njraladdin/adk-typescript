/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { BaseAgent } from '../agents/BaseAgent';
import { LlmAgent } from '../agents/LlmAgent';
import { RunConfig, StreamingMode } from '../agents/RunConfig';
import { InMemoryArtifactService } from '../artifacts/InMemoryArtifactService';
import { InMemoryMemoryService } from '../memory/InMemoryMemoryService';
import { DatabaseSessionService } from '../sessions/databaseSessionService';
import { InMemorySessionService } from '../sessions/inMemorySessionService';
import { Runner } from '../runners';
import { Content } from '../models/types';
import { Session } from '../sessions/interfaces';
import { createEmptyState, loadDotenvForAgent, convertSessionToEvalFormat } from './utils';
import { v4 as uuidv4 } from 'uuid';

// Fix for the Event type conflict - import directly from events directory
import { Event as RunnerEvent } from '../events/Event';

// Interface definitions to replace Pydantic models
interface AgentRunRequest {
  appName: string;
  userId: string;
  sessionId: string;
  newMessage: Content;
  streaming: boolean;
}

interface AddSessionToEvalSetRequest {
  evalId: string;
  sessionId: string;
  userId: string;
}

interface RunEvalRequest {
  evalIds: string[];
  evalMetrics: any[]; 
}

interface RunEvalResult {
  evalSetId: string;
  evalId: string;
  finalEvalStatus: string;
  evalMetricResults: any[];
  sessionId: string;
}

interface ApiServerOptions {
  agentDir: string;
  sessionDbUrl?: string;
  allowOrigins?: string[];
  web: boolean;
  traceToCloud?: boolean;
  port?: number;
}

// Constant for eval session ID prefix
const EVAL_SESSION_ID_PREFIX = 'eval_';

// Constant for eval set file extension
const EVAL_SET_FILE_EXTENSION = '.evalset.json';

/**
 * Creates an Express app that serves as an API server for agents
 * 
 * @param options Configuration options for the server
 * @returns The configured Express app and server
 */
export function createApiServer(options: ApiServerOptions): { app: express.Application, server: http.Server } {
  const { 
    agentDir, 
    sessionDbUrl = '', 
    allowOrigins = ['*'],
    web = false,
    traceToCloud = false,
    port = 8000
  } = options;

  // Trace dictionary for storing trace information
  const traceDict: Record<string, any> = {};

  // Create the Express app
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: allowOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Add middleware
  app.use(express.json());
  app.use(cors({
    origin: allowOrigins,
    credentials: true
  }));

  // Add the agent directory to the module search path
  if (!process.env.NODE_PATH?.includes(agentDir)) {
    process.env.NODE_PATH = (process.env.NODE_PATH || '') + path.delimiter + agentDir;
    // Force Node.js to reload the module paths
    require('module').Module._initPaths();
  }

  // Initialize services
  const runnerDict: Record<string, Runner> = {};
  const rootAgentDict: Record<string, BaseAgent> = {};

  // Build the Artifact service
  const artifactService = new InMemoryArtifactService();
  const memoryService = new InMemoryMemoryService();

  // Build the Session service
  let agentEngineId = '';
  let sessionService: any; // Temporary any type to fix linter error

  if (sessionDbUrl) {
    if (sessionDbUrl.startsWith('agentengine://')) {
      // TODO: Implement VertexAI session service for TypeScript version
      throw new Error('VertexAI session service not implemented in TypeScript version yet');
    } else {
      sessionService = new DatabaseSessionService(sessionDbUrl);
    }
  } else {
    sessionService = new InMemorySessionService();
  }

  // Define API endpoints
  app.get('/list-apps', (req: express.Request, res: express.Response) => {
    const basePath = path.resolve(agentDir);
    if (!fs.existsSync(basePath)) {
      return res.status(404).json({ error: 'Path not found' });
    }
    if (!fs.statSync(basePath).isDirectory()) {
      return res.status(400).json({ error: 'Not a directory' });
    }

    const agentNames = fs.readdirSync(basePath)
      .filter(x => {
        const fullPath = path.join(basePath, x);
        return fs.statSync(fullPath).isDirectory() &&
               !x.startsWith('.') &&
               x !== 'node_modules';
      })
      .sort();
    
    res.json(agentNames);
  });

  app.get('/debug/trace/:eventId', (req: express.Request, res: express.Response) => {
    const { eventId } = req.params;
    const eventDict = traceDict[eventId];
    if (!eventDict) {
      return res.status(404).json({ error: 'Trace not found' });
    }
    res.json(eventDict);
  });

  // Session management endpoints
  app.get('/apps/:appName/users/:userId/sessions/:sessionId', (req: express.Request, res: express.Response) => {
    const { appName, userId, sessionId } = req.params;
    // Connect to managed session if agent_engine_id is set
    const effectiveAppName = agentEngineId || appName;
    
    const session = sessionService.getSession({
      appName: effectiveAppName,
      userId,
      sessionId
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  });

  app.get('/apps/:appName/users/:userId/sessions', (req: express.Request, res: express.Response) => {
    const { appName, userId } = req.params;
    // Connect to managed session if agent_engine_id is set
    const effectiveAppName = agentEngineId || appName;
    
    const sessions = sessionService.listSessions({
      appName: effectiveAppName,
      userId
    }).sessions.filter((session: Session) => 
      // Remove sessions that were generated as a part of Eval
      !session.id.startsWith(EVAL_SESSION_ID_PREFIX)
    );
    
    res.json(sessions);
  });

  app.post('/apps/:appName/users/:userId/sessions/:sessionId', (req: express.Request, res: express.Response) => {
    const { appName, userId, sessionId } = req.params;
    const state = req.body?.state || undefined;
    
    // Connect to managed session if agent_engine_id is set
    const effectiveAppName = agentEngineId || appName;
    
    if (sessionService.getSession({
      appName: effectiveAppName,
      userId,
      sessionId
    })) {
      return res.status(400).json({ error: `Session already exists: ${sessionId}` });
    }
    
    const session = sessionService.createSession({
      appName: effectiveAppName,
      userId,
      state,
      sessionId
    });
    
    console.log(`New session created: ${sessionId}`);
    res.json(session);
  });

  app.post('/apps/:appName/users/:userId/sessions', (req: express.Request, res: express.Response) => {
    const { appName, userId } = req.params;
    const state = req.body?.state || undefined;
    
    // Connect to managed session if agent_engine_id is set
    const effectiveAppName = agentEngineId || appName;
    
    const session = sessionService.createSession({
      appName: effectiveAppName,
      userId,
      state
    });
    
    console.log('New session created');
    res.json(session);
  });

  app.delete('/apps/:appName/users/:userId/sessions/:sessionId', (req: express.Request, res: express.Response) => {
    const { appName, userId, sessionId } = req.params;
    // Connect to managed session if agent_engine_id is set
    const effectiveAppName = agentEngineId || appName;
    
    sessionService.deleteSession({
      appName: effectiveAppName,
      userId,
      sessionId
    });
    
    res.status(204).send();
  });

  // Artifact management endpoints
  app.get('/apps/:appName/users/:userId/sessions/:sessionId/artifacts/:artifactName', 
    (req: express.Request, res: express.Response) => {
      const { appName, userId, sessionId, artifactName } = req.params;
      const version = req.query.version ? parseInt(req.query.version as string) : undefined;
      
      // Connect to managed session if agent_engine_id is set
      const effectiveAppName = agentEngineId || appName;
      
      const artifact = artifactService.loadArtifact({
        appName: effectiveAppName,
        userId,
        sessionId,
        filename: artifactName,
        version
      });
      
      if (!artifact) {
        return res.status(404).json({ error: 'Artifact not found' });
      }
      
      res.json(artifact);
  });

  app.get('/apps/:appName/users/:userId/sessions/:sessionId/artifacts/:artifactName/versions/:versionId', 
    (req: express.Request, res: express.Response) => {
      const { appName, userId, sessionId, artifactName, versionId } = req.params;
      const version = parseInt(versionId);
      
      // Connect to managed session if agent_engine_id is set
      const effectiveAppName = agentEngineId || appName;
      
      const artifact = artifactService.loadArtifact({
        appName: effectiveAppName,
        userId,
        sessionId,
        filename: artifactName,
        version
      });
      
      if (!artifact) {
        return res.status(404).json({ error: 'Artifact not found' });
      }
      
      res.json(artifact);
  });

  app.get('/apps/:appName/users/:userId/sessions/:sessionId/artifacts', 
    (req: express.Request, res: express.Response) => {
      const { appName, userId, sessionId } = req.params;
      
      // Connect to managed session if agent_engine_id is set
      const effectiveAppName = agentEngineId || appName;
      
      // Fix for listArtifactKeys - no filename parameter needed
      const artifactNames = artifactService.listArtifactKeys({
        appName: effectiveAppName,
        userId,
        sessionId
      } as any); // Using 'as any' to bypass TypeScript check as this is how the method is implemented
      
      res.json(artifactNames);
  });

  app.get('/apps/:appName/users/:userId/sessions/:sessionId/artifacts/:artifactName/versions', 
    (req: express.Request, res: express.Response) => {
      const { appName, userId, sessionId, artifactName } = req.params;
      
      // Connect to managed session if agent_engine_id is set
      const effectiveAppName = agentEngineId || appName;
      
      const versions = artifactService.listVersions({
        appName: effectiveAppName,
        userId,
        sessionId,
        filename: artifactName
      });
      
      res.json(versions);
  });

  app.delete('/apps/:appName/users/:userId/sessions/:sessionId/artifacts/:artifactName', 
    (req: express.Request, res: express.Response) => {
      const { appName, userId, sessionId, artifactName } = req.params;
      
      // Connect to managed session if agent_engine_id is set
      const effectiveAppName = agentEngineId || appName;
      
      artifactService.deleteArtifact({
        appName: effectiveAppName,
        userId,
        sessionId,
        filename: artifactName
      });
      
      res.status(204).send();
  });

  // Agent run endpoint
  app.post('/run', async (req: express.Request, res: express.Response) => {
    const runRequest: AgentRunRequest = req.body;
    
    // Connect to managed session if agent_engine_id is set
    const appId = agentEngineId || runRequest.appName;
    
    const session = sessionService.getSession({
      appName: appId,
      userId: runRequest.userId,
      sessionId: runRequest.sessionId
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    try {
      const runner = await getRunner(runRequest.appName);
      const events: RunnerEvent[] = [];
      
      // Collect all events from the runner
      for await (const event of runner.runAsync({
        userId: runRequest.userId,
        sessionId: runRequest.sessionId,
        newMessage: runRequest.newMessage
      })) {
        events.push(event);
      }
      
      console.log(`Generated ${events.length} events in agent run:`, events);
      res.json(events);
    } catch (error) {
      console.error('Error in agent run:', error);
      res.status(500).json({ error: 'Error running agent' });
    }
  });

  // SSE endpoint for streaming responses
  app.post('/run_sse', async (req: express.Request, res: express.Response) => {
    const runRequest: AgentRunRequest = req.body;
    
    // Connect to managed session if agent_engine_id is set
    const appId = agentEngineId || runRequest.appName;
    
    const session = sessionService.getSession({
      appName: appId,
      userId: runRequest.userId,
      sessionId: runRequest.sessionId
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Helper to send SSE data
    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    try {
      const runner = await getRunner(runRequest.appName);
      const streamingMode = runRequest.streaming ? StreamingMode.SSE : StreamingMode.NONE;
      
      // Run the agent and stream events
      for await (const event of runner.runAsync({
        userId: runRequest.userId,
        sessionId: runRequest.sessionId,
        newMessage: runRequest.newMessage,
        runConfig: { streamingMode }
      })) {
        console.log('Generated event in agent run streaming:', event);
        sendEvent(event);
      }
      
      // End the response
      res.end();
    } catch (error) {
      console.error('Error in SSE streaming:', error);
      sendEvent({ error: String(error) });
      res.end();
    }
  });

  // WebSocket support for live interaction
  io.on('connection', (socket) => {
    console.log('New WebSocket connection');
    
    socket.on('run_live', async (data: any) => {
      try {
        const { appName, userId, sessionId, modalities = ['TEXT'] } = data;
        
        // Connect to managed session if agent_engine_id is set
        const effectiveAppName = agentEngineId || appName;
        
        const session = sessionService.getSession({
          appName: effectiveAppName,
          userId,
          sessionId
        });
        
        if (!session) {
          socket.emit('error', { error: 'Session not found' });
          return;
        }
        
        const runner = await getRunner(appName);
        
        // Set up message handling
        socket.on('message', async (messageData: any) => {
          try {
            // Forward message to runner
            // This is a simplified implementation 
            const response = { 
              id: uuidv4(),
              author: 'agent',
              content: {
                role: 'assistant',
                parts: [{ text: `Live response to: ${messageData.text}` }]
              }
            };
            socket.emit('event', response);
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
            socket.emit('error', { error: String(error) });
          }
        });
        
        // Initial response
        socket.emit('ready', { status: 'Agent ready for live interaction' });
        
      } catch (error) {
        console.error('Error in WebSocket setup:', error);
        socket.emit('error', { error: String(error) });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  });

  // Add more endpoints to match Python's fast_api.py functionality

  // Add session to eval set endpoint
  app.post('/apps/:appName/eval_sets/:evalSetId/add_session', async (req: express.Request, res: express.Response) => {
    const { appName, evalSetId } = req.params;
    const requestData: AddSessionToEvalSetRequest = req.body;
    
    // Validate eval ID format
    const pattern = /^[a-zA-Z0-9_]+$/;
    if (!pattern.test(requestData.evalId)) {
      return res.status(400).json({ 
        error: `Invalid eval id. Eval id should have the \`${pattern}\` format` 
      });
    }
    
    // Get the session
    const session = sessionService.getSession({
      appName,
      userId: requestData.userId,
      sessionId: requestData.sessionId
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Load the eval set file data
    const evalSetFilePath = getEvalSetFilePath(appName, evalSetId);
    
    if (!fs.existsSync(evalSetFilePath)) {
      return res.status(404).json({ error: 'Eval set not found' });
    }
    
    try {
      const evalSetDataRaw = fs.readFileSync(evalSetFilePath, 'utf-8');
      const evalSetData = JSON.parse(evalSetDataRaw);
      
      // Check if eval ID already exists
      if (evalSetData.some((item: any) => item.name === requestData.evalId)) {
        return res.status(400).json({
          error: `Eval id \`${requestData.evalId}\` already exists in \`${evalSetId}\` eval set.`
        });
      }
      
      // Convert session to evaluation format
      const testData = convertSessionToEvalFormat(session);
      
      // Get root agent for initial session state
      const rootAgent = await getRootAgent(appName);
      const initialSessionState = createEmptyState(rootAgent);
      
      // Add to eval set
      evalSetData.push({
        name: requestData.evalId,
        data: testData,
        initial_session: {
          state: initialSessionState,
          app_name: appName,
          user_id: requestData.userId
        }
      });
      
      // Write updated eval set back to file
      fs.writeFileSync(evalSetFilePath, JSON.stringify(evalSetData, null, 2));
      
      res.status(201).json({ status: 'success' });
    } catch (error) {
      console.error('Error adding session to eval set:', error);
      res.status(500).json({ error: 'Failed to add session to eval set' });
    }
  });

  // List evals in eval set endpoint
  app.get('/apps/:appName/eval_sets/:evalSetId/evals', (req: express.Request, res: express.Response) => {
    const { appName, evalSetId } = req.params;
    
    // Load the eval set file data
    const evalSetFilePath = getEvalSetFilePath(appName, evalSetId);
    
    if (!fs.existsSync(evalSetFilePath)) {
      return res.status(404).json({ error: 'Eval set not found' });
    }
    
    try {
      const evalSetDataRaw = fs.readFileSync(evalSetFilePath, 'utf-8');
      const evalSetData = JSON.parse(evalSetDataRaw);
      
      const evalIds = evalSetData.map((item: any) => item.name);
      res.json(evalIds.sort());
    } catch (error) {
      console.error('Error listing evals:', error);
      res.status(500).json({ error: 'Failed to list evals' });
    }
  });

  // Run eval endpoint
  app.post('/apps/:appName/eval_sets/:evalSetId/run_eval', async (req: express.Request, res: express.Response) => {
    const { appName, evalSetId } = req.params;
    const requestData: RunEvalRequest = req.body;
    
    // This is a placeholder implementation as the full eval runner would require more code
    // In a complete implementation, this would use the cliEval module
    
    try {
      const evalSetFilePath = getEvalSetFilePath(appName, evalSetId);
      
      if (!fs.existsSync(evalSetFilePath)) {
        return res.status(404).json({ error: 'Eval set not found' });
      }
      
      // Get root agent
      const rootAgent = await getRootAgent(appName);
      
      // Mock response - in a real implementation, this would run the actual evaluations
      const results: RunEvalResult[] = requestData.evalIds.map(evalId => ({
        evalSetId,
        evalId,
        finalEvalStatus: 'SUCCESS',
        evalMetricResults: [],
        sessionId: `eval_${evalId}_${Date.now()}`
      }));
      
      res.json(results);
    } catch (error) {
      console.error('Error running eval:', error);
      res.status(500).json({ error: 'Failed to run eval' });
    }
  });

  // Helper functions for eval set management
  function getEvalSetFilePath(appName: string, evalSetId: string): string {
    return path.join(
      agentDir,
      appName,
      evalSetId + EVAL_SET_FILE_EXTENSION
    );
  }

  // Eval set endpoints
  app.post('/apps/:appName/eval_sets/:evalSetId', (req: express.Request, res: express.Response) => {
    const { appName, evalSetId } = req.params;
    
    // Validate eval set ID
    const pattern = /^[a-zA-Z0-9_]+$/;
    if (!pattern.test(evalSetId)) {
      return res.status(400).json({ 
        error: `Invalid eval set id. Eval set id should have the ${pattern} format` 
      });
    }
    
    // Define the file path
    const newEvalSetPath = getEvalSetFilePath(appName, evalSetId);
    
    console.log(`Creating eval set file ${newEvalSetPath}`);
    
    if (!fs.existsSync(newEvalSetPath)) {
      // Write the JSON string to the file
      console.log("Eval set file doesn't exist, we will create a new one.");
      fs.writeFileSync(newEvalSetPath, JSON.stringify([], null, 2));
    }
    
    res.status(201).send();
  });

  app.get('/apps/:appName/eval_sets', (req: express.Request, res: express.Response) => {
    const { appName } = req.params;
    const evalSetFilePath = path.join(agentDir, appName);
    
    if (!fs.existsSync(evalSetFilePath)) {
      return res.status(404).json({ error: 'App directory not found' });
    }
    
    const evalSets = fs.readdirSync(evalSetFilePath)
      .filter(file => file.endsWith(EVAL_SET_FILE_EXTENSION))
      .map(file => path.basename(file).replace(EVAL_SET_FILE_EXTENSION, ''));
    
    res.json(evalSets.sort());
  });

  /**
   * Helper function to get the root agent for an app
   */
  async function getRootAgent(appName: string): Promise<BaseAgent> {
    if (rootAgentDict[appName]) {
      return rootAgentDict[appName];
    }

    try {
      // Dynamically import the agent module
      const agentModule = require(path.join(agentDir, appName));
      
      if (!agentModule.agent?.rootAgent) {
        throw new Error(`Unable to find "rootAgent" from ${appName}.`);
      }
      
      const rootAgent = agentModule.agent.rootAgent;
      rootAgentDict[appName] = rootAgent;
      return rootAgent;
    } catch (error) {
      console.error(`Error loading root agent for ${appName}:`, error);
      throw error;
    }
  }

  /**
   * Helper function to get a runner for an app
   */
  async function getRunner(appName: string): Promise<Runner> {
    if (runnerDict[appName]) {
      return runnerDict[appName];
    }

    // Load environment variables for the agent
    loadDotenvForAgent('', agentDir);
    
    const rootAgent = await getRootAgent(appName);
    const runner = new Runner({
      appName: agentEngineId || appName,
      agent: rootAgent,
      artifactService,
      sessionService
    });
    
    runnerDict[appName] = runner;
    return runner;
  }

  // If web UI is enabled, serve static files
  if (web) {
    const BASE_DIR = path.dirname(__filename);
    const ANGULAR_DIST_PATH = path.join(BASE_DIR, 'browser');

    // Root redirect to dev-ui
    app.get('/', (req, res) => {
      res.redirect('/dev-ui');
    });
    
    // Dev UI page - serve the index.html file directly
    app.get('/dev-ui', (req, res) => {
      const indexHtmlPath = path.join(ANGULAR_DIST_PATH, 'index.html');
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        // Fallback if index.html not found
        res.status(404).send('Web UI not found. Please make sure the browser directory is properly installed.');
      }
    });
    
    // Serve all static files from the browser directory
    app.use('/', express.static(ANGULAR_DIST_PATH));
    
    console.log(`Serving web UI from ${ANGULAR_DIST_PATH}`);
  }

  // Start the server if a port was provided
  if (port) {
    server.listen(port, () => {
      console.log(`API server running at http://localhost:${port}`);
    });
  }

  // Return both the app and server
  return { app, server };
} 