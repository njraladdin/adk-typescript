

/**
 * A queue for live requests in streaming sessions.
 */
import { Content } from '../models/types';

/**
 * Represents a live request within a streaming session.
 */
export interface LiveRequest {
  /** Indicates if the connection should be closed */
  close?: boolean;
  
  /** Binary blob data for audio/video streaming */
  blob?: Uint8Array;
  
  /** Content data */
  content?: Content;
}

/**
 * A queue for managing live requests in streaming sessions.
 */
export class LiveRequestQueue {
  private queue: LiveRequest[] = [];
  private resolvers: ((request: LiveRequest) => void)[] = [];
  
  /**
   * Adds a request to close the connection to the queue.
   */
  sendClose(): void {
    this.enqueue({ close: true });
  }
  
  /**
   * Adds a blob request to the queue.
   * 
   * @param blob The binary blob data
   */
  sendBlob(blob: Uint8Array): void {
    this.enqueue({ blob });
  }
  
  /**
   * Adds a content request to the queue.
   * 
   * @param content The content data
   */
  sendContent(content: Content): void {
    this.enqueue({ content });
  }
  
  /**
   * Gets the next request from the queue.
   * 
   * @returns A promise that resolves to the next request
   */
  async get(): Promise<LiveRequest> {
    if (this.queue.length > 0) {
      return this.queue.shift()!;
    }
    
    return new Promise<LiveRequest>((resolve) => {
      this.resolvers.push(resolve);
    });
  }
  
  /**
   * Adds a request to the queue.
   * 
   * @param request The request to add
   */
  private enqueue(request: LiveRequest): void {
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve(request);
    } else {
      this.queue.push(request);
    }
  }
} 