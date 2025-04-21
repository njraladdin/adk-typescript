

/**
 * Utility functions for code execution.
 */

import { Content, Part } from "../models/types";

/**
 * A structure that contains a file name and its content.
 */
export interface File {
  /**
   * The name of the file with file extension (e.g., "file.csv").
   */
  name: string;

  /**
   * The base64-encoded bytes of the file content.
   */
  content: string;

  /**
   * The mime type of the file (e.g., "image/png").
   */
  mimeType: string;
}

/**
 * A structure that contains the input of code execution.
 */
export interface CodeExecutionInput {
  /**
   * The code to execute.
   */
  code: string;

  /**
   * The input files available to the code.
   */
  inputFiles: File[];

  /**
   * The execution ID for the stateful code execution.
   */
  executionId?: string;
}

/**
 * A structure that contains the result of code execution.
 */
export interface CodeExecutionResult {
  /**
   * The standard output of the code execution.
   */
  stdout: string;

  /**
   * The standard error of the code execution.
   */
  stderr: string;

  /**
   * The output files from the code execution.
   */
  outputFiles: File[];
}

/**
 * Extensions to the Part interface for code execution
 */
interface ExecutableCodePart extends Part {
  executableCode?: {
    code: string;
    language: string;
  };
}

/**
 * Utility functions for code execution.
 */
export class CodeExecutionUtils {
  /**
   * Gets the file content as a base64-encoded string.
   *
   * @param data - The file content bytes.
   * @returns The file content as a base64-encoded string.
   */
  static getEncodedFileContent(data: Uint8Array): string {
    const isBase64Encoded = (data: Uint8Array): boolean => {
      try {
        const decoded = Buffer.from(data.toString(), 'base64');
        const reEncoded = Buffer.from(decoded).toString('base64');
        return reEncoded === data.toString();
      } catch (error) {
        return false;
      }
    };

    return isBase64Encoded(data)
      ? data.toString()
      : Buffer.from(data).toString('base64');
  }

  /**
   * Extracts the first code block from the content and truncate everything after it.
   *
   * @param content - The mutable content to extract the code from.
   * @param codeBlockDelimiters - The list of the enclosing delimiters to identify the code blocks.
   * @returns The first code block if found, otherwise undefined.
   */
  static extractCodeAndTruncateContent(
    content: Content,
    codeBlockDelimiters: [string, string][]
  ): string | undefined {
    if (!content || !content.parts || content.parts.length === 0) {
      return undefined;
    }

    // Extract the code from the executable code parts if there're no associated
    // code execution result parts.
    for (let idx = 0; idx < content.parts.length; idx++) {
      const part = content.parts[idx] as ExecutableCodePart;
      if (
        part.executableCode &&
        (idx === content.parts.length - 1 || !(content.parts[idx + 1] as Part).codeExecutionResult)
      ) {
        content.parts = content.parts.slice(0, idx + 1);
        return part.executableCode.code;
      }
    }

    // Extract the code from the text parts.
    const textParts = content.parts.filter(p => p.text !== undefined);
    if (textParts.length === 0) {
      return undefined;
    }

    const firstTextPart = { ...textParts[0] };
    const responseText = textParts.map(p => p.text).join('\n');

    // Find the first code block.
    const leadingDelimiterPattern = codeBlockDelimiters.map(d => d[0]).join('|');
    const trailingDelimiterPattern = codeBlockDelimiters.map(d => d[1]).join('|');
    const pattern = new RegExp(
      `(?<prefix>.*?)(${leadingDelimiterPattern})(?<code>.*?)(${trailingDelimiterPattern})(?<suffix>.*?)$`,
      's'
    );
    const patternMatch = pattern.exec(responseText);
    if (!patternMatch || !patternMatch.groups) {
      return undefined;
    }

    const codeStr = patternMatch.groups.code;
    if (!codeStr) {
      return undefined;
    }

    content.parts = [];
    if (patternMatch.groups.prefix) {
      firstTextPart.text = patternMatch.groups.prefix;
      content.parts.push(firstTextPart as Part);
    }
    content.parts.push(CodeExecutionUtils.buildExecutableCodePart(codeStr));
    return codeStr;
  }

  /**
   * Builds an executable code part with code string.
   *
   * @param code - The code string.
   * @returns The constructed executable code part.
   */
  static buildExecutableCodePart(code: string): ExecutableCodePart {
    return {
      executableCode: {
        code,
        language: 'PYTHON',
      },
    };
  }

  /**
   * Builds the code execution result part from the code execution result.
   *
   * @param codeExecutionResult - The code execution result.
   * @returns The constructed code execution result part.
   */
  static buildCodeExecutionResultPart(codeExecutionResult: CodeExecutionResult): Part {
    if (codeExecutionResult.stderr) {
      return {
        codeExecutionResult: {
          outcome: 'OUTCOME_FAILED',
          output: codeExecutionResult.stderr,
        },
      };
    }
    
    const finalResult: string[] = [];
    if (codeExecutionResult.stdout || codeExecutionResult.outputFiles.length === 0) {
      finalResult.push(`Code execution result:\n${codeExecutionResult.stdout}\n`);
    }
    if (codeExecutionResult.outputFiles.length > 0) {
      finalResult.push(
        `Saved artifacts:\n${codeExecutionResult.outputFiles.map(f => `\`${f.name}\``).join(',')}`
      );
    }
    
    return {
      codeExecutionResult: {
        outcome: 'OUTCOME_OK',
        output: finalResult.join('\n\n'),
      },
    };
  }

  /**
   * Converts the code execution parts to text parts in a Content.
   *
   * @param content - The mutable content to convert the code execution parts to text parts.
   * @param codeBlockDelimiter - The delimiter to format the code block.
   * @param executionResultDelimiters - The delimiter to format the code execution result.
   */
  static convertCodeExecutionParts(
    content: Content,
    codeBlockDelimiter: [string, string],
    executionResultDelimiters: [string, string]
  ): void {
    if (!content.parts || content.parts.length === 0) {
      return;
    }

    // Handle the conversion of trailing executable code parts.
    const lastPart = content.parts[content.parts.length - 1] as ExecutableCodePart;
    if (lastPart.executableCode) {
      content.parts[content.parts.length - 1] = {
        text: codeBlockDelimiter[0] + lastPart.executableCode.code + codeBlockDelimiter[1],
      };
    }
    // Handle the conversion of trailing code execution result parts.
    // Skip if the Content has multiple parts, which means the Content is
    // likely generated by the model.
    else if (content.parts.length === 1 && lastPart.codeExecutionResult) {
      content.parts[content.parts.length - 1] = {
        text: executionResultDelimiters[0] + 
              lastPart.codeExecutionResult.output + 
              executionResultDelimiters[1],
      };
      content.role = 'user';
    }
  }
} 