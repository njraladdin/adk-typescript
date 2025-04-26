

import { Session } from '../../sessions/interfaces';
import { Event } from '../../events/Event';
import { Content } from '../../models/types';
import { Part } from '../../models/types';

/**
 * Agent response during an evaluation
 */
interface AgentResponse {
  /** The author of the response */
  author: string;
  
  /** The text content of the response */
  text: string;
}

/**
 * Function call structure for tool use
 */
interface ExpectedToolUse {
  /** Name of the tool that was used */
  tool_name: string;
  
  /** Input provided to the tool */
  tool_input: Record<string, any>;
}

/**
 * A single evaluation case 
 */
interface EvaluationCase {
  /** The user query */
  query: string;
  
  /** Expected tool use for this query */
  expected_tool_use: ExpectedToolUse[];
  
  /** Intermediate responses from agents */
  expected_intermediate_agent_responses: AgentResponse[];
  
  /** Expected final response (reference) */
  reference: string;
}

/**
 * Converts a session into an evaluation format
 * 
 * @param session The session to convert
 * @returns Array of evaluation cases extracted from the session
 */
export function convertSessionToEvalFormat(session: Session): EvaluationCase[] {
  const evalCases: EvaluationCase[] = [];
  const events = session.events || [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    // Skip if not a user event or has no content
    if (event.author !== 'user' || !event.content || !event.content.parts || event.content.parts.length === 0) {
      continue;
    }

    // Extract user query
    const query = event.content.parts[0].text || '';
    
    // Find the corresponding tool usage or response for the query
    const expectedToolUse: ExpectedToolUse[] = [];
    const intermediateAgentResponses: AgentResponse[] = [];
    
    // Check subsequent events to extract tool uses or responses for this turn
    for (let j = i + 1; j < events.length; j++) {
      const subsequentEvent = events[j];
      const eventAuthor = subsequentEvent.author || 'agent';
      
      // If we find a user event, this is the start of a new turn
      if (eventAuthor === 'user') {
        break;
      }
      
      if (!subsequentEvent.content || !subsequentEvent.content.parts) {
        continue;
      }
      
      for (const part of subsequentEvent.content.parts as Part[]) {
        if (part.functionCall) {
          const toolName = part.functionCall.name || '';
          const toolInput = part.functionCall.args || {};
          
          expectedToolUse.push({
            tool_name: toolName,
            tool_input: toolInput,
          });
        } else if (part.text) {
          // Also keep track of all the natural language responses that
          // agent (or sub agents) generated
          intermediateAgentResponses.push({
            author: eventAuthor,
            text: part.text
          });
        }
      }
    }
    
    // We assume the last natural language intermediate response is the final response
    // from the agent/model. We treat that as a reference.
    evalCases.push({
      query,
      expected_tool_use: expectedToolUse,
      expected_intermediate_agent_responses: intermediateAgentResponses.slice(0, -1),
      reference: intermediateAgentResponses.length > 0 ? 
        intermediateAgentResponses[intermediateAgentResponses.length - 1].text : '',
    });
  }
  
  return evalCases;
} 