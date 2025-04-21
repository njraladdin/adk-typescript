

import { BaseRetrievalTool, RetrievalToolOptions } from './BaseRetrievalTool';
import { ToolContext } from '../toolContext';

/**
 * Options for creating a LlamaIndex retrieval tool
 */
export interface LlamaIndexRetrievalOptions extends RetrievalToolOptions {
  /**
   * The LlamaIndex retriever to use
   */
  retriever: any; // Type as any for now, would be properly typed if LlamaIndex had TypeScript definitions
}

/**
 * Retrieval tool that uses LlamaIndex to retrieve information
 */
export class LlamaIndexRetrieval extends BaseRetrievalTool {
  /**
   * The LlamaIndex retriever
   */
  private retriever: any;

  /**
   * Create a new LlamaIndex retrieval tool
   * 
   * @param options Options for the LlamaIndex retrieval tool
   */
  constructor(options: LlamaIndexRetrievalOptions) {
    super(options);
    this.retriever = options.retriever;
  }

  /**
   * Retrieve information using LlamaIndex
   * 
   * @param query The query to retrieve information for
   * @param maxResults Maximum number of results to return
   * @param context The context for the retrieval
   * @returns The retrieved information
   */
  protected async retrieve(
    query: string,
    maxResults: number,
    context: ToolContext
  ): Promise<string> {
    try {
      // This is a simplified implementation since we don't have direct LlamaIndex bindings in TypeScript
      // In a real implementation, this would use the LlamaIndex TypeScript bindings if available
      const results = await this.retriever.retrieve(query);
      
      if (!results || results.length === 0) {
        return "No results found";
      }
      
      // Return the first result's text
      // In a real implementation with TypeScript bindings, this would be properly typed
      return results[0].text;
    } catch (error: unknown) {
      console.error("Error retrieving from LlamaIndex:", error);
      return `Error retrieving information: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
} 