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

import { BaseLlm } from './BaseLlm';
import { LlmRequest } from './LlmRequest';
import { LlmResponse } from './LlmResponse';
import { Content, Part, FunctionDeclaration } from './types';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Maximum tokens for Claude model responses
 */
const MAX_TOKEN = 1024;

/**
 * TypeScript equivalent of Anthropic API types
 */
interface MessageParam {
  role: 'user' | 'assistant';
  content: ContentBlock[];
}

interface ContentBlock {
  type: string;
  [key: string]: any;
}

interface TextBlockParam extends ContentBlock {
  type: 'text';
  text: string;
}

interface ImageBlockParam extends ContentBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

interface ToolUseBlockParam extends ContentBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

interface ToolResultBlockParam extends ContentBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error: boolean;
}

interface ToolParam {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
  };
}

interface ToolChoiceAutoParam {
  type: 'auto';
  disable_parallel_tool_use: boolean;
}

interface Message {
  id: string;
  type: string;
  role: string;
  content: ContentBlock[];
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * AnthropicVertex client for Claude models
 */
class AnthropicVertexClient {
  private projectId: string;
  private region: string;
  private client: Anthropic;
  private isConfigured: boolean = false;

  /**
   * Constructor
   * @param projectId GCP project ID
   * @param region GCP region
   */
  constructor(projectId: string, region: string) {
    this.projectId = projectId;
    this.region = region;
    
    try {
      // Initialize the Anthropic client specifically for Vertex AI integration
      this.client = new Anthropic({
        apiKey: 'vertex-ai', // Special value to indicate Vertex AI integration
        baseURL: this.getVertexEndpoint(),
        defaultHeaders: {
          'x-goog-user-project': this.projectId,
          'x-vertex-ai-region': this.region,
        }
      });
      
      this.isConfigured = true;
    } catch (error) {
      console.error("Error initializing Anthropic client:", error);
      this.client = new Anthropic(); // Fallback empty client
      this.isConfigured = false;
    }
  }

  /**
   * Get the Vertex AI endpoint for Anthropic
   * @param model The model name to use
   * @returns The endpoint URL
   */
  private getVertexEndpoint(model: string = 'claude-3-5-sonnet-v2@20241022'): string {
    return `https://${this.region}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.region}/publishers/anthropic/models/${model}:predict`;
  }

  /**
   * Messages API for Anthropic
   */
  messages = {
    /**
     * Create a message using the Anthropic API
     * 
     * @param options Message creation options
     * @returns A promise resolving to the message
     */
    create: async (options: {
      model: string;
      system?: string;
      messages: MessageParam[];
      tools?: ToolParam[];
      tool_choice?: ToolChoiceAutoParam;
      max_tokens?: number;
    }): Promise<Message> => {
      if (!this.isConfigured) {
        throw new Error('Anthropic client not properly configured.');
      }

      try {
        // For Vertex AI, we need to use the correct endpoint based on the requested model
        // We could rebuild the client for each request, but for now we'll use the existing client
        // Ideally we would use a model-specific endpoint

        // Convert our options to Anthropic SDK format
        const createParams: Anthropic.MessageCreateParams = {
          model: options.model,
          max_tokens: options.max_tokens || MAX_TOKEN,
          system: options.system,
          messages: options.messages as Anthropic.MessageParam[],
        };

        // Add tools if provided
        if (options.tools && options.tools.length > 0) {
          createParams.tools = options.tools as any[];
        }

        // Add tool choice if provided
        if (options.tool_choice) {
          createParams.tool_choice = {
            type: options.tool_choice.type,
            // Map additional parameters
            ...(options.tool_choice.disable_parallel_tool_use !== undefined ? 
              { disable_parallel_tool_use: options.tool_choice.disable_parallel_tool_use } : {})
          } as any;
        }

        // Call the Anthropic API
        const response = await this.client.messages.create(createParams);
        
        // Return parsed response
        return {
          id: response.id,
          type: response.type,
          role: response.role,
          content: response.content as ContentBlock[],
          model: response.model,
          stop_reason: response.stop_reason,
          stop_sequence: response.stop_sequence,
          usage: {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens
          }
        };
      } catch (error) {
        console.error("Error calling Anthropic API:", error);
        throw error;
      }
    }
  };
}

/**
 * Convert genai role to Claude role
 * @param role Role to convert
 * @returns Claude role
 */
function toClaudeRole(role: string | undefined): 'user' | 'assistant' {
  if (role === 'model' || role === 'assistant') {
    return 'assistant';
  }
  return 'user';
}

/**
 * Convert a Part to a Claude content block
 * @param part The part to convert
 * @returns A Claude content block
 */
function partToMessageBlock(part: Part): ContentBlock {
  if (part.text) {
    return {
      type: 'text',
      text: part.text
    } as TextBlockParam;
  }
  
  if (part.functionCall) {
    if (!part.functionCall.name) {
      throw new Error('Function call must have a name');
    }
    
    return {
      type: 'tool_use',
      id: part.functionCall.id || '',
      name: part.functionCall.name,
      input: part.functionCall.args
    } as ToolUseBlockParam;
  }
  
  if (part.functionResponse) {
    let content = '';
    if (
      part.functionResponse.response && 
      'result' in part.functionResponse.response &&
      part.functionResponse.response['result']
    ) {
      // Convert complex response to string to avoid issues with the Anthropic API
      content = String(part.functionResponse.response['result']);
    }
    
    return {
      type: 'tool_result',
      tool_use_id: part.functionResponse.id || '',
      content: content,
      is_error: false
    } as ToolResultBlockParam;
  }
  
  if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: part.inlineData.mimeType,
        data: part.inlineData.data
      }
    } as ImageBlockParam;
  }
  
  throw new Error('Unsupported part type');
}

/**
 * Convert Content to a Claude MessageParam
 * @param content Content to convert
 * @returns MessageParam for Claude API
 */
function contentToMessageParam(content: Content): MessageParam {
  return {
    role: toClaudeRole(content.role),
    content: content.parts.map(partToMessageBlock)
  };
}

/**
 * Convert a Claude ContentBlock to a Part
 * @param contentBlock Block to convert
 * @returns Converted Part
 */
function contentBlockToPart(contentBlock: ContentBlock): Part {
  if (contentBlock.type === 'text') {
    const textBlock = contentBlock as TextBlockParam;
    return { text: textBlock.text };
  }
  
  if (contentBlock.type === 'tool_use') {
    const toolUseBlock = contentBlock as ToolUseBlockParam;
    const part: Part = {
      functionCall: {
        name: toolUseBlock.name,
        args: toolUseBlock.input,
        id: toolUseBlock.id
      }
    };
    return part;
  }
  
  throw new Error('Unsupported content block type');
}

/**
 * Convert a Claude message to an LlmResponse
 * @param message Claude message
 * @returns LlmResponse
 */
function messageToGenerateContentResponse(message: Message): LlmResponse {
  const response = new LlmResponse();
  
  response.content = {
    role: 'model',
    parts: message.content.map(contentBlockToPart)
  };
  
  // Could also set finish_reason and usage_metadata if needed
  
  return response;
}

/**
 * Convert a FunctionDeclaration to a Claude ToolParam
 * @param functionDeclaration Function declaration to convert
 * @returns Claude ToolParam
 */
function functionDeclarationToToolParam(functionDeclaration: FunctionDeclaration): ToolParam {
  if (!functionDeclaration.name) {
    throw new Error('Function declaration must have a name');
  }

  const properties: Record<string, any> = {};
  if (functionDeclaration.parameters && functionDeclaration.parameters.properties) {
    for (const [key, value] of Object.entries(functionDeclaration.parameters.properties)) {
      // Safely copy properties
      const valueDict: Record<string, any> = {};
      // Use type assertion to help TypeScript understand this is a safe operation
      const safeValue = value as Record<string, any>;
      
      // Copy each property individually
      if (safeValue) {
        for (const propKey in safeValue) {
          if (Object.prototype.hasOwnProperty.call(safeValue, propKey)) {
            valueDict[propKey] = safeValue[propKey];
          }
        }
      }
      
      if ('type' in valueDict) {
        valueDict.type = typeof valueDict.type === 'string' ? 
          valueDict.type.toLowerCase() : valueDict.type;
      }
      properties[key] = valueDict;
    }
  }

  return {
    name: functionDeclaration.name,
    description: functionDeclaration.description || '',
    input_schema: {
      type: 'object',
      properties: properties,
    }
  };
}

/**
 * Claude class - wrapper around Anthropic's Claude API
 */
export class Claude extends BaseLlm {
  private anthropicClient: AnthropicVertexClient | null = null;

  /**
   * Constructor
   * @param model Model name, defaults to 'claude-3-5-sonnet-v2@20241022'
   */
  constructor(model: string = 'claude-3-5-sonnet-v2@20241022') {
    super(model);
  }

  /**
   * Create and return the Anthropic client
   * Lazy initialization to avoid creating the client until needed
   * @returns AnthropicVertexClient
   */
  private get client(): AnthropicVertexClient {
    if (!this.anthropicClient) {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT;
      const region = process.env.GOOGLE_CLOUD_LOCATION;
      
      if (!projectId || !region) {
        throw new Error(
          'GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set for using Anthropic on Vertex.'
        );
      }
      
      this.anthropicClient = new AnthropicVertexClient(projectId, region);
    }
    
    return this.anthropicClient;
  }

  /**
   * Generate content asynchronously
   * @param llmRequest The request
   * @param stream Whether to stream (currently not supported for Claude)
   * @returns AsyncGenerator yielding responses
   */
  async *generateContentAsync(
    llmRequest: LlmRequest,
    stream: boolean = false
  ): AsyncGenerator<LlmResponse, void, unknown> {
    // Convert contents to Claude format
    const messages = (llmRequest.contents || []).map(contentToMessageParam);
    
    // Process tools if present
    let tools = undefined;
    if (
      llmRequest.config &&
      llmRequest.config.tools &&
      llmRequest.config.tools.length > 0 &&
      llmRequest.config.tools[0].functionDeclarations &&
      llmRequest.config.tools[0].functionDeclarations.length > 0
    ) {
      tools = llmRequest.config.tools[0].functionDeclarations.map(
        functionDeclarationToToolParam
      );
    }
    
    // Process tool choice
    const toolChoice = (
      llmRequest.config && 
      llmRequest.config.tools && 
      llmRequest.config.tools.length > 0
    ) ? {
      type: 'auto',
      disable_parallel_tool_use: true
    } as ToolChoiceAutoParam : undefined;
    
    try {
      if (stream) {
        // Log that streaming is not fully supported yet but we're falling back to non-streaming
        console.warn('Streaming for Claude is not fully supported in this implementation. Falling back to non-streaming.');
        
        // Implement basic streaming simulation by yielding the entire response at once
        // In a full implementation, you would use the Anthropic streaming API
        const message = await this.client.messages.create({
          model: this.model,
          system: llmRequest.config.systemInstruction,
          messages: messages,
          tools: tools,
          tool_choice: toolChoice,
          max_tokens: MAX_TOKEN
        });
        
        // Log the response (would use proper logging in real implementation)
        console.log('Claude response (stream mode):', JSON.stringify(message, null, 2));
        
        // Convert and yield the response
        // In a real streaming implementation, we would process chunks as they arrive
        yield messageToGenerateContentResponse(message);
      } else {
        // Standard non-streaming implementation
        const message = await this.client.messages.create({
          model: this.model,
          system: llmRequest.config.systemInstruction,
          messages: messages,
          tools: tools,
          tool_choice: toolChoice,
          max_tokens: MAX_TOKEN
        });
        
        // Log the response (would use proper logging in real implementation)
        console.log('Claude response:', JSON.stringify(message, null, 2));
        
        // Convert and yield the response
        yield messageToGenerateContentResponse(message);
      }
    } catch (error) {
      console.error('Error during Claude API call:', error);
      
      // Create an error response
      const errorResponse = new LlmResponse();
      errorResponse.errorCode = 'CLAUDE_API_ERROR';
      errorResponse.errorMessage = String(error);
      yield errorResponse;
    }
  }

  /**
   * List of supported models
   * @returns Regular expressions for supported model names
   */
  static supportedModels(): string[] {
    return [
      "claude-3-5-haiku@\\d+",
      "claude-3-5-sonnet-v2@\\d+",
      "claude-3-5-sonnet@\\d+",
      "claude-3-haiku@\\d+",
      "claude-3-opus@\\d+",
      "claude-3-sonnet@\\d+"
    ];
  }
} 