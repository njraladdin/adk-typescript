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

import { BaseAgent } from '../agents/BaseAgent';
import { RunConfig } from '../agents/RunConfig';
import { BaseArtifactService } from '../artifacts/BaseArtifactService';
import { Content } from '../models/types';
import { BaseSessionService } from '../sessions/baseSessionService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Options for creating a Runner
 */
export interface RunnerOptions {
  /** The name of the app */
  appName: string;
  
  /** The agent to run */
  agent: BaseAgent;
  
  /** Service for managing artifacts */
  artifactService: BaseArtifactService;
  
  /** Service for managing sessions */
  sessionService: BaseSessionService;
}

/**
 * Options for running an agent
 */
export interface RunOptions {
  /** The ID of the user */
  userId: string;
  
  /** The ID of the session */
  sessionId: string;
  
  /** The new message to process */
  newMessage: Content;
  
  /** Configuration for the run */
  runConfig?: RunConfig;
}

/**
 * Event emitted during agent execution
 */
export interface Event {
  /** The ID of the event */
  id: string;
  
  /** The ID of the invocation that produced this event */
  invocationId?: string;
  
  /** The author of the event */
  author: string;
  
  /** The content of the event */
  content?: Content;
  
  /** The actions associated with the event */
  actions?: Record<string, any>;
  
  /** Whether this event completes the turn */
  turnComplete?: boolean;
  
  /** Whether this is a partial event */
  partial?: boolean;
  
  /** IDs of long-running tools */
  longRunningToolIds?: Set<string>;
  
  /** Error code if the event represents an error */
  errorCode?: string;
  
  /** Error message if the event represents an error */
  errorMessage?: string;
  
  /** Whether the event was interrupted */
  interrupted?: boolean;
  
  /** Timestamp when the event was created */
  timestamp?: Date;
  
  /** Whether this is the final response */
  isFinalResponse?: boolean;
  
  /** Gets function calls from this event */
  getFunctionCalls?: () => any[];
  
  /** Gets function responses from this event */
  getFunctionResponses?: () => any[];
  
  /** Whether this event has trailing code execution results */
  hasTrailingCodeExecutionResult?: boolean;
}

/**
 * Runner for executing agents with sessions
 */
export class Runner {
  private appName: string;
  private agent: BaseAgent;
  private artifactService: BaseArtifactService;
  private sessionService: BaseSessionService;
  
  /**
   * Creates a new Runner
   * 
   * @param options Options for the runner
   */
  constructor(options: RunnerOptions) {
    this.appName = options.appName;
    this.agent = options.agent;
    this.artifactService = options.artifactService;
    this.sessionService = options.sessionService;
  }
  
  /**
   * Runs the agent asynchronously
   * 
   * @param options Options for running the agent
   * @returns An async generator of events
   */
  async *runAsync(options: RunOptions): AsyncGenerator<Event, void, unknown> {
    const { userId, sessionId, newMessage, runConfig } = options;
    
    // Apply run configuration (TODO: implement actual configuration handling)
    
    // For now, just yield a single event as a placeholder
    // This would be replaced with actual agent invocation logic
    const event: Event = {
      id: uuidv4(),
      author: this.agent.name,
      content: {
        role: 'assistant',
        parts: [{ text: `Response from ${this.agent.name}` }]
      },
      turnComplete: true,
      timestamp: new Date(),
      isFinalResponse: true,
      getFunctionCalls: () => [],
      getFunctionResponses: () => [],
      hasTrailingCodeExecutionResult: false
    };
    
    yield event;
  }
  
  /**
   * Runs the agent in live mode with WebSocket
   * 
   * @param options Options for live running
   * @returns An async generator of events
   */
  async *runLive(options: any): AsyncGenerator<Event, void, unknown> {
    // This is a placeholder implementation
    yield {
      id: uuidv4(),
      author: this.agent.name,
      content: {
        role: 'assistant',
        parts: [{ text: `Live response from ${this.agent.name}` }]
      },
      turnComplete: true,
      timestamp: new Date(),
      isFinalResponse: true,
      getFunctionCalls: () => [],
      getFunctionResponses: () => [],
      hasTrailingCodeExecutionResult: false
    };
  }
} 