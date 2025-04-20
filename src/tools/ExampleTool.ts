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

import { BaseTool } from './BaseTool';
import { ToolContext } from './toolContext';

/**
 * Interface for an example
 */
export interface Example {
  /** The user input in the example */
  input: string;
  
  /** The expected output in the example */
  output: string;
}

/**
 * Interface for an example provider
 */
export interface BaseExampleProvider {
  /** Get examples based on a query */
  getExamples(query: string, model?: string): Example[];
}

/**
 * Utility to build example instructions
 * 
 * @param examples The examples to use
 * @param query The user query
 * @param model The model being used (optional)
 * @returns Formatted examples as a string
 */
export function buildExampleInstructions(
  examples: Example[] | BaseExampleProvider,
  query: string,
  model?: string
): string {
  // Get examples - either directly from the array or from the provider
  const examplesList = Array.isArray(examples) 
    ? examples 
    : examples.getExamples(query, model);
  
  if (examplesList.length === 0) {
    return '';
  }
  
  // Format the examples
  let exampleText = 'Here are some examples of how to respond to similar queries:\n\n';
  
  examplesList.forEach((example, index) => {
    exampleText += `Example ${index + 1}:\n`;
    exampleText += `User: ${example.input}\n`;
    exampleText += `Assistant: ${example.output}\n\n`;
  });
  
  exampleText += 'Now, respond to the actual query following these examples.\n';
  
  return exampleText;
}

/**
 * A tool that adds (few-shot) examples to the LLM request
 */
export class ExampleTool extends BaseTool {
  /**
   * The examples to add to the LLM request
   */
  private examples: Example[] | BaseExampleProvider;
  
  /**
   * Create a new example tool
   * 
   * @param examples The examples to use
   */
  constructor(examples: Example[] | BaseExampleProvider) {
    // Name and description are not used because this tool only changes llmRequest
    super({
      name: 'example_tool',
      description: 'A tool that adds examples to guide the model responses'
    });
    
    this.examples = examples;
  }
  
  /**
   * Process the LLM request to add examples
   * 
   * @param params The parameters for processing
   * @param params.toolContext The tool context
   * @param params.llmRequest The LLM request to process
   */
  async processLlmRequest({ 
    toolContext, 
    llmRequest 
  }: { 
    toolContext: ToolContext, 
    llmRequest: any 
  }): Promise<void> {
    // Get user content from context
    const userContent = toolContext.userContent || (toolContext as any).user_content;
    
    // Return if no user content or parts
    if (!userContent || !userContent.parts || !userContent.parts.length || !userContent.parts[0].text) {
      return;
    }
    
    // Build example instructions
    const exampleInstructions = buildExampleInstructions(
      this.examples,
      userContent.parts[0].text,
      llmRequest.model
    );
    
    // Add the example instructions to the LLM request
    if (exampleInstructions && llmRequest.appendInstructions) {
      llmRequest.appendInstructions([exampleInstructions]);
    }
  }
  
  /**
   * Execute the example tool - not meant to be called directly
   * 
   * @param params The parameters for execution
   * @param context The tool context
   * @returns A message indicating this tool is not meant to be called directly
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    return {
      error: 'ExampleTool is not meant to be executed directly. It works automatically during LLM request processing.'
    };
  }
}

/**
 * Creates a new example tool
 * 
 * @param examples The examples to use
 * @returns A new ExampleTool instance
 */
export function createExampleTool(examples: Example[] | BaseExampleProvider): ExampleTool {
  return new ExampleTool(examples);
} 