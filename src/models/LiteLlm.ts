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
import { Content, Part, FunctionDeclaration, Schema, Tool } from './types';
import { completion as litellmCompletion } from 'litellm';

// TypeScript equivalents of LiteLLM types
interface Message {
  role: string;
  content?: string | any[] | null;
  tool_calls?: ToolCall[] | null;
  tool_call_id?: string | null;
}

interface ToolCall {
  type: string;
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface Function {
  name: string;
  arguments: string;
}

// Compatible with litellm response
interface ModelResponse {
  choices?: {
    message?: Message;
    delta?: Message;
    finish_reason?: string | null;
  }[];
  [key: string]: any; // Allow additional properties from litellm responses
}

export class TextChunk {
  constructor(public text: string) {}
}

export class FunctionChunk {
  constructor(
    public id?: string | null,
    public name?: string | null,
    public args?: string | null
  ) {}
}

/**
 * StreamIterator class to handle both sync and async iteration
 * for compatibility with the expected interfaces
 */
class StreamIterator implements AsyncIterable<ModelResponse>, Iterable<ModelResponse> {
  private chunks: ModelResponse[] = [];
  private done = false;
  private position = 0;
  private streamPromise: Promise<void>;
  private resolveStream: () => void = () => {};

  constructor(streamResponse: AsyncIterable<any>) {
    this.streamPromise = new Promise<void>((resolve) => {
      this.resolveStream = resolve;
    });

    // Process the stream in the background
    this.processStream(streamResponse);
  }

  private async processStream(streamResponse: AsyncIterable<any>) {
    try {
      for await (const chunk of streamResponse) {
        const normalizedChunk = this.normalizeResponse(chunk);
        this.chunks.push(normalizedChunk);
      }
    } catch (error) {
      console.error("Error processing stream:", error);
    } finally {
      this.done = true;
      this.resolveStream();
    }
  }

  // For async iteration (used by for-await-of)
  [Symbol.asyncIterator](): AsyncIterator<ModelResponse> {
    let position = 0;
    
    return {
      next: async () => {
        // If we've already consumed all chunks and the stream is done
        if (position >= this.chunks.length && this.done) {
          return { done: true, value: undefined };
        }
        
        // If we need to wait for more chunks
        while (position >= this.chunks.length && !this.done) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Return the next available chunk
        if (position < this.chunks.length) {
          return { done: false, value: this.chunks[position++] };
        }
        
        // Stream is done and all chunks consumed
        return { done: true, value: undefined };
      }
    };
  }

  // For sync iteration (used by for-of), returns all chunks at once
  [Symbol.iterator](): Iterator<ModelResponse> {
    return {
      next: () => {
        if (this.position < this.chunks.length) {
          return { done: false, value: this.chunks[this.position++] };
        } else {
          return { done: true, value: undefined };
        }
      }
    };
  }

  private normalizeResponse(response: any): ModelResponse {
    // Already in expected format
    if (response.choices && Array.isArray(response.choices)) {
      return response as ModelResponse;
    }

    // Create a compatible response
    return {
      choices: [{
        message: response.message || response.delta,
        finish_reason: response.finish_reason
      }]
    };
  }
}

/**
 * LiteLLM client for making completions
 * This implementation uses any types in places where strict typing is challenging
 * due to differences between the TypeScript and JavaScript implementations
 */
export class LiteLLMClient {
  /**
   * Asynchronously calls completion
   * @param model The model name
   * @param messages The messages to send
   * @param tools The tools to use
   * @param kwargs Additional arguments
   * @returns A promise resolving to the model response
   */
  async acompletion(
    model: string,
    messages: any[],
    tools?: any[],
    ...kwargs: any[]
  ): Promise<any> {
    try {
      const params: any = {
        model,
        messages,
        tools,
        ...Object.assign({}, ...kwargs)
      };
      
      const response = await litellmCompletion(params);
      return response;
    } catch (error) {
      console.error("Error in acompletion:", error);
      throw error;
    }
  }

  /**
   * Synchronously calls completion
   * @param model The model name
   * @param messages The messages to send
   * @param tools The tools to use
   * @param stream Whether to stream the response
   * @param kwargs Additional arguments
   * @returns An iterable of model responses
   */
  completion(
    model: string,
    messages: any[],
    tools?: any[],
    stream: boolean = false,
    ...kwargs: any[]
  ): any {
    try {
      const params: any = {
        model,
        messages,
        tools,
        stream,
        ...Object.assign({}, ...kwargs)
      };
      
      return litellmCompletion(params);
    } catch (error) {
      console.error("Error in completion:", error);
      throw error;
    }
  }
}

/**
 * Helper function to convert content to message parameter
 * @param content The content to convert
 * @returns The content as a message parameter or array of messages
 */
function contentToMessageParam(content: Content): Message | Message[] {
  const toolMessages: Message[] = [];
  
  for (const part of content.parts) {
    if (part.functionResponse) {
      toolMessages.push({
        role: 'tool',
        tool_call_id: part.functionResponse.id || '',
        content: safeJsonSerialize(part.functionResponse.response),
      });
    }
  }
  
  if (toolMessages.length) {
    return toolMessages.length > 1 ? toolMessages : toolMessages[0];
  }

  // Handle user or assistant messages
  const role = toLiteLlmRole(content.role);
  const messageContent = getContent(content.parts) || null;

  if (role === 'user') {
    return { role: 'user', content: messageContent };
  } else { // assistant/model
    const toolCalls: ToolCall[] = [];
    let contentPresent = false;
    
    for (const part of content.parts) {
      if (part.functionCall) {
        toolCalls.push({
          type: 'function',
          id: part.functionCall.id || '',
          function: {
            name: part.functionCall.name,
            arguments: safeJsonSerialize(part.functionCall.args),
          },
        });
      } else if (part.text || part.inlineData) {
        contentPresent = true;
      }
    }

    const finalContent = contentPresent ? messageContent : null;

    return {
      role: role,
      content: finalContent,
      tool_calls: toolCalls.length > 0 ? toolCalls : null,
    };
  }
}

/**
 * Safe JSON serialization with fallback to string conversion
 * @param obj Object to serialize
 * @returns JSON string
 */
function safeJsonSerialize(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    return String(obj);
  }
}

/**
 * Convert content parts to LiteLLM content format
 * @param parts Content parts
 * @returns Content in LiteLLM format
 */
function getContent(parts: Part[]): string | any[] | null {
  const contentObjects = [];
  
  for (const part of parts) {
    if (part.text) {
      if (parts.length === 1) {
        return part.text;
      }
      contentObjects.push({
        type: 'text',
        text: part.text,
      });
    } else if (part.inlineData && part.inlineData.data && part.inlineData.mimeType) {
      const dataUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      
      if (part.inlineData.mimeType.startsWith('image')) {
        contentObjects.push({
          type: 'image_url',
          image_url: dataUri,
        });
      } else if (part.inlineData.mimeType.startsWith('video')) {
        contentObjects.push({
          type: 'video_url',
          video_url: dataUri,
        });
      } else {
        throw new Error('LiteLlm does not support this content part.');
      }
    }
  }
  
  return contentObjects.length > 0 ? contentObjects : null;
}

/**
 * Convert role to LiteLLM role
 * @param role The role to convert
 * @returns The LiteLLM role
 */
function toLiteLlmRole(role: string | undefined): 'user' | 'assistant' {
  if (role === 'model' || role === 'assistant') {
    return 'assistant';
  }
  return 'user';
}

// Type labels for schema conversion
const TYPE_LABELS: Record<string, string> = {
  'STRING': 'string',
  'NUMBER': 'number',
  'BOOLEAN': 'boolean',
  'OBJECT': 'object',
  'ARRAY': 'array',
  'INTEGER': 'integer',
};

/**
 * Convert schema to dictionary
 * @param schema The schema to convert
 * @returns The dictionary representation
 */
function schemaToDict(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  const schemaDict: any = { ...schema };
  
  if ('type' in schemaDict && typeof schemaDict.type === 'string') {
    schemaDict.type = schemaDict.type.toLowerCase();
  }
  
  if ('items' in schemaDict && schemaDict.items) {
    if (typeof schemaDict.items === 'object' && !Array.isArray(schemaDict.items)) {
      schemaDict.items = schemaToDict(schemaDict.items);
    } else if (typeof schemaDict.items === 'object' && 'type' in schemaDict.items) {
      const itemType = schemaDict.items.type;
      if (typeof itemType === 'string' && itemType in TYPE_LABELS) {
        schemaDict.items.type = TYPE_LABELS[itemType];
      }
    }
  }
  
  if ('properties' in schemaDict && schemaDict.properties) {
    const properties: Record<string, any> = {};
    for (const [key, value] of Object.entries(schemaDict.properties)) {
      properties[key] = schemaToDict(value);
    }
    schemaDict.properties = properties;
  }
  
  return schemaDict;
}

/**
 * Convert function declaration to tool parameter
 * @param functionDeclaration The function declaration
 * @returns The tool parameter
 */
function functionDeclarationToToolParam(functionDeclaration: FunctionDeclaration): any {
  if (!functionDeclaration.name) {
    throw new Error('Function declaration must have a name');
  }

  const properties: Record<string, any> = {};
  if (functionDeclaration.parameters && functionDeclaration.parameters.properties) {
    for (const [key, value] of Object.entries(functionDeclaration.parameters.properties)) {
      properties[key] = schemaToDict(value);
    }
  }

  return {
    type: 'function',
    function: {
      name: functionDeclaration.name,
      description: functionDeclaration.description || '',
      parameters: {
        type: 'object',
        properties: properties,
      },
    },
  };
}

/**
 * Convert model response to chunks
 * @param response The model response
 * @yields Tuples of chunks and finish reasons
 */
function* modelResponseToChunk(response: ModelResponse): Generator<[TextChunk | FunctionChunk | null, string | null]> {
  let message = null;
  if (response.choices) {
    const choice = response.choices[0];
    message = choice.message;
    const finishReason = choice.finish_reason;
    
    // Check streaming delta
    if (!message && choice.delta) {
      message = choice.delta;
    }

    if (message?.content) {
      // Handle content that could be string or any[]
      const content = typeof message.content === 'string' 
        ? message.content 
        : Array.isArray(message.content) 
          ? message.content.map(item => item.text || '').join('') 
          : '';
      
      yield [new TextChunk(content), finishReason || null];
    }

    if (message?.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === 'function') {
          yield [new FunctionChunk(
            toolCall.id,
            toolCall.function.name,
            toolCall.function.arguments
          ), finishReason || null];
        }
      }
    }

    if (finishReason && !(message?.content || message?.tool_calls)) {
      yield [null, finishReason];
    }
  }

  if (!message) {
    yield [null, null];
  }
}

/**
 * Process model response to get the response content
 * @param response The model response 
 * @returns LlmResponse
 */
function modelResponseToGenerateContentResponse(response: ModelResponse): LlmResponse {
  if (!response.choices || !response.choices[0] || !response.choices[0].message) {
    throw new Error('Invalid response from model');
  }
  
  return messageToGenerateContentResponse(response.choices[0].message);
}

/**
 * Convert a LiteLLM message to an LlmResponse
 * @param message The message to convert
 * @param isPartial Whether the message is partial
 * @returns The LlmResponse
 */
function messageToGenerateContentResponse(message: Message, isPartial: boolean = false): LlmResponse {
  const response = new LlmResponse();
  const parts: Part[] = [];
  
  if (message.content !== undefined && message.content !== null) {
    if (typeof message.content === 'string') {
      parts.push({ text: message.content });
    } else if (Array.isArray(message.content)) {
      // For array content (multimodal), we'd need more complex handling
      // but for now, take the first text item if available
      const textItem = message.content.find(item => item.type === 'text');
      if (textItem) {
        parts.push({ text: textItem.text });
      }
    }
  }

  if (message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.type === 'function') {
        const part: Part = {
          functionCall: {
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments || '{}'),
            id: toolCall.id
          }
        };
        parts.push(part);
      }
    }
  }

  response.content = {
    role: 'model',
    parts: parts
  };
  
  response.partial = isPartial;
  
  return response;
}

/**
 * Build a log string for function declarations
 * @param functionDeclaration The function declaration
 * @returns The log string
 */
function buildFunctionDeclarationLog(functionDeclaration: FunctionDeclaration): string {
  let paramStr = '{}';
  if (functionDeclaration.parameters && functionDeclaration.parameters.properties) {
    paramStr = JSON.stringify(functionDeclaration.parameters.properties);
  }
  
  return `${functionDeclaration.name}: ${paramStr}`;
}

/**
 * Build a request log string
 * @param llmRequest The request
 * @returns The log string
 */
function buildRequestLog(llmRequest: LlmRequest): string {
  const functionDecls = llmRequest.config.tools?.[0]?.functionDeclarations || [];
  const functionLogs = functionDecls.map(buildFunctionDeclarationLog);
  
  const contentsLogs = (llmRequest.contents || []).map(content => {
    // In a real implementation, you would need to strip large binary data
    // from inline_data fields before logging
    return JSON.stringify(content);
  });

  return `
LLM Request:
-----------------------------------------------------------
System Instruction:
${llmRequest.config.systemInstruction || ''}
-----------------------------------------------------------
Contents:
${contentsLogs.join('\n')}
-----------------------------------------------------------
Functions:
${functionLogs.join('\n')}
-----------------------------------------------------------
`;
}

/**
 * Get completion inputs from an LlmRequest
 * @param llmRequest The LlmRequest
 * @returns Tuple of messages and tools
 */
function getCompletionInputs(llmRequest: LlmRequest): [Message[], any[]] {
  const messages: Message[] = [];
  
  for (const content of llmRequest.contents || []) {
    const messageParamOrList = contentToMessageParam(content);
    if (Array.isArray(messageParamOrList)) {
      messages.push(...messageParamOrList);
    } else if (messageParamOrList) {
      messages.push(messageParamOrList);
    }
  }

  if (llmRequest.config.systemInstruction) {
    messages.unshift({
      role: 'developer',
      content: llmRequest.config.systemInstruction,
    });
  }

  let tools = null;
  if (
    llmRequest.config &&
    llmRequest.config.tools &&
    llmRequest.config.tools.length > 0 &&
    llmRequest.config.tools[0].functionDeclarations
  ) {
    tools = llmRequest.config.tools[0].functionDeclarations.map(
      tool => functionDeclarationToToolParam(tool)
    );
  }
  
  return [messages, tools || []];
}

/**
 * LiteLlm class - wrapper around LiteLLM
 */
export class LiteLlm extends BaseLlm {
  llmClient: LiteLLMClient;
  private _additionalArgs: Record<string, any>;

  /**
   * Constructor
   * @param model The model name
   * @param additionalArgs Additional arguments
   */
  constructor(model: string, additionalArgs: Record<string, any> = {}) {
    super(model);
    this.llmClient = new LiteLLMClient();
    this._additionalArgs = { ...additionalArgs };
    
    // Remove invalid arguments
    delete this._additionalArgs.llmClient;
    delete this._additionalArgs.messages;
    delete this._additionalArgs.tools;
    delete this._additionalArgs.stream;
  }

  /**
   * Generate content asynchronously
   * @param llmRequest The request
   * @param stream Whether to stream
   * @returns AsyncGenerator yielding responses
   */
  async *generateContentAsync(
    llmRequest: LlmRequest,
    stream: boolean = false
  ): AsyncGenerator<LlmResponse, void, unknown> {
    // Log the request details, matching Python's behavior
    console.log(buildRequestLog(llmRequest));

    const [messages, tools] = getCompletionInputs(llmRequest);

    const completionArgs: Record<string, any> = {
      model: this.model,
      messages,
      tools,
      ...this._additionalArgs
    };

    try {
      if (stream) {
        let text = '';
        let functionName = '';
        let functionArgs = '';
        let functionId: string | null = null;
        
        completionArgs.stream = true;
        
        // Call the completion method for streaming
        const streamingResponse = this.llmClient.completion(
          completionArgs.model,
          completionArgs.messages,
          completionArgs.tools,
          true,
          completionArgs
        );
        
        // Process the streaming response
        try {
          for await (const part of streamingResponse) {
            for (const [chunk, finishReason] of modelResponseToChunk(part)) {
              if (chunk instanceof FunctionChunk) {
                if (chunk.name) {
                  functionName += chunk.name;
                }
                if (chunk.args) {
                  functionArgs += chunk.args;
                }
                functionId = chunk.id || functionId;
              } else if (chunk instanceof TextChunk) {
                text += chunk.text;
                yield messageToGenerateContentResponse(
                  {
                    role: 'assistant',
                    content: chunk.text,
                  },
                  true
                );
              }
              
              if (finishReason === 'tool_calls' && functionId) {
                yield messageToGenerateContentResponse(
                  {
                    role: 'assistant',
                    content: '',
                    tool_calls: [
                      {
                        type: 'function',
                        id: functionId,
                        function: {
                          name: functionName,
                          arguments: functionArgs,
                        },
                      },
                    ],
                  }
                );
                functionName = '';
                functionArgs = '';
                functionId = null;
              } else if (finishReason === 'stop' && text) {
                yield messageToGenerateContentResponse(
                  {
                    role: 'assistant',
                    content: text,
                  }
                );
                text = '';
              }
            }
          }
        } catch (error) {
          console.error('Error processing streaming response:', error);
          // If there's an error in stream processing but we have accumulated text
          if (text) {
            yield messageToGenerateContentResponse(
              {
                role: 'assistant',
                content: text,
              }
            );
          }
        }
      } else {
        // Non-streaming: just call acompletion and yield the response
        const response = await this.llmClient.acompletion(
          completionArgs.model,
          completionArgs.messages,
          completionArgs.tools, 
          completionArgs
        );
        
        yield modelResponseToGenerateContentResponse(response);
      }
    } catch (error) {
      console.error('Error during LLM completion:', error);
      const errorResponse = new LlmResponse();
      errorResponse.errorCode = 'COMPLETION_ERROR';
      errorResponse.errorMessage = String(error);
      yield errorResponse;
    }
  }

  /**
   * List of supported models
   * @returns Empty array - LiteLlm supports all models
   */
  static supportedModels(): string[] {
    return [];
  }
} 