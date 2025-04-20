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
 * Implementation of an agent that uses an LLM flow.
 */
import { BaseAgent, AgentOptions } from './BaseAgent';
import { InvocationContext } from './InvocationContext';
import { Event } from '../events/Event';
import { BaseLlmFlow } from '../flows/llm_flows/BaseLlmFlow';
import { Content } from '../models/types';
import { BaseLlm } from '../models/BaseLlm';
import { BaseTool } from '../tools/BaseTool';
import { Session } from '../session';
import { Message, MessageRole } from '../messages';

/**
 * Extended options for LLM agents.
 */
export interface LlmAgentOptions extends AgentOptions {
  /** The LLM flow to use */
  flow?: BaseLlmFlow;
  
  /** The LLM model to use */
  llm?: BaseLlm;
  
  /** Whether to allow transfers to peer agents (default: true) */
  allowTransferToPeer?: boolean;
  
  /** Tools available to this agent */
  tools?: BaseTool[];
  
  /** The instruction template for the agent */
  instruction?: string;
}

/**
 * An agent that uses an LLM flow to process requests.
 */
export class LlmAgent extends BaseAgent {
  /** The LLM flow used by this agent */
  flow: BaseLlmFlow;
  
  /** The LLM model used by this agent */
  llm?: BaseLlm;
  
  /** Whether to allow transfers to peer agents */
  allowTransferToPeer: boolean;
  
  /** Tools available to this agent */
  canonicalTools: BaseTool[] = [];
  
  /** The instruction template for the agent */
  instruction?: string;
  
  /**
   * Creates a new LLM agent.
   * 
   * @param name The name of the agent
   * @param options Options for the agent
   */
  constructor(name: string, options: LlmAgentOptions = {}) {
    super(name, options);
    
    if (!options.flow) {
      throw new Error('LlmAgent requires a flow');
    }
    
    this.flow = options.flow;
    this.llm = options.llm;
    this.allowTransferToPeer = options.allowTransferToPeer ?? true;
    this.instruction = options.instruction;
    
    // Set tools if provided
    if (options.tools) {
      this.canonicalTools = [...options.tools];
    }
  }
  
  /**
   * Creates a new session for this agent
   * 
   * @returns A promise resolving to a new Session object
   */
  async createSession(): Promise<Session> {
    // Create and return a new session for this agent
    // This is a simplified implementation
    return {
      id: crypto.randomUUID(),
      agent: this,
      sendMessage: async (message: Message | string) => {
        // Placeholder implementation
        console.log(`Received message in session: ${typeof message === 'string' ? message : JSON.stringify(message)}`);
        return {
          id: crypto.randomUUID(),
          role: MessageRole.ASSISTANT,
          parts: [{ text: "Agent response" }],
          timestamp: new Date(),
          text: () => "Agent response"
        };
      },
      getMessages: () => [],
      end: async () => { /* End the session */ }
    };
  }
  
  /**
   * Implementation of the agent's async invocation logic.
   * 
   * @param invocationContext The invocation context
   * @returns An async generator of events
   */
  protected async *runAsyncImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Set the LLM in the invocation context if it's defined
    if (this.llm) {
      invocationContext.llm = this.llm;
    }
    
    // Use the flow to generate a response
    yield* this.flow.runAsync(invocationContext);
  }
  
  /**
   * Implementation of the agent's live invocation logic.
   * 
   * @param invocationContext The invocation context
   * @returns An async generator of events
   */
  protected async *runLiveImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // Set the LLM in the invocation context if it's defined
    if (this.llm) {
      invocationContext.llm = this.llm;
    }
    
    // Use the flow to generate a response
    yield* this.flow.runLive(invocationContext);
  }
  
  /**
   * Sets the user content for the agent.
   * 
   * @param content The user content
   * @param invocationContext The invocation context
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    invocationContext.userContent = content;
  }
} 