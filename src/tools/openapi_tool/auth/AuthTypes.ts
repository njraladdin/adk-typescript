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

/**
 * Authentication types and interfaces for OpenAPI tools
 */

/**
 * Auth scheme types
 */
export enum AuthSchemeType {
  apiKey = 'apiKey',
  http = 'http',
  oauth2 = 'oauth2',
  openIdConnect = 'openIdConnect',
}

/**
 * OpenID Connect configuration
 */
export interface OpenIdConnectConfig {
  /**
   * The authorization endpoint URL
   */
  authorizationEndpoint: string;
  
  /**
   * The token endpoint URL
   */
  tokenEndpoint: string;
  
  /**
   * The user info endpoint URL
   */
  userinfoEndpoint: string;
  
  /**
   * The token revocation endpoint URL
   */
  revocationEndpoint: string;
  
  /**
   * The supported token endpoint authentication methods
   */
  tokenEndpointAuthMethodsSupported: string[];
  
  /**
   * The supported grant types
   */
  grantTypesSupported: string[];
  
  /**
   * The requested scopes
   */
  scopes: string[];
}

/**
 * OAuth2 flow configuration
 */
export interface OAuth2Flow {
  /**
   * The authorization URL
   */
  authorizationUrl?: string;
  
  /**
   * The token URL
   */
  tokenUrl?: string;
  
  /**
   * The refresh URL
   */
  refreshUrl?: string;
  
  /**
   * The available scopes
   */
  scopes?: Record<string, string>;
}

/**
 * Auth scheme interface
 */
export interface AuthScheme {
  /**
   * The type of authentication scheme
   */
  type_: AuthSchemeType;
  
  /**
   * The name of the authentication parameter
   */
  name?: string;
  
  /**
   * The location of the authentication parameter
   */
  in?: string;
  
  /**
   * The scheme for HTTP authentication
   */
  scheme?: string;
  
  /**
   * The bearer format for HTTP authentication
   */
  bearerFormat?: string;
  
  /**
   * The OAuth2 flows
   */
  flows?: {
    implicit?: OAuth2Flow;
    password?: OAuth2Flow;
    clientCredentials?: OAuth2Flow;
    authorizationCode?: OAuth2Flow;
  };
  
  /**
   * The OpenID Connect URL
   */
  openIdConnectUrl?: string;
  
  /**
   * OpenID Connect configuration
   */
  openIdConnectConfig?: OpenIdConnectConfig;
}

/**
 * Auth credential types
 */
export enum AuthCredentialTypes {
  OAUTH2 = 'oauth2',
  API_KEY = 'api_key',
  HTTP_BASIC = 'http_basic',
  HTTP_BEARER = 'http_bearer',
  OPEN_ID_CONNECT = 'open_id_connect',
}

/**
 * OAuth2 authentication
 */
export interface OAuth2Auth {
  /**
   * The client ID
   */
  clientId: string;
  
  /**
   * The client secret
   */
  clientSecret: string;
  
  /**
   * The access token
   */
  accessToken?: string;
  
  /**
   * The refresh token
   */
  refreshToken?: string;
  
  /**
   * When the token expires
   */
  expiresAt?: number;
  
  /**
   * The authorization code
   */
  authorizationCode?: string;
  
  /**
   * The redirect URI
   */
  redirectUri?: string;
  
  /**
   * The code verifier for PKCE
   */
  codeVerifier?: string;
}

/**
 * API key authentication
 */
export interface ApiKeyAuth {
  /**
   * The API key
   */
  apiKey: string;
}

/**
 * HTTP basic authentication
 */
export interface HttpBasicAuth {
  /**
   * The username
   */
  username: string;
  
  /**
   * The password
   */
  password: string;
}

/**
 * HTTP bearer authentication
 */
export interface HttpBearerAuth {
  /**
   * The bearer token
   */
  token: string;
}

/**
 * Auth credential interface
 */
export interface AuthCredential {
  /**
   * The type of authentication credential
   */
  authType: AuthCredentialTypes;
  
  /**
   * OAuth2 authentication credentials
   */
  oauth2?: OAuth2Auth;
  
  /**
   * API key authentication credentials
   */
  apiKey?: ApiKeyAuth;
  
  /**
   * HTTP basic authentication credentials
   */
  httpBasic?: HttpBasicAuth;
  
  /**
   * HTTP bearer authentication credentials
   */
  httpBearer?: HttpBearerAuth;
} 