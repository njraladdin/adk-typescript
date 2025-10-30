import { Content, GenerateContentConfig, LiveConnectConfig, Tool, FunctionDeclaration } from './types';
import { BaseTool } from '../tools/BaseTool';

/**
 * Converts a TypeScript class to a JSON Schema object
 * @param classConstructor The class constructor to convert
 * @returns A JSON Schema object
 */
function convertClassToJsonSchema(classConstructor: any): any {
  console.log('convertClassToJsonSchema called with:', typeof classConstructor, classConstructor?.name);
  
  // For TypeScript classes, we need to extract the schema from the constructor
  if (typeof classConstructor === 'function') {
    // Try to create an instance to inspect properties
    try {
      // Get property names from the constructor or prototype
      const propertyNames: string[] = [];
      const properties: Record<string, any> = {};
      
      // If the class has a static schema property, use it
      if (classConstructor.schema) {
        console.log('Using static schema property:', classConstructor.schema);
        return classConstructor.schema;
      }
      
      // Try to inspect the constructor parameters
      const constructorStr = classConstructor.toString();
      console.log('Constructor string:', constructorStr.substring(0, 200) + '...');
      const paramMatch = constructorStr.match(/constructor\s*\(\s*([^)]*)\s*\)/);
      
      if (paramMatch && paramMatch[1]) {
        // Look for destructured parameter object pattern
        const paramStr = paramMatch[1].trim();
        console.log('Constructor param string:', paramStr);
        const destructureMatch = paramStr.match(/\{\s*([^}]+)\s*\}/);
        
        if (destructureMatch) {
          // Extract property names from destructured parameter
          const propsStr = destructureMatch[1];
          console.log('Destructured props string:', propsStr);
          const propNames = propsStr.split(',').map((p: string) => p.trim().split(':')[0].trim());
          console.log('Extracted property names:', propNames);
          
          // Create schema properties (assuming all are strings for simplicity)
          for (const propName of propNames) {
            if (propName) {
              properties[propName] = { type: 'string' };
              propertyNames.push(propName);
            }
          }
        }
      }
      
      // Fallback: try to create an instance and inspect it
      if (Object.keys(properties).length === 0) {
        console.log('Fallback: trying to create instance...');
        try {
          // Try with empty object
          const instance = new classConstructor({});
          console.log('Instance created:', instance);
          for (const key of Object.keys(instance)) {
            properties[key] = { type: 'string' };
            propertyNames.push(key);
          }
        } catch (e) {
          // If that fails, try with constructor reflection
          console.warn('Could not auto-generate schema for class. Please provide an explicit schema object.');
        }
      }
      
      const schema = {
        type: 'object',
        properties: properties,
        required: propertyNames
      };
      
      console.log('Generated schema:', JSON.stringify(schema, null, 2));
      return schema;
    } catch (error) {
      console.warn('Failed to convert class to schema:', error);
      return { type: 'object' };
    }
  } else if (typeof classConstructor === 'object' && classConstructor !== null) {
    // Already a schema object, return as-is
    console.log('Using provided schema object:', classConstructor);
    return classConstructor;
  }
  
  console.log('Returning default schema');
  return { type: 'object' };
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
      // Ensure tools array exists
      if (!this.config.tools) {
        this.config.tools = [];
      }

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
   * @param baseModel The schema class or JSON schema object to set the output schema to.
   */
  setOutputSchema(baseModel: any): void {
    console.log('setOutputSchema called with:', baseModel);
    const schema = convertClassToJsonSchema(baseModel);
    console.log('Setting responseSchema to:', JSON.stringify(schema, null, 2));
    this.config.responseSchema = schema;
    this.config.responseMimeType = 'application/json';
    console.log('Final config.responseSchema:', this.config.responseSchema);
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

    // Ensure tools array exists
    if (!this.config.tools) {
      this.config.tools = [];
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
        console.log('Adding responseSchema to request:', this.config.responseSchema);
        result.generationConfig.responseSchema = this.config.responseSchema;
        result.generationConfig.responseMimeType = this.config.responseMimeType || 'application/json';
        console.log('Final generationConfig with schema:', result.generationConfig);
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