 

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
    console.log('[NlPlanning] Request processor running...');
    const planner = getPlanner(invocationContext);
    if (!planner) {
      console.log('[NlPlanning] No planner found, skipping');
      return;
    }

    console.log('[NlPlanning] Using planner:', planner.constructor.name);

    if (planner instanceof BuiltInPlanner) {
      console.log('[NlPlanning] Applying BuiltInPlanner thinking config');
      planner.applyThinkingConfig(llmRequest);
    } else if (planner instanceof PlanReActPlanner) {
      console.log('[NlPlanning] Using PlanReActPlanner');
      const planningInstruction = planner.buildPlanningInstruction(
        new ReadonlyContext(invocationContext),
        llmRequest
      );

      if (planningInstruction) {
        console.log('[NlPlanning] Appending planning instruction:', planningInstruction.substring(0, 100) + '...');
        llmRequest.appendInstructions([planningInstruction]);
      } else {
        console.log('[NlPlanning] No planning instruction to append');
      }

      console.log('[NlPlanning] Removing thought from request (PlanReActPlanner only)');
      removeThoughtFromRequest(llmRequest);
    }

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
    console.log('[NlPlanning] Response processor running...');

    if (
      !llmResponse ||
      !llmResponse.content ||
      !llmResponse.content.parts
    ) {
      console.log('[NlPlanning] No response content or parts, skipping');
      return;
    }

    const planner = getPlanner(invocationContext);
    if (!planner) {
      console.log('[NlPlanning] No planner found, skipping');
      return;
    }

    // Skip processing for BuiltInPlanner (matching Python behavior)
    if (planner instanceof BuiltInPlanner) {
      console.log('[NlPlanning] BuiltInPlanner detected, skipping response processing');
      return;
    }

    console.log('[NlPlanning] Processing response with planner:', planner.constructor.name);

    // Postprocess the LLM response
    const callbackContext = new CallbackContext(invocationContext);
    const processedParts = planner.processPlanningResponse(
      callbackContext,
      llmResponse.content.parts
    );

    if (processedParts) {
      console.log('[NlPlanning] Response parts were processed, replacing with', processedParts.length, 'parts');
      llmResponse.content.parts = processedParts;
    } else {
      console.log('[NlPlanning] No processing done, keeping original response parts');
    }

    // Check if the state has changed and create an event if needed
    // The Python has_delta() is equivalent to checking if the state delta is not empty
    if (callbackContext.state.hasDelta()) {
      console.log('[NlPlanning] State has changed, yielding state update event');
      const stateUpdateEvent = new Event({
        invocationId: invocationContext.invocationId,
        author: invocationContext.agent.name,
        branch: invocationContext.branch,
        actions: callbackContext._eventActions
      });
      yield stateUpdateEvent;
    } else {
      console.log('[NlPlanning] No state changes detected');
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
  console.log('[NlPlanning] removeThoughtFromRequest - Before removal');
  if (!llmRequest.contents) {
    console.log('[NlPlanning] No contents in request');
    return;
  }

  console.log('[NlPlanning] Processing', llmRequest.contents.length, 'content items');

  for (let i = 0; i < llmRequest.contents.length; i++) {
    const content = llmRequest.contents[i];
    if (!content.parts) {
      console.log(`[NlPlanning] Content ${i}: No parts`);
      continue;
    }

    console.log(`[NlPlanning] Content ${i}: Processing ${content.parts.length} parts`);

    for (let j = 0; j < content.parts.length; j++) {
      const part = content.parts[j];
      const partKeys = Object.keys(part);
      console.log(`[NlPlanning] Content ${i}, Part ${j}: Keys before:`, partKeys);

      if (part.thought !== undefined) {
        console.log(`[NlPlanning] Content ${i}, Part ${j}: Deleting thought property`);
        delete part.thought;
        console.log(`[NlPlanning] Content ${i}, Part ${j}: Keys after:`, Object.keys(part));
      }
    }
  }

  console.log('[NlPlanning] removeThoughtFromRequest - After removal');
} 