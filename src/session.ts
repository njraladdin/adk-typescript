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

import { LlmAgent } from './agents/LlmAgent';
import { Message } from './messages';

/**
 * Interface representing a part of a message
 */
export interface Part {
  text?: string;
  [key: string]: any;
}

/**
 * Options for creating a session
 */
export interface SessionOptions {
  /**
   * The agent associated with the session
   */
  agent: LlmAgent;
  
  /**
   * The ID for the session
   */
  id?: string;
  
  /**
   * The parent ID for the session
   */
  parentId?: string;
}

/**
 * Represents an interactive session with an agent
 */
export interface Session {
  /**
   * The unique identifier for the session
   */
  id: string;
  
  /**
   * The parent session ID if this is a child session
   */
  parentId?: string;
  
  /**
   * The agent associated with this session
   */
  agent: LlmAgent;
  
  /**
   * Sends a message to the agent and receives a response
   * 
   * @param message The message to send to the agent
   * @returns A promise resolving to the agent's response
   */
  sendMessage(message: Message | string): Promise<Message>;
  
  /**
   * Gets the history of messages in the session
   * 
   * @returns An array of messages in the session
   */
  getMessages(): Message[];
  
  /**
   * Ends the session
   */
  end(): Promise<void>;
} 