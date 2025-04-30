

import { FunctionTool } from './FunctionTool';
import { ToolContext } from './ToolContext';
import * as child_process from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

// Promisified versions of fs functions
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);

/**
 * Result of code execution
 */
export interface CodeExecutionResult {
  /** Standard output from the execution */
  stdout: string;
  
  /** Standard error output from the execution */
  stderr: string;
  
  /** Exit code of the process */
  exitCode: number;
  
  /** Execution time in milliseconds */
  executionTime: number;
  
  /** Whether the execution was successful */
  success: boolean;
}

/**
 * Language configuration for code execution
 */
interface LanguageConfig {
  /** File extension for this language */
  extension: string;
  
  /** Command to execute the code */
  command: string;
  
  /** Arguments to pass to the command */
  args: (filename: string) => string[];
}

/**
 * Map of supported languages and their configurations
 */
const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  python: {
    extension: '.py',
    command: 'python',
    args: (filename) => [filename]
  },
  javascript: {
    extension: '.js',
    command: 'node',
    args: (filename) => [filename]
  },
  typescript: {
    extension: '.ts',
    command: 'ts-node',
    args: (filename) => [filename]
  },
  bash: {
    extension: '.sh',
    command: 'bash',
    args: (filename) => [filename]
  },
  // Add more languages as needed
};

/**
 * Function to execute code in various languages
 * 
 * @param params Parameters for the function
 * @param params.language Programming language of the code
 * @param params.code Code to execute
 * @param context The tool context
 * @returns Result of the code execution
 */
export async function executeCode(
  params: Record<string, any>,
  context: ToolContext
): Promise<CodeExecutionResult> {
  const language = params.language.toLowerCase();
  const code = params.code;
  
  // Check if language is supported
  if (!LANGUAGE_CONFIGS[language]) {
    return {
      stdout: '',
      stderr: `Unsupported language: ${language}. Supported languages are: ${Object.keys(LANGUAGE_CONFIGS).join(', ')}`,
      exitCode: 1,
      executionTime: 0,
      success: false
    };
  }
  
  // Get language configuration
  const config = LANGUAGE_CONFIGS[language];
  
  // Create a temporary directory for the code
  const tempDir = path.join(os.tmpdir(), 'code-execution', `run-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  
  // Create a temporary file for the code
  const filename = `code${config.extension}`;
  const filepath = path.join(tempDir, filename);
  await writeFile(filepath, code);
  
  // Execute the code
  const startTime = Date.now();
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  
  try {
    // Execute the command with the code file
    const command = config.command;
    const args = config.args(filepath);
    
    // Set a timeout for execution (30 seconds)
    const timeout = 30000;
    
    // Execute the process
    const process = child_process.spawn(command, args, {
      timeout,
      cwd: tempDir
    });
    
    // Collect output
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Wait for process to exit
    exitCode = await new Promise<number>((resolve) => {
      process.on('close', (code) => {
        resolve(code ?? 0);
      });
    });
  } catch (error: any) {
    stderr = `Error executing code: ${error.message}`;
    exitCode = 1;
  }
  
  // Calculate execution time
  const executionTime = Date.now() - startTime;
  
  // Clean up temporary file
  try {
    await unlink(filepath);
  } catch (error: any) {
    console.warn(`Error removing temporary file ${filepath}: ${error.message}`);
  }
  
  return {
    stdout,
    stderr,
    exitCode,
    executionTime,
    success: exitCode === 0
  };
}

/**
 * Tool for executing code in various programming languages
 */
export class CodeExecutionTool extends FunctionTool {
  /**
   * Creates a new code execution tool
   */
  constructor() {
    super({
      name: 'execute_code',
      description: 'Executes code in various programming languages',
      fn: executeCode,
      functionDeclaration: {
        name: 'execute_code',
        description: 'Executes code in various programming languages',
        parameters: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              description: `Programming language of the code. Supported languages: ${Object.keys(LANGUAGE_CONFIGS).join(', ')}`
            },
            code: {
              type: 'string',
              description: 'Code to execute'
            }
          },
          required: ['language', 'code']
        }
      }
    });
  }
}

/**
 * Singleton instance of the Code Execution tool
 */
export const codeExecutionTool = new CodeExecutionTool(); 