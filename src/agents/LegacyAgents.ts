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

import { BaseAgent } from './BaseAgent';

/**
 * ReasoningAgent - An agent that can reason step by step
 * @deprecated Use the new agent architecture instead
 */
export class ReasoningAgent implements Omit<BaseAgent, 'runAsyncImpl' | 'runLiveImpl' | 'name'> {
  readonly name: string = 'reasoning_agent';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  /**
   * Run the agent with a specific task
   * @param task The task description or query
   * @returns Result of the agent's execution
   */
  async run(task: string): Promise<any> {
    // Legacy implementation
    return { status: 'reasoning agent pending implementation', task };
  }

  /**
   * For compatibility with BaseAgent interface
   */
  async* runAsync(): AsyncGenerator<any, void, unknown> {
    yield { status: 'reasoning agent pending implementation' };
  }

  /**
   * For compatibility with BaseAgent interface
   */
  async* runLive(): AsyncGenerator<any, void, unknown> {
    yield { status: 'reasoning agent pending implementation' };
  }
}

/**
 * PlanningAgent - An agent that can create and execute plans
 * @deprecated Use the new agent architecture instead
 */
export class PlanningAgent implements Omit<BaseAgent, 'runAsyncImpl' | 'runLiveImpl' | 'name'> {
  readonly name: string = 'planning_agent';
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  /**
   * Run the agent with a specific task
   * @param task The task description or query
   * @returns Result of the agent's execution
   */
  async run(task: string): Promise<any> {
    // Legacy implementation
    return { status: 'planning agent pending implementation', task };
  }

  /**
   * For compatibility with BaseAgent interface
   */
  async* runAsync(): AsyncGenerator<any, void, unknown> {
    yield { status: 'planning agent pending implementation' };
  }

  /**
   * For compatibility with BaseAgent interface
   */
  async* runLive(): AsyncGenerator<any, void, unknown> {
    yield { status: 'planning agent pending implementation' };
  }
} 