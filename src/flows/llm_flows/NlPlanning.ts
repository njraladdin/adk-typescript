 

/**
 * Handles NL planning related logic.
 */

import { InvocationContext } from '../../agents/InvocationContext';
import { CallbackContext } from '../../agents/CallbackContext';
import { ReadonlyContext } from '../../agents/ReadonlyContext';
import { Event } from '../../events/Event';
import { LlmRequest } from '../../models/LlmRequest';
import { LlmResponse } from '../../models/LlmResponse';
import { Part } from '../../models/types';
import { BasePlanner } from '../../planners/BasePlanner';
import { BuiltInPlanner } from '../../planners/BuiltInPlanner';
import { PlanReActPlanner } from '../../planners/PlanReActPlanner';
import { LlmAgent } from '../../agents/LlmAgent';
import { BaseLlmRequestProcessor, BaseLlmResponseProcessor } from './BaseLlmProcessor';

/**
 * Processor for NL planning request.
 */
class NlPlanningRequestProcessor implements BaseLlmRequestProcessor {
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
    const planner = getPlanner(invocationContext);
    if (!planner) {
      return;
    }

    if (planner instanceof BuiltInPlanner) {
      planner.applyThinkingConfig(llmRequest);
    }

    const planningInstruction = planner.buildPlanningInstruction(
      new ReadonlyContext(invocationContext),
      llmRequest
    );
    
    if (planningInstruction) {
      llmRequest.appendInstructions([planningInstruction]);
    }

    removeThoughtFromRequest(llmRequest);

    // Maintain async generator behavior by returning early
    return;
    // The code below is unreachable but satisfies the AsyncGenerator return type
    yield {} as Event;
  }
}

/**
 * The exported request processor instance.
 */
export const requestProcessor = new NlPlanningRequestProcessor();

/**
 * Processor for NL planning response.
 */
class NlPlanningResponseProcessor implements BaseLlmResponseProcessor {
  /**
   * Processes the LLM response asynchronously.
   * 
   * @param invocationContext The invocation context
   * @param llmResponse The LLM response to process
   * @returns An async generator yielding events
   */
  async *runAsync(
    invocationContext: InvocationContext,
    llmResponse: LlmResponse
  ): AsyncGenerator<Event, void, unknown> {
    if (
      !llmResponse ||
      !llmResponse.content ||
      !llmResponse.content.parts
    ) {
      return;
    }

    const planner = getPlanner(invocationContext);
    if (!planner) {
      return;
    }

    // Postprocess the LLM response
    const callbackContext = new CallbackContext(invocationContext);
    const processedParts = planner.processPlanningResponse(
      callbackContext,
      llmResponse.content.parts
    );
    
    if (processedParts) {
      llmResponse.content.parts = processedParts;
    }

    // Check if the state has changed and create an event if needed
    // The Python has_delta() is equivalent to checking if the state delta is not empty
    if (Object.keys(callbackContext['eventActions'].stateDelta).length > 0) {
      const stateUpdateEvent = new Event({
        invocationId: invocationContext.invocationId,
        author: invocationContext.agent.name,
        branch: invocationContext.branch,
        actions: callbackContext['eventActions']
      });
      yield stateUpdateEvent;
    }
  }
}

/**
 * The exported response processor instance.
 */
export const responseProcessor = new NlPlanningResponseProcessor();

/**
 * Gets the planner from the invocation context.
 * 
 * @param invocationContext The invocation context
 * @returns The planner, or undefined if not found
 */
function getPlanner(
  invocationContext: InvocationContext
): BasePlanner | undefined {
  const agent = invocationContext.agent;
  
  if (!(agent instanceof LlmAgent)) {
    return undefined;
  }
  
  if (!agent.planner) {
    return undefined;
  }

  if (agent.planner instanceof BasePlanner) {
    return agent.planner;
  }
  
  return new PlanReActPlanner();
}

/**
 * Removes thought from the request.
 * 
 * @param llmRequest The LLM request
 */
function removeThoughtFromRequest(llmRequest: LlmRequest): void {
  if (!llmRequest.contents) {
    return;
  }

  for (const content of llmRequest.contents) {
    if (!content.parts) {
      continue;
    }
    
    for (const part of content.parts) {
      part.thought = undefined;
    }
  }
} 