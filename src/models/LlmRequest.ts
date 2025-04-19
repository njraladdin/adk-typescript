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

import { Content, GenerateContentConfig, LiveConnectConfig, Tool } from './types';

// Placeholder for a BaseTool interface - you'll need to implement this
// based on your tools module
export interface BaseTool {
  name: string;
  _getDeclaration(): any;
  getDeclaration(): any;
}

/**
 * LLM request class that allows passing in tools, output schema and system
 * instructions to the model.
 */
export class LlmRequest {
  /**
   * The model name.
   */
  model?: string = undefined;

  /**
   * The contents to send to the model.
   */
  contents: Content[] = [];

  /**
   * Additional config for the generate content request.
   * Tools in generate_content_config should not be set.
   */
  config: GenerateContentConfig;
  
  /**
   * Configuration for live connections
   */
  liveConnectConfig: LiveConnectConfig;

  /**
   * The tools dictionary.
   * @private Not serialized when converting to JSON
   */
  private toolsDict: Record<string, BaseTool> = {};

  constructor() {
    this.config = {
      tools: []
    };
    this.liveConnectConfig = {};
  }

  /**
   * Appends instructions to the system instruction.
   * @param instructions The instructions to append.
   */
  appendInstructions(instructions: string[]): void {
    if (this.config.systemInstruction) {
      this.config.systemInstruction += '\n\n' + instructions.join('\n\n');
    } else {
      this.config.systemInstruction = instructions.join('\n\n');
    }
  }

  /**
   * Appends tools to the request.
   * @param tools The tools to append.
   */
  appendTools(tools: BaseTool[]): void {
    if (!tools || tools.length === 0) {
      return;
    }

    const declarations: any[] = [];
    for (const tool of tools) {
      let declaration;
      // Check if the tool has _getDeclaration method
      if (typeof tool._getDeclaration === 'function') {
        declaration = tool._getDeclaration();
      } 
      // Check if the tool has getDeclaration method 
      else if (typeof (tool as any).getDeclaration === 'function') {
        declaration = (tool as any).getDeclaration();
      }
      
      if (declaration) {
        declarations.push(declaration);
        this.toolsDict[tool.name] = tool;
      }
    }

    if (declarations.length > 0) {
      this.config.tools.push({
        function_declarations: declarations
      });
    }
  }

  /**
   * Sets the output schema for the request.
   * @param baseModel The class to set the output schema to.
   */
  setOutputSchema(baseModel: any): void {
    this.config.responseSchema = baseModel;
    this.config.responseMimeType = 'application/json';
  }
} 