

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
    // Get the session from invocation context
    const session = invocationContext.session as any;
    const targetAgents: Array<{name: string, description: string}> = [];
    
    // Make sure the session has an agents Map
    if (!session.agents) {
      session.agents = new Map();
    }
    
    // Ensure the agents property is a Map or at least has a forEach method
    if (!(session.agents instanceof Map) && typeof session.agents.entries !== 'function') {
      console.warn('Session agents is not a Map, creating a new Map');
      const oldAgents = session.agents;
      session.agents = new Map();
      
      // If agents is an object, try to convert it to a Map
      if (typeof oldAgents === 'object' && oldAgents !== null) {
        Object.entries(oldAgents).forEach(([name, agent]) => {
          session.agents.set(name, agent);
        });
      }
    }
    
    // Add the current agent to the session if not already there
    if (!session.agents.has(agent.name)) {
      session.agents.set(agent.name, agent);
    }
    
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
      // Use disallowTransferToPeers property on LlmAgent
      if (agent.parentAgent instanceof LlmAgent && !agent.parentAgent.disallowTransferToPeers) {
        // Add peer agents (siblings)
        // Use the agents map from the session
        try {
          // Safely iterate over the agents Map
          for (const [peerName, peerAgent] of session.agents.entries()) {
            // Skip self and non-children of parent
            if (peerAgent === agent || peerAgent.parentAgent !== agent.parentAgent) {
              continue;
            }
            
            targetAgents.push({
              name: peerAgent.name,
              description: peerAgent.description || `Peer agent: ${peerAgent.name}`
            });
          }
        } catch (error) {
          console.error('Error iterating over agents:', error);
        }
      }
    }
    
    // Add sub-agents as transfer targets
    // Safely iterate over the agents Map
    try {
      for (const [subName, subAgent] of session.agents.entries()) {
        if (subAgent.parentAgent === agent) {
          targetAgents.push({
            name: subAgent.name,
            description: subAgent.description || `Sub-agent: ${subAgent.name}`
          });
        }
      }
    } catch (error) {
      console.error('Error iterating over agents for sub-agents:', error);
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