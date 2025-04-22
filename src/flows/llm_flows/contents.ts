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
 * Module for building contents for LLM requests.
 */
import { InvocationContext } from '../../agents/InvocationContext';
import { LlmAgent } from '../../agents/LlmAgent';
import { Event } from '../../events/Event';
import { Content, Part } from '../../models/types';
import { LlmRequest } from '../../models/LlmRequest';
import { BaseLlmRequestProcessor } from './BaseLlmProcessor';

// Constants
const REQUEST_EUC_FUNCTION_CALL_NAME = 'adk_request_credential';

/**
 * Removes client function call IDs from all function calls in content
 * 
 * @param content The content containing function calls to clean
 */
function removeClientFunctionCallId(content: Content): void {
  if (!content || !content.parts) {
    return;
  }
  
  for (const part of content.parts) {
    if (part.functionCall) {
      // Remove the id property from the function call
      delete part.functionCall.id;
    }
  }
}

/**
 * Builds the contents for the LLM request.
 */
class ContentLlmRequestProcessor implements BaseLlmRequestProcessor {
  /**
   * Runs the processor asynchronously.
   * 
   * @param invocationContext The invocation context
   * @param llmRequest The LLM request to process
   * @returns An async generator yielding events
   */
  async *runAsync(
    invocationContext: InvocationContext,
    llmRequest: LlmRequest
  ): AsyncGenerator<Event, void, unknown> {
    const agent = invocationContext.agent;
    
    if (!(agent instanceof LlmAgent)) {
      return;
    }

    if (agent.includeContents !== 'none') {
      llmRequest.contents = getContents(
        invocationContext.branch,
        invocationContext.session.events,
        agent.name
      );
    }

    // Maintain async generator contract
    if (false) {
      yield {} as Event;
    }
  }
}

/**
 * The main content request processor instance.
 */
export const requestProcessor = new ContentLlmRequestProcessor();

/**
 * Rearranges the async function_response events in the history.
 * 
 * @param events List of events to rearrange
 * @returns Rearranged list of events
 */
function rearrangeEventsForAsyncFunctionResponsesInHistory(
  events: Event[]
): Event[] {
  const functionCallIdToResponseEventsIndex: Map<string, number> = new Map();
  
  for (let i = 0; i < events.length; i++) {
    const functionResponses = events[i].getFunctionResponses();
    if (functionResponses.length > 0) {
      for (const functionResponse of functionResponses) {
        if (functionResponse.id) {
          functionCallIdToResponseEventsIndex.set(functionResponse.id, i);
        }
      }
    }
  }

  const resultEvents: Event[] = [];
  
  for (const event of events) {
    if (event.getFunctionResponses().length > 0) {
      // function_response should be handled together with function_call below.
      continue;
    } else if (event.getFunctionCalls().length > 0) {
      const functionResponseEventsIndices = new Set<number>();
      
      for (const functionCall of event.getFunctionCalls()) {
        const functionCallId = functionCall.id;
        if (functionCallId && functionCallIdToResponseEventsIndex.has(functionCallId)) {
          functionResponseEventsIndices.add(
            functionCallIdToResponseEventsIndex.get(functionCallId)!
          );
        }
      }
      
      resultEvents.push(event);
      
      if (functionResponseEventsIndices.size === 0) {
        continue;
      }
      
      if (functionResponseEventsIndices.size === 1) {
        const index = Array.from(functionResponseEventsIndices)[0];
        resultEvents.push(events[index]);
      } else {
        // Merge all async function_response as one response event
        resultEvents.push(
          mergeFunctionResponseEvents(
            Array.from(functionResponseEventsIndices)
              .sort()
              .map(i => events[i])
          )
        );
      }
    } else {
      resultEvents.push(event);
    }
  }

  return resultEvents;
}

/**
 * Rearranges the events for the latest function_response.
 * 
 * If the latest function_response is for an async function_call, all events
 * between the initial function_call and the latest function_response will be
 * removed.
 * 
 * @param events List of events to rearrange
 * @returns Rearranged list of events
 */
function rearrangeEventsForLatestFunctionResponse(
  events: Event[]
): Event[] {
  if (!events || events.length === 0) {
    return events;
  }

  const functionResponses = events[events.length - 1].getFunctionResponses();
  if (functionResponses.length === 0) {
    // No need to process, since the latest event is not function_response.
    return events;
  }

  const functionResponsesIds = new Set<string>();
  for (const functionResponse of functionResponses) {
    if (functionResponse.id) {
      functionResponsesIds.add(functionResponse.id);
    }
  }

  if (events.length >= 2) {
    const functionCalls = events[events.length - 2].getFunctionCalls();
    
    if (functionCalls.length > 0) {
      for (const functionCall of functionCalls) {
        // The latest function_response is already matched
        if (functionCall.id && functionResponsesIds.has(functionCall.id)) {
          return events;
        }
      }
    }
  }

  let functionCallEventIdx = -1;
  // look for corresponding function call event reversely
  for (let idx = events.length - 2; idx >= 0; idx--) {
    const event = events[idx];
    const functionCalls = event.getFunctionCalls();
    
    if (functionCalls.length > 0) {
      for (const functionCall of functionCalls) {
        if (functionCall.id && functionResponsesIds.has(functionCall.id)) {
          functionCallEventIdx = idx;
          break;
        }
      }
      
      if (functionCallEventIdx !== -1) {
        // in case the last response event only have part of the responses
        // for the function calls in the function call event
        for (const functionCall of functionCalls) {
          if (functionCall.id) {
            functionResponsesIds.add(functionCall.id);
          }
        }
        break;
      }
    }
  }

  if (functionCallEventIdx === -1) {
    throw new Error(
      `No function call event found for function responses ids: ${Array.from(functionResponsesIds).join(', ')}`
    );
  }

  // collect all function response between last function response event
  // and function call event
  const functionResponseEvents: Event[] = [];
  
  for (let idx = functionCallEventIdx + 1; idx < events.length - 1; idx++) {
    const event = events[idx];
    const functionResponses = event.getFunctionResponses();
    
    if (
      functionResponses.length > 0 &&
      functionResponses[0].id &&
      functionResponsesIds.has(functionResponses[0].id)
    ) {
      functionResponseEvents.push(event);
    }
  }
  
  functionResponseEvents.push(events[events.length - 1]);

  const resultEvents = events.slice(0, functionCallEventIdx + 1);
  resultEvents.push(
    mergeFunctionResponseEvents(functionResponseEvents)
  );

  return resultEvents;
}

/**
 * Gets the contents for the LLM request.
 * 
 * @param currentBranch The current branch of the agent
 * @param events List of events
 * @param agentName The name of the agent
 * @returns List of contents
 */
export function getContents(
  currentBranch: string | undefined,
  events: Event[],
  agentName: string = ''
): Content[] {
  let filteredEvents: Event[] = [];
  
  // Parse the events, leaving the contents and the function calls and
  // responses from the current agent.
  for (const event of events) {
    if (!event.content || !event.content.role) {
      // Skip events without content, or generated neither by user nor by model.
      // E.g. events purely for mutating session states.
      continue;
    }
    
    if (!isEventBelongsToBranch(currentBranch, event)) {
      // Skip events not belong to current branch.
      continue;
    }
    
    if (isAuthEvent(event)) {
      // skip auth event
      continue;
    }
    
    filteredEvents.push(
      isOtherAgentReply(agentName, event)
        ? convertForeignEvent(event)
        : event
    );
  }

  filteredEvents = rearrangeEventsForLatestFunctionResponse(filteredEvents);
  filteredEvents = rearrangeEventsForAsyncFunctionResponsesInHistory(filteredEvents);
  
  const contents: Content[] = [];
  
  for (const event of filteredEvents) {
    if (event.content) {
      const content = JSON.parse(JSON.stringify(event.content)) as Content;
      removeClientFunctionCallId(content);
      contents.push(content);
    }
  }
  
  return contents;
}

/**
 * Whether the event is a reply from another agent.
 * 
 * @param currentAgentName The name of the current agent
 * @param event The event to check
 * @returns True if the event is a reply from another agent
 */
function isOtherAgentReply(currentAgentName: string, event: Event): boolean {
  return Boolean(
    currentAgentName &&
    event.author !== currentAgentName &&
    event.author !== 'user'
  );
}

/**
 * Converts an event authored by another agent as a user-content event.
 * 
 * This is to provide another agent's output as context to the current agent, so
 * that current agent can continue to respond, such as summarizing previous
 * agent's reply, etc.
 * 
 * @param event The event to convert
 * @returns The converted event
 */
function convertForeignEvent(event: Event): Event {
  if (!event.content || !event.content.parts) {
    return event;
  }

  const content: Content = {
    role: 'user',
    parts: [{ text: 'For context:' }]
  };
  
  for (const part of event.content.parts) {
    if (part.text) {
      content.parts.push({
        text: `[${event.author}] said: ${part.text}`
      });
    } else if (part.functionCall) {
      content.parts.push({
        text: `[${event.author}] called tool \`${part.functionCall.name}\` with parameters: ${JSON.stringify(part.functionCall.args)}`
      });
    } else if (part.functionResponse) {
      content.parts.push({
        text: `[${event.author}] \`${part.functionResponse.name}\` tool returned result: ${JSON.stringify(part.functionResponse.response)}`
      });
    } else {
      // Fallback to the original part for non-text and non-functionCall parts.
      content.parts.push(part);
    }
  }

  return new Event({
    timestamp: event.timestamp,
    author: 'user',
    content: content,
    branch: event.branch,
  });
}

/**
 * Merges a list of function_response events into one event.
 * 
 * The key goal is to ensure:
 * 1. function_call and function_response are always of the same number.
 * 2. The function_call and function_response are consecutively in the content.
 * 
 * @param functionResponseEvents List of function_response events to merge
 * @returns Merged event
 */
function mergeFunctionResponseEvents(functionResponseEvents: Event[]): Event {
  if (!functionResponseEvents || functionResponseEvents.length === 0) {
    throw new Error('At least one function_response event is required.');
  }

  // Deep copy the first event
  const mergedEvent = new Event({
    invocationId: functionResponseEvents[0].invocationId,
    author: functionResponseEvents[0].author,
    actions: JSON.parse(JSON.stringify(functionResponseEvents[0].actions || {})),
    branch: functionResponseEvents[0].branch,
    timestamp: functionResponseEvents[0].timestamp,
    content: JSON.parse(JSON.stringify(functionResponseEvents[0].content || {})),
  });

  const partsInMergedEvent: Part[] = mergedEvent.content?.parts || [];
  
  if (!partsInMergedEvent || partsInMergedEvent.length === 0) {
    throw new Error('There should be at least one function_response part.');
  }

  const partIndicesInMergedEvent: Map<string, number> = new Map();
  
  for (let idx = 0; idx < partsInMergedEvent.length; idx++) {
    const part = partsInMergedEvent[idx];
    if (part.functionResponse && part.functionResponse.id) {
      partIndicesInMergedEvent.set(part.functionResponse.id, idx);
    }
  }

  for (let i = 1; i < functionResponseEvents.length; i++) {
    const event = functionResponseEvents[i];
    if (!event.content || !event.content.parts || event.content.parts.length === 0) {
      throw new Error('There should be at least one function_response part.');
    }

    for (const part of event.content.parts) {
      if (part.functionResponse && part.functionResponse.id) {
        const functionCallId = part.functionResponse.id;
        if (partIndicesInMergedEvent.has(functionCallId)) {
          partsInMergedEvent[partIndicesInMergedEvent.get(functionCallId)!] = part;
        } else {
          partsInMergedEvent.push(part);
          partIndicesInMergedEvent.set(functionCallId, partsInMergedEvent.length - 1);
        }
      } else {
        partsInMergedEvent.push(part);
      }
    }
  }

  return mergedEvent;
}

/**
 * Checks if an event belongs to a branch.
 * 
 * Event belongs to a branch when event.branch is prefix of the invocation branch.
 * 
 * @param invocationBranch The invocation branch
 * @param event The event to check
 * @returns True if the event belongs to the branch
 */
function isEventBelongsToBranch(
  invocationBranch: string | undefined,
  event: Event
): boolean {
  if (!invocationBranch || !event.branch) {
    return true;
  }
  return invocationBranch.startsWith(event.branch);
}

/**
 * Checks if an event is an auth event.
 * 
 * @param event The event to check
 * @returns True if the event is an auth event
 */
function isAuthEvent(event: Event): boolean {
  if (!event.content?.parts) {
    return false;
  }
  
  for (const part of event.content.parts) {
    if (
      part.functionCall &&
      part.functionCall.name === REQUEST_EUC_FUNCTION_CALL_NAME
    ) {
      return true;
    }
    
    if (
      part.functionResponse &&
      part.functionResponse.name === REQUEST_EUC_FUNCTION_CALL_NAME
    ) {
      return true;
    }
  }
  
  return false;
} 