 

import { Content, GenerateContentConfig, LiveConnectConfig, Tool, FunctionDeclaration } from './types';
import { BaseTool } from '../tools/BaseTool';

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
   * Maps tool names to tool instances.
   * @private Not serialized when converting to JSON
   */
  private toolsDict: Record<string, BaseTool> = {};

  /**
   * Creates a new LLM request.
   */
  constructor() {
    this.config = {
      temperature: undefined,
      topP: undefined,
      topK: undefined,
      maxOutputTokens: undefined,
      candidateCount: undefined,
      stopSequences: undefined,
      systemInstruction: undefined,
      tools: [],
      responseSchema: undefined,
      responseMimeType: undefined,
      thinkingConfig: undefined
    };
    this.liveConnectConfig = {};
  }

  /**
   * Appends instructions to the system instruction.
   * @param instructions The instructions to append.
   */
  appendInstructions(instructions: string[]): void {
    if (!instructions || instructions.length === 0) {
      return;
    }

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
      console.log('no tools to append');
      return;
    }

    const declarations: FunctionDeclaration[] = [];
    
    for (const tool of tools) {
      let declaration: FunctionDeclaration | null = null;
      
      // Use the public getDeclaration method which internally calls _getDeclaration
      if (typeof tool.getDeclaration === 'function') {
        declaration = tool.getDeclaration();
      }
      
      if (declaration) {
        // Store tool name to avoid duplicates
        this.toolsDict[tool.name] = tool;
        // Check if we already have this declaration to avoid duplicates
        const existingDeclaration = declarations.find(d => d.name === declaration?.name);
        if (!existingDeclaration) {
          declarations.push(declaration);
        }
      }
    }

    if (declarations.length > 0) {
      // Find an existing tool entry with functionDeclarations (camelCase format)
      let toolEntry = this.config.tools.find(t => 
        Array.isArray((t as any).functionDeclarations)
      );
      
      // Also check for snake_case format for backward compatibility
      if (!toolEntry) {
        toolEntry = this.config.tools.find(t => 
          Array.isArray(t.functionDeclarations)
        );
        
        // Convert to camelCase if found
        if (toolEntry && toolEntry.functionDeclarations) {
          (toolEntry as any).functionDeclarations = toolEntry.functionDeclarations;
          // Use type assertion to avoid TypeScript error
          (toolEntry as any).functionDeclarations = undefined;
        }
      }
      
      if (toolEntry) {
        // We need to use 'as any' since functionDeclarations isn't in the type
        const existingDeclarations = (toolEntry as any).functionDeclarations || [];
        
        // Add new declarations, avoiding duplicates
        for (const declaration of declarations) {
          // Check if a declaration with the same name already exists
          const existingIndex = existingDeclarations.findIndex(
            (existing: FunctionDeclaration) => existing.name === declaration.name
          );
          
          if (existingIndex === -1) {
            // Only add if it doesn't exist already
            existingDeclarations.push(declaration);
          }
        }
        
        // Update the declarations
        (toolEntry as any).functionDeclarations = existingDeclarations;
      } else {
        // Create a new tool entry with camelCase format
        this.config.tools.push({
          functionDeclarations: declarations
        } as any);
      }
    }
  }

  /**
   * Sets the output schema for the request.
   * @param baseModel The schema class to set the output schema to.
   */
  setOutputSchema(baseModel: any): void {
    this.config.responseSchema = baseModel;
    this.config.responseMimeType = 'application/json';
  }

  /**
   * Get the tools dictionary for this request.
   * @returns The tools dictionary
   */
  getToolsDict(): Record<string, BaseTool> {
    return { ...this.toolsDict };
  }

  /**
   * Adds a function declaration to the tools.
   * @param functionDef The function definition to add
   */
  addFunction(functionDef: FunctionDeclaration): void {
    if (!functionDef) {
      return;
    }
    
    // Find an existing tool entry with functionDeclarations (camelCase format)
    const toolEntry = this.config.tools.find(t => 
      Array.isArray((t as any).functionDeclarations)
    );
    
    if (toolEntry) {
      // We need to use 'as any' since functionDeclarations isn't in the type
      const existingDeclarations = (toolEntry as any).functionDeclarations || [];
      
      // Check if a declaration with the same name already exists
      const existingIndex = existingDeclarations.findIndex(
        (existing: FunctionDeclaration) => existing.name === functionDef.name
      );
      
      if (existingIndex === -1) {
        // Only add if it doesn't exist already
        existingDeclarations.push(functionDef);
      }
      
      // Update the declarations
      (toolEntry as any).functionDeclarations = existingDeclarations;
    } else {
      // Create a new tool entry with camelCase format
      this.config.tools.push({
        functionDeclarations: [functionDef]
      } as any);
    }
  }

  /**
   * Converts this LlmRequest to a plain object for API requests.
   * @returns A plain object representation of this request
   */
  toRequestObject(): any {
    const result: any = {
      contents: this.contents,
      model: this.model
    };

    // Add configuration if it exists
    if (this.config && Object.keys(this.config).length > 0) {
      result.generationConfig = {};
      
      // Copy over generation config properties
      if (this.config.temperature !== undefined) {
        result.generationConfig.temperature = this.config.temperature;
      }
      if (this.config.topP !== undefined) {
        result.generationConfig.topP = this.config.topP;
      }
      if (this.config.topK !== undefined) {
        result.generationConfig.topK = this.config.topK;
      }
      if (this.config.maxOutputTokens !== undefined) {
        result.generationConfig.maxOutputTokens = this.config.maxOutputTokens;
      }
      if (this.config.candidateCount !== undefined) {
        result.generationConfig.candidateCount = this.config.candidateCount;
      }
      if (this.config.stopSequences !== undefined) {
        result.generationConfig.stopSequences = this.config.stopSequences;
      }
      
      // Add system instructions if present
      if (this.config.systemInstruction) {
        result.systemInstruction = this.config.systemInstruction;
      }
      
      // Add tools if present
      if (this.config.tools && this.config.tools.length > 0) {
        result.tools = this.config.tools;
      }
      
      // Add response schema if present
      if (this.config.responseSchema) {
        result.generationConfig.responseSchema = this.config.responseSchema;
        result.generationConfig.responseMimeType = this.config.responseMimeType || 'application/json';
      }
      
      // Add thinking config if present
      if (this.config.thinkingConfig) {
        result.thinkingConfig = this.config.thinkingConfig;
      }
    }
    
    // Add live connect config if present
    if (this.liveConnectConfig && Object.keys(this.liveConnectConfig).length > 0) {
      result.liveConnectConfig = this.liveConnectConfig;
    }
    
    return result;
  }
} 