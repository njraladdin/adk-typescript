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

import { BaseTool } from '../BaseTool';
import { ToolContext } from '../toolContext';

/**
 * Auth credential types enum
 */
export enum AuthCredentialTypes {
  OPEN_ID_CONNECT = 'open_id_connect',
}

/**
 * OAuth2 Auth interface
 */
export interface OAuth2Auth {
  clientId: string;
  clientSecret: string;
}

/**
 * Auth credential interface
 */
export interface AuthCredential {
  authType: AuthCredentialTypes;
  oauth2: OAuth2Auth;
}

/**
 * RestApiTool interface (placeholder for actual implementation)
 */
export interface RestApiTool {
  name: string;
  description: string;
  isLongRunning: boolean;
  execute: (params: Record<string, any>, context: ToolContext) => Promise<any>;
  getDeclaration: () => any;
  authCredential?: AuthCredential;
}

/**
 * GoogleApiTool class
 * A wrapper around RestApiTool that adds Google API specific functionality
 */
export class GoogleApiTool extends BaseTool {
  private restApiTool: RestApiTool;

  /**
   * Create a new GoogleApiTool
   * @param restApiTool The underlying RestApiTool to wrap
   */
  constructor(restApiTool: RestApiTool) {
    super({
      name: restApiTool.name,
      description: restApiTool.description,
      isLongRunning: restApiTool.isLongRunning
    });
    this.restApiTool = restApiTool;
  }

  /**
   * Get the function declaration
   * @returns The function declaration from the underlying RestApiTool
   */
  protected _getDeclaration(): any {
    return this.restApiTool.getDeclaration();
  }

  /**
   * Execute the tool
   * @param params The parameters for the tool execution
   * @param context The context for the tool execution
   * @returns The result of executing the underlying RestApiTool
   */
  async execute(
    params: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    return await this.restApiTool.execute(params, context);
  }

  /**
   * Configure authentication for the tool
   * @param clientId The OAuth2 client ID
   * @param clientSecret The OAuth2 client secret
   */
  configureAuth(clientId: string, clientSecret: string): void {
    this.restApiTool.authCredential = {
      authType: AuthCredentialTypes.OPEN_ID_CONNECT,
      oauth2: {
        clientId,
        clientSecret
      }
    };
  }
} 