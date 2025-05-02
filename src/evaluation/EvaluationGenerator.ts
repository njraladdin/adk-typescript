import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { EvalConstants } from './EvaluationConstants';
import { Content, Part, FunctionCall } from '../models/types';
import { BaseAgent } from '../agents/BaseAgent';
import { LlmAgent } from '../agents/LlmAgent';
import { Runner } from '../runners';
import { SessionInterface as Session } from '../sessions/types';
import { InMemorySessionService } from '../sessions/InMemorySessionService';
import { InMemoryArtifactService } from '../artifacts/InMemoryArtifactService';
import { Event } from '../events/Event';
import { BaseTool } from '../tools/BaseTool';
import { ToolContext } from '../tools/ToolContext';

/**
 * Type for tool callback function
 */
export type BeforeToolCallback = (
  tool: BaseTool, 
  args: Record<string, any>, 
  toolContext: ToolContext, 
  evalDataset: EvalEntry[]
) => Record<string, any> | undefined;

/**
 * Interface for an evaluation data entry
 */
export interface EvalEntry {
  id?: string;
  query: string;
  response?: string;
  expected_tool_use?: Array<{
    [EvalConstants.TOOL_NAME]: string;
    [EvalConstants.TOOL_INPUT]?: Record<string, any>;
    [EvalConstants.MOCK_TOOL_OUTPUT]?: any;
  }>;
  actual_tool_use?: Array<{
    [EvalConstants.TOOL_NAME]: string;
    [EvalConstants.TOOL_INPUT]: Record<string, any>;
  }>;
  [key: string]: any;
}

/**
 * Generates evaluation data from test files
 */
export class EvaluationGenerator {
  /**
   * Generates evaluation responses for the given dataset and agent.
   * @param evalDataset The dataset to evaluate
   * @param agentModulePath Path to the module that contains the root agent
   * @param repeatNum Number of times to repeat the eval dataset
   * @param agentName The name of the agent to evaluate (optional)
   * @param initialSession Initial session data (optional)
   */
  static async generateResponses(
    evalDataset: EvalEntry[],
    agentModulePath: string,
    repeatNum: number = 3,
    agentName?: string,
    initialSession: Record<string, any> = {}
  ): Promise<EvalEntry[]> {
    const results: EvalEntry[] = [];

    for (let i = 0; i < repeatNum; i++) {
      for (const data of evalDataset) {
        results.push(
          await EvaluationGenerator._processQuery(
            data, agentModulePath, agentName, initialSession
          )
        );
      }
    }

    return results;
  }

  /**
   * Generates evaluation responses by combining session data with evaluation data.
   * @param sessionPath Path to a JSON file that contains session data
   * @param evalDataset The evaluation dataset to combine with session data
   */
  static async generateResponsesFromSession(
    sessionPath: string,
    evalDataset: EvalEntry[]
  ): Promise<EvalEntry[]> {
    const results: EvalEntry[] = [];

    const fileContent = fs.readFileSync(sessionPath, 'utf8');
    const sessionData = JSON.parse(fileContent) as Session;
    console.log("loaded session", sessionPath);

    for (const data of evalDataset) {
      results.push(
        EvaluationGenerator._processQueryWithSession(
          sessionData,
          data
        )
      );
    }

    return results;
  }

  /**
   * Process a query using the agent and evaluation dataset.
   * @param data The evaluation data entry
   * @param moduleName The module name/path
   * @param agentName The agent name (optional)
   * @param initialSession Initial session data (optional)
   */
  static async _processQuery(
    data: EvalEntry,
    moduleName: string,
    agentName?: string,
    initialSession: Record<string, any> = {}
  ): Promise<EvalEntry> {
    // Dynamically import the agent module and get the root agent
    // Note: In TypeScript/Node.js dynamic imports work differently than Python
    console.log(`Original module path: ${moduleName}`);
    
    try {
      // First ensure ts-node is registered for TypeScript files
      try {
        require('ts-node/register');
      } catch (error: any) {
        console.log(`ts-node registration failed: ${error.message}`);
      }
      
      let agentModule;
      let rootAgent;
      
      // Try multiple approaches for loading the agent module, similar to cli.ts
      try {
        // Check if direct agent.ts file exists first
        const agentPath = path.resolve(process.cwd(), moduleName, 'agent.ts');
        console.log(`Trying direct agent.ts file: ${agentPath}`);
        
        if (fs.existsSync(agentPath)) {
          agentModule = require(agentPath);
        } else {
          // Try index.ts file
          const indexPath = path.resolve(process.cwd(), moduleName, 'index.ts');
          console.log(`Trying index.ts file: ${indexPath}`);
          
          if (fs.existsSync(indexPath)) {
            agentModule = require(indexPath);
          } else {
            // Try the module directly
            console.log(`Trying direct module import: ${moduleName}`);
            agentModule = require(moduleName);
          }
        }
        
        // Check if the agent structure is correct
        if (agentModule && agentModule.agent && agentModule.agent.rootAgent) {
          rootAgent = agentModule.agent.rootAgent;
        } else if (agentModule && agentModule.rootAgent) {
          rootAgent = agentModule.rootAgent;
        } else {
          throw new Error(`Invalid agent module structure. Expected 'agent.rootAgent' or 'rootAgent' export.`);
        }
        
        // Get the reset function if it exists
        const resetFunc = agentModule.reset_data || (agentModule.agent && agentModule.agent.reset_data);
      
        let agentToEvaluate = rootAgent;
        if (agentName) {
          // There are several ways the agent might be found:
          
          // 1. Direct export with the exact agent name
          if (agentModule[agentName]) {
            console.log(`Found agent with exact name: ${agentName}`);
            agentToEvaluate = agentModule[agentName];
          } else {
            // 2. Try all exported agents and check their name property
            let found = false;
            for (const exportKey in agentModule) {
              const exportedItem = agentModule[exportKey];
              // Check if it's an agent and has the right name
              if (exportedItem && typeof exportedItem === 'object' && exportedItem.name === agentName) {
                console.log(`Found agent with name property: ${agentName}, export key: ${exportKey}`);
                agentToEvaluate = exportedItem;
                found = true;
                break;
              }
            }
            
            // 3. Use findAgent as a last resort
            if (!found) {
              console.log(`Trying findAgent for: ${agentName}`);
              agentToEvaluate = rootAgent.findAgent(agentName);
            }
          }
          
          if (!agentToEvaluate) {
            throw new Error(`Sub-Agent ${agentName} not found.`);
          }
        }
  
        return await EvaluationGenerator._processQueryWithRootAgent(
          data, agentToEvaluate, resetFunc, initialSession
        );
      } catch (error: any) {
        console.error(`Failed to import agent module: ${error.message}`);
        throw error;
      }
    } catch (error: any) {
      console.error(`Failed to import agent module: ${error}`);
      throw error;
    }
  }

  /**
   * Process a query using the agent and evaluation dataset (core logic).
   * @param data The evaluation data entry
   * @param rootAgent The root agent instance
   * @param resetFunc Function to reset agent state (optional)
   * @param initialSession Initial session data (optional)
   * @param sessionId Session ID (optional)
   * @param sessionService Session service (optional)
   * @param artifactService Artifact service (optional)
   */
  static async _processQueryWithRootAgent(
    data: EvalEntry,
    rootAgent: BaseAgent,
    resetFunc?: () => void,
    initialSession: Record<string, any> = {},
    sessionId?: string,
    sessionService?: InMemorySessionService,
    artifactService?: InMemoryArtifactService
  ): Promise<EvalEntry> {
    // Extract tool names that need to be mocked
    const allMockTools = new Set<string>();
    const expectedToolUse = data.expected_tool_use || [];
    
    for (const expected of expectedToolUse) {
      if (expected[EvalConstants.MOCK_TOOL_OUTPUT] !== undefined) {
        allMockTools.add(expected[EvalConstants.TOOL_NAME]);
      }
    }

    // Apply the tool callback to mock tool outputs if agent is an LlmAgent
    if (rootAgent instanceof LlmAgent) {
      EvaluationGenerator.applyBeforeToolCallback(
        rootAgent,
        (tool, args, toolContext, evalDataset) => 
          EvaluationGenerator.beforeToolCallback(tool, args, toolContext, evalDataset),
        allMockTools,
        [data]
      );
    }

    // Initialize services 
    if (!sessionService) {
      sessionService = new InMemorySessionService();
    }

    // Setup the session
    const appName = initialSession.appName || "EvaluationGenerator";
    const userId = initialSession.userId || "test_user_id";
    
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // Get existing session or create a new one
    let session: Session;
    try {
      const existingSession = sessionService.getSession({
        appName,
        userId,
        sessionId
      });
      
      if (existingSession) {
        session = existingSession;
      } else {
        // Create new session if none exists
        session = sessionService.createSession({
          appName,
          userId,
          sessionId,
          state: initialSession.state || {}
        });
      }
    } catch (e) {
      // Session doesn't exist, create a new one
      session = sessionService.createSession({
        appName,
        userId,
        sessionId,
        state: initialSession.state || {}
      });
    }

    // Initialize artifact service if not provided
    if (!artifactService) {
      artifactService = new InMemoryArtifactService();
    }

    // Create a runner for the agent
    const runner = new Runner({
      appName,
      agent: rootAgent,
      artifactService,
      sessionService
    });

    // Reset agent state if reset function is provided
    if (resetFunc && typeof resetFunc === 'function') {
      resetFunc();
    }

    // Process the response
    const response: EvalEntry = { ...data };
    const query = data.query;
    
    // Create a content object from the query
    const content: Content = {
      role: 'user',
      parts: [{ text: query }]
    };

    const turnActualToolUses: Array<{
      [EvalConstants.TOOL_NAME]: string;
      [EvalConstants.TOOL_INPUT]: Record<string, any>;
    }> = [];

    // Run the agent and collect responses
    for await (const event of runner.run({
      userId,
      sessionId,
      newMessage: content
    })) {
      if (event.isFinalResponse() && event.content && event.content.parts.length > 0) {
        const textPart = event.content.parts.find((part: Part) => part.text !== undefined);
        if (textPart) {
          response.response = textPart.text;
        }
      } else if (event.getFunctionCalls && event.getFunctionCalls().length > 0) {
        for (const call of event.getFunctionCalls()) {
          turnActualToolUses.push({
            [EvalConstants.TOOL_NAME]: call.name,
            [EvalConstants.TOOL_INPUT]: call.args
          });
        }
      }
    }

    // Update the response with collected tool uses
    response.actual_tool_use = turnActualToolUses;
    
    return response;
  }

  /**
   * Process the queries using the existing session data without invoking the runner.
   * @param sessionData The session data
   * @param data The evaluation data entry
   */
  static _processQueryWithSession(
    sessionData: Session,
    data: EvalEntry
  ): EvalEntry {
    const response: EvalEntry = { ...data };
    const query = data.query;
    const actualToolUses: Array<{
      [EvalConstants.TOOL_NAME]: string;
      [EvalConstants.TOOL_INPUT]: Record<string, any>;
    }> = [];
    
    let responseText: string | undefined;

    // Search for the corresponding session events
    for (const event of sessionData.events) {
      // Match the query to a user event
      if (
        event.author === "user" &&
        event.content?.parts[0]?.text === query
      ) {
        // Look for subsequent tool usage or model responses
        for (const subsequentEvent of sessionData.events) {
          if (subsequentEvent.invocationId === event.invocationId) {
            // Extract tool usage
            const part = subsequentEvent.content?.parts?.[0];
            // Check for function call and cast to appropriate type
            if (part && 'functionCall' in part && part.functionCall) {
              const functionCall = part.functionCall as unknown as { name: string; args: Record<string, any> };
              actualToolUses.push({
                [EvalConstants.TOOL_NAME]: functionCall.name,
                [EvalConstants.TOOL_INPUT]: functionCall.args
              });
            }
            // Extract final response
            else if (subsequentEvent.author !== "user") {
              responseText = subsequentEvent.content?.parts?.[0]?.text;
            }
          }
        }
      }
    }

    // Update the response with collected data
    response.actual_tool_use = actualToolUses;
    response.response = responseText;
    
    return response;
  }

  /**
   * Intercept specific tool calls and return predefined outputs from eval_dataset.
   * @param tool The tool being called
   * @param args The tool arguments
   * @param toolContext The tool context
   * @param evalDataset The evaluation dataset
   */
  static beforeToolCallback(
    tool: BaseTool,
    args: Record<string, any>,
    toolContext: ToolContext,
    evalDataset: EvalEntry[]
  ): Record<string, any> | undefined {
    for (let i = 0; i < evalDataset.length; i++) {
      const evalEntry = evalDataset[i];
      const expectedToolUse = evalEntry.expected_tool_use || [];
      
      for (const expected of expectedToolUse) {
        if (
          expected[EvalConstants.MOCK_TOOL_OUTPUT] !== undefined &&
          tool.name === expected[EvalConstants.TOOL_NAME] &&
          this.areArgsEqual(args, expected[EvalConstants.TOOL_INPUT] || {})
        ) {
          // Remove the matched entry so we don't rematch again
          evalDataset.splice(i, 1);
          return { result: expected[EvalConstants.MOCK_TOOL_OUTPUT] };
        }
      }
    }

    return undefined;
  }

  /**
   * Helper method to check if two argument objects are equal
   */
  private static areArgsEqual(
    args1: Record<string, any>,
    args2: Record<string, any>
  ): boolean {
    // Simple equality check - can be enhanced for deeper comparisons
    return JSON.stringify(args1) === JSON.stringify(args2);
  }

  /**
   * Recursively apply the before_tool_callback to the root agent and all its subagents.
   * @param agent The agent to apply the callback to
   * @param callback The callback function
   * @param allMockTools Set of tool names that need to be mocked
   * @param evalDataset The evaluation dataset
   */
  static applyBeforeToolCallback(
    agent: BaseAgent,
    callback: BeforeToolCallback,
    allMockTools: Set<string>,
    evalDataset: EvalEntry[]
  ): void {
    // Check if the agent is an LlmAgent
    if (!(agent instanceof LlmAgent)) {
      return;
    }

    // Apply callback to matching tools
    for (const tool of agent.tools) {
      const toolName = tool.name;
      if (allMockTools.has(toolName)) {
        // Assign the callback with the proper type/return value
        agent.beforeToolCallback = (tool: BaseTool, args: Record<string, any>, toolContext: ToolContext) => 
          callback(tool, args, toolContext, evalDataset);
      }
    }

    // Apply recursively to subagents
    for (const subAgent of agent.subAgents) {
      EvaluationGenerator.applyBeforeToolCallback(
        subAgent, 
        callback, 
        allMockTools,
        evalDataset
      );
    }
  }
}