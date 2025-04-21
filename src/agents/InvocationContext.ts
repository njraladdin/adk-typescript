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

import { v4 as uuidv4 } from 'uuid';
import { Content } from '../models/types';
// Importing from index instead of direct files to avoid circular dependencies
import type { BaseAgent, RunConfig } from './index';
import { LiveRequestQueue } from './LiveRequestQueue';
import { ActiveStreamingTool } from './ActiveStreamingTool';
import { TranscriptionEntry } from './TranscriptionEntry';
import { Session } from '../sessions/Session';
import { BaseArtifactService } from '../artifacts/BaseArtifactService';
import { BaseMemoryService } from '../memory/BaseMemoryService';
import { BaseSessionService } from '../sessions/baseSessionService';
import { BaseLlm } from '../models/BaseLlm';
import { ToolContext } from '../tools/tool_context';

/**
 * Error thrown when the number of LLM calls exceed the limit.
 */
export class LlmCallsLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmCallsLimitExceededError';
  }
}

/**
 * A container to keep track of the cost of invocation.
 */
class InvocationCostManager {
  private numberOfLlmCalls: number = 0;

  /**
   * Increments number of LLM calls made and enforces the limit.
   */
  incrementAndEnforceLlmCallsLimit(runConfig?: RunConfig): void {
    this.numberOfLlmCalls += 1;

    if (
      runConfig &&
      runConfig.maxLlmCalls !== undefined &&
      runConfig.maxLlmCalls > 0 &&
      this.numberOfLlmCalls > runConfig.maxLlmCalls
    ) {
      throw new LlmCallsLimitExceededError(
        `Max number of llm calls limit of ${runConfig.maxLlmCalls} exceeded`
      );
    }
  }
}

/**
 * Options for creating an invocation context.
 */
export interface InvocationContextOptions {
  /** The invocation ID */
  invocationId?: string;
  
  /** The session */
  session?: Session;
  
  /** The agent being invoked */
  agent?: BaseAgent;
  
  /** The user content */
  userContent?: Content;
  
  /** Whether this is a live invocation */
  live?: boolean;
  
  /** The LLM model to use */
  llm?: BaseLlm;
  
  /** The live request queue for real-time interactions */
  liveRequestQueue?: LiveRequestQueue;
  
  /** Additional context-specific options */
  [key: string]: any;
}

/**
 * An invocation context represents the data of a single invocation of an agent.
 */
export class InvocationContext {
  /** The artifact service */
  artifactService?: BaseArtifactService;
  
  /** The session service */
  sessionService: BaseSessionService;
  
  /** The memory service */
  memoryService?: BaseMemoryService;

  /** The id of this invocation context. Readonly. */
  invocationId: string;
  
  /**
   * The branch of the invocation context.
   * 
   * The format is like agent_1.agent_2.agent_3, where agent_1 is the parent of
   * agent_2, and agent_2 is the parent of agent_3.
   * 
   * Branch is used when multiple sub-agents shouldn't see their peer agents'
   * conversation history.
   */
  branch?: string;
  
  /** The current agent of this invocation context. Readonly. */
  agent: BaseAgent;
  
  /** The user content that started this invocation. Readonly. */
  userContent?: Content;
  
  /** The current session of this invocation context. Readonly. */
  session: Session;

  /**
   * Whether to end this invocation.
   * 
   * Set to True in callbacks or tools to terminate this invocation.
   */
  endInvocation: boolean = false;

  /** The queue to receive live requests. */
  liveRequestQueue?: LiveRequestQueue;

  /** The running streaming tools of this invocation. */
  activeStreamingTools?: Map<string, ActiveStreamingTool>;

  /** Caches necessary data, audio or contents, that are needed by transcription. */
  transcriptionCache?: TranscriptionEntry[];

  /** Configurations for live agents under this invocation. */
  runConfig?: RunConfig;

  /** The LLM model to use */
  llm?: BaseLlm;

  /** Tools available in this context */
  tools?: ToolContext;

  /** Whether this is a live invocation */
  live: boolean = false;

  private invocationCostManager: InvocationCostManager = new InvocationCostManager();

  /**
   * Creates a new invocation context.
   * 
   * @param options Options for the context
   */
  constructor(options: InvocationContextOptions = {}) {
    this.artifactService = options.artifactService;
    this.sessionService = options.sessionService;
    this.memoryService = options.memoryService;
    this.invocationId = options.invocationId || uuidv4();
    this.branch = options.branch;
    this.agent = options.agent!;
    this.userContent = options.userContent;
    this.session = options.session || new Session();
    this.endInvocation = options.endInvocation || false;
    this.liveRequestQueue = options.liveRequestQueue;
    this.activeStreamingTools = options.activeStreamingTools;
    this.transcriptionCache = options.transcriptionCache;
    this.runConfig = options.runConfig;
    this.llm = options.llm;
    this.live = options.live || false;
    
    // Copy any additional properties
    for (const [key, value] of Object.entries(options)) {
      if (!this.hasOwnProperty(key)) {
        (this as any)[key] = value;
      }
    }
  }

  /**
   * Tracks number of llm calls made.
   * 
   * @throws LlmCallsLimitExceededError If number of llm calls made exceed the set threshold.
   */
  incrementLlmCallCount(): void {
    this.invocationCostManager.incrementAndEnforceLlmCallsLimit(this.runConfig);
  }

  /** The app name from the session */
  get appName(): string {
    return this.session.appName;
  }

  /** The user ID from the session */
  get userId(): string {
    return this.session.userId;
  }
}

/**
 * Generates a UUID.
 * 
 * @returns A UUID string
 */
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
} 