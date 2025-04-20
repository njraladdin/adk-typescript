/**
 * Basic type definitions for the ADK TypeScript port
 */

/**
 * Part represents a content part, which can be text, a function call, or a function response
 */
export class Part {
  text?: string;
  functionCall?: any;
  functionResponse?: any;

  constructor(data: { text?: string; functionCall?: any; functionResponse?: any }) {
    this.text = data.text;
    this.functionCall = data.functionCall;
    this.functionResponse = data.functionResponse;
  }
}

/**
 * Content represents a message with a role and parts
 */
export interface Content {
  role: string;
  parts: Part[];
}

/**
 * Event represents an interaction in a session
 */
export interface Event {
  author: string;
  content: Content;
} 