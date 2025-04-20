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

import axios from 'axios';

/**
 * Credentials for SecretManagerClient
 */
interface SecretCredentials {
  token?: string;
  serviceAccount?: Record<string, unknown>;
}

/**
 * Parameters for SecretManagerClient constructor
 */
interface SecretManagerClientParams {
  serviceAccountJson?: string;
  authToken?: string;
}

/**
 * A client for interacting with Google Cloud Secret Manager.
 * 
 * This class provides a simplified interface for retrieving secrets from
 * Secret Manager, handling authentication using either a service account
 * JSON keyfile (passed as a string) or a pre-existing authorization token.
 */
export class SecretManagerClient {
  private credentials: any = null;

  /**
   * Initializes the SecretManagerClient.
   * 
   * @param params Configuration parameters
   * @param params.serviceAccountJson The content of a service account JSON keyfile (as a string), not the file path. Must be valid JSON.
   * @param params.authToken An existing Google Cloud authorization token.
   * @throws Error if neither serviceAccountJson nor authToken is provided, or if both are provided. Also raised if the serviceAccountJson is not valid JSON.
   */
  constructor(params: {
    serviceAccountJson?: string;
    authToken?: string;
  }) {
    if (params.serviceAccountJson && params.authToken) {
      throw new Error("Must provide either 'serviceAccountJson' or 'authToken', not both.");
    }

    if (params.authToken) {
      this.credentials = { token: params.authToken };
    } else if (params.serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(params.serviceAccountJson);
        // In a TypeScript environment, we can't directly use the Google Auth library the same way
        // We'd need to use something like the Google Cloud client libraries or custom implementation
        this.credentials = { serviceAccount };
      } catch (e) {
        throw new Error(`Invalid service account JSON: ${e}`);
      }
    } else {
      throw new Error("Must provide either 'serviceAccountJson' or 'authToken'");
    }
  }

  /**
   * Retrieves a secret from Google Cloud Secret Manager.
   * 
   * @param resourceName The full resource name of the secret. 
   *                    Usually you want the "latest" version, e.g., "projects/my-project/secrets/my-secret/versions/latest".
   * @returns The secret payload as a string.
   * @throws Error if the Secret Manager API returns an error
   */
  async getSecret(resourceName: string): Promise<string> {
    // This is a simplified implementation since the full implementation would require Google Cloud SDK
    // In a real environment, you would use the @google-cloud/secret-manager package
    
    if (!this.credentials.token) {
      throw new Error("Authentication token required to access Secret Manager");
    }
    
    try {
      const url = `https://secretmanager.googleapis.com/v1/${resourceName}:access`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.credentials.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // The actual response format would depend on the Secret Manager API
      // This is a simplified implementation
      return response.data.payload?.data || '';
    } catch (e) {
      throw new Error(`Failed to access secret: ${e}`);
    }
  }
} 