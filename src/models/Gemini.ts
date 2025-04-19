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
import { BaseLlmConnection } from './BaseLlmConnection';
import { GeminiLlmConnection } from './GeminiLlmConnection';
import { LlmRequest } from './LlmRequest';
import { LlmResponse } from './LlmResponse';
import { Blob, Content, FunctionDeclaration, Part } from './types';

// Simulated interfaces for GenAI SDK types in TypeScript
interface GenerateContentResponse {
  candidates?: {
    content?: Content;
    grounding_metadata?: any;
    finish_reason?: string;
    finish_message?: string;
  }[];
  prompt_feedback?: {
    block_reason?: string;
    block_reason_message?: string;
  };
  usage_metadata?: {
    prompt_token_count?: number;
    candidates_token_count?: number;
    total_token_count?: number;
  };
  text?: string;
  function_calls?: {
    name: string;
    args: any;
  }[];
}

interface HttpOptions {
  headers: Record<string, string>;
  api_version?: string;
}

interface GenerateContentConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  candidateCount?: number;
  stopSequences?: string[];
  systemInstruction?: string;
  tools?: any[];
}

interface LiveConnectConfig {
  voiceInput?: boolean;
  systemInstruction?: Content;
  tools?: any[];
}

// Mock AsyncSession for the Google GenAI Live SDK
interface AsyncSession {
  send(input: any): Promise<void>;
  receive(): AsyncGenerator<any, void, unknown>;
  close(): Promise<void>;
}

// GenAI Client for Gemini
class GenAIClient {
  vertexai: boolean = false;
  
  constructor(private httpOptions: { headers: Record<string, string>, api_version?: string }) {}

  // Models API
  async generateContent(
    model: string,
    contents: Content[],
    config: GenerateContentConfig
  ): Promise<GenerateContentResponse> {
    // This would call the actual GenAI SDK in a real implementation
    throw new Error('Not implemented: This requires integration with GenAI SDK');
  }

  async *generateContentStream(
    model: string,
    contents: Content[],
    config: GenerateContentConfig
  ): AsyncGenerator<GenerateContentResponse, void, unknown> {
    // This would call the actual GenAI SDK in a real implementation
    throw new Error('Not implemented: This requires integration with GenAI SDK');
    yield {} as GenerateContentResponse; // To satisfy the generator requirement
  }

  // Live API
  async connectLive(
    model: string,
    config: LiveConnectConfig
  ): Promise<{ session: AsyncSession }> {
    // This would create a real AsyncSession in a real implementation
    throw new Error('Not implemented: This requires integration with GenAI SDK');
  }
}

/**
 * Integration for Gemini models.
 */
export class Gemini extends BaseLlm {
  private apiClientCache: GenAIClient | null = null;
  private liveApiClientCache: GenAIClient | null = null;
  private readonly NEW_LINE = '\n';
  private readonly EXCLUDED_PART_FIELD: { 'inline_data': { 'data': string } } = { 'inline_data': { 'data': '' } };

  /**
   * Constructor
   * @param model The name of the Gemini model, defaults to 'gemini-1.5-flash'
   */
  constructor(model: string = 'gemini-1.5-flash') {
    super(model);
  }

  /**
   * List of supported models
   * @returns An array of regex patterns for supported model names
   */
  static supportedModels(): string[] {
    return [
      'gemini-.*',
      // fine-tuned vertex endpoint pattern
      'projects\\/.*\\/locations\\/.*\\/endpoints\\/.*',
      // vertex gemini long name
      'projects\\/.*\\/locations\\/.*\\/publishers\\/google\\/models\\/gemini.*',
    ];
  }

  /**
   * Generate content asynchronously
   * @param llmRequest The request to send to the Gemini model
   * @param stream Whether to use streaming mode
   * @returns AsyncGenerator yielding LlmResponse objects
   */
  async *generateContentAsync(
    llmRequest: LlmRequest,
    stream: boolean = false
  ): AsyncGenerator<LlmResponse, void, unknown> {
    this._maybeAppendUserContent(llmRequest);
    console.info(
      `Sending out request, model: ${llmRequest.model || this.model}, backend: ${this._apiBackend}, stream: ${stream}`
    );
    console.info(this._buildRequestLog(llmRequest));

    if (stream) {
      const responses = this.apiClient.generateContentStream(
        llmRequest.model || this.model,
        llmRequest.contents,
        llmRequest.config
      );

      let response: GenerateContentResponse | null = null;
      let text = '';

      // For streaming, mark text content as partial and accumulate text
      for await (const resp of responses) {
        console.info(this._buildResponseLog(resp));
        response = resp;
        const llmResponse = LlmResponse.create(resp);

        if (
          llmResponse.content &&
          llmResponse.content.parts &&
          llmResponse.content.parts[0]?.text
        ) {
          text += llmResponse.content.parts[0].text;
          llmResponse.partial = true;
        } else if (
          text &&
          (!llmResponse.content ||
            !llmResponse.content.parts ||
            !llmResponse.content.parts[0]?.inlineData)
        ) {
          // Yield accumulated text
          const textResponse = new LlmResponse();
          textResponse.content = {
            role: 'model',
            parts: [{ text }]
          };
          yield textResponse;
          text = '';
        }

        yield llmResponse;
      }

      // Yield final accumulated text if there's any and response finished with STOP
      if (
        text &&
        response &&
        response.candidates &&
        response.candidates[0]?.finish_reason === 'STOP'
      ) {
        const finalResponse = new LlmResponse();
        finalResponse.content = {
          role: 'model',
          parts: [{ text }]
        };
        yield finalResponse;
      }
    } else {
      // Non-streaming mode
      const response = await this.apiClient.generateContent(
        llmRequest.model || this.model,
        llmRequest.contents,
        llmRequest.config
      );
      console.info(this._buildResponseLog(response));
      yield LlmResponse.create(response);
    }
  }

  /**
   * Get the API client
   */
  private get apiClient(): GenAIClient {
    if (!this.apiClientCache) {
      this.apiClientCache = new GenAIClient({ headers: this._trackingHeaders });
    }
    return this.apiClientCache;
  }

  /**
   * Get the API backend type
   */
  private get _apiBackend(): string {
    return this.apiClient.vertexai ? 'vertex' : 'ml_dev';
  }

  /**
   * Get tracking headers for API requests
   */
  private get _trackingHeaders(): Record<string, string> {
    // In a real implementation, we would import the version from a version module
    const version = '1.0.0';
    const frameworkLabel = `google-adk/${version}`;
    const languageLabel = 'gl-typescript/1.0.0';
    const versionHeaderValue = `${frameworkLabel} ${languageLabel}`;
    
    return {
      'x-goog-api-client': versionHeaderValue,
      'user-agent': versionHeaderValue,
    };
  }

  /**
   * Get the live API client
   */
  private get _liveApiClient(): GenAIClient {
    if (!this.liveApiClientCache) {
      if (this._apiBackend === 'vertex') {
        // Use default API version for Vertex
        this.liveApiClientCache = new GenAIClient({ headers: this._trackingHeaders });
      } else {
        // Use v1alpha for ML Dev
        this.liveApiClientCache = new GenAIClient({
          headers: this._trackingHeaders,
          api_version: 'v1alpha'
        });
      }
    }
    return this.liveApiClientCache;
  }

  /**
   * Connect to the Gemini model and create a connection
   * This implementation is synchronous to match the BaseLlm interface
   * The implementation itself uses async/await internally
   */
  connect(llmRequest: LlmRequest): BaseLlmConnection {
    if (!llmRequest.liveConnectConfig) {
      llmRequest.liveConnectConfig = {};
    }
    
    // Cast to allow access to the properties we need
    const liveConfig = llmRequest.liveConnectConfig as LiveConnectConfig;
    
    // Set system instruction
    if (llmRequest.config.systemInstruction) {
      liveConfig.systemInstruction = {
        role: 'system',
        parts: [{ text: llmRequest.config.systemInstruction }]
      };
    }
    
    // Set tools
    liveConfig.tools = llmRequest.config.tools;
    
    // Create a minimal implementation that will be replaced with the real one
    // when the async operations complete
    const dummyConnection = new class extends BaseLlmConnection {
      private realConnection: BaseLlmConnection | null = null;
      private connectionPromise: Promise<BaseLlmConnection>;
      
      constructor(connectPromise: Promise<{ session: AsyncSession }>) {
        super();
        this.connectionPromise = connectPromise.then(({session}) => {
          this.realConnection = new GeminiLlmConnection(session);
          return this.realConnection;
        }).catch(error => {
          console.error('Error connecting to Gemini model:', error);
          throw error;
        });
      }
      
      async sendHistory(history: Content[]): Promise<void> {
        const conn = await this.connectionPromise;
        return conn.sendHistory(history);
      }
      
      async sendContent(content: Content): Promise<void> {
        const conn = await this.connectionPromise;
        return conn.sendContent(content);
      }
      
      async sendRealtime(blob: Blob): Promise<void> {
        const conn = await this.connectionPromise;
        return conn.sendRealtime(blob);
      }
      
      async *receive(): AsyncGenerator<LlmResponse, void, unknown> {
        const conn = await this.connectionPromise;
        yield* conn.receive();
      }
      
      async close(): Promise<void> {
        const conn = await this.connectionPromise;
        return conn.close();
      }
    }(this._liveApiClient.connectLive(
      llmRequest.model || this.model,
      llmRequest.liveConnectConfig
    ));
    
    return dummyConnection;
  }

  /**
   * Appends a user content if needed
   * @param llmRequest The request to modify
   */
  private _maybeAppendUserContent(llmRequest: LlmRequest): void {
    // If no content is provided, append a user content to hint model response
    // using system instruction
    if (!llmRequest.contents || llmRequest.contents.length === 0) {
      llmRequest.contents.push({
        role: 'user',
        parts: [{
          text: 'Handle the requests as specified in the System Instruction.'
        }]
      });
      return;
    }

    // Insert a user content to preserve user intent and avoid empty model response
    if (llmRequest.contents[llmRequest.contents.length - 1].role !== 'user') {
      llmRequest.contents.push({
        role: 'user',
        parts: [{
          text: 'Continue processing previous requests as instructed. Exit or provide a summary if no more outputs are needed.'
        }]
      });
    }
  }

  /**
   * Build a log string for a function declaration
   * @param funcDecl The function declaration
   * @returns A string representation
   */
  private _buildFunctionDeclarationLog(funcDecl: FunctionDeclaration): string {
    let paramStr = '{}';
    if (funcDecl.parameters && funcDecl.parameters.properties) {
      paramStr = JSON.stringify(funcDecl.parameters.properties);
    }
    const returnStr = 'None'; // TypeScript version doesn't use return types in the same way
    return `${funcDecl.name}: ${paramStr} -> ${returnStr}`;
  }

  /**
   * Build a log string for an LlmRequest
   * @param req The request
   * @returns A formatted log string
   */
  private _buildRequestLog(req: LlmRequest): string {
    const functionDecls = req.config.tools?.[0]?.function_declarations || [];
    const functionLogs = functionDecls.map(decl => this._buildFunctionDeclarationLog(decl));
    
    const contentsLogs = req.contents.map(content => {
      // In a real implementation, we would exclude large binary data
      // from inline_data fields before logging
      return JSON.stringify(content);
    });

    return `
LLM Request:
-----------------------------------------------------------
System Instruction:
${req.config.systemInstruction || ''}
-----------------------------------------------------------
Contents:
${contentsLogs.join(this.NEW_LINE)}
-----------------------------------------------------------
Functions:
${functionLogs.join(this.NEW_LINE)}
-----------------------------------------------------------
`;
  }

  /**
   * Build a log string for a response
   * @param resp The response
   * @returns A formatted log string
   */
  private _buildResponseLog(resp: GenerateContentResponse): string {
    const functionCallsText: string[] = [];
    
    if (resp.function_calls) {
      for (const funcCall of resp.function_calls) {
        functionCallsText.push(`name: ${funcCall.name}, args: ${JSON.stringify(funcCall.args)}`);
      }
    }

    return `
LLM Response:
-----------------------------------------------------------
Text:
${resp.text || ''}
-----------------------------------------------------------
Function calls:
${functionCallsText.join(this.NEW_LINE)}
-----------------------------------------------------------
Raw response:
${JSON.stringify(resp)}
-----------------------------------------------------------
`;
  }
} 