 

import { GeminiLlmConnection } from '../../../src/models/GeminiLlmConnection';
import { LlmResponse } from '../../../src/models/LlmResponse';
import { Content, Blob, Part } from '../../../src/models/types';

// Mock Gemini AsyncSession for testing
class MockAsyncSession {
  sendMock: jest.Mock;
  receiveMock: jest.Mock;
  closeMock: jest.Mock;

  constructor() {
    this.sendMock = jest.fn().mockResolvedValue(undefined);
    this.closeMock = jest.fn().mockResolvedValue(undefined);
    this.receiveMock = jest.fn();
  }

  async send(input: any): Promise<void> {
    return this.sendMock(input);
  }

  async *receive(): AsyncGenerator<any, void, unknown> {
    const messages = this.receiveMock();
    for (const message of messages) {
      yield message;
    }
  }

  async close(): Promise<void> {
    return this.closeMock();
  }
}

// Test messages for different scenarios
const textMessage = {
  server_content: {
    model_turn: {
      role: 'model',
      parts: [{ text: 'Hello, this is a test response.' }]
    },
    turn_complete: false,
    interrupted: false
  }
};

const functionCallMessage = {
  tool_call: {
    function_calls: [
      {
        name: 'test_function',
        args: { param1: 'value1' }
      }
    ]
  }
};

const turnCompleteMessage = {
  server_content: {
    turn_complete: true,
    interrupted: false
  }
};

const interruptedMessage = {
  server_content: {
    turn_complete: false,
    interrupted: true
  }
};

const transcriptionMessage = {
  server_content: {
    output_transcription: {
      text: 'This is a transcription test.'
    },
    turn_complete: false,
    interrupted: false
  }
};

describe('GeminiLlmConnection', () => {
  let mockSession: MockAsyncSession;
  let connection: GeminiLlmConnection;

  beforeEach(() => {
    mockSession = new MockAsyncSession();
    connection = new GeminiLlmConnection(mockSession as any);
  });

  describe('sendHistory', () => {
    test('sends history with user as last role', async () => {
      const history: Content[] = [
        {
          role: 'user',
          parts: [{ text: 'Hello' }]
        },
        {
          role: 'model',
          parts: [{ text: 'Hi there' }]
        },
        {
          role: 'user',
          parts: [{ text: 'How are you?' }]
        }
      ];

      await connection.sendHistory(history);

      expect(mockSession.sendMock).toHaveBeenCalledWith({
        turns: history,
        turn_complete: true
      });
    });

    test('sends history with model as last role', async () => {
      const history: Content[] = [
        {
          role: 'user',
          parts: [{ text: 'Hello' }]
        },
        {
          role: 'model',
          parts: [{ text: 'Hi there, how can I help?' }]
        }
      ];

      await connection.sendHistory(history);

      expect(mockSession.sendMock).toHaveBeenCalledWith({
        turns: history,
        turn_complete: false
      });
    });

    test('filters out content without text parts', async () => {
      const history: Content[] = [
        {
          role: 'user',
          parts: [{ text: 'Hello' }]
        },
        {
          role: 'user',
          parts: [{ inlineData: { data: 'data', mimeType: 'audio/wav' } }]
        },
        {
          role: 'model',
          parts: [{ text: 'Hi there' }]
        }
      ];

      await connection.sendHistory(history);

      expect(mockSession.sendMock).toHaveBeenCalledWith({
        turns: [
          history[0],
          history[2]
        ],
        turn_complete: false
      });
    });

    test('handles empty history', async () => {
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
      
      await connection.sendHistory([]);
      
      expect(mockSession.sendMock).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledWith('No content is sent');
      
      consoleInfoSpy.mockRestore();
    });
  });

  describe('sendContent', () => {
    test('sends regular content', async () => {
      const content: Content = {
        role: 'user',
        parts: [{ text: 'Hello' }]
      };

      await connection.sendContent(content);

      expect(mockSession.sendMock).toHaveBeenCalledWith({
        turns: [content],
        turn_complete: true
      });
    });

    test('sends function responses', async () => {
      const content: Content = {
        role: 'tool',
        parts: [
          { 
            functionResponse: {
              name: 'test_function',
              response: { result: 'success' },
              id: 'func1'
            }
          },
          {
            functionResponse: {
              name: 'another_function',
              response: { data: 'value' },
              id: 'func2'
            }
          }
        ]
      };

      await connection.sendContent(content);

      expect(mockSession.sendMock).toHaveBeenCalledWith({
        function_responses: [
          content.parts[0].functionResponse,
          content.parts[1].functionResponse
        ]
      });
    });

    test('throws error for content without parts', async () => {
      const content: Content = {
        role: 'user',
        parts: []
      };

      await expect(connection.sendContent(content)).rejects.toThrow('Content must have parts');
    });
  });

  describe('sendRealtime', () => {
    test('sends blob data', async () => {
      const blob: Blob = {
        data: new Uint8Array([1, 2, 3]),
        mimeType: 'audio/wav'
      };

      await connection.sendRealtime(blob);

      expect(mockSession.sendMock).toHaveBeenCalledWith(blob);
    });
  });

  describe('receive', () => {
    test('handles text responses', async () => {
      mockSession.receiveMock.mockReturnValue([textMessage]);
      
      const responses: LlmResponse[] = [];
      for await (const response of connection.receive()) {
        responses.push(response);
      }
      
      // The receive method yields an additional interrupted response
      expect(responses.length).toBe(2);
      expect(responses[0].content?.role).toBe('model');
      expect(responses[0].content?.parts[0].text).toBe('Hello, this is a test response.');
      expect(responses[0].partial).toBe(true);
      // The second response is the interrupted status
      expect(responses[1].interrupted).toBeDefined();
    });

    test('handles function call responses', async () => {
      mockSession.receiveMock.mockReturnValue([functionCallMessage]);
      
      const responses: LlmResponse[] = [];
      for await (const response of connection.receive()) {
        responses.push(response);
      }
      
      expect(responses.length).toBe(1);
      expect(responses[0].content?.role).toBe('model');
      expect(responses[0].content?.parts[0].functionCall).toBeDefined();
      expect(responses[0].content?.parts[0].functionCall?.name).toBe('test_function');
      expect(responses[0].content?.parts[0].functionCall?.args).toEqual({ param1: 'value1' });
    });

    test('handles turn complete responses', async () => {
      mockSession.receiveMock.mockReturnValue([
        textMessage,
        turnCompleteMessage
      ]);
      
      const responses: LlmResponse[] = [];
      for await (const response of connection.receive()) {
        responses.push(response);
      }
      
      // Text message + interrupted status + full text response + turn complete response
      expect(responses.length).toBe(4);
      // First response is the text message with partial flag
      expect(responses[0].content?.parts[0].text).toBe('Hello, this is a test response.');
      expect(responses[0].partial).toBe(true);
      // Second response is the interrupted status
      expect(responses[1].interrupted).toBeDefined();
      // Third response is the full text (non-partial)
      expect(responses[2].content?.parts[0].text).toBe('Hello, this is a test response.');
      expect(responses[2].partial).toBeUndefined();
      // Fourth response is the turn complete
      expect(responses[3].turnComplete).toBe(true);
    });

    test('handles interrupted responses', async () => {
      mockSession.receiveMock.mockReturnValue([
        textMessage,
        interruptedMessage
      ]);
      
      const responses: LlmResponse[] = [];
      for await (const response of connection.receive()) {
        responses.push(response);
      }
      
      // Text message + interrupted status + full text response + interrupted response
      expect(responses.length).toBe(4);
      // First response is the text message
      expect(responses[0].content?.parts[0].text).toBe('Hello, this is a test response.');
      // Second response is the first interrupted status
      expect(responses[1].interrupted).toBeDefined();
      // Third response is the full text
      expect(responses[2].content?.parts[0].text).toBe('Hello, this is a test response.');
      // Fourth response is the final interrupted status
      expect(responses[3].interrupted).toBe(true);
    });

    test('handles transcription responses', async () => {
      mockSession.receiveMock.mockReturnValue([transcriptionMessage]);
      
      const responses: LlmResponse[] = [];
      for await (const response of connection.receive()) {
        responses.push(response);
      }
      
      expect(responses.length).toBe(2); // transcription + interrupted status
      expect(responses[0].content?.parts[0].text).toBe('This is a transcription test.');
      expect(responses[0].partial).toBe(true);
    });

    test('handles complex sequence of responses', async () => {
      mockSession.receiveMock.mockReturnValue([
        textMessage,
        transcriptionMessage,
        functionCallMessage,
        turnCompleteMessage
      ]);
      
      const responses: LlmResponse[] = [];
      for await (const response of connection.receive()) {
        responses.push(response);
      }
      
      expect(responses.length).toBeGreaterThan(3);
      expect(responses.some(r => r.content?.parts[0].text === 'Hello, this is a test response.')).toBe(true);
      expect(responses.some(r => r.content?.parts[0].text === 'This is a transcription test.')).toBe(true);
      expect(responses.some(r => r.content?.parts[0].functionCall !== undefined)).toBe(true);
      expect(responses.some(r => r.turnComplete === true)).toBe(true);
    });
  });

  describe('close', () => {
    test('closes the session', async () => {
      await connection.close();
      expect(mockSession.closeMock).toHaveBeenCalled();
    });
  });
}); 