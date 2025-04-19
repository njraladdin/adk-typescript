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

import { v4 as uuidv4 } from 'uuid';
import { Event, Session, SessionsList } from './interfaces';
import { Content, Part } from './types';
import { BaseSessionService, ListEventsResponse } from './baseSessionService';
import { State } from './state';

// Interface for the Vertex AI client
interface VertexAiClient {
  request(options: {
    httpMethod: string;
    path: string;
    requestDict: Record<string, any>;
  }): Promise<any>;
}

// Interface for the Vertex AI client factory
interface GenAiClient {
  _apiClient: VertexAiClient;
}

/**
 * Connects to the managed Vertex AI Session Service
 */
export class VertexAiSessionService extends BaseSessionService {
  private project: string;
  private location: string;
  private apiClient: VertexAiClient;

  /**
   * Creates a new VertexAiSessionService
   * 
   * @param project - The Google Cloud project ID
   * @param location - The Google Cloud location/region
   * @param client - Optional GenAi client to use for API calls
   */
  constructor(options: {
    project?: string;
    location?: string;
    client?: GenAiClient;
  }) {
    super();
    this.project = options.project || '';
    this.location = options.location || '';
    
    // In a real implementation, we would import and use the genai client
    // For now, we'll just use the provided client or create a stub
    this.apiClient = options.client?._apiClient || {
      request: async (options: any) => {
        throw new Error('No Vertex AI client provided');
      }
    };
  }

  /**
   * Creates a new session in Vertex AI
   */
  async createSession(options: {
    appName: string;
    userId: string;
    sessionId?: string;
    state?: Record<string, any>;
  }): Promise<Session> {
    const { appName, userId, state } = options;
    const reasoningEngineId = this.parseReasoningEngineId(appName);

    const sessionJsonDict: Record<string, any> = { 
      user_id: userId
    };
    
    if (state) {
      sessionJsonDict.session_state = state;
    }

    // Create the session in Vertex AI
    const apiResponse = await this.apiClient.request({
      httpMethod: 'POST',
      path: `reasoningEngines/${reasoningEngineId}/sessions`,
      requestDict: sessionJsonDict
    });
    
    console.log('Create Session response', apiResponse);

    // Extract session ID and operation ID from the response
    const sessionId = apiResponse.name.split('/').slice(-3)[0];
    const operationId = apiResponse.name.split('/').slice(-1)[0];

    // Poll for operation completion
    let maxRetryAttempt = 5;
    while (maxRetryAttempt >= 0) {
      const lroResponse = await this.apiClient.request({
        httpMethod: 'GET',
        path: `operations/${operationId}`,
        requestDict: {}
      });

      if (lroResponse.done) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      maxRetryAttempt--;
    }

    // Get the session resource
    const getSessionApiResponse = await this.apiClient.request({
      httpMethod: 'GET',
      path: `reasoningEngines/${reasoningEngineId}/sessions/${sessionId}`,
      requestDict: {}
    });

    // Parse the update timestamp
    const updateTimestamp = new Date(getSessionApiResponse.updateTime).getTime() / 1000;
    
    // Create and return the session
    const session: Session = {
      id: sessionId,
      appName: appName,
      userId: userId,
      state: getSessionApiResponse.sessionState || {},
      events: []
    };
    
    return session;
  }

  /**
   * Gets a session by its ID
   */
  async getSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<Session | null> {
    const { appName, userId, sessionId } = options;
    const reasoningEngineId = this.parseReasoningEngineId(appName);

    try {
      // Get session resource
      const getSessionApiResponse = await this.apiClient.request({
        httpMethod: 'GET',
        path: `reasoningEngines/${reasoningEngineId}/sessions/${sessionId}`,
        requestDict: {}
      });

      // Parse the update timestamp
      const updateTimestamp = new Date(getSessionApiResponse.updateTime).getTime() / 1000;
      
      // Create the session
      const session: Session = {
        id: sessionId,
        appName: appName,
        userId: userId,
        state: getSessionApiResponse.sessionState || {},
        events: []
      };

      // Get the session events
      const listEventsApiResponse = await this.apiClient.request({
        httpMethod: 'GET',
        path: `reasoningEngines/${reasoningEngineId}/sessions/${sessionId}/events`,
        requestDict: {}
      });

      // Handle empty response case
      if (listEventsApiResponse.httpHeaders) {
        return session;
      }

      // Convert API events to Event objects
      session.events = listEventsApiResponse.sessionEvents
        .map((event: any) => this.fromApiEvent(event))
        .filter((event: Event) => {
          // Filter events by timestamp
          return event.timestamp !== undefined && event.timestamp <= updateTimestamp;
        })
        .sort((a: Event, b: Event) => {
          // Sort events by timestamp
          return (a.timestamp || 0) - (b.timestamp || 0);
        });

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Lists all sessions for a user in an app
   */
  async listSessions(options: {
    appName: string;
    userId: string;
  }): Promise<SessionsList> {
    const { appName, userId } = options;
    const reasoningEngineId = this.parseReasoningEngineId(appName);

    try {
      const apiResponse = await this.apiClient.request({
        httpMethod: 'GET',
        path: `reasoningEngines/${reasoningEngineId}/sessions?filter=user_id=${userId}`,
        requestDict: {}
      });

      // Handle empty response case
      if (apiResponse.httpHeaders) {
        return { sessions: [] };
      }

      // Convert API sessions to Session objects
      const sessions = apiResponse.sessions.map((apiSession: any) => {
        return {
          id: apiSession.name.split('/').slice(-1)[0],
          appName: appName,
          userId: userId,
          state: {}, // Don't load full state for listing
          events: [] // Don't load events for listing
        };
      });

      return { sessions };
    } catch (error) {
      console.error('Error listing sessions:', error);
      return { sessions: [] };
    }
  }

  /**
   * Deletes a session
   */
  async deleteSession(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<void> {
    const { appName, sessionId } = options;
    const reasoningEngineId = this.parseReasoningEngineId(appName);

    try {
      await this.apiClient.request({
        httpMethod: 'DELETE',
        path: `reasoningEngines/${reasoningEngineId}/sessions/${sessionId}`,
        requestDict: {}
      });
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  /**
   * Lists events in a session
   */
  async listEvents(options: {
    appName: string;
    userId: string;
    sessionId: string;
  }): Promise<ListEventsResponse> {
    const { appName, sessionId } = options;
    const reasoningEngineId = this.parseReasoningEngineId(appName);

    try {
      const apiResponse = await this.apiClient.request({
        httpMethod: 'GET',
        path: `reasoningEngines/${reasoningEngineId}/sessions/${sessionId}/events`,
        requestDict: {}
      });

      console.log('List events response', apiResponse);

      // Handle empty response case
      if (apiResponse.httpHeaders) {
        return { events: [] };
      }

      // Convert API events to Event objects
      const events = apiResponse.sessionEvents.map((event: any) => this.fromApiEvent(event));

      return { events };
    } catch (error) {
      console.error('Error listing events:', error);
      return { events: [] };
    }
  }

  /**
   * Appends an event to a session
   */
  async appendEvent(options: {
    session: Session;
    event: Event;
  }): Promise<void> {
    const { session, event } = options;
    
    // Update the in-memory session
    super.appendEvent(options);

    // Update the session in Vertex AI
    const reasoningEngineId = this.parseReasoningEngineId(session.appName);
    
    try {
      await this.apiClient.request({
        httpMethod: 'POST',
        path: `reasoningEngines/${reasoningEngineId}/sessions/${session.id}:appendEvent`,
        requestDict: this.convertEventToJson(event)
      });
    } catch (error) {
      console.error('Error appending event:', error);
    }
  }

  /**
   * Parses a reasoning engine ID from an app name
   */
  private parseReasoningEngineId(appName: string): string {
    // If app name is just digits, assume it's already a reasoning engine ID
    if (/^\d+$/.test(appName)) {
      return appName;
    }

    // Check if app name matches the expected format
    const pattern = /^projects\/([a-zA-Z0-9-_]+)\/locations\/([a-zA-Z0-9-_]+)\/reasoningEngines\/(\d+)$/;
    const match = appName.match(pattern);

    if (!match) {
      throw new Error(
        `App name ${appName} is not valid. It should either be the full ` +
        'ReasoningEngine resource name, or the reasoning engine id.'
      );
    }

    // Return the reasoning engine ID
    return match[3];
  }

  /**
   * Converts an Event object to a JSON object for the API
   */
  private convertEventToJson(event: Event): Record<string, any> {
    const metadataJson: Record<string, any> = {
      partial: event.partial,
      turn_complete: event.turnComplete,
      interrupted: event.interrupted,
      branch: event.branch,
      long_running_tool_ids: event.longRunningToolIds ? 
        Array.from(event.longRunningToolIds) : 
        undefined
    };

    if (event.groundingMetadata) {
      metadataJson.grounding_metadata = event.groundingMetadata;
    }

    const eventJson: Record<string, any> = {
      author: event.author,
      invocation_id: event.invocationId,
      timestamp: {
        seconds: Math.floor(event.timestamp || Date.now() / 1000),
        nanos: Math.floor(((event.timestamp || Date.now() / 1000) % 1) * 1_000_000_000)
      },
      error_code: event.errorCode,
      error_message: event.errorMessage,
      event_metadata: metadataJson
    };

    if (event.actions) {
      const actionsJson: Record<string, any> = {
        skip_summarization: event.actions.skipSummarization,
        state_delta: event.actions.stateDelta,
        artifact_delta: event.actions.artifactDelta,
        transfer_agent: event.actions.transferToAgent,
        escalate: event.actions.escalate,
        requested_auth_configs: event.actions.requestedAuthConfigs
      };
      
      eventJson.actions = actionsJson;
    }

    if (event.content) {
      eventJson.content = this.convertContentToJson(event.content);
    }

    return eventJson;
  }

  /**
   * Converts a Content object to a JSON object for the API
   */
  private convertContentToJson(content: Content): Record<string, any> {
    return {
      role: content.role,
      parts: content.parts.map(part => this.convertPartToJson(part))
    };
  }

  /**
   * Converts a Part object to a JSON object for the API
   */
  private convertPartToJson(part: Part): Record<string, any> {
    const result: Record<string, any> = {};
    
    if (part.text !== undefined) {
      result.text = part.text;
    }
    
    if (part.data !== undefined && part.mimeType !== undefined) {
      result.inline_data = {
        data: Buffer.from(part.data).toString('base64'),
        mime_type: part.mimeType
      };
    }
    
    return result;
  }

  /**
   * Converts an API event to an Event object
   */
  private fromApiEvent(apiEvent: Record<string, any>): Event {
    // Parse event actions
    const eventActions = apiEvent.actions ? {
      skipSummarization: apiEvent.actions.skipSummarization,
      stateDelta: apiEvent.actions.stateDelta || {},
      artifactDelta: apiEvent.actions.artifactDelta || {},
      transferToAgent: apiEvent.actions.transferAgent,
      escalate: apiEvent.actions.escalate,
      requestedAuthConfigs: apiEvent.actions.requestedAuthConfigs || {}
    } : undefined;

    // Create the event
    const event: Event = {
      id: apiEvent.name.split('/').slice(-1)[0],
      invocationId: apiEvent.invocationId,
      author: apiEvent.author,
      content: this.parseContent(apiEvent.content),
      actions: eventActions,
      timestamp: new Date(apiEvent.timestamp).getTime() / 1000,
      errorCode: apiEvent.errorCode,
      errorMessage: apiEvent.errorMessage
    };

    // Parse event metadata
    if (apiEvent.eventMetadata) {
      const longRunningToolIdsList = apiEvent.eventMetadata.longRunningToolIds;
      
      event.partial = apiEvent.eventMetadata.partial;
      event.turnComplete = apiEvent.eventMetadata.turnComplete;
      event.interrupted = apiEvent.eventMetadata.interrupted;
      event.branch = apiEvent.eventMetadata.branch;
      event.groundingMetadata = apiEvent.eventMetadata.groundingMetadata;
      
      if (longRunningToolIdsList) {
        event.longRunningToolIds = new Set(longRunningToolIdsList);
      }
    }

    return event;
  }

  /**
   * Parses content from the API
   */
  private parseContent(apiContent: Record<string, any> | undefined): Content {
    if (!apiContent) {
      return {
        role: 'user',
        parts: []
      };
    }

    return {
      role: apiContent.role,
      parts: (apiContent.parts || []).map((part: any) => this.parsePart(part))
    };
  }

  /**
   * Parses a part from the API
   */
  private parsePart(apiPart: Record<string, any>): Part {
    const part: Part = {};
    
    if (apiPart.text !== undefined) {
      part.text = apiPart.text;
    }
    
    if (apiPart.inline_data) {
      part.data = Buffer.from(apiPart.inline_data.data, 'base64');
      part.mimeType = apiPart.inline_data.mime_type;
    }
    
    return part;
  }
} 