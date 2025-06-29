import { Event, SessionInterface as Session } from '../sessions/types';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { BaseMemoryService, SearchMemoryResponse } from './BaseMemoryService';
import { MemoryEntry } from './MemoryEntry';
import { formatTimestamp } from './utils';
import { Content, Part } from '../models/types';

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
  ragCorpora?: any[];
}

/**
 * Represents a context in the retrieval query response.
 */
interface RetrievalContext {
  text: string;
  sourceDisplayName?: string;
}

/**
 * Represents the response from a retrieval query.
 */
interface RetrievalQueryResponse {
  contexts: {
    contexts: RetrievalContext[];
  };
}

// Mock Vertex AI RAG functions for TypeScript
// In a real implementation, these would be imports from Vertex AI client libraries
const mockVertexAiRag = {
  async uploadFile(params: {
    corpusName: string;
    path: string;
    displayName: string;
  }): Promise<void> {
    // Mock implementation
    console.log(`Mock upload file ${params.path} to corpus ${params.corpusName} with display name ${params.displayName}`);
  },

  async retrievalQuery(params: {
    text: string;
    ragResources: RagResource[];
    ragCorpora?: any[];
    similarityTopK?: number;
    vectorDistanceThreshold?: number;
  }): Promise<RetrievalQueryResponse> {
    // Mock implementation
    return {
      contexts: {
        contexts: []
      }
    };
  }
};

/**
 * A memory service that uses Vertex AI RAG for storage and retrieval.
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
      ragCorpora: []
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
    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`;
    const tempFilePath = path.join(tempDir, tempFileName);

    try {
      const outputLines: string[] = [];
      
      for (const event of session.events) {
        if (!event.content || !event.content.parts) {
          continue;
        }
        
        const textParts = event.content.parts
          .filter(part => part.text)
          .map(part => part.text!.replace(/\n/g, ' '));
        
        if (textParts.length > 0) {
          const eventData = {
            author: event.author,
            timestamp: event.timestamp,
            text: textParts.join('.')
          };
          outputLines.push(JSON.stringify(eventData));
        }
      }
      
      const outputString = outputLines.join('\n');
      
      // Write to temporary file
      fs.writeFileSync(tempFilePath, outputString, 'utf8');
      
      if (!this.vertexRagStore.ragResources) {
        throw new Error('Rag resources must be set.');
      }
      
      // Upload to each RAG resource
      for (const ragResource of this.vertexRagStore.ragResources) {
        await mockVertexAiRag.uploadFile({
          corpusName: ragResource.ragCorpus,
          path: tempFilePath,
          // Use display_name to store the session info as a temp workaround
          displayName: `${session.appName}.${session.userId}.${session.id}`
        });
      }
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  /**
   * Searches for sessions that match the query using rag.retrieval_query.
   * @param appName The name of the application
   * @param userId The id of the user
   * @param query The query to search for
   * @returns A SearchMemoryResponse containing the matching memories
   */
  async searchMemory(appName: string, userId: string, query: string): Promise<SearchMemoryResponse> {
    const response = await mockVertexAiRag.retrievalQuery({
      text: query,
      ragResources: this.vertexRagStore.ragResources,
      ragCorpora: this.vertexRagStore.ragCorpora,
      similarityTopK: this.vertexRagStore.similarityTopK,
      vectorDistanceThreshold: this.vertexRagStore.vectorDistanceThreshold
    });

    const memoryResults: MemoryEntry[] = [];
    const sessionEventsMap = new Map<string, Event[][]>();

    for (const context of response.contexts.contexts) {
      // Filter out context that is not related
      // TODO: Add server side filtering by app_name and user_id.
      // if (!context.sourceDisplayName.startsWith(`${appName}.${userId}.`)) {
      //   continue;
      // }

      if (!context.sourceDisplayName) {
        continue;
      }

      const sessionId = context.sourceDisplayName.split('.').pop()!;
      const events: Event[] = [];

      if (context.text) {
        const lines = context.text.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            continue;
          }

          try {
            // Try to parse as JSON
            const eventData = JSON.parse(trimmedLine);
            const author = eventData.author || '';
            const timestamp = parseFloat(eventData.timestamp || '0');
            const text = eventData.text || '';

            const content: Content = {
              role: 'model', // Adding required role property
              parts: [{ text } as Part]
            };

            const event: Event = {
              author,
              timestamp,
              content,
              // Add other required Event properties with defaults
              id: `${Date.now()}-${Math.random()}`,
              invocationId: '',
              branch: ''
            };

            events.push(event);
          } catch (error) {
            // Not valid JSON, skip this line
            continue;
          }
        }
      }

      if (sessionEventsMap.has(sessionId)) {
        sessionEventsMap.get(sessionId)!.push(events);
      } else {
        sessionEventsMap.set(sessionId, [events]);
      }
    }

    // Remove overlap and combine events from the same session
    for (const [sessionId, eventLists] of sessionEventsMap.entries()) {
      const mergedEventLists = this._mergeEventLists(eventLists);
      for (const events of mergedEventLists) {
        const sortedEvents = events.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        // Convert events to MemoryEntry objects
        memoryResults.push(...sortedEvents
          .filter(event => event.content)
          .map(event => ({
            author: event.author,
            content: event.content!,
            timestamp: event.timestamp ? formatTimestamp(event.timestamp) : undefined
          }))
        );
      }
    }

    return { memories: memoryResults };
  }

  /**
   * Merge event lists that have overlapping timestamps.
   * @param eventLists List of event lists to merge
   * @returns Merged event lists
   */
  private _mergeEventLists(eventLists: Event[][]): Event[][] {
    const merged: Event[][] = [];

    while (eventLists.length > 0) {
      const current = eventLists.shift()!;
      const currentTs = new Set(current.map(event => event.timestamp));
      let mergeFound = true;

      // Keep merging until no new overlap is found
      while (mergeFound) {
        mergeFound = false;
        const remaining: Event[][] = [];

        for (const other of eventLists) {
          const otherTs = new Set(other.map(event => event.timestamp));
          
          // Check for overlap
          const hasOverlap = [...currentTs].some(ts => otherTs.has(ts));
          
          if (hasOverlap) {
            // Overlap exists, so we merge and use the merged list to check again
            const newEvents = other.filter(e => !currentTs.has(e.timestamp));
            current.push(...newEvents);
            newEvents.forEach(e => currentTs.add(e.timestamp));
            mergeFound = true;
          } else {
            remaining.push(other);
          }
        }

        eventLists.splice(0, eventLists.length, ...remaining);
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