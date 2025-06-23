import { BaseLlm } from './BaseLlm';
import { LlmRequest } from './LlmRequest';
import { LlmResponse } from './LlmResponse';
import { Content, Part, FunctionDeclaration } from './types';
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';

// NOT_GIVEN equivalent for TypeScript
const NOT_GIVEN = undefined;

/**
 * Maximum tokens for Claude model responses
 */
const MAX_TOKEN = 1024;

/**
 * Logger for Claude operations
 */
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[Claude] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Claude] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Claude] ${message}`, data);
  }
};

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
 * Convert Claude stop reason to Google GenAI finish reason
 * @param anthropicStopReason Anthropic stop reason
 * @returns Google GenAI finish reason
 */
function toGoogleGenaiFinishReason(anthropicStopReason: string | null): string {
  if (anthropicStopReason === 'end_turn' || anthropicStopReason === 'stop_sequence' || anthropicStopReason === 'tool_use') {
    return 'STOP';
  }
  if (anthropicStopReason === 'max_tokens') {
    return 'MAX_TOKENS';
  }
  return 'FINISH_REASON_UNSPECIFIED';
}

/**
 * Convert a Part to a Claude content block
 * @param part The part to convert
 * @returns A Claude content block
 */
function partToMessageBlock(part: Part): any {
  if (part.text) {
    return {
      type: 'text',
      text: part.text
    };
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
    };
  }
  
  if (part.functionResponse) {
    let content = '';
    if (
      part.functionResponse.response && 
      'result' in part.functionResponse.response &&
      part.functionResponse.response['result']
    ) {
      // Transformation is required because the content is a list of dict.
      // ToolResultBlockParam content doesn't support list of dict. Converting
      // to str to prevent anthropic.BadRequestError from being thrown.
      content = String(part.functionResponse.response['result']);
    }
    
    return {
      type: 'tool_result',
      tool_use_id: part.functionResponse.id || '',
      content: content,
      is_error: false
    };
  }
  
  if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: part.inlineData.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: part.inlineData.data
      }
    };
  }
  
  throw new Error('Not supported yet.');
}

/**
 * Convert Content to a Claude MessageParam
 * @param content Content to convert
 * @returns MessageParam for Claude API
 */
function contentToMessageParam(content: Content): any {
  return {
    role: toClaudeRole(content.role),
    content: (content.parts || []).map(partToMessageBlock)
  };
}

/**
 * Convert a Claude ContentBlock to a Part
 * @param contentBlock Block to convert
 * @returns Converted Part
 */
function contentBlockToPart(contentBlock: any): Part {
  if (contentBlock.type === 'text') {
    return { text: contentBlock.text };
  }
  
  if (contentBlock.type === 'tool_use') {
    if (typeof contentBlock.input !== 'object' || contentBlock.input === null) {
      throw new Error('Tool use block input must be an object');
    }
    
    const part: Part = {
      functionCall: {
        name: contentBlock.name,
        args: contentBlock.input as Record<string, any>,
        id: contentBlock.id
      }
    };
    return part;
  }
  
  throw new Error('Not supported yet.');
}

/**
 * Convert a Claude message to an LlmResponse
 * @param message Claude message
 * @returns LlmResponse
 */
function messageToGenerateContentResponse(message: any): LlmResponse {
  return new LlmResponse({
    content: {
      role: 'model',
      parts: message.content.map(contentBlockToPart)
    }
    // TODO: Deal with these later.
    // finish_reason: toGoogleGenaiFinishReason(message.stop_reason),
    // usage_metadata: {
    //   prompt_token_count: message.usage.input_tokens,
    //   candidates_token_count: message.usage.output_tokens,
    //   total_token_count: message.usage.input_tokens + message.usage.output_tokens
    // }
  });
}

/**
 * Recursively updates 'type' field to expected JSON schema format.
 * @param valueDict Object that may contain 'type' field or nested 'items'/'properties'
 */
function updateTypeString(valueDict: Record<string, any>): void {
  if ('type' in valueDict) {
    valueDict.type = typeof valueDict.type === 'string' ?
      valueDict.type.toLowerCase() : valueDict.type;
  }

  // 'type' field could exist for items as well, this would be the case if
  // items represent primitive types.
  if ('items' in valueDict) {
    updateTypeString(valueDict.items);
    
    // There could be properties as well on the items, especially if the items
    // are complex object themselves. We recursively traverse each individual
    // property as well and fix the "type" value.
    if (valueDict.items.properties) {
      for (const [propKey, propValue] of Object.entries(valueDict.items.properties)) {
        updateTypeString(propValue as Record<string, any>);
      }
    }
  }

  // Process nested properties directly
  if ('properties' in valueDict) {
    for (const [propKey, propValue] of Object.entries(valueDict.properties)) {
      updateTypeString(propValue as Record<string, any>);
    }
  }
}

/**
 * Convert a FunctionDeclaration to a Claude ToolParam
 * @param functionDeclaration Function declaration to convert
 * @returns Claude ToolParam
 */
function functionDeclarationToToolParam(functionDeclaration: FunctionDeclaration): any {
  if (!functionDeclaration.name) {
    throw new Error('Function declaration must have a name');
  }

  const properties: Record<string, any> = {};
  if (functionDeclaration.parameters && functionDeclaration.parameters.properties) {
    for (const [key, value] of Object.entries(functionDeclaration.parameters.properties)) {
      // Safely copy properties using model_dump equivalent (JSON parse/stringify)
      const valueDict: Record<string, any> = JSON.parse(JSON.stringify(value));
      
      // Recursively update type strings
      updateTypeString(valueDict);
      properties[key] = valueDict;
    }
  }

  return {
    name: functionDeclaration.name,
    description: functionDeclaration.description || '',
    input_schema: {
      type: 'object',
      properties: properties
    }
  };
}

/**
 * Claude class - wrapper around Anthropic's Claude API
 */
export class Claude extends BaseLlm {
  model: string = 'claude-3-5-sonnet-v2@20241022';
  private anthropicClient: AnthropicVertex | null = null;

  /**
   * Constructor
   * @param model Model name, defaults to 'claude-3-5-sonnet-v2@20241022'
   */
  constructor(model: string = 'claude-3-5-sonnet-v2@20241022') {
    super(model);
    this.model = model;
  }

  /**
   * List of supported models
   * @returns Regular expressions for supported model names
   */
  static supportedModels(): string[] {
    return ['claude-3-.*'];
  }

  /**
   * Create and return the Anthropic client
   * Lazy initialization to avoid creating the client until needed
   * @returns AnthropicVertex
   */
  private get client(): AnthropicVertex {
    if (!this.anthropicClient) {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT;
      const region = process.env.GOOGLE_CLOUD_LOCATION;
      
      if (!projectId || !region) {
        throw new Error(
          'GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set for using Anthropic on Vertex.'
        );
      }
      
      this.anthropicClient = new AnthropicVertex({
        projectId: projectId,
        region: region
      });
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
    let tools: any = NOT_GIVEN;
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
      llmRequest.getToolsDict() && 
      Object.keys(llmRequest.getToolsDict()).length > 0
    ) ? {
      type: 'auto' as const,
      // TODO: allow parallel tool use.
      disable_parallel_tool_use: true
    } : NOT_GIVEN;
    
    try {
      const message = await this.client.messages.create({
        model: llmRequest.model || this.model,
        system: llmRequest.config.systemInstruction || NOT_GIVEN,
        messages: messages,
        tools: tools,
        tool_choice: toolChoice,
        max_tokens: MAX_TOKEN
      });
      
      logger.info(
        'Claude response:',
        {
          id: message.id,
          model: message.model,
          role: message.role,
          content: message.content,
          stop_reason: message.stop_reason,
          usage: message.usage
        }
      );
      
      yield messageToGenerateContentResponse(message);
    } catch (error) {
      logger.error('Error during Claude API call:', error);
      
      // Create an error response
      const errorResponse = new LlmResponse({
        errorCode: 'CLAUDE_API_ERROR',
        errorMessage: String(error)
      });
      yield errorResponse;
    }
  }
} 