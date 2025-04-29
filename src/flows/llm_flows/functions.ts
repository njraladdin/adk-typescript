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

/**
 * Handles function calls for LLM flow.
 */
import { v4 as uuidv4 } from 'uuid';
import { Event } from '../../events/Event';
import { InvocationContext } from '../../agents/InvocationContext';
import { ToolContext } from '../../tools/toolContext';
import { BaseTool } from '../../tools/BaseTool';
import * as telemetry from '../../telemetry';
import { LlmAgent } from '../../agents/LlmAgent';

const AF_FUNCTION_CALL_ID_PREFIX = 'adk-';
const REQUEST_EUC_FUNCTION_CALL_NAME = 'adk_request_credential';

/**
 * Interface for active streaming tool task
 */
interface ActiveStreamingTool {
  task: Promise<void> | null;
  done?: boolean;
  cancelled?: boolean;
}

/**
 * Safely get an event ID for telemetry purposes
 * Always returns a valid string
 * 
 * @param event The event to get the ID from
 * @returns A string ID, never undefined
 */
function getSafeEventId(event: Event): string {
  return event.id || Event.newId();
}

/**
 * Generates a unique client function call ID
 * 
 * @returns A unique function call ID string
 */
export function generateClientFunctionCallId(): string {
  return `${AF_FUNCTION_CALL_ID_PREFIX}${uuidv4()}`;
}

/**
 * Populates client function call IDs for all function calls in an event
 * 
 * @param event The event containing function calls to populate
 */
export function populateClientFunctionCallId(event: Event): void {
  const functionCalls = event.getFunctionCalls();
  if (!functionCalls || functionCalls.length === 0) {
    return;
  }
  
  for (const functionCall of functionCalls) {
    if (!functionCall.id) {
      functionCall.id = generateClientFunctionCallId();
    }
  }
}

/**
 * Removes client function call IDs from content parts
 *
 * @param content The content object containing parts to clean
 */
export function removeClientFunctionCallId(content: any): void {
  if (content && content.parts) {
    for (const part of content.parts) {
      if (
        part.functionCall &&
        part.functionCall.id &&
        part.functionCall.id.startsWith(AF_FUNCTION_CALL_ID_PREFIX)
      ) {
        part.functionCall.id = null;
      }
      if (
        part.functionResponse &&
        part.functionResponse.id &&
        part.functionResponse.id.startsWith(AF_FUNCTION_CALL_ID_PREFIX)
      ) {
        part.functionResponse.id = null;
      }
    }
  }
}

/**
 * Gets the set of long-running function call IDs
 * 
 * @param functionCalls The list of function calls
 * @param toolsDict Dictionary mapping tool names to tool instances
 * @returns Set of function call IDs for long-running tools
 */
export function getLongRunningFunctionCalls(
  functionCalls: any[],
  toolsDict: Record<string, BaseTool>
): Set<string> {
  const longRunningToolIds = new Set<string>();
  
  for (const functionCall of functionCalls) {
    if (
      functionCall.name in toolsDict &&
      toolsDict[functionCall.name].isLongRunning
    ) {
      longRunningToolIds.add(functionCall.id);
    }
  }
  
  return longRunningToolIds;
}

/**
 * Generates an auth event for the requested auth configs
 * 
 * @param invocationContext Invocation context
 * @param functionResponseEvent Function response event with auth configs
 * @returns Auth event or undefined if no auth configs requested
 */
export function generateAuthEvent(
  invocationContext: InvocationContext,
  functionResponseEvent: Event
): Event | undefined {
  if (
    !functionResponseEvent.actions?.requestedAuthConfigs ||
    Object.keys(functionResponseEvent.actions.requestedAuthConfigs).length === 0
  ) {
    return undefined;
  }
  
  const parts = [];
  const longRunningToolIds = new Set<string>();
  
  for (const [functionCallId, authConfig] of Object.entries(
    functionResponseEvent.actions.requestedAuthConfigs
  )) {
    const requestEucFunctionCall = {
      name: REQUEST_EUC_FUNCTION_CALL_NAME,
      args: {
        function_call_id: functionCallId,
        auth_config: authConfig,
      },
    };
    
    const functionCallWithId = {
      ...requestEucFunctionCall,
      id: generateClientFunctionCallId(),
    };
    
    longRunningToolIds.add(functionCallWithId.id);
    parts.push({ functionCall: functionCallWithId });
  }
  
  return new Event({
    invocationId: invocationContext.invocationId,
    author: invocationContext.agent.name,
    branch: invocationContext.branch,
    content: {
      parts,
      role: functionResponseEvent.content?.role || 'model',
    },
    longRunningToolIds,
  });
}

/**
 * Gets the tool and context for a function call
 * 
 * @param invocationContext Invocation context
 * @param functionCallEvent Function call event
 * @param functionCall Function call object
 * @param toolsDict Dictionary mapping tool names to tool instances
 * @returns Tool and tool context
 */
function _getToolAndContext(
  invocationContext: InvocationContext,
  functionCallEvent: Event,
  functionCall: any,
  toolsDict: Record<string, BaseTool>
): { tool: BaseTool; toolContext: ToolContext } {
  const tool = toolsDict[functionCall.name];
  if (!tool) {
    throw new Error(`Tool ${functionCall.name} not found`);
  }
  
  // Create the tool context directly with invocationContext (matching Python implementation)
  const toolContext = new ToolContext(
    invocationContext,
    functionCall.id
  );
  
  // Set additional properties needed for tool execution
  toolContext.functionCallEvent = functionCallEvent;
  toolContext.functionCall = functionCall;
  
  return { tool, toolContext };
}

/**
 * Handles function calls for the live API
 * 
 * @param invocationContext Invocation context
 * @param functionCallEvent Function call event
 * @param toolsDict Dictionary mapping tool names to tool instances
 * @returns Function response event
 */
export async function handleFunctionCallsLive(
  invocationContext: InvocationContext,
  functionCallEvent: Event,
  toolsDict: Record<string, BaseTool>
): Promise<Event | undefined> {
  const agent = invocationContext.agent as LlmAgent;
  const functionCalls = functionCallEvent.getFunctionCalls();
  
  if (!functionCalls || functionCalls.length === 0) {
    return undefined;
  }
  
  const functionResponseEvents: Event[] = [];
  
  for (const functionCall of functionCalls) {
    try {
      const { tool, toolContext } = _getToolAndContext(
        invocationContext,
        functionCallEvent,
        functionCall,
        toolsDict
      );
      
      // Function args
      const functionArgs = functionCall.args || {};
      let functionResponse = null;
      
      // Call before_tool_callback if exists
      if (agent.beforeToolCallback) {
        functionResponse = agent.beforeToolCallback(
          tool,
          functionArgs,
          toolContext
        );
      }
      
      // Execute the tool if no callback response
      if (!functionResponse) {
        functionResponse = await _processFunctionLiveHelper(
          tool,
          toolContext,
          functionCall,
          functionArgs,
          invocationContext
        );
      }
      
      // Call after_tool_callback if exists
      if (agent.afterToolCallback) {
        const newResponse = agent.afterToolCallback(
          tool,
          functionArgs,
          toolContext,
          functionResponse
        );
        
        if (newResponse) {
          functionResponse = newResponse;
        }
      }
      
      if (tool.isLongRunning) {
        // Allow long running function to return undefined
        if (!functionResponse) {
          continue;
        }
      }
      
      // Build function response event
      const responseEvent = _buildResponseEvent(
        tool,
        functionResponse,
        toolContext,
        invocationContext
      );
      
      functionResponseEvents.push(responseEvent);
    } catch (error) {
      console.error(`Error executing function ${functionCall.name}:`, error);
    }
  }
  
  if (functionResponseEvents.length === 0) {
    return undefined;
  }
  
  const mergedEvent = mergeParallelFunctionResponseEvents(functionResponseEvents);
  
  if (functionResponseEvents.length > 1) {
    // Trace the merged response for parallel calls
    const tracingSpan = telemetry.tracer.startAsCurrentSpan('tool_response');
    try {
      telemetry.traceToolResponse(
        invocationContext,
        getSafeEventId(mergedEvent),
        mergedEvent
      );
    } finally {
      tracingSpan.end();
    }
  }
  
  return mergedEvent;
}

/**
 * Handles function calls asynchronously
 * 
 * @param invocationContext Invocation context
 * @param functionCallEvent Function call event
 * @param toolsDict Dictionary mapping tool names to tool instances
 * @param filters Optional set of function call IDs to filter
 * @returns Function response event
 */
export async function handleFunctionCallsAsync(
  invocationContext: InvocationContext,
  functionCallEvent: Event,
  toolsDict: Record<string, BaseTool>,
  filters?: Set<string>
): Promise<Event | undefined> {
  const agent = invocationContext.agent as LlmAgent;
  if (!agent) {
    return undefined;
  }
  
  const functionCalls = functionCallEvent.getFunctionCalls();
  if (!functionCalls || functionCalls.length === 0) {
    return undefined;
  }
  
  const functionResponseEvents: Event[] = [];
  
  for (const functionCall of functionCalls) {
    // Skip if not in filter list when a filter is provided
    if (filters && functionCall.id && !filters.has(functionCall.id)) {
      continue;
    }
    
    try {
      const { tool, toolContext } = _getToolAndContext(
        invocationContext,
        functionCallEvent,
        functionCall,
        toolsDict
      );
      
      // Function args
      const functionArgs = functionCall.args || {};
      let functionResponse = null;
      
      // Call before_tool_callback if exists
      if (agent.beforeToolCallback) {
        functionResponse = agent.beforeToolCallback(
          tool,
          functionArgs,
          toolContext
        );
      }
      
      // Execute the tool if no callback response
      if (!functionResponse) {
        functionResponse = await _callToolAsync(
          tool,
          functionArgs,
          toolContext
        );
      }
      
      // Call after_tool_callback if exists
      if (agent.afterToolCallback) {
        const newResponse = agent.afterToolCallback(
          tool,
          functionArgs,
          toolContext,
          functionResponse
        );
        
        if (newResponse) {
          functionResponse = newResponse;
        }
      }
      
      if (tool.isLongRunning) {
        // Allow long running function to return undefined
        if (!functionResponse) {
          continue;
        }
      }
      
      // Build function response event
      const responseEvent = _buildResponseEvent(
        tool,
        functionResponse,
        toolContext,
        invocationContext
      );
      
      functionResponseEvents.push(responseEvent);
    } catch (error) {
      console.error(`Error executing function ${functionCall.name}:`, error);
    }
  }
  
  if (functionResponseEvents.length === 0) {
    return undefined;
  }
  
  const mergedEvent = mergeParallelFunctionResponseEvents(functionResponseEvents);
  
  if (functionResponseEvents.length > 1) {
    // Trace the merged response for parallel calls
    const tracingSpan = telemetry.tracer.startAsCurrentSpan('tool_response');
    try {
      telemetry.traceToolResponse(
        invocationContext,
        getSafeEventId(mergedEvent),
        mergedEvent
      );
    } finally {
      tracingSpan.end();
    }
  }
  
  return mergedEvent;
}

/**
 * Helper function to process function calls for live API
 * 
 * @param tool Tool to execute
 * @param toolContext Tool context
 * @param functionCall Function call object
 * @param functionArgs Function arguments
 * @param invocationContext Invocation context
 * @returns Function response
 */
async function _processFunctionLiveHelper(
  tool: BaseTool,
  toolContext: ToolContext,
  functionCall: any,
  functionArgs: Record<string, any>,
  invocationContext: InvocationContext
): Promise<any> {
  // We need to implement live streaming support when appropriate interfaces are added
  // This is a simplified implementation without streaming support
  
  // Handle stop_streaming function call
  if (functionCall.name === 'stop_streaming' && functionArgs.function_name) {
    const functionName = functionArgs.function_name;
    return { status: `Stop streaming request received for ${functionName}` };
  }
  
  // For now, execute all tools synchronously
  return await _callToolAsync(tool, functionArgs, toolContext);
}

/**
 * Calls tool asynchronously
 * 
 * @param tool Tool to execute
 * @param args Tool arguments
 * @param toolContext Tool context
 * @returns Tool execution result
 */
async function _callToolAsync(
  tool: BaseTool,
  args: Record<string, any>,
  toolContext: ToolContext
): Promise<any> {
  // Use tracing to measure tool execution time
  const tracingSpan = telemetry.tracer.startAsCurrentSpan(`tool_call_${tool.name}`);
  try {
    return await tool.execute(args, toolContext);
  } finally {
    tracingSpan.end();
  }
}

/**
 * Builds response event for a tool execution
 * 
 * @param tool Tool that was executed
 * @param functionResult Function execution result
 * @param toolContext Tool context
 * @param invocationContext Invocation context
 * @returns Response event
 */
function _buildResponseEvent(
  tool: BaseTool,
  functionResult: any,
  toolContext: ToolContext,
  invocationContext: InvocationContext
): Event {
  // Ensure function result is a dictionary
  if (typeof functionResult !== 'object' || functionResult === null) {
    functionResult = { result: functionResult };
  }
  
  // Get the function call ID or generate a new one
  const functionCallId = toolContext.functionCall?.id || generateClientFunctionCallId();
  
  // Create a function response event with a guaranteed ID
  const responseEvent = new Event({
    invocationId: invocationContext.invocationId,
    author: invocationContext.agent.name,
    branch: invocationContext.branch,
    content: {
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: tool.name,
            response: functionResult,
            id: functionCallId,
          },
        },
      ],
    },
    actions: toolContext.actions,
    id: Event.newId() // Explicitly set an ID
  });
  
  // Trace the tool response
  const tracingSpan = telemetry.tracer.startAsCurrentSpan(`tool_response_${tool.name}`);
  try {
    telemetry.traceToolResponse(
      invocationContext,
      getSafeEventId(responseEvent),
      responseEvent
    );
  } finally {
    tracingSpan.end();
  }
  
  return responseEvent;
}

/**
 * Merges parallel function response events into a single event
 * 
 * @param functionResponseEvents Array of function response events
 * @returns Merged event
 */
function mergeParallelFunctionResponseEvents(
  functionResponseEvents: Event[]
): Event {
  if (functionResponseEvents.length === 0) {
    throw new Error('Cannot merge empty events');
  }
  
  if (functionResponseEvents.length === 1) {
    return functionResponseEvents[0];
  }
  
  // Combine all parts from all events
  const firstEvent = functionResponseEvents[0];
  const parts = [];
  
  for (const event of functionResponseEvents) {
    if (event.content && event.content.parts) {
      parts.push(...event.content.parts);
    }
  }
  
  // Create a new event with all parts
  return new Event({
    invocationId: firstEvent.invocationId,
    author: firstEvent.author,
    branch: firstEvent.branch,
    content: {
      role: firstEvent.content?.role || 'user',
      parts: parts,
    },
    actions: firstEvent.actions,
  });
} 