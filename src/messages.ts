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
 * Represents a part of a message content
 */
export interface Part {
  /**
   * The text content of the part
   */
  text?: string;
  
  /**
   * Optional function call details
   */
  functionCall?: {
    name: string;
    args: Record<string, any>;
  };
}

/**
 * Enum representing the role of a message sender
 */
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}

/**
 * Options for creating a message
 */
export interface MessageOptions {
  /**
   * The role of the message sender
   */
  role: MessageRole;
  
  /**
   * The content parts of the message
   */
  parts: Part[];
  
  /**
   * Optional timestamp for the message
   */
  timestamp?: Date;
  
  /**
   * Optional ID for the message
   */
  id?: string;
}

/**
 * Represents a message in a conversation
 */
export interface Message {
  /**
   * The unique identifier for the message
   */
  id: string;
  
  /**
   * The role of the message sender
   */
  role: MessageRole;
  
  /**
   * The content parts of the message
   */
  parts: Part[];
  
  /**
   * Timestamp when the message was created
   */
  timestamp: Date;
  
  /**
   * Get the text content of the message
   */
  text(): string;
} 