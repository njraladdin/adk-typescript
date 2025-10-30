import { BaseLlm } from './BaseLlm';
import { BaseLlmConnection } from './BaseLlmConnection';
import { GeminiLlmConnection } from './GeminiLlmConnection';
import { LlmRequest } from './LlmRequest';
import { LlmResponse } from './LlmResponse';
import { Blob, Content, FunctionDeclaration, Part, GenerateContentConfig, ThinkingConfig } from './types';
//import { GoogleGenAI/*, Tool as GoogleTool*/ } from '@google/genai';
const { GoogleGenAI, Tool } = require('@google/genai');
const GoogleTool = Tool;

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

/**
 * Helper function to convert our content type to Google GenAI content format
 */
function convertContent(content: Content): { role: string, parts: any[] } {
  // Convert role from model to assistant if needed
  const role = content.role === 'model' ? 'assistant' : content.role;

  // Convert parts and filter out invalid ones
  const parts = content.parts
    .map(part => {
      if (part.text !== undefined) {
        return { text: part.text };
      } else if (part.inlineData) {
        return {
          inline_data: {
            mime_type: part.inlineData.mimeType,
            data: part.inlineData.data
          }
        };
      } else if (part.functionCall) {
        // Validate function call has required fields
        if (!part.functionCall.name) {
          console.warn('[GoogleLlm] convertContent: Skipping function call with missing name:', part.functionCall);
          return null;
        }
        return {
          functionCall: {
            name: part.functionCall.name,
            args: part.functionCall.args || {}
          }
        };
      } else if (part.functionResponse) {
        // Validate function response has required fields
        if (!part.functionResponse.name) {
          console.warn('[GoogleLlm] convertContent: Skipping function response with missing name:', part.functionResponse);
          return null;
        }
        return {
          functionResponse: {
            name: part.functionResponse.name,
            response: part.functionResponse.response || {}
          }
        };
      }
      // Log and skip invalid parts instead of returning empty object
      console.warn('[GoogleLlm] convertContent: Skipping invalid part with keys:', Object.keys(part));
      return null;
    })
    .filter(part => part !== null); // Filter out null parts

  return { role, parts };
}

/**
 * Helper function to convert our tools format to Google GenAI tools format
 */
function convertTools(tools: any[] | undefined): typeof GoogleTool[] {
  if (!tools || tools.length === 0) {
    return [];
  }
  
  return tools.map(tool => {
    // Handle snake_case format (functionDeclarations)
    if (tool.functionDeclarations) {
      return {
        functionDeclarations: tool.functionDeclarations.map((func: FunctionDeclaration) => ({
          name: func.name,
          description: func.description || '',
          parameters: func.parameters || {},
        }))
      };
    }
    return {};
  }).filter(tool => tool.functionDeclarations && tool.functionDeclarations.length > 0);
}

/**
 * Helper to convert response from Google GenAI to our expected format
 */
function convertResponse(response: any): GenerateContentResponse {
  
  // Check if the response is empty or invalid
  if (!response || typeof response !== 'object') {
    console.error('Received invalid response from Gemini API:', response);
    return {
      candidates: [{
        content: {
          role: 'model',
          parts: [{ text: 'The API returned an invalid response. Please try again.' }]
        },
        finish_reason: 'ERROR',
        finish_message: 'Invalid API response'
      }]
    };
  }
  
  // Handle VertexAI response format which nests the actual response inside a 'response' property
  const actualResponse = response.response || response;
  
  // Create result object
  const result: GenerateContentResponse = {};
  
  if (actualResponse.candidates) {
    result.candidates = actualResponse.candidates.map((candidate: any) => ({
      content: candidate.content,
      finish_reason: candidate.finishReason,
      grounding_metadata: candidate.groundingMetadata,
      finish_message: candidate.finishMessage
    }));
  }
  
  if (actualResponse.promptFeedback) {
    result.prompt_feedback = {
      block_reason: actualResponse.promptFeedback.blockReason,
      block_reason_message: actualResponse.promptFeedback.blockReasonMessage
    };
  }
  
  if (actualResponse.usageMetadata) {
    result.usage_metadata = {
      prompt_token_count: actualResponse.usageMetadata.promptTokenCount,
      candidates_token_count: actualResponse.usageMetadata.candidatesTokenCount,
      total_token_count: actualResponse.usageMetadata.totalTokenCount
    };
  }
  
  // Extract text from first candidate if available
  if (result.candidates && 
      result.candidates[0] && 
      result.candidates[0].content && 
      result.candidates[0].content.parts && 
      result.candidates[0].content.parts[0] && 
      result.candidates[0].content.parts[0].text) {
    result.text = result.candidates[0].content.parts[0].text;
  }
  
  // Extract function calls if available
  if (result.candidates && 
      result.candidates[0] && 
      result.candidates[0].content && 
      result.candidates[0].content.parts) {
    
    const functionCalls = result.candidates[0].content.parts
      .filter((part: any) => part.functionCall)
      .map((part: any) => ({
        name: part.functionCall.name,
        args: part.functionCall.args
      }));
    
    if (functionCalls.length > 0) {
      result.function_calls = functionCalls;
    }
  }
  
  // ONLY If no candidates were returned but response exists, create a default one
  if ((!result.candidates || result.candidates.length === 0) && 
      (!result.prompt_feedback || !result.prompt_feedback.block_reason)) {
    console.warn('Response missing candidates, creating a default candidate');
    result.candidates = [{
      content: {
        role: 'model',
        parts: [{ text: 'I received your message but encountered an issue generating a proper response. Please try again.' }]
      },
      finish_reason: 'DEFAULT_CANDIDATE',
      finish_message: 'Created default candidate due to missing response data'
    }];
  }
  
  // Check if the response has valid candidates but is asking for system instructions
  if (result.candidates && 
      result.candidates.length > 0 && 
      result.candidates[0].content && 
      result.candidates[0].content.parts && 
      result.candidates[0].content.parts[0] && 
      result.candidates[0].content.parts[0].text && 
      result.candidates[0].content.parts[0].text.includes("Please provide the System Instruction")) {
    console.warn('Model is asking for system instructions - this suggests the system instructions were not properly passed');
  }
  
  return result;
}

// GenAI Client for Gemini
class GenAIClient {
  vertexai: boolean = false;
  private genAI: typeof GoogleGenAI;
  
  constructor(private httpOptions: { headers: Record<string, string>, api_version?: string }) {
    // Check if this is a Vertex AI environment
    // Only use Vertex AI if explicitly enabled via GOOGLE_GENAI_USE_VERTEXAI or VERTEX_AI
    const useVertexAI = process.env.GOOGLE_GENAI_USE_VERTEXAI === '1' ||
                        process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true' ||
                        process.env.VERTEX_AI === '1' ||
                        process.env.VERTEX_AI === 'true';
    this.vertexai = useVertexAI;

    // Initialize Google GenAI with API key from environment
    this.genAI = new GoogleGenAI(this.vertexai ? {
    vertexai: true,
    
    /* these params are apparently optional */
    project: process.env?.GOOGLE_CLOUD_PROJECT,
    location: process.env?.GOOGLE_CLOUD_LOCATION,
	apiVersion: 'v1'     
  }:
  {
    vertexai:false,
    apiKey:process.env?.GOOGLE_API_KEY
  });
    
  }

  // Models API
  async generateContent(
    model: string,
    contents: Content[],
    config: GenerateContentConfig
  ): Promise<GenerateContentResponse> {
    try {
      
      // IMPORTANT: The JavaScript SDK handles system instructions differently than Python
      // We need to pass systemInstruction in the model configuration
      // not as a message in contents with role 'system'
      
      // Extract system instructions from config
      const systemInstructionText = config.systemInstruction;
      
      // Filter out any system messages from contents
      // as they're not supported by the JavaScript SDK
      contents = contents.filter(content => content.role !== 'system');
            
      // Create model instance with systemInstruction as a configuration parameter
      const genModel = this.genAI.models;
      
      // Log configuration for debugging
      // Convert content format
      const convertedContents = contents.map(convertContent);

      // Validate converted contents to ensure no empty parts
      convertedContents.forEach((content, index) => {
        content.parts = content.parts.filter((part: any) => {
          const partKeys = Object.keys(part);
          if (partKeys.length === 0) {
            console.error(`[GoogleLlm] Filtering out empty part at Content ${index}`);
            return false;
          }
          return true;
        });
      });

      // Log the converted contents for debugging
      console.log('[GoogleLlm] Sending request to API with', convertedContents.length, 'content items');
      convertedContents.forEach((content, index) => {
        console.log(`[GoogleLlm] Content ${index}: role=${content.role}, parts=${content.parts?.length}`);
        content.parts?.forEach((part: any, partIndex: number) => {
          const partKeys = Object.keys(part);
          console.log(`[GoogleLlm] Content ${index}, Part ${partIndex}: keys=${partKeys.join(', ')}`);
        });
      });

      try {
        // Build config object
        const generateConfig: any = {
          temperature: config.temperature,
          topP: config.topP,
          topK: config.topK,
          maxOutputTokens: config.maxOutputTokens,
          candidateCount: config.candidateCount,
          stopSequences: config.stopSequences,
          responseSchema: config.responseSchema,
          responseMimeType: config.responseMimeType,
          systemInstruction: systemInstructionText,
          tools: convertTools(config.tools),
        };

        // Add thinkingConfig if present
        if (config.thinkingConfig) {
          generateConfig.thinkingConfig = config.thinkingConfig;
        }

        // Generate content
        const response = await genModel.generateContent({
          model: model,
          contents: convertedContents,
          config: generateConfig,
        });
        
        // Convert response back to our expected format
        return convertResponse(response);
      } catch (apiErrorUnknown) {
        // Type cast the error
        const apiError = apiErrorUnknown as Error;
        console.error("API Error generating content:", apiError);
        
        // Create a fallback response with the error information
        return {
          candidates: [{
            content: {
              role: 'model',
              parts: [{ text: `API Error: ${apiError.message || 'Unknown error occurred'}. Please try again.` }]
            },
            finish_reason: 'ERROR',
            finish_message: apiError.message || 'Unknown error'
          }]
        };
      }
    } catch (errorUnknown) {
      // Type cast the error
      const error = errorUnknown as Error;
      console.error("Error generating content:", error);
      
      // Return a fallback response instead of throwing
      return {
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: `An error occurred: ${error.message || 'Unknown error'}. Please try again.` }]
          },
          finish_reason: 'ERROR',
          finish_message: error.message || 'Unknown error'
        }]
      };
    }
  }

  async *generateContentStream(
    model: string,
    contents: Content[],
    config: GenerateContentConfig
  ): AsyncGenerator<GenerateContentResponse, void, unknown> {
    try {
      console.log(`Generating streaming content with model: ${model}`);
      
      // IMPORTANT: The JavaScript SDK handles system instructions differently than Python
      // We need to pass systemInstruction in the model configuration
      // not as a message in contents with role 'system'
      
      // Extract system instructions from config
      const systemInstructionText = config.systemInstruction;
      
      // Filter out any system messages from contents
      // as they're not supported by the JavaScript SDK
      contents = contents.filter(content => content.role !== 'system');
      
      // Log information about system instructions
      if (systemInstructionText) {
        console.log(`Using system instruction for streaming: ${systemInstructionText}`);
      }
      
      // Create model instance with systemInstruction as a configuration parameter
      const genModel = this.genAI.models;      
      
      // Convert content format
      const convertedContents = contents.map(convertContent);
      
      // Generate streaming content
      const responseStream = await genModel.generateContentStream({
        model: model,
        contents: convertedContents,                
        config: {
          temperature: config.temperature,
          topP: config.topP,
          topK: config.topK,
          maxOutputTokens: config.maxOutputTokens,
          candidateCount: config.candidateCount,
          stopSequences: config.stopSequences,
          responseSchema: config.responseSchema,
          responseMimeType: config.responseMimeType,
          systemInstruction: systemInstructionText,
          tools: convertTools(config.tools),
        },
      });
      
      // Process and yield each chunk
      for await (const chunk of responseStream.stream) {
        yield convertResponse(chunk);
      }
    } catch (errorUnknown) {
      const error = errorUnknown as Error;
      console.error("Error in streaming content generation:", error);
      
      // Return a fallback response instead of throwing
      yield {
        candidates: [{
          content: {
            role: 'model',
            parts: [{ text: `An error occurred during streaming: ${error.message || 'Unknown error'}. Please try again.` }]
          },
          finish_reason: 'ERROR',
          finish_message: error.message || 'Streaming error'
        }]
      };
    }
  }

  // Live API
  async connectLive(
    model: string,
    config: LiveConnectConfig
  ): Promise<{ session: AsyncSession }> {
    try {
      console.log(`Connecting live to model: ${model}`);
      
      // IMPORTANT: The JavaScript SDK handles system instructions differently than Python
      // Filter out any system message content from history
      const history = [];
      let systemInstructionText = '';
      
      // Check if we have a system instruction
      if (config.systemInstruction) {
        // If we have a system instruction, get the text from it
        const systemMsg = config.systemInstruction;
        if (systemMsg && 
            systemMsg.parts && 
            systemMsg.parts.length > 0 && 
            systemMsg.parts[0].text) {
          systemInstructionText = systemMsg.parts[0].text;
          console.log(`Using system instruction for live connection: ${systemInstructionText}`);
        }
      }
      
      // Create model instance with appropriate configuration
      const genModel = this.genAI.chats;
      
      // Start chat session - don't pass system instruction in history
      const chat = genModel.create({
        model: model,
        history: [],  // Don't include system instructions in history
        config: {
          systemInstruction: systemInstructionText,
          tools: convertTools(config.tools),
        }
      });
      
      // Create an AsyncSession wrapper around the chat
      const session: AsyncSession = {
        async send(input: any): Promise<void> {
          await chat.sendMessage({message:input});
        },
        
        async *receive(): AsyncGenerator<any, void, unknown> {
          // In a real implementation, this would listen for responses
          // This is a placeholder as the Google GenAI JS SDK doesn't 
          // have a direct equivalent to the Python SDK's receive() method
          // Instead of getLastResponse, we'll use sendMessage to get a response
          const response = await chat.sendMessage({message:"continue"});
          yield convertResponse(response);
        },
        
        async close(): Promise<void> {
          // Clean up resources if needed
          // The Google GenAI JS SDK doesn't have an explicit close method
        }
      };
      
      return { session };
    } catch (error) {
      console.error("Error connecting to Gemini model:", error);
      throw error;
    }
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
   * @param model The name of the Gemini model, defaults to 'gemini-2.0-flash'
   */
  constructor(model: string = 'gemini-2.0-flash') {
    super(model);
  }

  /**
   * List of supported models
   * @returns An array of regex patterns for supported model names
   */
  static supportedModels(): string[] {
    return [
      'gemini-1\\.5-flash(-\\d+)?',
      'gemini-1\\.5-pro(-\\d+)?',
      'gemini-2\\.0-flash-exp',
      'gemini-2\\.0-flash',
      'gemini-2\\.5-flash-preview-04-17',
      'projects/.+/locations/.+/endpoints/.+', // finetuned vertex gemini endpoint
      'projects/.+/locations/.+/publishers/google/models/gemini.+', // vertex gemini long name
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

    // Make sure contents array exists
    if (!llmRequest.contents) {
      llmRequest.contents = [];
    }
    
    // Preserve original user message for logging
    const originalUserMessages = llmRequest.contents
      .filter(content => content.role === 'user')
      .map(content => JSON.stringify(content));
      
    if (originalUserMessages.length === 0) {
      console.warn('No user message found in request - this is unusual');
    }
    
    // IMPORTANT: In the JavaScript SDK for Google Generative AI,
    // system instructions should NOT be added as a message in contents
    // with role 'system'. Instead, use the systemInstruction config parameter.
    // Remove any system messages from contents array
    llmRequest.contents = llmRequest.contents.filter(content => content.role !== 'system');
    
   
    // Only append user content if absolutely necessary
    this._maybeAppendUserContent(llmRequest);
    
    // Sanity check - make sure we still have the original user message
    const userMessagesAfter = llmRequest.contents
      .filter(content => content.role === 'user')
      .map(content => JSON.stringify(content));
    
    if (originalUserMessages.length > 0 && 
        !userMessagesAfter.some(msg => originalUserMessages.includes(msg))) {
      console.error('ERROR: Original user message was lost during processing!');
      // In this case, restore the first original user message to ensure it's not lost
      if (originalUserMessages.length > 0) {
        const firstOriginalMsg = JSON.parse(originalUserMessages[0]);

        llmRequest.contents.push(firstOriginalMsg);
      }
    }
    
    // console.info(
    //   `Sending out request, model: ${llmRequest.model || this.model}, backend: ${this._apiBackend}, stream: ${stream}`
    // );
    // console.info(this._buildRequestLog(llmRequest));

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
        // console.info(this._buildResponseLog(resp));
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
      // console.info(this._buildResponseLog(response));
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
        // Use beta version for vertex api
        const apiVersion = 'v1beta1'; // use default api version for vertex
        this.liveApiClientCache = new GenAIClient({
          headers: this._trackingHeaders,
          api_version: apiVersion
        });
      } else {
        // Use v1alpha for ML Dev
        const apiVersion = 'v1alpha';
        this.liveApiClientCache = new GenAIClient({
          headers: this._trackingHeaders,
          api_version: apiVersion
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
    // Make sure contents array exists
    if (!llmRequest.contents) {
      llmRequest.contents = [];
    }
    
    // If contents array is completely empty, add a default message
    // This should only happen in very rare cases where no message was provided at all
    if (llmRequest.contents.length === 0) {
      console.warn('WARNING: No content provided in request. This is unusual and suggests an error in the calling code.');
      llmRequest.contents.push({
        role: 'user',
        parts: [{
          text: 'Hello'
        }]
      });
      return;
    }

    // Add a continuation prompt only if the last message is not from the user
    // This is to ensure that model responses are always triggered by a user message
    if (llmRequest.contents.length > 0 && 
        llmRequest.contents[llmRequest.contents.length - 1].role !== 'user') {
      console.log('Last message is not from user, adding minimal continuation prompt');
      llmRequest.contents.push({
        role: 'user',
        parts: [{
          text: 'Continue please.'
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
    const functionDecls = req.config.tools?.[0]?.functionDeclarations || [];
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