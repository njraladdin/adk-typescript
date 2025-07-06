import { LlmResponse } from '../models/LlmResponse';
import { EventActions } from './EventActions';
import { FunctionCall, FunctionResponse } from '../models/types';

/**
 * Represents an event in a conversation between agents and users.
 *
 * It is used to store the content of the conversation, as well as the actions
 * taken by the agents like function calls, etc.
 */
export class Event extends LlmResponse {
  /**
   * The invocation ID of the event.
   */
  invocationId: string = '';

  /**
   * 'user' or the name of the agent, indicating who appended the event to the session.
   */
  author: string;

  /**
   * The actions taken by the agent.
   */
  actions: EventActions;

  /**
   * Set of ids of the long running function calls.
   * Agent client will know from this field about which function call is long running.
   * only valid for function call event
   */
  longRunningToolIds?: Set<string>;

  /**
   * The branch of the event.
   *
   * The format is like agent_1.agent_2.agent_3, where agent_1 is the parent of
   * agent_2, and agent_2 is the parent of agent_3.
   *
   * Branch is used when multiple sub-agent shouldn't see their peer agents'
   * conversation history.
   */
  branch?: string;

  /**
   * The unique identifier of the event.
   */
  id: string = '';

  /**
   * The timestamp of the event.
   */
  timestamp: number;

  /**
   * Constructor for Event class
   */
  constructor(params: {
    invocationId?: string;
    author: string;
    actions?: EventActions;
    longRunningToolIds?: Set<string>;
    branch?: string;
    id?: string;
    timestamp?: number;
    content?: any;
    partial?: boolean;
    turnComplete?: boolean;
    errorCode?: string;
    errorMessage?: string;
    interrupted?: boolean;
    customMetadata?: Record<string, any>;
  }) {
    super();
    this.invocationId = params.invocationId || '';
    this.author = params.author;
    this.actions = params.actions || new EventActions();
    this.longRunningToolIds = params.longRunningToolIds;
    this.branch = params.branch;
    this.id = params.id || Event.newId();
    this.timestamp = params.timestamp || Date.now() / 1000;
    this.content = params.content;
    this.partial = params.partial;
    this.turnComplete = params.turnComplete;
    this.errorCode = params.errorCode;
    this.errorMessage = params.errorMessage;
    this.interrupted = params.interrupted;
    this.customMetadata = params.customMetadata;
  }

  /**
   * Returns whether the event is the final response of the agent.
   */
  isFinalResponse(): boolean {
    const skipSummarization = this.actions.skipSummarization;
    const hasLongRunningToolIds = this.longRunningToolIds && this.longRunningToolIds.size > 0;
    const functionCallsLength = this.getFunctionCalls().length;
    const functionResponsesLength = this.getFunctionResponses().length;
    const isPartial = this.partial;
    const hasTrailingCodeExecution = this.hasTrailingCodeExecutionResult();
    
    console.log(`[Event.isFinalResponse] Event ${this.id}:`);
    console.log(`  skipSummarization: ${skipSummarization}`);
    console.log(`  hasLongRunningToolIds: ${hasLongRunningToolIds}`);
    console.log(`  functionCallsLength: ${functionCallsLength}`);
    console.log(`  functionResponsesLength: ${functionResponsesLength}`);
    console.log(`  isPartial: ${isPartial}`);
    console.log(`  hasTrailingCodeExecution: ${hasTrailingCodeExecution}`);
    
    if (skipSummarization || hasLongRunningToolIds) {
      console.log(`  -> returning true (skipSummarization or longRunningToolIds)`);
      return true;
    }
    
    const result = (
      functionCallsLength === 0 &&
      functionResponsesLength === 0 &&
      !isPartial &&
      !hasTrailingCodeExecution
    );
    
    console.log(`  -> returning ${result}`);
    return result;
  }

  /**
   * Returns the function calls in the event.
   */
  getFunctionCalls(): FunctionCall[] {
    const funcCalls: FunctionCall[] = [];
    if (this.content && this.content.parts) {
      for (const part of this.content.parts) {
        if (part.functionCall) {
          funcCalls.push(part.functionCall);
        }
      }
    }
    return funcCalls;
  }

  /**
   * Returns the function responses in the event.
   */
  getFunctionResponses(): FunctionResponse[] {
    const funcResponses: FunctionResponse[] = [];
    if (this.content && this.content.parts) {
      for (const part of this.content.parts) {
        if (part.functionResponse) {
          funcResponses.push(part.functionResponse);
        }
      }
    }
    return funcResponses;
  }

  /**
   * Returns whether the event has a trailing code execution result.
   */
  hasTrailingCodeExecutionResult(): boolean {
    if (this.content && this.content.parts && this.content.parts.length > 0) {
      const lastPart = this.content.parts[this.content.parts.length - 1];
      return lastPart.codeExecutionResult !== undefined && 
             lastPart.codeExecutionResult !== null;
    }
    return false;
  }

  /**
   * Generate a new random ID for an event.
   */
  static newId(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
} 