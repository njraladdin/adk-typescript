import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import * as chokidar from 'chokidar';
import { BaseAgent } from '../agents/BaseAgent';
import { LlmAgent } from '../agents/LlmAgent';
import { BaseToolset } from '../tools/BaseToolset';
import { RunConfig, StreamingMode } from '../agents/RunConfig';
import { InMemoryArtifactService } from '../artifacts/InMemoryArtifactService';
import { InMemoryMemoryService } from '../memory/InMemoryMemoryService';
import { DatabaseSessionService } from '../sessions/DatabaseSessionService';
import { InMemorySessionService } from '../sessions/InMemorySessionService';
import { Runner } from '../runners';
import { Content } from '../models/types';
import { SessionInterface as Session } from '../sessions/types';
import { createEmptyState, loadDotenvForAgent } from './utils';
import { convertSessionToEvalInvocations } from './utils/evals';
import { v4 as uuidv4 } from 'uuid';
import { LocalEvalSetsManager } from '../evaluation/LocalEvalSetsManager';
import { EvalCase } from '../evaluation/EvalCase';

// Fix for the Event type conflict - import directly from events directory
import { Event as RunnerEvent } from '../events/Event';

// Import the LiveRequestQueue and LiveRequest interfaces/classes
import { LiveRequest, LiveRequestQueue } from '../agents/LiveRequestQueue';

// Import agent_graph
import * as agentGraph from './agentGraph';

// Import evaluation types
import { EvalCaseResult, EvalSetResult } from './cliEval';

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
  evalSetFile: string;
  evalSetId: string;
  evalId: string;
  finalEvalStatus: string;
  evalMetricResults: any[];
  userId: string;
  sessionId: string;
}

interface ApiServerOptions {
  agentDir: string;
  sessionDbUrl?: string;
  allowOrigins?: string[];
  web: boolean;
  traceToCloud?: boolean;
  port?: number;
  reload?: boolean;
}

// Constant for eval session ID prefix
const EVAL_SESSION_ID_PREFIX = 'eval_';

// Constant for eval set file extension
const EVAL_SET_FILE_EXTENSION = '.evalset.json';
const EVAL_SET_RESULT_FILE_EXTENSION = '.evalset_result.json';

// Interface for OpenTelemetry-like span structure
interface ReadableSpan {
  name: string;
  context: {
    traceId: number;
    spanId: number;
  };
  startTime: number;
  endTime: number;
  attributes: Record<string, any>;
  parent?: {
    spanId: number;
  };
}

// In-memory span exporter class
class InMemoryExporter {
  private spans: ReadableSpan[] = [];
  private traceDict: Record<string, number[]>;

  constructor(traceDict: Record<string, number[]>) {
    this.traceDict = traceDict;
  }

  export(spans: ReadableSpan[]): boolean {
    for (const span of spans) {
      const traceId = span.context.traceId;
      if (span.name === "call_llm") {
        const attributes = span.attributes;
        const sessionId = attributes['gcp.vertex.agent.session_id'];
        if (sessionId) {
          if (!this.traceDict[sessionId]) {
            this.traceDict[sessionId] = [traceId];
          } else {
            this.traceDict[sessionId].push(traceId);
          }
        }
      }
    }
    this.spans.push(...spans);
    return true;
  }

  getFinishedSpans(sessionId: string): ReadableSpan[] {
    const traceIds = this.traceDict[sessionId];
    if (!traceIds || traceIds.length === 0) {
      return [];
    }
    return this.spans.filter(span => traceIds.includes(span.context.traceId));
  }

  forceFlush(timeoutMillis: number = 30000): boolean {
    return true;
  }

  clear(): void {
    this.spans.length = 0;
  }
}

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
    port = 8000,
    reload = true
  } = options;

  // Trace dictionary for storing trace information
  const traceDict: Record<string, any> = {};
  const sessionTraceDict: Record<string, number[]> = {};

  // Create in-memory exporter for session tracing
  const memoryExporter = new InMemoryExporter(sessionTraceDict);

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
  const toolsetsToClose: Set<BaseToolset> = new Set();

  // Build the Artifact service
  const artifactService = new InMemoryArtifactService();
  const memoryService = new InMemoryMemoryService();

  const evalSetsManager = new LocalEvalSetsManager(agentDir);

  // Build the Session service
  const agentEngineId = '';
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

  // Helper function to collect all toolsets from an agent tree
  function getAllToolsets(agent: BaseAgent): Set<BaseToolset> {
    const toolsets = new Set<BaseToolset>();
    if (agent instanceof LlmAgent) {
      for (const toolUnion of agent.tools) {
        if (toolUnion instanceof BaseToolset) {
          toolsets.add(toolUnion);
        }
      }
    }
    for (const subAgent of agent.subAgents) {
      const subToolsets = getAllToolsets(subAgent);
      subToolsets.forEach(toolset => toolsets.add(toolset));
    }
    return toolsets;
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

  app.get('/debug/trace/session/:sessionId', (req: express.Request, res: express.Response) => {
    const { sessionId } = req.params;
    const spans = memoryExporter.getFinishedSpans(sessionId);
    if (!spans || spans.length === 0) {
      return res.json([]);
    }
    
    const result = spans.map(span => ({
      name: span.name,
      span_id: span.context.spanId,
      trace_id: span.context.traceId,
      start_time: span.startTime,
      end_time: span.endTime,
      attributes: span.attributes,
      parent_span_id: span.parent?.spanId || null
    }));
    
    res.json(result);
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
    const { state } = req.body;
    // Connect to managed session if agent_engine_id is set
    const effectiveAppName = agentEngineId || appName;
    
    const existingSession = sessionService.getSession({
      appName: effectiveAppName,
      userId,
      sessionId
    });
    
    if (existingSession) {
      console.warn(`Session already exists: ${sessionId}`);
      return res.status(400).json({ error: `Session already exists: ${sessionId}` });
    }
    
    const newSession = sessionService.createSession({
      appName: effectiveAppName,
      userId,
      sessionId,
      state: state || {}
    });
    
    res.json(newSession);
  });

  app.post('/apps/:appName/users/:userId/sessions', (req: express.Request, res: express.Response) => {
    const { appName, userId } = req.params;
    const { state } = req.body;
    // Connect to managed session if agent_engine_id is set
    const effectiveAppName = agentEngineId || appName;
    
    const newSession = sessionService.createSession({
      appName: effectiveAppName,
      userId,
      state: state || {}
    });
    
    res.json(newSession);
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

  // Artifact endpoints
  app.get('/apps/:appName/users/:userId/sessions/:sessionId/artifacts/:artifactName', async (req: express.Request, res: express.Response) => {
    const { appName, userId, sessionId, artifactName } = req.params;
    const { version } = req.query;
    const effectiveAppName = agentEngineId || appName;
    
    try {
      const artifact = await artifactService.loadArtifact({
        appName: effectiveAppName,
        userId,
        sessionId,
        filename: artifactName,
        version: version ? parseInt(version as string) : undefined
      });
      
      if (!artifact) {
        return res.status(404).json({ error: 'Artifact not found' });
      }
      
      res.json(artifact);
    } catch (error) {
      console.error('Error loading artifact:', error);
      res.status(500).json({ error: 'Error loading artifact' });
    }
  });

  app.get('/apps/:appName/users/:userId/sessions/:sessionId/artifacts/:artifactName/versions/:versionId', async (req: express.Request, res: express.Response) => {
    const { appName, userId, sessionId, artifactName, versionId } = req.params;
    const effectiveAppName = agentEngineId || appName;
    
    try {
      const artifact = await artifactService.loadArtifact({
        appName: effectiveAppName,
        userId,
        sessionId,
        filename: artifactName,
        version: parseInt(versionId)
      });
      
      if (!artifact) {
        return res.status(404).json({ error: 'Artifact not found' });
      }
      
      res.json(artifact);
    } catch (error) {
      console.error('Error loading artifact version:', error);
      res.status(500).json({ error: 'Error loading artifact version' });
    }
  });

  app.get('/apps/:appName/users/:userId/sessions/:sessionId/artifacts', async (req: express.Request, res: express.Response) => {
    const { appName, userId, sessionId } = req.params;
    const effectiveAppName = agentEngineId || appName;
    
    try {
      const artifactNames = await artifactService.listArtifactKeys({
        appName: effectiveAppName,
        userId,
        sessionId,
        filename: '' // Required by interface but not used by implementation
      });
      
      res.json(artifactNames);
    } catch (error) {
      console.error('Error listing artifacts:', error);
      res.status(500).json({ error: 'Error listing artifacts' });
    }
  });

  app.get('/apps/:appName/users/:userId/sessions/:sessionId/artifacts/:artifactName/versions', async (req: express.Request, res: express.Response) => {
    const { appName, userId, sessionId, artifactName } = req.params;
    const effectiveAppName = agentEngineId || appName;
    
    try {
      const versions = await artifactService.listVersions({
        appName: effectiveAppName,
        userId,
        sessionId,
        filename: artifactName
      });
      
      res.json(versions);
    } catch (error) {
      console.error('Error listing artifact versions:', error);
      res.status(500).json({ error: 'Error listing artifact versions' });
    }
  });

  app.delete('/apps/:appName/users/:userId/sessions/:sessionId/artifacts/:artifactName', async (req: express.Request, res: express.Response) => {
    const { appName, userId, sessionId, artifactName } = req.params;
    const effectiveAppName = agentEngineId || appName;
    
    try {
      await artifactService.deleteArtifact({
        appName: effectiveAppName,
        userId,
        sessionId,
        filename: artifactName
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting artifact:', error);
      res.status(500).json({ error: 'Error deleting artifact' });
    }
  });

  // Agent run endpoints
  app.post('/run', async (req: express.Request, res: express.Response) => {
    const requestData: AgentRunRequest = req.body;
    const { appName, userId, sessionId, newMessage } = requestData;
    
    try {
      // Connect to managed session if agent_engine_id is set
      const appId = agentEngineId || appName;
      
      const session = sessionService.getSession({
        appName: appId,
        userId,
        sessionId
      });
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      const runner = await getRunner(appName);
      const events: RunnerEvent[] = [];
      
      for await (const event of runner.runAsync({
        userId,
        sessionId,
        newMessage
      })) {
        events.push(event);
      }
      
      console.info(`Generated ${events.length} events in agent run:`, events);
      res.json(events);
    } catch (error) {
      console.error('Error in agent run:', error);
      res.status(500).json({ error: 'Error in agent run' });
    }
  });

  app.post('/run_sse', async (req: express.Request, res: express.Response) => {
    const requestData: AgentRunRequest = req.body;
    const { appName, userId, sessionId, newMessage, streaming } = requestData;
    
    try {
      // Connect to managed session if agent_engine_id is set
      const appId = agentEngineId || appName;
      
      const session = sessionService.getSession({
        appName: appId,
        userId,
        sessionId
      });
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });
      
      const runner = await getRunner(appName);
      const streamMode = streaming ? StreamingMode.SSE : StreamingMode.NONE;
      
      try {
        for await (const event of runner.runAsync({
          userId,
          sessionId,
          newMessage,
          runConfig: new RunConfig({ streamingMode: streamMode })
        })) {
          const sseEvent = JSON.stringify(event);
          console.info('Generated event in agent run streaming:', sseEvent);
          res.write(`data: ${sseEvent}\n\n`);
        }
      } catch (error) {
        console.error('Error in event generator:', error);
        res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
      }
      
      res.end();
    } catch (error) {
      console.error('Error in SSE agent run:', error);
      res.status(500).json({ error: 'Error in SSE agent run' });
    }
  });

  // Add session to eval set endpoint
  app.post('/apps/:appName/eval_sets/:evalSetId/add_session', async (req: express.Request, res: express.Response) => {
    const { appName, evalSetId } = req.params;
    const requestData: AddSessionToEvalSetRequest = req.body;
    
    try {
      // Get the session
      const session = sessionService.getSession({
        appName,
        userId: requestData.userId,
        sessionId: requestData.sessionId
      });
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Convert the session data to eval invocations
      const invocations = convertSessionToEvalInvocations(session);
      
      // Populate the session with initial session state
      const rootAgent = await getRootAgent(appName);
      const initialSessionState = createEmptyState(rootAgent);
      
      const newEvalCase: EvalCase = {
        evalId: requestData.evalId,
        conversation: invocations,
        sessionInput: {
          appName: appName,
          userId: requestData.userId,
          state: initialSessionState
        },
        creationTimestamp: Date.now() / 1000
      };
      
      try {
        evalSetsManager.addEvalCase(appName, evalSetId, newEvalCase);
        res.status(201).send();
      } catch (error) {
        if (error instanceof Error) {
          return res.status(400).json({ error: error.message });
        }
        return res.status(400).json({ error: 'Unknown error occurred' });
      }
    } catch (error) {
      console.error('Error adding session to eval set:', error);
      res.status(500).json({ error: 'Error adding session to eval set' });
    }
  });

  // List evals in eval set endpoint
  app.get('/apps/:appName/eval_sets/:evalSetId/evals', (req: express.Request, res: express.Response) => {
    const { appName, evalSetId } = req.params;
    
    try {
      const evalSetData = evalSetsManager.getEvalSet(appName, evalSetId);
      const evalNames = evalSetData.evalCases.map(x => x.evalId).sort();
      res.json(evalNames);
    } catch (error) {
      console.error('Error listing evals in eval set:', error);
      res.status(500).json({ error: 'Error listing evals in eval set' });
    }
  });

  // Helper function to collect and transform eval results
  async function collectAndTransformEvalResults(
    evalSetToEvals: Record<string, string[]>,
    rootAgent: any,
    evalMetrics: any[],
    sessionService: any,
    artifactService: any,
    evalSetId: string,
    appName: string
  ): Promise<{ runEvalResults: RunEvalResult[], evalCaseResults: EvalCaseResult[] }> {
    const { runEvals } = require('./cliEval');
    const runEvalResults: RunEvalResult[] = [];
    const evalCaseResults: EvalCaseResult[] = [];
    
    for await (const evalResult of runEvals({
      evalSetToEvals,
      rootAgent,
      resetFunc: undefined,
      evalMetrics,
      sessionService,
      artifactService,
      printDetailedResults: false
    })) {
      runEvalResults.push({
        evalSetFile: evalResult.evalSetFile,
        evalSetId,
        evalId: evalResult.evalId,
        finalEvalStatus: evalResult.finalEvalStatus === 1 ? 'PASSED' : 
                         evalResult.finalEvalStatus === 2 ? 'FAILED' : 'NOT_EVALUATED',
        evalMetricResults: evalResult.evalMetricResults,
        userId: evalResult.userId || 'test_user_id',
        sessionId: evalResult.sessionId
      });
      
      // Get session details for the eval case result
      const session = sessionService.getSession({
        appName,
        userId: evalResult.userId || 'test_user_id',
        sessionId: evalResult.sessionId
      });
      
      evalCaseResults.push({
        evalSetFile: evalResult.evalSetFile,
        evalId: evalResult.evalId,
        finalEvalStatus: evalResult.finalEvalStatus,
        evalMetricResults: evalResult.evalMetricResults,
        sessionId: evalResult.sessionId,
        sessionDetails: session,
        userId: evalResult.userId || 'test_user_id'
      });
    }
    
    return { runEvalResults, evalCaseResults };
  }

  // Run eval endpoint
  app.post('/apps/:appName/eval_sets/:evalSetId/run_eval', async (req: express.Request, res: express.Response) => {
    const { appName, evalSetId } = req.params;
    const requestData: RunEvalRequest = req.body;
    
    try {
      // Load environment variables
      loadDotenvForAgent(path.basename(appName), agentDir);
      
      const evalSetFilePath = path.join(agentDir, appName, evalSetId + EVAL_SET_FILE_EXTENSION);
      
      if (!fs.existsSync(evalSetFilePath)) {
        return res.status(404).json({ error: 'Eval set not found' });
      }
      
      // Get root agent
      const rootAgent = await getRootAgent(appName);
      
      // Create a mapping from eval set file to all the evals that needed to be run
      const evalSetToEvals: Record<string, string[]> = {
        [evalSetFilePath]: requestData.evalIds
      };
      
      if (!requestData.evalIds || requestData.evalIds.length === 0) {
        console.log('Eval ids to run list is empty. We will run all evals in the eval set.');
      }
      
      const { runEvalResults, evalCaseResults } = await collectAndTransformEvalResults(
        evalSetToEvals,
        rootAgent,
        requestData.evalMetrics,
        sessionService,
        artifactService,
        evalSetId,
        appName
      );
      
      // Create eval set result
      const timestamp = Date.now() / 1000; // Convert to seconds
      const evalSetResultName = `${appName}_${evalSetId}_${timestamp}`;
      const evalSetResult: EvalSetResult = {
        evalSetResultId: evalSetResultName,
        evalSetResultName,
        evalSetId,
        evalCaseResults,
        creationTimestamp: timestamp
      };
      
      // Write eval result file
      const appEvalHistoryDir = path.join(agentDir, appName, '.adk', 'eval_history');
      if (!fs.existsSync(appEvalHistoryDir)) {
        fs.mkdirSync(appEvalHistoryDir, { recursive: true });
      }
      
      // Convert to JSON and write to file
      const evalSetResultFilePath = path.join(
        appEvalHistoryDir,
        evalSetResultName + EVAL_SET_RESULT_FILE_EXTENSION
      );
      
      console.info('Writing eval result to file:', evalSetResultFilePath);
      fs.writeFileSync(evalSetResultFilePath, JSON.stringify(evalSetResult, null, 2));
      
      res.json(runEvalResults);
    } catch (error) {
      console.error('Error running eval:', error);
      res.status(500).json({ error: 'Failed to run eval' });
    }
  });

  // Get eval result endpoint
  app.get('/apps/:appName/eval_results/:evalResultId', (req: express.Request, res: express.Response) => {
    const { appName, evalResultId } = req.params;
    
    try {
      // Load the eval set result file data
      const maybeEvalResultFilePath = path.join(
        agentDir,
        appName,
        '.adk',
        'eval_history',
        evalResultId + EVAL_SET_RESULT_FILE_EXTENSION
      );
      
      if (!fs.existsSync(maybeEvalResultFilePath)) {
        return res.status(404).json({ 
          error: `Eval result \`${evalResultId}\` not found.` 
        });
      }
      
      const evalResultData = JSON.parse(fs.readFileSync(maybeEvalResultFilePath, 'utf-8'));
      
      // Validate and return the eval result
      const evalResult: EvalSetResult = evalResultData;
      res.json(evalResult);
    } catch (error) {
      console.error('get_eval_result validation error:', error);
      res.status(500).json({ error: 'Error loading eval result' });
    }
  });

  // List eval results endpoint
  app.get('/apps/:appName/eval_results', (req: express.Request, res: express.Response) => {
    const { appName } = req.params;
    
    try {
      const appEvalHistoryDirectory = path.join(agentDir, appName, '.adk', 'eval_history');
      
      if (!fs.existsSync(appEvalHistoryDirectory)) {
        return res.json([]);
      }
      
      const evalResultFiles = fs.readdirSync(appEvalHistoryDirectory)
        .filter(file => file.endsWith(EVAL_SET_RESULT_FILE_EXTENSION))
        .map(file => file.replace(EVAL_SET_RESULT_FILE_EXTENSION, ''));
      
      res.json(evalResultFiles);
    } catch (error) {
      console.error('Error listing eval results:', error);
      res.status(500).json({ error: 'Error listing eval results' });
    }
  });

  // Agent graph endpoint
  app.get('/apps/:appName/users/:userId/sessions/:sessionId/events/:eventId/graph', async (req: express.Request, res: express.Response) => {
    try {
      const { appName, userId, sessionId, eventId } = req.params;
      
      // Connect to managed session if agent_engine_id is set
      const appId = agentEngineId || appName;
      
      const session = sessionService.getSession({
        appName: appId,
        userId,
        sessionId
      });
      
      const sessionEvents = session?.events || [];
      const event = sessionEvents.find((x: any) => x.id === eventId);
      
      if (!event) {
        return res.json({});
      }
      
      const rootAgent = await getRootAgent(appName);
      let dotGraph;
      
      // Check for function calls
      const functionCalls = event.getFunctionCalls ? event.getFunctionCalls() : [];
      const functionResponses = event.getFunctionResponses ? event.getFunctionResponses() : [];
      
      if (functionCalls && functionCalls.length > 0) {
        const functionCallHighlights = functionCalls.map((call: any) => 
          [event.author, call.name] as [string, string]
        );
        dotGraph = await agentGraph.getAgentGraph(rootAgent, functionCallHighlights);
      } else if (functionResponses && functionResponses.length > 0) {
        const functionResponseHighlights = functionResponses.map((response: any) => 
          [response.name, event.author] as [string, string]
        );
        dotGraph = await agentGraph.getAgentGraph(rootAgent, functionResponseHighlights);
      } else {
        dotGraph = await agentGraph.getAgentGraph(rootAgent, [[event.author, '']]);
      }
      
      if (dotGraph) {
        // For TypeScript, we'll return the dot source directly
        return res.json({ dot_src: dotGraph.to_string() });
      } else {
        return res.json({});
      }
    } catch (error) {
      console.error('Error generating agent graph:', error);
      return res.status(500).json({ error: 'Error generating agent graph' });
    }
  });



  // Eval set endpoints
  app.post('/apps/:appName/eval_sets/:evalSetId', (req: express.Request, res: express.Response) => {
    const { appName, evalSetId } = req.params;
    
    try {
      evalSetsManager.createEvalSet(appName, evalSetId);
      res.status(201).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: 'Unknown error occurred' });
    }
  });

  app.get('/apps/:appName/eval_sets', (req: express.Request, res: express.Response) => {
    const { appName } = req.params;
    
    try {
      const evalSets = evalSetsManager.listEvalSets(appName);
      res.json(evalSets);
    } catch (error) {
      console.error('Error listing eval sets:', error);
      res.status(500).json({ error: 'Error listing eval sets' });
    }
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
      
      // Collect all toolsets for cleanup
      const agentToolsets = getAllToolsets(rootAgent);
      agentToolsets.forEach(toolset => toolsetsToClose.add(toolset));
      
      return rootAgent;
    } catch (error) {
      console.error(`Error getting root agent for ${appName}:`, error);
      throw new Error(`Error getting root agent for ${appName}: ${error}`);
    }
  }

  /**
   * Helper function to get the runner for an app
   */
  async function getRunner(appName: string): Promise<Runner> {
    loadDotenvForAgent(path.basename(appName), agentDir);
    
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
      sessionService,
      memoryService
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
      if (reload) {
        console.log('Auto-reload enabled. Watching for file changes...');
      }
    });
  }

  // Setup auto-reload functionality if enabled
  if (reload && port) {
    // Disable auto-reload on Windows to avoid subprocess transport errors
    // similar to the Python fix for uvicorn reload=True on Windows
    if (process.platform === 'win32') {
      console.log('Auto-reload disabled on Windows to avoid potential subprocess transport errors.');
    } else {
      setupAutoReload(server, agentDir, port);
    }
  }

  // Setup graceful shutdown handler for toolsets
  const gracefulShutdown = async () => {
    console.log('Received shutdown signal, closing server gracefully...');
    
    // Close all toolsets
    for (const toolset of toolsetsToClose) {
      try {
        await toolset.close();
      } catch (error) {
        console.error('Error closing toolset:', error);
      }
    }
    
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Auto-reload functionality
  if (reload) {
    setupAutoReload(server, agentDir, port);
  }

  return { app, server };
}

// Auto-reload setup
function setupAutoReload(server: http.Server, agentDir: string, port: number): void {
  const watcher = chokidar.watch(agentDir, {
    ignored: [
      /node_modules/,
      /\.git/,
      /\.adk/,
      /\.DS_Store/,
      /\.pyc$/,
      /__pycache__/
    ],
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('change', (filePath: string) => {
    console.log(`File changed: ${filePath}`);
    console.log('Restarting server...');
    
    // Clear the require cache for the changed file and related modules
    clearRequireCache(agentDir);
    
    // Close the server and restart
    server.close(() => {
      console.log('Server restarted');
      // Note: In a production environment, you'd want to use a process manager
      // like PM2 or nodemon for proper restart functionality
      process.exit(0);
    });
  });

  watcher.on('error', (error) => {
    console.error('File watcher error:', error);
  });

  // Clean up watcher on process exit
  process.on('SIGINT', () => {
    watcher.close();
  });

  process.on('SIGTERM', () => {
    watcher.close();
  });
}

// Clear require cache for a directory
function clearRequireCache(dir: string): void {
  Object.keys(require.cache).forEach(key => {
    if (key.startsWith(dir)) {
      delete require.cache[key];
    }
  });
}