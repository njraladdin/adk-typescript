/**
 * Handles function calls for LLM flow.
 */
import { v4 as uuidv4 } from 'uuid';
import { Event } from '../../events/Event';
import { InvocationContext } from '../../agents/InvocationContext';
import { ToolContext } from '../../tools/ToolContext';
import { BaseTool } from '../../tools/BaseTool';
import * as telemetry from '../../telemetry';
import { LlmAgent } from '../../agents/LlmAgent';
import { ActiveStreamingTool } from '../../agents/ActiveStreamingTool';

const AF_FUNCTION_CALL_ID_PREFIX = 'adk-';
const REQUEST_EUC_FUNCTION_CALL_NAME = 'adk_request_credential';

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
 * Checks if a function call is missing any mandatory arguments
 * 
 * @param tool The tool being called
 * @param functionArgs The arguments provided to the function
 * @returns An error object if mandatory arguments are missing, undefined otherwise
 */
function _checkMandatoryArguments(
  tool: BaseTool,
  functionArgs: Record<string, any>
): { error: string } | undefined {
  // Get the tool declaration which contains parameter information
  const declaration = tool.getDeclaration();
  if (!declaration || !declaration.parameters || !declaration.parameters.required) {
    return undefined;
  }

  // Check for missing mandatory arguments
  const missingArgs = declaration.parameters.required.filter((arg: string) => !(arg in functionArgs));
  
  if (missingArgs.length > 0) {
    const missingArgsStr = missingArgs.join('\n');
    const errorStr = `Invoking \`${tool.name}()\` failed as the following mandatory input parameters are not present:\n${missingArgsStr}\nYou could retry calling this tool, but it is IMPORTANT for you to provide all the mandatory parameters.`;
    
    return { error: errorStr };
  }
  
  return undefined;
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
      let functionResponse: Record<string, any> | undefined = undefined;
      
      // Check for missing mandatory arguments
      const missingArgsError = _checkMandatoryArguments(tool, functionArgs);
      if (missingArgsError) {
        functionResponse = missingArgsError;
      } else {
        // before_tool_callback (sync or async)
        if (agent.beforeToolCallback) {
          const beforeCallbackResult = agent.beforeToolCallback(
            tool,
            functionArgs,
            toolContext
          );
          
          // Check if the response is a Promise and await it
          if (beforeCallbackResult instanceof Promise) {
            functionResponse = await beforeCallbackResult;
          } else {
            functionResponse = beforeCallbackResult;
          }
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
        
        // after_tool_callback (sync or async)
        if (agent.afterToolCallback && functionResponse) {
          const alteredFunctionResponse = agent.afterToolCallback(
            tool,
            functionArgs,
            toolContext,
            functionResponse
          );
          
          // Check if the response is a Promise and await it
          if (alteredFunctionResponse instanceof Promise) {
            const awaitedResponse = await alteredFunctionResponse;
            // Only update if the response is not undefined (equivalent to Python's "is not None")
            if (awaitedResponse !== undefined) {
              functionResponse = awaitedResponse;
            }
          } else if (alteredFunctionResponse !== undefined) {
            // Only update if not undefined (equivalent to Python's "is not None")
            functionResponse = alteredFunctionResponse;
          }
        }
      }
      
      if (tool.isLongRunning) {
        // Allow long running function to return undefined
        if (!functionResponse) {
          continue;
        }
      }
      
      // Build function response event
      if (functionResponse) {
        const responseEvent = _buildResponseEvent(
          tool,
          functionResponse,
          toolContext,
          invocationContext
        );
        
        functionResponseEvents.push(responseEvent);
      }
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
      let functionResponse: Record<string, any> | undefined = undefined;
      
      // Check for missing mandatory arguments
      const missingArgsError = _checkMandatoryArguments(tool, functionArgs);
      if (missingArgsError) {
        functionResponse = missingArgsError;
      } else {
        // before_tool_callback (sync or async)
        if (agent.beforeToolCallback) {
          const beforeCallbackResult = agent.beforeToolCallback(
            tool,
            functionArgs,
            toolContext
          );
          
          // Check if the response is a Promise and await it
          if (beforeCallbackResult instanceof Promise) {
            functionResponse = await beforeCallbackResult;
          } else {
            functionResponse = beforeCallbackResult;
          }
        }
        
        // Execute the tool if no callback response
        if (!functionResponse) {
          functionResponse = await _callToolAsync(
            tool,
            functionArgs,
            toolContext
          );
        }
        
        // after_tool_callback (sync or async)
        if (agent.afterToolCallback && functionResponse) {
          const alteredFunctionResponse = agent.afterToolCallback(
            tool,
            functionArgs,
            toolContext,
            functionResponse
          );
          
          // Check if the response is a Promise and await it
          if (alteredFunctionResponse instanceof Promise) {
            const awaitedResponse = await alteredFunctionResponse;
            // Only update if the response is not undefined (equivalent to Python's "is not None")
            if (awaitedResponse !== undefined) {
              functionResponse = awaitedResponse;
            }
          } else if (alteredFunctionResponse !== undefined) {
            // Only update if not undefined (equivalent to Python's "is not None")
            functionResponse = alteredFunctionResponse;
          }
        }
      }
      
      if (tool.isLongRunning) {
        // Allow long running function to return undefined
        if (!functionResponse) {
          continue;
        }
      }
      
      // Build function response event
      if (functionResponse) {
        const responseEvent = _buildResponseEvent(
          tool,
          functionResponse,
          toolContext,
          invocationContext
        );
        
        functionResponseEvents.push(responseEvent);
      }
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
  let functionResponse = null;
  
  // Handle stop_streaming function call
  if (functionCall.name === 'stop_streaming' && functionArgs.function_name) {
    const functionName = functionArgs.function_name;
    const activeTasks = invocationContext.activeStreamingTools;
    
    if (activeTasks && 
        activeTasks.has(functionName) && 
        activeTasks.get(functionName)?.task && 
        !activeTasks.get(functionName)?.done) {
      const activeTask = activeTasks.get(functionName)!;
      
      // Mark as cancelled
      activeTask.cancelled = true;
      
      try {
        // Wait for task to complete or timeout
        // Note: Proper task cancellation would require more robust implementation
        await Promise.race([
          activeTask.task,
          new Promise(resolve => setTimeout(resolve, 1000)) // 1 second timeout
        ]);
        
        // Clean up the reference
        activeTask.task = null;
        functionResponse = {
          status: `Successfully stopped streaming function ${functionName}`
        };
      } catch (error: any) {
        console.error(`Error cancelling task ${functionName}:`, error);
        functionResponse = {
          status: `Error stopping streaming function ${functionName}: ${error.message || 'Unknown error'}`
        };
      }
    } else {
      functionResponse = {
        status: `No active streaming function named ${functionName} found`
      };
    }
  } else if ((tool as any).isAsyncGenerator) {
    // For streaming tool use case
    // Mirroring Python's inspect.isasyncgenfunction(tool.func)
    
    // Create async function to run tool and update results
    const runToolAndUpdateQueue = async () => {
      try {
        // In Python, this uses tool._call_live() which is an async generator
        // We'd need equivalent streaming support in TypeScript
        // This is a placeholder for the actual implementation
        return { status: 'The function is running asynchronously and the results are pending.' };
      } catch (error: any) {
        console.error(`Error in streaming tool ${tool.name}:`, error);
        return { status: `Error in streaming tool: ${error.message || 'Unknown error'}` };
      }
    };
    
    // Create a task
    const task = runToolAndUpdateQueue();
    
    // Store the task in active streaming tools
    if (!invocationContext.activeStreamingTools) {
      // Initialize the map if it doesn't exist
      invocationContext.activeStreamingTools = new Map();
    }
    
    // Create the streaming tool
    const streamingTool = new ActiveStreamingTool(task, {
      name: tool.name,
      args: functionArgs,
      id: functionCall.id
    });
    
    // Ensure the map exists before setting the tool
    invocationContext.activeStreamingTools.set(tool.name, streamingTool);
    
    // Immediately return a pending response
    functionResponse = {
      status: 'The function is running asynchronously and the results are pending.'
    };
  } else {
    // For non-streaming tools, just call them normally
    functionResponse = await _callToolAsync(tool, functionArgs, toolContext);
  }
  
  return functionResponse;
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
            response: functionResult,  // Nest the function result instead of spreading it
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
  
  // Create a new event with all parts and the actions from the first event
  // In a more complete implementation, we would merge actions more thoroughly
  return new Event({
    invocationId: firstEvent.invocationId,
    author: firstEvent.author,
    branch: firstEvent.branch,
    content: {
      role: firstEvent.content?.role || 'user',
      parts: parts,
    },
    actions: firstEvent.actions,
    // Also preserve the timestamp from the first event
    timestamp: firstEvent.timestamp
  });
} 