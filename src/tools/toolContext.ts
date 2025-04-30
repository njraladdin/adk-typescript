// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CallbackContext } from '../agents/CallbackContext';
import { InvocationContext } from '../agents/InvocationContext';
import { EventActions } from '../events/EventActions';
import { AuthConfig } from '../auth/AuthConfig';
import { AuthCredential } from '../auth/AuthCredential';
import { AuthHandler } from '../auth/AuthHandler';
import { ArtifactParams } from '../artifacts/BaseArtifactService'; 
import { SearchMemoryResponse } from '../memory/BaseMemoryService';

/**
 * The context for a tool execution.
 * 
 * This class provides the context for a tool invocation, including access to
 * the invocation context, function call ID, event actions, and authentication
 * response. It also provides methods for requesting credentials, retrieving
 * authentication responses, listing artifacts, and searching memory.
 */
export class ToolContext extends CallbackContext {
  /**
   * The function call id of the current tool call. This id was
   * returned in the function call event from LLM to identify a function call.
   * If LLM didn't return this id, ADK will assign one to it. This id is used
   * to map function call response to the original function call.
   */
  functionCallId?: string;

  /**
   * The event actions for this tool call 
   */
  private toolEventActions: EventActions;

  /**
   * Additional properties for dynamic access
   */
  [key: string]: any;

  /**
   * Create a new tool context
   * 
   * @param invocationContext The invocation context
   * @param functionCallId The function call ID
   * @param eventActions The event actions
   */
  constructor(
    invocationContext: InvocationContext,
    functionCallId?: string,
    eventActions?: EventActions
  ) {
    super(invocationContext, eventActions);
    this.functionCallId = functionCallId;
    this.toolEventActions = eventActions || new EventActions();
  }

  /**
   * Get the event actions for this tool call
   */
  get actions(): EventActions {
    return this.toolEventActions;
  }

  /**
   * Request credential using the given auth config
   * 
   * @param authConfig The auth config to use
   * @throws Error if function call ID is not set
   */
  requestCredential(authConfig: AuthConfig): void {
    if (!this.functionCallId) {
      throw new Error('functionCallId is not set.');
    }
    
    const authHandler = new AuthHandler(authConfig);
    const authRequest = authHandler.generateAuthRequest();
    this.toolEventActions.requestedAuthConfigs.set(this.functionCallId, authRequest);
  }

  /**
   * Get the auth response for the given auth config
   * 
   * @param authConfig The auth config to use
   * @returns The auth credential
   */
  getAuthResponse(authConfig: AuthConfig): AuthCredential {
    const authHandler = new AuthHandler(authConfig);
    const response = authHandler.getAuthResponse(this.state);
    if (!response) {
      throw new Error('No auth response available for the given auth config.');
    }
    return response;
  }

  /**
   * List artifacts attached to the current session
   * 
   * @returns List of artifact filenames
   * @throws Error if artifact service is not initialized
   */
  listArtifacts(): string[] | Promise<string[]> {
    if (!this.invocationContext.artifactService) {
      throw new Error('Artifact service is not initialized.');
    }
    
    return this.invocationContext.artifactService.listArtifactKeys({
      appName: this.invocationContext.appName,
      userId: this.invocationContext.userId,
      sessionId: this.invocationContext.session.id,
      // TS requires filename, but in this case we're listing artifacts so we don't need it
      // Using an empty string as a placeholder
      filename: '' 
    });
  }

  /**
   * Search the memory for the given query
   * 
   * @param query The search query
   * @returns The search results
   * @throws Error if memory service is not available
   */
  searchMemory(query: string): SearchMemoryResponse | Promise<SearchMemoryResponse> {
    if (!this.invocationContext.memoryService) {
      throw new Error('Memory service is not available.');
    }
    
    return this.invocationContext.memoryService.searchMemory(
      this.invocationContext.appName,
      this.invocationContext.userId,
      query
    );
  }

  // Maintain backward compatibility with the original ToolContext interface
  
  /**
   * Check if the context has a specific property 
   */
  has(key: string): boolean {
    return key in this && this[key] !== undefined;
  }

  /**
   * Get a value from the context
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    if (key === 'session') {
      return this.invocationContext.session as unknown as T;
    }
    return this.has(key) ? (this[key] as T) : defaultValue;
  }

  /**
   * Set a value in the context
   */
  set<T>(key: string, value: T): void {
    if (key !== 'session' && key !== 'invocationContext') {
      this[key] = value;
    }
  }
} 