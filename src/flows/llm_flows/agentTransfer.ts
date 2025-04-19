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

/**
 * Implementation of agent transfer processor.
 * 
 * This processor allows agents to transfer control to other agents in specific conditions:
 * 1. From parent to sub-agent
 * 2. From sub-agent to parent
 * 3. From sub-agent to its peer agents (when allowed)
 */
import { InvocationContext } from '../../agents/InvocationContext';
import { Event } from '../../events/Event';
import { LlmRequest } from '../../models/LlmRequest';
import { BaseLlmRequestProcessor } from './BaseLlmProcessor';
import { LlmAgent } from '../../agents/LlmAgent';
import { BaseAgent } from '../../agents/BaseAgent';
import { Session } from '../../sessions/Session';

/**
 * A request processor that adds agent transfer capability to LLM requests.
 */
class AgentTransferLlmRequestProcessor implements BaseLlmRequestProcessor {
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
    
    // Build potential transfer targets to other agents
    const targetAgents = this.buildTargetAgentsList(invocationContext);
    if (!targetAgents || targetAgents.length === 0) {
      // No available targets, nothing to do
      return;
    }

    // Append instructions for the agent transfer ability
    const instructions = this.buildTargetAgentInstructions(targetAgents);
    llmRequest.appendInstructions(instructions);
    
    // Add the function definition for transfer_to_agent
    this.addTransferFunction(llmRequest);
    
    // An empty generator function that yields nothing but maintains the generator structure
    if (false) {
      yield {} as Event;
    }
  }

  /**
   * Adds the transfer_to_agent function definition to the LLM request.
   * 
   * @param llmRequest The LLM request to add the function to
   */
  private addTransferFunction(llmRequest: LlmRequest): void {
    // We're using a type assertion here because we're assuming
    // that LlmRequest will be extended to support this functionality
    const extendedRequest = llmRequest as unknown as { 
      addFunction: (functionDef: any) => void 
    };
    
    extendedRequest.addFunction({
      name: 'transfer_to_agent',
      description: 'Transfer to another agent if the current agent cannot handle the request',
      parameters: {
        type: 'object',
        properties: {
          agent_name: {
            type: 'string',
            description: 'Name of the agent to transfer to'
          },
          reason: {
            type: 'string',
            description: 'Reason for transferring to the specified agent'
          }
        },
        required: ['agent_name', 'reason']
      }
    });
  }

  /**
   * Builds the list of available target agents for transfer.
   * 
   * @param invocationContext The invocation context
   * @returns List of target agent objects with name and description
   */
  private buildTargetAgentsList(invocationContext: InvocationContext): Array<{name: string, description: string}> {
    const agent = invocationContext.agent;
    // Cast session to the concrete type to access the agents property
    const session = invocationContext.session as Session;
    const targetAgents: Array<{name: string, description: string}> = [];
    
    // Access parent through parentAgent property from BaseAgent
    if (agent.parentAgent) {
      // Add parent for backward transfer if it's an LLM agent
      if (agent.parentAgent instanceof LlmAgent) {
        targetAgents.push({
          name: agent.parentAgent.name,
          description: agent.parentAgent.description || 'Parent agent'
        });
      }
      
      // Check if parent allows transfers to peer agents
      // Cast to LlmAgent to access allowTransferToPeer
      const parentAsLlmAgent = agent.parentAgent as unknown as { allowTransferToPeer?: boolean };
      if (parentAsLlmAgent.allowTransferToPeer !== false) {
        // Add peer agents (siblings)
        // Use the agents map from the session
        for (const [_, peerAgent] of session.agents) {
          // Skip self and non-children of parent
          if (peerAgent === agent || peerAgent.parentAgent !== agent.parentAgent) {
            continue;
          }
          
          targetAgents.push({
            name: peerAgent.name,
            description: peerAgent.description || `Peer agent: ${peerAgent.name}`
          });
        }
      }
    }
    
    // Add sub-agents as transfer targets
    // Use the agents map from the session
    for (const [_, subAgent] of session.agents) {
      if (subAgent.parentAgent === agent) {
        targetAgents.push({
          name: subAgent.name,
          description: subAgent.description || `Sub-agent: ${subAgent.name}`
        });
      }
    }
    
    return targetAgents;
  }

  /**
   * Builds instructions for agent transfer capability.
   * 
   * @param targetAgents List of target agents with name and description
   * @returns Array of instruction strings
   */
  private buildTargetAgentInstructions(targetAgents: Array<{name: string, description: string}>): string[] {
    const instructions: string[] = [];
    
    instructions.push('You can transfer to other agents when you cannot handle the request:');
    
    // Add description for each target agent
    for (const targetAgent of targetAgents) {
      instructions.push(` - ${targetAgent.name}: ${targetAgent.description}`);
    }
    
    instructions.push(
      'To transfer, call the transfer_to_agent function with the agent name and reason. ' +
      'Don\'t transfer unless you need to.'
    );
    
    return instructions;
  }
}

// Export the processor instance
export const requestProcessor = new AgentTransferLlmRequestProcessor(); 