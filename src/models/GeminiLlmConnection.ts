 

import { BaseLlmConnection } from './BaseLlmConnection';
import { LlmResponse } from './LlmResponse';
import { Blob, Content, Part } from './types';

/**
 * TypeScript equivalents of the Google genai live types
 */
interface LiveClientContent {
  turns: Content[];
  turn_complete: boolean;
}

interface LiveClientToolResponse {
  function_responses: any[];
}

interface ServerContent {
  model_turn?: Content;
  output_transcription?: {
    text: string;
  };
  turn_complete: boolean;
  interrupted: boolean;
}

interface ToolCall {
  function_calls: any[];
}

interface LiveMessage {
  server_content?: ServerContent;
  tool_call?: ToolCall;
}

/**
 * AsyncSession interface for the Google genai live SDK
 */
interface AsyncSession {
  send(input: LiveClientContent | LiveClientToolResponse | Blob): Promise<void>;
  receive(): AsyncGenerator<LiveMessage, void, unknown>;
  close(): Promise<void>;
}

/**
 * The Gemini model connection.
 */
export class GeminiLlmConnection extends BaseLlmConnection {
  private geminiSession: AsyncSession;
  
  /**
   * Constructor for GeminiLlmConnection
   * @param geminiSession The Gemini async session
   */
  constructor(geminiSession: AsyncSession) {
    super();
    this.geminiSession = geminiSession;
  }

  /**
   * Sends the conversation history to the gemini model.
   *
   * You call this method right after setting up the model connection.
   * The model will respond if the last content is from user, otherwise it will
   * wait for new user input before responding.
   *
   * @param history The conversation history to send to the model.
   */
  async sendHistory(history: Content[]): Promise<void> {
    // Filter out any content without text parts (e.g., ignore audio during agent transfer)
    const contents = history.filter(content => 
      content.parts && 
      content.parts.length > 0 && 
      content.parts.some(part => part.text)
    );

    if (contents.length > 0) {
      await this.geminiSession.send({
        turns: contents,
        turn_complete: contents[contents.length - 1].role === 'user'
      });
    } else {
      console.info('No content is sent');
    }
  }

  /**
   * Sends a user content to the gemini model.
   *
   * The model will respond immediately upon receiving the content.
   * If you send function responses, all parts in the content should be function
   * responses.
   *
   * @param content The content to send to the model.
   */
  async sendContent(content: Content): Promise<void> {
    if (!content.parts || content.parts.length === 0) {
      throw new Error('Content must have parts');
    }

    if (content.parts[0].functionResponse) {
      // All parts have to be function responses
      const functionResponses = content.parts
        .map(part => part.functionResponse)
        .filter(fr => fr !== undefined);
        
      console.debug('Sending LLM function response:', functionResponses);
      
      await this.geminiSession.send({
        function_responses: functionResponses
      } as LiveClientToolResponse);
    } else {
      console.debug('Sending LLM new content:', content);
      
      await this.geminiSession.send({
        turns: [content],
        turn_complete: true
      } as LiveClientContent);
    }
  }

  /**
   * Sends a chunk of audio or a frame of video to the model in realtime.
   *
   * The model may not respond immediately upon receiving the blob. It will do
   * voice activity detection and decide when to respond.
   *
   * @param blob The blob to send to the model.
   */
  async sendRealtime(blob: Blob): Promise<void> {
    console.debug('Sending LLM Blob:', blob);
    await this.geminiSession.send(blob);
  }

  /**
   * Builds a full text response.
   *
   * The text is not partial and the returned LlmResponse is not be
   * partial.
   *
   * @param text The text to be included in the response.
   * @returns An LlmResponse containing the full text.
   */
  private buildFullTextResponse(text: string): LlmResponse {
    const response = new LlmResponse();
    response.content = {
      role: 'model',
      parts: [{ text }]
    };
    return response;
  }

  /**
   * Receives the model response using the llm server connection.
   *
   * @returns An async generator yielding LlmResponse objects.
   */
  async *receive(): AsyncGenerator<LlmResponse, void, unknown> {
    let text = '';
    
    for await (const message of this.geminiSession.receive()) {
      console.debug('Got LLM Live message:', message);
      
      if (message.server_content) {
        const serverContent = message.server_content;
        const content = serverContent.model_turn;
        
        if (content && content.parts && content.parts.length > 0) {
          const response = new LlmResponse();
          response.content = content;
          response.interrupted = serverContent.interrupted;
          
          if (content.parts[0].text) {
            text += content.parts[0].text;
            response.partial = true;
          } 
          // Don't yield the merged text event when receiving audio data
          else if (text && !content.parts[0].inlineData) {
            yield this.buildFullTextResponse(text);
            text = '';
          }
          
          yield response;
        }

        // Handle transcription
        if (
          serverContent.output_transcription &&
          serverContent.output_transcription.text
        ) {
          // Transcription is always considered as partial event
          // We rely on other control signals to determine when to yield the
          // full text response (turn_complete, interrupted, or tool_call)
          text += serverContent.output_transcription.text;
          
          const response = new LlmResponse();
          response.content = {
            role: 'model',
            parts: [{ text: serverContent.output_transcription.text }]
          };
          response.partial = true;
          
          yield response;
        }

        // Handle turn complete
        if (serverContent.turn_complete) {
          if (text) {
            yield this.buildFullTextResponse(text);
            text = '';
          }
          
          const response = new LlmResponse();
          response.turnComplete = true;
          response.interrupted = serverContent.interrupted;
          
          yield response;
          break;
        }
        
        // In case of empty content or parts, we still surface it
        // If it's an interrupted message, we merge the previous partial text
        if (serverContent.interrupted && text) {
          yield this.buildFullTextResponse(text);
          text = '';
        }
        
        // Yield interrupted status
        const interruptedResponse = new LlmResponse();
        interruptedResponse.interrupted = serverContent.interrupted;
        yield interruptedResponse;
      }
      
      // Handle tool call
      if (message.tool_call) {
        if (text) {
          yield this.buildFullTextResponse(text);
          text = '';
        }
        
        const parts: Part[] = message.tool_call.function_calls.map(
          functionCall => ({ functionCall })
        );
        
        const response = new LlmResponse();
        response.content = {
          role: 'model',
          parts
        };
        
        yield response;
      }
    }
  }

  /**
   * Closes the llm server connection.
   */
  async close(): Promise<void> {
    await this.geminiSession.close();
  }
} 