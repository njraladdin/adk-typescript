 

// NOTE:
//
//    We expect that the underlying GenAI SDK will provide a certain
//    level of tracing and logging telemetry aligned with Open Telemetry
//    Semantic Conventions (such as logging prompts, responses,
//    request properties, etc.) and so the information that is recorded by the
//    Agent Development Kit should be focused on the higher-level
//    constructs of the framework that are not observable by the SDK.

import { InvocationContext } from './agents/InvocationContext';
import { Event } from './events/Event';
import { LlmRequest } from './models/LlmRequest';
import { LlmResponse } from './models/LlmResponse';
import { Content } from './models/types';

// This is a placeholder for OpenTelemetry trace functionality
// In an actual implementation, you'd import and use the real OpenTelemetry trace
interface Span {
  setAttribute(key: string, value: string): void;
}

class Tracer {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  startAsCurrentSpan(name: string): { end: () => void } {
    // In a real implementation, this would create and activate a new span
    console.log(`Starting span: ${name} for service: ${this.serviceName}`);
    return {
      end: () => {
        console.log(`Ending span: ${name}`);
      }
    };
  }
}

// Create a tracer for the agent service
export const tracer = new Tracer('gcp.vertex.agent');

// Placeholder for getting the current span in OpenTelemetry
function getCurrentSpan(): Span {
  // In a real implementation, this would return the current active span
  return {
    setAttribute: (key: string, value: string) => {
      console.log(`Setting attribute ${key} = ${value}`);
    }
  };
}

/**
 * Traces tool call.
 * 
 * @param args The arguments to the tool call.
 */
export function traceToolCall(args: Record<string, any>): void {
  const span = getCurrentSpan();
  span.setAttribute('gen_ai.system', 'gcp.vertex.agent');
  span.setAttribute('gcp.vertex.agent.tool_call_args', JSON.stringify(args));
}

/**
 * Traces tool response event.
 * 
 * This function records details about the tool response event as attributes on
 * the current OpenTelemetry span.
 * 
 * @param invocationContext The invocation context for the current agent run.
 * @param eventId The ID of the event.
 * @param functionResponseEvent The function response event which can be either
 *   merged function response for parallel function calls or individual
 *   function response for sequential function calls.
 */
export function traceToolResponse(
  invocationContext: InvocationContext,
  eventId: string,
  functionResponseEvent: Event
): void {
  const span = getCurrentSpan();
  span.setAttribute('gen_ai.system', 'gcp.vertex.agent');
  span.setAttribute('gcp.vertex.agent.invocation_id', invocationContext.invocationId);
  span.setAttribute('gcp.vertex.agent.event_id', eventId);
  span.setAttribute(
    'gcp.vertex.agent.tool_response',
    JSON.stringify(functionResponseEvent)
  );

  // Setting empty llm request and response (as UI expect these) while not
  // applicable for tool_response.
  span.setAttribute('gcp.vertex.agent.llm_request', '{}');
  span.setAttribute('gcp.vertex.agent.llm_response', '{}');
}

/**
 * Traces a call to the LLM.
 * 
 * This function records details about the LLM request and response as
 * attributes on the current OpenTelemetry span.
 * 
 * @param invocationContext The invocation context for the current agent run.
 * @param eventId The ID of the event.
 * @param llmRequest The LLM request object.
 * @param llmResponse The LLM response object.
 */
export function traceCallLlm(
  invocationContext: InvocationContext,
  eventId: string,
  llmRequest: LlmRequest,
  llmResponse: LlmResponse
): void {
  const span = getCurrentSpan();
  // Special standard Open Telemetry GenaI attributes that indicate
  // that this is a span related to a Generative AI system.
  span.setAttribute('gen_ai.system', 'gcp.vertex.agent');
  span.setAttribute('gen_ai.request.model', llmRequest.model || 'unknown');
  span.setAttribute('gcp.vertex.agent.invocation_id', invocationContext.invocationId);
  span.setAttribute('gcp.vertex.agent.event_id', eventId);
  
  // Consider removing once GenAI SDK provides a way to record this info.
  span.setAttribute(
    'gcp.vertex.agent.llm_request',
    JSON.stringify(buildLlmRequestForTrace(llmRequest))
  );
  
  // Consider removing once GenAI SDK provides a way to record this info.
  span.setAttribute(
    'gcp.vertex.agent.llm_response',
    JSON.stringify(llmResponse)
  );
}

/**
 * Traces the sending of data to the agent.
 * 
 * This function records details about the data sent to the agent as
 * attributes on the current OpenTelemetry span.
 * 
 * @param invocationContext The invocation context for the current agent run.
 * @param eventId The ID of the event.
 * @param data A list of content objects.
 */
export function traceSendData(
  invocationContext: InvocationContext,
  eventId: string,
  data: Content[]
): void {
  const span = getCurrentSpan();
  span.setAttribute('gcp.vertex.agent.invocation_id', invocationContext.invocationId);
  span.setAttribute('gcp.vertex.agent.event_id', eventId);
  
  // Once instrumentation is added to the GenAI SDK, consider whether this
  // information still needs to be recorded by the Agent Development Kit.
  span.setAttribute(
    'gcp.vertex.agent.data',
    JSON.stringify(data.map(content => ({
      role: content.role,
      parts: content.parts
    })))
  );
}

/**
 * Builds a dictionary representation of the LLM request for tracing.
 * 
 * This function prepares a dictionary representation of the LlmRequest
 * object, suitable for inclusion in a trace. It excludes fields that cannot
 * be serialized (e.g., function pointers) and avoids sending bytes data.
 * 
 * @param llmRequest The LlmRequest object.
 * @returns A dictionary representation of the LLM request.
 * @private
 */
function buildLlmRequestForTrace(llmRequest: LlmRequest): Record<string, any> {
  // Some fields in LlmRequest are function pointers and can not be serialized.
  const result: Record<string, any> = {
    model: llmRequest.model,
    config: { ...llmRequest.config },
    contents: []
  };

  // Delete response schema to avoid circular references
  if (result.config.responseSchema) {
    delete result.config.responseSchema;
  }
  
  // We do not want to send bytes data to the trace.
  if (llmRequest.contents) {
    for (const content of llmRequest.contents) {
      if (!content || !content.parts) continue;
      
      // Filter out parts with inline_data
      const filteredParts = content.parts.filter(part => !part.inlineData);
      
      result.contents.push({
        role: content.role,
        parts: filteredParts
      });
    }
  }
  
  return result;
} 