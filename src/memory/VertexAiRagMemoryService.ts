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

import { Event, Session } from '../sessions/interfaces';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { BaseMemoryService, SearchMemoryResponse, MemoryResult } from './BaseMemoryService';

// Import the Vertex AI client library
import { VertexAI } from '@google-cloud/vertexai';
// Import axios for making REST API calls
import axios from 'axios';
// Import Google Auth for authentication
import { GoogleAuth } from 'google-auth-library';
// Import FormData for multipart file uploads
import FormData from 'form-data';

/**
 * Configuration for the Vertex AI RAG memory service.
 */
export interface VertexAiRagConfig {
  /** The Vertex AI project */
  project: string;
  
  /** The location of the Vertex AI service */
  location: string;
  
  /** The RAG corpus name */
  ragCorpus: string;
  
  /** The number of contexts to retrieve */
  similarityTopK?: number;
  
  /** Only returns contexts with vector distance smaller than the threshold */
  vectorDistanceThreshold?: number;
}

/**
 * Represents the VertexAI RAG Resource.
 */
interface RagResource {
  ragCorpus: string;
}

/**
 * Represents the VertexAI RAG Store configuration.
 */
interface VertexRagStore {
  ragResources: RagResource[];
  similarityTopK?: number;
  vectorDistanceThreshold?: number;
}

/**
 * Represents a context in the retrieval query response.
 */
interface Context {
  text?: string;
  sourceDisplayName?: string;
}

/**
 * Represents the response from a retrieval query.
 */
interface RetrievalQueryResponse {
  contexts: {
    contexts: Context[];
  };
}

/**
 * A memory service that uses Vertex AI RAG capabilities for semantic search.
 * 
 * This implementation uses the Vertex AI embedding models to compute
 * embeddings for memory entries and perform semantic searches.
 */
export class VertexAiRagMemoryService implements BaseMemoryService {
  private config: VertexAiRagConfig;
  private vertexRagStore: VertexRagStore;
  private vertexAi: VertexAI;
  private baseUrl: string;
  private auth: GoogleAuth;
  
  // Store for key-value pairs
  private memoryStore: Map<string, any> = new Map();
  
  /**
   * Creates a new VertexAiRagMemoryService
   * @param config The configuration for the service
   */
  constructor(config: VertexAiRagConfig) {
    this.config = config;
    
    this.vertexAi = new VertexAI({
      project: config.project,
      location: config.location,
    });
    
    this.vertexRagStore = {
      ragResources: [{ ragCorpus: config.ragCorpus }],
      similarityTopK: config.similarityTopK,
      vectorDistanceThreshold: config.vectorDistanceThreshold || 10,
    };
    
    // Set base URL for REST API calls
    this.baseUrl = `https://${config.location}-aiplatform.googleapis.com/v1`;
    
    // Initialize Google Auth client
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
  }

  /**
   * Adds a session to the memory service.
   * @param session The session to add
   */
  async addSessionToMemory(session: Session): Promise<void> {
    // Create a temporary file to store the session data
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `session_${session.id}_${Date.now()}.txt`);
    
    try {
      const outputLines: string[] = [];
      
      for (const event of session.events) {
        if (!event.content || !event.content.parts || event.content.parts.length === 0) {
          continue;
        }
        
        const textParts = event.content.parts
          .filter(part => part.text)
          .map(part => part.text!.replace('\n', ' '));
        
        if (textParts.length > 0) {
          outputLines.push(JSON.stringify({
            author: event.author,
            timestamp: event.timestamp,
            text: textParts.join('.'),
          }));
        }
      }
      
      const outputString = outputLines.join('\n');
      fs.writeFileSync(tempFilePath, outputString);
      
      // Upload the file to Vertex AI RAG corpus
      for (const ragResource of this.vertexRagStore.ragResources) {
        await this.uploadFile(
          ragResource.ragCorpus, 
          tempFilePath, 
          `${session.appName}.${session.userId}.${session.id}`
        );
      }
    } catch (error) {
      console.error('Error adding session to memory:', error);
      throw error;
    } finally {
      // Clean up the temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  /**
   * Uploads a file to the Vertex AI RAG corpus.
   * 
   * @param corpusName The name of the corpus
   * @param filePath The path to the file
   * @param displayName The display name to store session info
   */
  private async uploadFile(corpusName: string, filePath: string, displayName: string): Promise<void> {
    try {
      // Format the full corpus name based on project and location
      const formattedCorpusName = this.formatRagCorpusName(corpusName);
      
      // Get authentication token
      const authClient = await this.auth.getClient();
      const accessToken = await authClient.getAccessToken();
      
      // Create a form data object for multipart upload using form-data
      const formData = new FormData();
      
      // Add metadata as a part of formData
      formData.append('metadata', JSON.stringify({
        displayName: displayName,
        mimeType: 'text/plain'
      }), {
        contentType: 'application/json'
      });
      
      // Read the file and add to form data
      formData.append('file', fs.createReadStream(filePath), {
        filename: path.basename(filePath),
        contentType: 'text/plain'
      });
      
      // Upload the file using the REST API
      const uploadUrl = `${this.baseUrl}/${formattedCorpusName}/ragFiles:import`;
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // The form-data package automatically sets the correct content-type header with boundary
          ...formData.getHeaders()
        }
      });
      
      console.log(`File uploaded successfully: ${response.data.name}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Searches for sessions that match the query.
   * @param appName The name of the application
   * @param userId The id of the user
   * @param query The query to search for
   * @returns A SearchMemoryResponse containing the matching memories
   */
  async searchMemory(appName: string, userId: string, query: string): Promise<SearchMemoryResponse> {
    try {
      // Call Vertex AI RAG retrieval query
      const response = await this.retrieveContexts(query);
      
      const memoryResults: MemoryResult[] = [];
      const sessionEventsMap = new Map<string, Event[][]>();
      
      // Process response contexts
      for (const context of response.contexts?.contexts || []) {
        if (!context.text) continue;
        
        const sessionId = context.sourceDisplayName?.split('.').pop() || '';
        const events: Event[] = [];
        
        const lines = context.text.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          try {
            // Parse JSON event data
            const eventData = JSON.parse(trimmedLine);
            
            const author = eventData.author || '';
            const timestamp = Number(eventData.timestamp) || 0;
            const text = eventData.text || '';
            
            const event: Event = {
              invocationId: '', // We don't have this from the retrieved data
              author,
              timestamp,
              content: {
                role: author,
                parts: [{ text }]
              }
            };
            
            events.push(event);
          } catch (error) {
            // Skip invalid JSON lines
            continue;
          }
        }
        
        if (sessionId) {
          if (sessionEventsMap.has(sessionId)) {
            sessionEventsMap.get(sessionId)!.push(events);
          } else {
            sessionEventsMap.set(sessionId, [events]);
          }
        }
      }
      
      // Merge and sort events from the same session
      for (const [sessionId, eventLists] of sessionEventsMap.entries()) {
        for (const events of this.mergeEventLists(eventLists)) {
          const sortedEvents = events.sort((a, b) => 
            (a.timestamp || 0) - (b.timestamp || 0)
          );
          
          memoryResults.push({
            sessionId,
            events: sortedEvents
          });
        }
      }
      
      return { memories: memoryResults };
    } catch (error) {
      console.error('Error searching memory:', error);
      return { memories: [] };
    }
  }
  
  /**
   * Calls Vertex AI RAG retrieval query.
   * 
   * @param text The text to search for
   * @returns The retrieval query response
   */
  private async retrieveContexts(text: string): Promise<RetrievalQueryResponse> {
    try {
      // Format the location for the API call
      const formattedParent = `projects/${this.config.project}/locations/${this.config.location}`;
      
      // Get authentication token
      const authClient = await this.auth.getClient();
      const accessToken = await authClient.getAccessToken();
      
      // Create the request body
      const requestBody = {
        query: text,
        ragResources: this.vertexRagStore.ragResources.map(res => ({
          ragCorpus: this.formatRagCorpusName(res.ragCorpus)
        })),
        similarityTopK: this.vertexRagStore.similarityTopK,
        vectorDistanceThreshold: this.vertexRagStore.vectorDistanceThreshold
      };
      
      // Make the API call using REST
      const url = `${this.baseUrl}/${formattedParent}:retrieveContexts`;
      const response = await axios.post(url, requestBody, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error retrieving contexts:', error);
      return { contexts: { contexts: [] } };
    }
  }
  
  /**
   * Formats the RAG corpus name to include project and location if not already included.
   * 
   * @param corpusName The corpus name to format
   * @returns The formatted corpus name
   */
  private formatRagCorpusName(corpusName: string): string {
    if (corpusName.startsWith('projects/')) {
      return corpusName;
    }
    return `projects/${this.config.project}/locations/${this.config.location}/ragCorpora/${corpusName}`;
  }
  
  /**
   * Merges event lists that have overlapping timestamps.
   * 
   * @param eventLists Lists of events to merge
   * @returns Merged event lists
   */
  private mergeEventLists(eventLists: Event[][]): Event[][] {
    const merged: Event[][] = [];
    
    while (eventLists.length > 0) {
      const current = eventLists.shift()!;
      const currentTimestamps = new Set(current.map(event => event.timestamp));
      
      let mergeFound = true;
      
      // Keep merging until no new overlap is found
      while (mergeFound) {
        mergeFound = false;
        const remaining: Event[][] = [];
        
        for (const other of eventLists) {
          const otherTimestamps = new Set(other.map(event => event.timestamp));
          
          // Check for overlap by finding common timestamps
          const hasOverlap = [...otherTimestamps].some(ts => currentTimestamps.has(ts));
          
          if (hasOverlap) {
            // Add events from 'other' that aren't in 'current'
            const newEvents = other.filter(e => 
              !currentTimestamps.has(e.timestamp)
            );
            
            current.push(...newEvents);
            newEvents.forEach(e => 
              e.timestamp && currentTimestamps.add(e.timestamp)
            );
            
            mergeFound = true;
          } else {
            remaining.push(other);
          }
        }
        
        eventLists = remaining;
      }
      
      merged.push(current);
    }
    
    return merged;
  }

  /**
   * Stores a memory entry.
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   * @param value The memory value
   */
  async store(appName: string, userId: string, key: string, value: any): Promise<void> {
    const storeKey = `${appName}/${userId}/${key}`;
    this.memoryStore.set(storeKey, value);
  }

  /**
   * Retrieves a memory entry.
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   * @returns The memory value, or undefined if not found
   */
  async retrieve(appName: string, userId: string, key: string): Promise<any | undefined> {
    const storeKey = `${appName}/${userId}/${key}`;
    return this.memoryStore.get(storeKey);
  }

  /**
   * Deletes a memory entry.
   * @param appName The application name
   * @param userId The user ID
   * @param key The memory key
   */
  async delete(appName: string, userId: string, key: string): Promise<void> {
    const storeKey = `${appName}/${userId}/${key}`;
    this.memoryStore.delete(storeKey);
  }
} 