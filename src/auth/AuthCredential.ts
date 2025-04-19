// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Represents the secret token value for HTTP authentication, like user name, password, oauth token, etc.
 */
export interface HttpCredentials {
  username?: string;
  password?: string;
  token?: string;
}

/**
 * The credentials and metadata for HTTP authentication.
 */
export interface HttpAuth {
  scheme: string;
  credentials: HttpCredentials;
}

/**
 * Represents credential value and its metadata for a OAuth2 credential.
 */
export interface OAuth2Auth {
  client_id?: string;
  client_secret?: string;
  auth_uri?: string;
  state?: string;
  redirect_uri?: string;
  auth_response_uri?: string;
  auth_code?: string;
  token?: Record<string, any>;
}

/**
 * Represents Google Service Account configuration.
 */
export interface ServiceAccountCredential {
  type?: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

/**
 * Represents Google Service Account configuration.
 */
export interface ServiceAccount {
  service_account_credential?: ServiceAccountCredential;
  scopes: string[];
  use_default_credential?: boolean;
}

/**
 * Represents the type of authentication credential.
 */
export enum AuthCredentialTypes {
  API_KEY = 'apiKey',
  HTTP = 'http',
  OAUTH2 = 'oauth2',
  OPEN_ID_CONNECT = 'openIdConnect',
  SERVICE_ACCOUNT = 'serviceAccount',
}

/**
 * Data class representing an authentication credential.
 */
export interface AuthCredential {
  auth_type: AuthCredentialTypes;
  resource_ref?: string;
  api_key?: string;
  http?: HttpAuth;
  service_account?: ServiceAccount;
  oauth2?: OAuth2Auth;
  // Add any extra fields as needed
  [key: string]: any;
} 