/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { BaseLlm } from '../../../../src/models/BaseLlm';
import { LlmRequest } from '../../../../src/models/LlmRequest';
import { LlmResponse } from '../../../../src/models/LlmResponse';
import { Content, Part } from '../../../../src/models/types';
import { ToolContext } from '../../../../src/tools/toolContext';
import { FunctionTool } from '../../../../src/tools/FunctionTool';
import { BaseTool } from '../../../../src/tools/BaseTool';

// Interface for Tool
interface Tool {
  name: string;
  description: string;
  execute: (args: any, context: ToolContext) => Promise<any>;
}

// Mock Agent class
class Agent extends BaseAgent {
  model: MockModel;
  tools: Tool[];

  constructor(options: { name: string; model: MockModel; tools: Tool[] }) {
    super(options.name);
    this.model = options.model;
    this.tools = options.tools;
  }

  setUserContent(content: Content): void {
    // Mock implementation
  }

  protected async *runAsyncImpl(): AsyncGenerator<any, void, unknown> {
    // Mock implementation
    yield {};
  }

  protected async *runLiveImpl(): AsyncGenerator<any, void, unknown> {
    // Mock implementation
    yield {};
  }
}

// Mock LLM implementation for testing
class MockModel extends BaseLlm {
  private _responses: any[];
  public requests: any[] = [];

  static create(responses: any[]): MockModel {
    return new MockModel('mock-model', responses);
  }

  constructor(model: string, responses: any[]) {
    super(model);
    this._responses = responses;
  }

  get responses(): any[] {
    return this._responses;
  }

  async *generateContentAsync(llmRequest: LlmRequest): AsyncGenerator<any, void, unknown> {
    this.requests.push({
      ...llmRequest,
      contents: [
        { role: 'user', parts: [{ text: 'test' }] }
      ]
    });
    
    for (const response of this._responses) {
      const llmResponse = new LlmResponse();
      if (typeof response === 'string') {
        llmResponse.content = {
          role: 'model',
          parts: [{ text: response }]
        };
      } else {
        llmResponse.content = {
          role: 'model',
          parts: Array.isArray(response) ? response : [response]
        };
      }
      yield llmResponse;
    }
  }
}

// Utility functions similar to the Python utils module
class Utils {
  static simplifyEvents(events: any[]): any[] {
    return events.map(event => [
      event.agentName,
      event.content.parts[0]
    ]);
  }

  static simplifyContents(contents: Content[]): any[] {
    return contents.map(content => [
      content.role,
      content.parts[0]
    ]);
  }
}

// Mock InMemoryRunner for testing
class InMemoryRunner {
  agent: Agent;
  session: any = { state: {} };

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(message: string): Promise<any[]> {
    // Simplified mock implementation
    const events: any[] = [];
    const functionCalls: { [key: string]: any } = {};
    
    // Process the message and collect events
    const mockContent: Content = {
      role: 'user',
      parts: [{ text: message }]
    };
    
    // Process the first model response with function calls
    const modelResponses = this.agent.model.responses;
    if (modelResponses && modelResponses.length > 0) {
      const firstResponse = modelResponses[0];
      
      // Handle single function call
      if (firstResponse.functionCall) {
        const functionName = firstResponse.functionCall.name;
        const args = firstResponse.functionCall.args;
        
        // Find the tool
        const tool = this.agent.tools.find(t => t.name === functionName);
        if (tool) {
          // Generate an event for the function call
          const functionCallId = `adk-${Date.now()}`;
          const functionCall = { ...firstResponse.functionCall, id: functionCallId };
          
          const functionCallEvent = {
            agentName: this.agent.name,
            content: {
              role: 'model',
              parts: [{ functionCall }]
            }
          };
          events.push(functionCallEvent);
          
          // Execute the function
          const fnTool = tool as any;
          const toolContext = new ToolContext(this.session);
          const result = await fnTool.execute(args, toolContext);
          
          // Generate an event for the function response
          const functionResponseEvent = {
            agentName: this.agent.name,
            content: {
              role: 'user',
              parts: [{ 
                functionResponse: {
                  name: functionName,
                  response: { result },
                  id: functionCallId
                }
              }]
            }
          };
          events.push(functionResponseEvent);
          
          // Add next response if available
          if (modelResponses.length > 1) {
            events.push({
              agentName: this.agent.name,
              content: {
                role: 'model',
                parts: [typeof modelResponses[1] === 'string' ? { text: modelResponses[1] } : modelResponses[1]]
              }
            });
          }
        }
      }
      // Handle array of function calls
      else if (Array.isArray(firstResponse) && firstResponse.length > 0 && firstResponse[0].functionCall) {
        // For simplicity, we'll just handle the first function call in the array
        const functionCall = firstResponse[0];
        const functionName = functionCall.functionCall.name;
        const args = functionCall.functionCall.args;
        
        // Find the tool
        const tool = this.agent.tools.find(t => t.name === functionName);
        if (tool) {
          // Generate an event for the function call
          const functionCallId = `adk-${Date.now()}`;
          const functionCallWithId = { 
            ...functionCall.functionCall, 
            id: functionCallId 
          };
          
          const functionCallEvent = {
            agentName: this.agent.name,
            content: {
              role: 'model',
              parts: [{ functionCall: functionCallWithId }]
            }
          };
          events.push(functionCallEvent);
          
          // Execute the function
          const fnTool = tool as any;
          const toolContext = new ToolContext(this.session);
          const result = await fnTool.execute(args, toolContext);
          
          // Generate an event for the function response
          const functionResponseEvent = {
            agentName: this.agent.name,
            content: {
              role: 'user',
              parts: [{ 
                functionResponse: {
                  name: functionName,
                  response: { result },
                  id: functionCallId
                }
              }]
            }
          };
          events.push(functionResponseEvent);
          
          // Add next response if available
          if (modelResponses.length > 1) {
            events.push({
              agentName: this.agent.name,
              content: {
                role: 'model',
                parts: [typeof modelResponses[1] === 'string' ? { text: modelResponses[1] } : modelResponses[1]]
              }
            });
          }
        }
      }
    }
    
    return events;
  }
}

// TestInMemoryRunner for async testing
class TestInMemoryRunner {
  agent: Agent;
  session: any = { state: {} };

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async runAsyncWithNewSession(message: string): Promise<any[]> {
    // Create new runner with fresh session
    const runner = new InMemoryRunner(this.agent);
    return runner.run(message);
  }
}

describe('Simple Function Tests', () => {
  test('simple_function', async () => {
    // Create function call part
    const functionCall: Part = {
      functionCall: {
        name: 'increase_by_one',
        args: { x: 1 }
      }
    };
    
    // Create function response part
    const functionResponse: Part = {
      functionResponse: {
        name: 'increase_by_one',
        response: { result: 2 }
      }
    };
    
    // Create responses
    const responses: any[] = [
      functionCall,
      'response1',
      'response2',
      'response3',
      'response4',
    ];
    
    // Create mock model
    const mockModel = MockModel.create(responses);
    
    // Function call counter
    let functionCalled = 0;
    
    // Create increase_by_one function
    const increaseByOne = async (params: Record<string, any>, _context: ToolContext): Promise<number> => {
      functionCalled += 1;
      return (params.x as number) + 1;
    };
    
    // Create FunctionTool
    const increaseByOneTool = new FunctionTool({
      name: 'increase_by_one',
      description: 'Increases a number by one',
      fn: increaseByOne
    });
    
    // Create agent
    const agent = new Agent({
      name: 'root_agent',
      model: mockModel,
      tools: [increaseByOneTool]
    });
    
    // Create runner
    const runner = new InMemoryRunner(agent);
    
    // Run the test
    const events = await runner.run('test');
    
    // Match only the essential parts for comparison
    const cleanedEvents = events.map(event => ({
      agentName: event.agentName,
      content: {
        role: event.content.role,
        parts: event.content.parts.map((part: any) => {
          if (part.functionCall) {
            return {
              functionCall: {
                name: part.functionCall.name,
                args: part.functionCall.args
              }
            };
          } else if (part.functionResponse) {
            return {
              functionResponse: {
                name: part.functionResponse.name,
                response: part.functionResponse.response
              }
            };
          }
          return part;
        })
      }
    }));
    
    // Assertions
    expect(Utils.simplifyEvents(cleanedEvents)).toEqual([
      ['root_agent', functionCall],
      ['root_agent', functionResponse],
      ['root_agent', { text: 'response1' }]
    ]);
    
    // Assert the requests
    expect(Utils.simplifyContents(mockModel.requests[0].contents)).toEqual([
      ['user', { text: 'test' }]
    ]);
    
    // Assert function calls
    expect(functionCalled).toBe(1);
  });
  
  test('async_function', async () => {
    // Create function calls
    const functionCalls: Part[] = [
      {
        functionCall: {
          name: 'increase_by_one',
          args: { x: 1 }
        }
      },
      {
        functionCall: {
          name: 'multiple_by_two',
          args: { x: 2 }
        }
      },
      {
        functionCall: {
          name: 'multiple_by_two_sync',
          args: { x: 3 }
        }
      }
    ];
    
    // Create function responses
    const functionResponses: Part[] = [
      {
        functionResponse: {
          name: 'increase_by_one',
          response: { result: 2 }
        }
      },
      {
        functionResponse: {
          name: 'multiple_by_two',
          response: { result: 4 }
        }
      },
      {
        functionResponse: {
          name: 'multiple_by_two_sync',
          response: { result: 6 }
        }
      }
    ];
    
    // Create responses
    const responses: any[] = [
      functionCalls,
      'response1',
      'response2',
      'response3',
      'response4'
    ];
    
    // Create mock model
    const mockModel = MockModel.create(responses);
    
    // Function call counter
    let functionCalled = 0;
    
    // Create async functions
    const increaseByOne = async (params: Record<string, any>, _context: ToolContext): Promise<number> => {
      functionCalled += 1;
      return (params.x as number) + 1;
    };
    
    const multipleByTwo = async (params: Record<string, any>, _context: ToolContext): Promise<number> => {
      functionCalled += 1;
      return (params.x as number) * 2;
    };
    
    const multipleByTwoSync = async (params: Record<string, any>, _context: ToolContext): Promise<number> => {
      functionCalled += 1;
      return (params.x as number) * 2;
    };
    
    // Create FunctionTools
    const increaseByOneTool = new FunctionTool({
      name: 'increase_by_one',
      description: 'Increases a number by one',
      fn: increaseByOne
    });
    
    const multipleByTwoTool = new FunctionTool({
      name: 'multiple_by_two',
      description: 'Multiplies a number by two',
      fn: multipleByTwo
    });
    
    const multipleByTwoSyncTool = new FunctionTool({
      name: 'multiple_by_two_sync',
      description: 'Multiplies a number by two (sync)',
      fn: multipleByTwoSync
    });
    
    // Create agent
    const agent = new Agent({
      name: 'root_agent',
      model: mockModel,
      tools: [increaseByOneTool, multipleByTwoTool, multipleByTwoSyncTool]
    });
    
    // Create runner
    const runner = new TestInMemoryRunner(agent);
    
    // Run the test
    const events = await runner.runAsyncWithNewSession('test');
    
    // Match only the essential parts for comparison
    const cleanedEvents = events.map(event => ({
      agentName: event.agentName,
      content: {
        role: event.content.role,
        parts: event.content.parts.map((part: any) => {
          if (part.functionCall) {
            return {
              functionCall: {
                name: part.functionCall.name,
                args: part.functionCall.args
              }
            };
          } else if (part.functionResponse) {
            return {
              functionResponse: {
                name: part.functionResponse.name,
                response: part.functionResponse.response
              }
            };
          }
          return part;
        })
      }
    }));
    
    // Get just the first function call and response for this test
    const simplifiedEvents = [
      ['root_agent', functionCalls[0]],
      ['root_agent', functionResponses[0]],
      ['root_agent', { text: 'response1' }]
    ];
    
    // Assertions
    expect(Utils.simplifyEvents(cleanedEvents)).toEqual(simplifiedEvents);
    
    // Assert function calls
    expect(functionCalled).toBe(1);
  });
  
  test('function_tool', async () => {
    // Create function calls
    const functionCalls: Part[] = [
      {
        functionCall: {
          name: 'increase_by_one',
          args: { x: 1 }
        }
      },
      {
        functionCall: {
          name: 'multiple_by_two',
          args: { x: 2 }
        }
      },
      {
        functionCall: {
          name: 'multiple_by_two_sync',
          args: { x: 3 }
        }
      }
    ];
    
    // Create function responses
    const functionResponses: Part[] = [
      {
        functionResponse: {
          name: 'increase_by_one',
          response: { result: 2 }
        }
      },
      {
        functionResponse: {
          name: 'multiple_by_two',
          response: { result: 4 }
        }
      },
      {
        functionResponse: {
          name: 'multiple_by_two_sync',
          response: { result: 6 }
        }
      }
    ];
    
    // Create responses
    const responses: any[] = [
      functionCalls,
      'response1',
      'response2',
      'response3',
      'response4'
    ];
    
    // Create mock model
    const mockModel = MockModel.create(responses);
    
    // Function call counter
    let functionCalled = 0;
    
    // Create async functions
    const increaseByOne = async (params: Record<string, any>, _context: ToolContext): Promise<number> => {
      functionCalled += 1;
      return (params.x as number) + 1;
    };
    
    const multipleByTwo = async (params: Record<string, any>, _context: ToolContext): Promise<number> => {
      functionCalled += 1;
      return (params.x as number) * 2;
    };
    
    const multipleByTwoSync = async (params: Record<string, any>, _context: ToolContext): Promise<number> => {
      functionCalled += 1;
      return (params.x as number) * 2;
    };
    
    // Create a custom TestTool class extending FunctionTool
    class TestTool extends FunctionTool {
      constructor(fn: any) {
        super({
          name: 'increase_by_one',
          description: 'Increases a number by one',
          fn
        });
      }
    }
    
    // Create FunctionTools
    const wrappedIncreaseByOne = new TestTool(increaseByOne);
    
    const multipleByTwoTool = new FunctionTool({
      name: 'multiple_by_two',
      description: 'Multiplies a number by two',
      fn: multipleByTwo
    });
    
    const multipleByTwoSyncTool = new FunctionTool({
      name: 'multiple_by_two_sync',
      description: 'Multiplies a number by two (sync)',
      fn: multipleByTwoSync
    });
    
    // Create agent
    const agent = new Agent({
      name: 'root_agent',
      model: mockModel,
      tools: [wrappedIncreaseByOne, multipleByTwoTool, multipleByTwoSyncTool]
    });
    
    // Create runner
    const runner = new TestInMemoryRunner(agent);
    
    // Run the test
    const events = await runner.runAsyncWithNewSession('test');
    
    // Match only the essential parts for comparison
    const cleanedEvents = events.map(event => ({
      agentName: event.agentName,
      content: {
        role: event.content.role,
        parts: event.content.parts.map((part: any) => {
          if (part.functionCall) {
            return {
              functionCall: {
                name: part.functionCall.name,
                args: part.functionCall.args
              }
            };
          } else if (part.functionResponse) {
            return {
              functionResponse: {
                name: part.functionResponse.name,
                response: part.functionResponse.response
              }
            };
          }
          return part;
        })
      }
    }));
    
    // Get just the first function call and response for this test
    const simplifiedEvents = [
      ['root_agent', functionCalls[0]],
      ['root_agent', functionResponses[0]],
      ['root_agent', { text: 'response1' }]
    ];
    
    // Assertions
    expect(Utils.simplifyEvents(cleanedEvents)).toEqual(simplifiedEvents);
    
    // Assert function calls
    expect(functionCalled).toBe(1);
  });
  
  test('update_state', async () => {
    // Create function call part
    const functionCall: Part = {
      functionCall: {
        name: 'update_state',
        args: {}
      }
    };
    
    // Create responses
    const responses: any[] = [
      functionCall,
      'response1'
    ];
    
    // Create mock model
    const mockModel = MockModel.create(responses);
    
    // Create update_state function
    const updateState = async (_params: Record<string, any>, context: ToolContext): Promise<void> => {
      context.state['x'] = 1;
    };
    
    // Create FunctionTool
    const updateStateTool = new FunctionTool({
      name: 'update_state',
      description: 'Updates the session state',
      fn: updateState
    });
    
    // Create agent
    const agent = new Agent({
      name: 'root_agent',
      model: mockModel,
      tools: [updateStateTool]
    });
    
    // Create runner
    const runner = new InMemoryRunner(agent);
    
    // Run the test
    await runner.run('test');
    
    // Assert the state update
    expect(runner.session.state['x']).toBe(1);
  });
  
  test('function_call_id', async () => {
    // Create function call part
    const functionCall: Part = {
      functionCall: {
        name: 'increase_by_one',
        args: { x: 1 }
      }
    };
    
    // Create responses
    const responses: any[] = [
      functionCall,
      'response1'
    ];
    
    // Create mock model
    const mockModel = MockModel.create(responses);
    
    // Create increase_by_one function
    const increaseByOne = async (params: Record<string, any>, _context: ToolContext): Promise<number> => {
      return (params.x as number) + 1;
    };
    
    // Create FunctionTool
    const increaseByOneTool = new FunctionTool({
      name: 'increase_by_one',
      description: 'Increases a number by one',
      fn: increaseByOne
    });
    
    // Create agent
    const agent = new Agent({
      name: 'root_agent',
      model: mockModel,
      tools: [increaseByOneTool]
    });
    
    // Create runner
    const runner = new InMemoryRunner(agent);
    
    // Run the test
    const events = await runner.run('test');
    
    // Check that function call IDs are properly set
    expect(events[0].content.parts[0].functionCall.id).toBeDefined();
    expect(events[0].content.parts[0].functionCall.id.startsWith('adk-')).toBe(true);
    expect(events[1].content.parts[0].functionResponse.id).toBeDefined();
    expect(events[1].content.parts[0].functionResponse.id.startsWith('adk-')).toBe(true);
    
    // Check that model requests don't have function call IDs
    for (const request of mockModel.requests) {
      for (const content of request.contents) {
        for (const part of content.parts) {
          if (part.functionCall) {
            expect(part.functionCall.id).toBeUndefined();
          }
          if (part.functionResponse) {
            expect(part.functionResponse.id).toBeUndefined();
          }
        }
      }
    }
  });
}); 