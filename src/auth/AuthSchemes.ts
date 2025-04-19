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
 * Enum for supported authentication scheme types.
 */
export enum AuthSchemeType {
  API_KEY = 'apiKey',
  HTTP = 'http',
  OAUTH2 = 'oauth2',
  OPEN_ID_CONNECT = 'openIdConnect',
  SERVICE_ACCOUNT = 'serviceAccount',
}

/**
 * Enum for OAuth2 grant types.
 */
export enum OAuthGrantType {
  CLIENT_CREDENTIALS = 'client_credentials',
  AUTHORIZATION_CODE = 'authorization_code',
  IMPLICIT = 'implicit',
  PASSWORD = 'password',
  REFRESH_TOKEN = 'refresh_token',
}

/**
 * Interface for OpenIdConnectWithConfig, matching the Python class.
 */
export interface OpenIdConnectWithConfig {
  type?: AuthSchemeType;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  revocation_endpoint?: string;
  token_endpoint_auth_methods_supported?: string[];
  grant_types_supported?: string[];
  scopes?: string[];
  [key: string]: any;
}

/**
 * AuthScheme is a union of SecurityScheme and OpenIdConnectWithConfig.
 * In TypeScript, SecurityScheme can be any object with a 'type' property.
 */
export type AuthScheme = { type: AuthSchemeType; [key: string]: any } | OpenIdConnectWithConfig;

/**
 * Utility function to get OAuthGrantType from an OAuthFlows-like object.
 */
export function getOAuthGrantTypeFromFlow(flow: any): OAuthGrantType | undefined {
  if (flow.clientCredentials) return OAuthGrantType.CLIENT_CREDENTIALS;
  if (flow.authorizationCode) return OAuthGrantType.AUTHORIZATION_CODE;
  if (flow.implicit) return OAuthGrantType.IMPLICIT;
  if (flow.password) return OAuthGrantType.PASSWORD;
  return undefined;
} 