/**
 * A code executor that uses Vertex AI Code Interpreter Extension to execute code.
 */

import { InvocationContext } from "../agents/InvocationContext";
import { BaseCodeExecutor } from "./baseCodeExecutor";
import { CodeExecutionInput, CodeExecutionResult, File } from "./codeExecutionUtils";

// Interface for the Vertex AI Extension client
interface Extension {
  execute(options: {
    operationId: string;
    operationParams: Record<string, any>;
  }): Promise<any>;
  gcaResource?: {
    name: string;
  };
}

// Interface for the Vertex AI Extension factory
interface ExtensionFactory {
  fromHub(extensionId: string): Extension;
}

/**
 * Supported file types for outputs
 */
const SUPPORTED_IMAGE_TYPES = ['png', 'jpg', 'jpeg'];
const SUPPORTED_DATA_FILE_TYPES = ['csv'];

/**
 * Libraries imported by default in the code execution environment
 */
const IMPORTED_LIBRARIES = `
import io
import math
import re

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import scipy

def crop(s: str, max_chars: int = 64) -> str:
  """Crops a string to max_chars characters."""
  return s[: max_chars - 3] + '...' if len(s) > max_chars else s


def explore_df(df: pd.DataFrame) -> None:
  """Prints some information about a pandas DataFrame."""

  with pd.option_context(
      'display.max_columns', None, 'display.expand_frame_repr', False
  ):
    # Print the column names to never encounter KeyError when selecting one.
    df_dtypes = df.dtypes

    # Obtain information about data types and missing values.
    df_nulls = (len(df) - df.isnull().sum()).apply(
        lambda x: f'{x} / {df.shape[0]} non-null'
    )

    # Explore unique total values in columns using \`.unique()\`.
    df_unique_count = df.apply(lambda x: len(x.unique()))

    # Explore unique values in columns using \`.unique()\`.
    df_unique = df.apply(lambda x: crop(str(list(x.unique()))))

    df_info = pd.concat(
        (
            df_dtypes.rename('Dtype'),
            df_nulls.rename('Non-Null Count'),
            df_unique_count.rename('Unique Values Count'),
            df_unique.rename('Unique Values'),
        ),
        axis=1,
    )
    df_info.index.name = 'Columns'
    print(f"""Total rows: {df.shape[0]}
Total columns: {df.shape[1]}

{df_info}""")
`;

/**
 * Get or create a code interpreter extension
 * 
 * @param resourceName Optional resource name of an existing extension
 * @returns The code interpreter extension
 */
async function getCodeInterpreterExtension(
  resourceName?: string,
  extensionClient?: ExtensionFactory
): Promise<Extension> {
  if (!extensionClient) {
    throw new Error('No Vertex AI Extension client provided');
  }
  
  if (resourceName) {
    // In a real implementation, we would use the extensionClient to load an existing extension
    // For now, return a mock extension
    return {
      execute: async (options) => {
        throw new Error('No real extension client available');
      },
      gcaResource: {
        name: resourceName
      }
    };
  } else {
    console.log('No CODE_INTERPRETER_ID found in the environment. Create a new one.');
    const extension = extensionClient.fromHub('code_interpreter');
    if (process.env) {
      process.env.CODE_INTERPRETER_EXTENSION_NAME = extension.gcaResource?.name;
    }
    return extension;
  }
}

/**
 * Options for initializing a VertexAiCodeExecutor
 */
export interface VertexAiCodeExecutorOptions {
  /**
   * If set, load the existing resource name of the code interpreter extension
   * instead of creating a new one.
   * Format: projects/123/locations/us-central1/extensions/456
   */
  resourceName?: string;
  
  /**
   * The Vertex AI extension client to use
   */
  extensionClient?: ExtensionFactory;
  
  /**
   * Other BaseCodeExecutor options
   */
  stateful?: boolean;
  optimizeDataFile?: boolean;
  errorRetryAttempts?: number;
  codeBlockDelimiters?: [string, string][];
  executionResultDelimiters?: [string, string];
}

/**
 * A code executor that uses Vertex AI Code Interpreter Extension to execute code.
 */
export class VertexAiCodeExecutor extends BaseCodeExecutor {
  /**
   * If set, load the existing resource name of the code interpreter extension
   * instead of creating a new one.
   * Format: projects/123/locations/us-central1/extensions/456
   */
  resourceName?: string;
  
  /**
   * The Vertex AI extension client
   */
  private extensionClient?: ExtensionFactory;
  
  /**
   * The code interpreter extension
   */
  private codeInterpreterExtension?: Extension;
  
  /**
   * Initializes the VertexAiCodeExecutor.
   */
  constructor(options: VertexAiCodeExecutorOptions = {}) {
    super();
    
    this.resourceName = options.resourceName;
    this.extensionClient = options.extensionClient;
    
    // Initialize other BaseCodeExecutor properties
    if (options.stateful !== undefined) {
      this.stateful = options.stateful;
    }
    
    if (options.optimizeDataFile !== undefined) {
      this.optimizeDataFile = options.optimizeDataFile;
    }
    
    if (options.errorRetryAttempts !== undefined) {
      this.errorRetryAttempts = options.errorRetryAttempts;
    }
    
    if (options.codeBlockDelimiters !== undefined) {
      this.codeBlockDelimiters = options.codeBlockDelimiters;
    }
    
    if (options.executionResultDelimiters !== undefined) {
      this.executionResultDelimiters = options.executionResultDelimiters;
    }
  }
  
  /**
   * Initialize the code interpreter extension
   */
  private async initializeExtension(): Promise<void> {
    if (!this.codeInterpreterExtension) {
      this.codeInterpreterExtension = await getCodeInterpreterExtension(
        this.resourceName,
        this.extensionClient
      );
    }
  }
  
  /**
   * Executes code and returns the code execution result.
   * 
   * @param invocationContext - The invocation context of the code execution.
   * @param codeExecutionInput - The code execution input.
   * @returns The code execution result.
   */
  async executeCode(
    invocationContext: InvocationContext,
    codeExecutionInput: CodeExecutionInput,
  ): Promise<CodeExecutionResult> {
    // Initialize the extension if not already done
    await this.initializeExtension();
    
    // Execute the code
    const codeWithImports = this.getCodeWithImports(codeExecutionInput.code);
    const response = await this.executeCodeInterpreter(
      codeWithImports,
      codeExecutionInput.inputFiles,
      codeExecutionInput.executionId
    );
    
    // Save output files as artifacts
    const currentTimestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const fileNamePrefix = `${currentTimestamp}_`;
    const savedFiles: File[] = [];
    let fileCount = 0;
    
    if (response.output_files && Array.isArray(response.output_files)) {
      for (const outputFile of response.output_files) {
        const fileType = outputFile.name.split('.').pop()?.toLowerCase() || '';
        const fileName = `${fileNamePrefix}${fileCount}.${fileType}`;
        
        if (SUPPORTED_IMAGE_TYPES.includes(fileType)) {
          fileCount++;
          savedFiles.push({
            name: `plot_${fileName}`,
            content: outputFile.contents,
            mimeType: `image/${fileType}`
          });
        } else if (SUPPORTED_DATA_FILE_TYPES.includes(fileType)) {
          fileCount++;
          savedFiles.push({
            name: `data_${fileName}`,
            content: outputFile.contents,
            mimeType: `text/${fileType}`
          });
        } else {
          let mimeType: string | null = null;
          
          // Use MIME type detection if available
          try {
            const mime = require('mime-types');
            mimeType = mime.lookup(fileName) || null;
          } catch (e) {
            // If mime-types package is not available, use basic detection
            if (fileType === 'txt') mimeType = 'text/plain';
            else if (fileType === 'json') mimeType = 'application/json';
            else if (fileType === 'html') mimeType = 'text/html';
          }
          
          savedFiles.push({
            name: fileName,
            content: outputFile.contents,
            mimeType: mimeType || 'application/octet-stream'
          });
        }
      }
    }
    
    // Collect the final result
    return {
      stdout: response.execution_result || '',
      stderr: response.execution_error || '',
      outputFiles: savedFiles
    };
  }
  
  /**
   * Executes the code interpreter extension.
   */
  private async executeCodeInterpreter(
    code: string,
    inputFiles?: File[],
    sessionId?: string
  ): Promise<any> {
    if (!this.codeInterpreterExtension) {
      throw new Error('Code interpreter extension not initialized');
    }
    
    const operationParams: Record<string, any> = { code };
    
    if (inputFiles && inputFiles.length > 0) {
      operationParams.files = inputFiles.map(file => ({
        name: file.name,
        contents: file.content
      }));
    }
    
    if (sessionId) {
      operationParams.session_id = sessionId;
    }
    
    return await this.codeInterpreterExtension.execute({
      operationId: 'execute',
      operationParams
    });
  }
  
  /**
   * Builds the code string with built-in imports.
   */
  private getCodeWithImports(code: string): string {
    return `
${IMPORTED_LIBRARIES}

${code}
`;
  }
} 