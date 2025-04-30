

import { BaseTool } from './BaseTool';
import { ToolContext } from './ToolContext';

/**
 * Options for the Vertex AI Search tool
 */
export interface VertexAISearchToolOptions {
  /**
   * The Vertex AI search data store resource ID in the format of
   * "projects/{project}/locations/{location}/collections/{collection}/dataStores/{dataStore}".
   */
  dataStoreId?: string;
  
  /**
   * The Vertex AI search engine resource ID in the format of
   * "projects/{project}/locations/{location}/collections/{collection}/engines/{engine}".
   */
  searchEngineId?: string;
}

/**
 * A built-in tool that uses Vertex AI Search.
 */
export class VertexAISearchTool extends BaseTool {
  /**
   * The Vertex AI search data store resource ID
   */
  private dataStoreId?: string;
  
  /**
   * The Vertex AI search engine resource ID
   */
  private searchEngineId?: string;
  
  /**
   * Create a new Vertex AI Search tool
   * 
   * @param options Options for the Vertex AI Search tool
   */
  constructor(options: VertexAISearchToolOptions) {
    // Name and description are not used because this is a model built-in tool
    super({
      name: 'vertex_ai_search',
      description: 'A built-in tool that enables search with Vertex AI Search'
    });
    
    // Check that exactly one of dataStoreId or searchEngineId is provided
    if ((!options.dataStoreId && !options.searchEngineId) || 
        (options.dataStoreId && options.searchEngineId)) {
      throw new Error('Either dataStoreId or searchEngineId must be specified, but not both.');
    }
    
    this.dataStoreId = options.dataStoreId;
    this.searchEngineId = options.searchEngineId;
  }
  
  /**
   * Process the LLM request to enable Vertex AI Search capability
   * 
   * @param params Parameters for processing
   * @param params.toolContext The tool context
   * @param params.llmRequest The LLM request to process
   */
  async processLlmRequest({ 
    toolContext, 
    llmRequest 
  }: { 
    toolContext: ToolContext, 
    llmRequest: any 
  }): Promise<void> {
    // Check if the model is supported (must be a Gemini model)
    const model = llmRequest.model || '';
    if (!model.startsWith('gemini-')) {
      throw new Error(`Vertex AI search tool is not supported for model ${model}`);
    }
    
    // Ensure config exists
    if (!llmRequest.config) {
      llmRequest.config = {};
    }
    
    // Ensure tools array exists
    if (!llmRequest.config.tools) {
      llmRequest.config.tools = [];
    }
    
    // For Gemini 1.x, verify no other tools are being used (limitation of the model)
    if (model.startsWith('gemini-1') && llmRequest.config.tools.length > 0) {
      throw new Error('Vertex AI search tool cannot be used with other tools in Gemini 1.x.');
    }
    
    // Add Vertex AI Search to the tools
    llmRequest.config.tools.push({
      retrieval: {
        vertexAiSearch: {
          datastore: this.dataStoreId,
          engine: this.searchEngineId
        }
      }
    });
  }
  
  /**
   * Execute the Vertex AI Search tool
   * 
   * This is a placeholder as the actual execution happens internally in the model.
   * 
   * @param params The parameters for tool execution
   * @param context The context for tool execution
   * @returns A placeholder response
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    // This tool doesn't actually execute locally - it's handled by the model
    return {
      status: 'error',
      message: 'VertexAISearchTool cannot be executed directly. It is handled internally by the model.'
    };
  }
}

/**
 * Creates a new Vertex AI Search tool with the provided data store ID
 * 
 * @param dataStoreId The Vertex AI search data store resource ID
 * @returns A new Vertex AI Search tool instance
 */
export function createVertexAISearchToolWithDataStore(dataStoreId: string): VertexAISearchTool {
  return new VertexAISearchTool({ dataStoreId });
}

/**
 * Creates a new Vertex AI Search tool with the provided search engine ID
 * 
 * @param searchEngineId The Vertex AI search engine resource ID
 * @returns A new Vertex AI Search tool instance
 */
export function createVertexAISearchToolWithEngine(searchEngineId: string): VertexAISearchTool {
  return new VertexAISearchTool({ searchEngineId });
} 