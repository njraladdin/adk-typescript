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

/**
 * Represents an active streaming tool that is running.
 */
export class ActiveStreamingTool {
  /** Function name */
  name: string;
  
  /** Function arguments */
  args: Record<string, any>;
  
  /** Function ID */
  id: string;
  
  /** Whether the function has completed */
  isCompleted: boolean = false;
  
  /** The result of the function, if completed */
  result?: any;

  /**
   * Creates a new instance of ActiveStreamingTool.
   * 
   * @param name Function name
   * @param args Function arguments
   * @param id Function ID
   */
  constructor(name: string, args: Record<string, any>, id: string) {
    this.name = name;
    this.args = args;
    this.id = id;
  }
  
  /**
   * Marks the streaming tool as completed.
   * 
   * @param result The result of the function.
   */
  complete(result: any): void {
    this.isCompleted = true;
    this.result = result;
  }
} 