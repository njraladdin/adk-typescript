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
 * Interface representing authentication credentials
 * 
 * This is a flexible structure that can hold different types
 * of authentication credentials depending on the auth scheme.
 */
export interface AuthCredential {
  /** Any property can be included in the credential */
  [key: string]: any;
  
  /** API key for API_KEY auth scheme */
  apiKey?: string;
  
  /** Username for BASIC auth scheme */
  username?: string;
  
  /** Password for BASIC auth scheme */
  password?: string;
  
  /** Client ID for OAuth2/OIDC auth schemes */
  clientId?: string;
  
  /** Client secret for OAuth2/OIDC auth schemes */
  clientSecret?: string;
  
  /** Authorization URI for OAuth2/OIDC auth schemes */
  authorizationUri?: string;
  
  /** Token URI for OAuth2/OIDC auth schemes */
  tokenUri?: string;
  
  /** Redirect URI for OAuth2/OIDC auth schemes */
  redirectUri?: string;
  
  /** Scopes for OAuth2/OIDC auth schemes */
  scopes?: string[];
  
  /** State for OAuth2/OIDC auth schemes */
  state?: string;
  
  /** Access token for OAuth2/OIDC auth schemes */
  accessToken?: string;
  
  /** Refresh token for OAuth2/OIDC auth schemes */
  refreshToken?: string;
  
  /** ID token for OIDC auth scheme */
  idToken?: string;
  
  /** Service account key for SERVICE_ACCOUNT auth scheme */
  serviceAccountKey?: string;
} 