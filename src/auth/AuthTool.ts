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

import { BaseTool, BaseToolOptions } from '../tools/BaseTool';
import { ToolContext } from '../tools/toolContext';
import { AuthScheme } from './AuthScheme';
import { AuthCredential } from './AuthCredential';

/**
 * Configuration for authentication
 */
export interface AuthConfig {
  /**
   * The authentication scheme used to collect credentials
   */
  authScheme: AuthScheme;
  
  /**
   * The raw auth credential used to collect credentials
   * Used in some auth schemes that need to exchange auth credentials
   * For other auth schemes, it could be null
   */
  rawAuthCredential?: AuthCredential;
  
  /**
   * The exchanged auth credential
   * For auth schemes that don't need to exchange credentials (e.g., API key), 
   * it's filled by client directly
   * For auth schemes that need to exchange credentials (e.g., OAuth2), 
   * it's first filled by ADK
   */
  exchangedAuthCredential?: AuthCredential;
}

/**
 * Arguments for the auth tool
 */
export interface AuthToolArguments {
  /**
   * The function call ID
   */
  functionCallId: string;
  
  /**
   * The auth configuration
   */
  authConfig: AuthConfig;
}

/**
 * Options for creating an authentication tool
 */
export interface AuthToolOptions extends BaseToolOptions {
  /**
   * Handler for authentication completion
   */
  onAuthComplete?: (args: AuthToolArguments) => Promise<void>;
}

/**
 * Tool for handling authentication flows
 */
export class AuthTool extends BaseTool {
  /**
   * Handler for authentication completion
   */
  private onAuthComplete?: (args: AuthToolArguments) => Promise<void>;
  
  /**
   * Creates a new authentication tool
   * 
   * @param options The options for the tool
   */
  constructor(options: AuthToolOptions) {
    super({
      name: options.name || 'auth_tool',
      description: options.description || 'Tool for handling authentication flows',
      isLongRunning: true
    });
    
    this.onAuthComplete = options.onAuthComplete;
  }
  
  /**
   * Get the function declaration for this tool
   * 
   * @returns The function declaration
   */
  protected _getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          authScheme: {
            type: 'string',
            description: 'The authentication scheme to use'
          },
          credentials: {
            type: 'object',
            description: 'The credentials for authentication'
          }
        },
        required: ['authScheme']
      }
    };
  }
  
  /**
   * Execute the authentication tool
   * 
   * @param params The parameters for tool execution
   * @param context The context for tool execution
   * @returns The result of the tool execution
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    const functionCallId = context.get('functionCallId') || '';
    const authScheme = params.authScheme;
    const credentials = params.credentials || {};
    
    // Create auth config
    const authConfig: AuthConfig = {
      authScheme: authScheme as AuthScheme,
      rawAuthCredential: credentials as AuthCredential
    };
    
    // Create auth tool arguments
    const authToolArgs: AuthToolArguments = {
      functionCallId,
      authConfig
    };
    
    // Call the auth complete handler if provided
    if (this.onAuthComplete) {
      await this.onAuthComplete(authToolArgs);
    }
    
    return {
      status: 'authentication_completed',
      authScheme
    };
  }
} 