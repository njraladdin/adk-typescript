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

import { AuthCredential, AuthCredentialTypes, OAuth2Auth } from './AuthCredential';
import { AuthConfig } from './AuthConfig';
import { AuthSchemeType, OAuthGrantType, OpenIdConnectWithConfig } from './AuthSchemes';

// Helper: deep copy an object
function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Helper: hash an object (for keying)
function hashObject(obj: any): number {
  const str = JSON.stringify(obj);
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

export class AuthHandler {
  authConfig: AuthConfig;

  constructor(authConfig: AuthConfig) {
    this.authConfig = authConfig;
  }

  /**
   * Exchanges an auth token from the authorization response.
   * Returns an AuthCredential object containing the access token.
   */
  exchangeAuthToken(): AuthCredential | undefined {
    // This is a placeholder for actual OAuth2 token exchange logic.
    // In a real implementation, use a library like 'simple-oauth2' or 'openid-client'.
    // Here, we just return the exchanged credential if present.
    const cred = this.authConfig.exchangedAuthCredential;
    return cred == null ? undefined : cred;
  }

  /**
   * Parses and stores the auth response in the state.
   */
  parseAndStoreAuthResponse(state: Record<string, any>): void {
    const credentialKey = this.getCredentialKey();
    state[credentialKey] = this.authConfig.exchangedAuthCredential;
    const scheme = this.authConfig.authScheme;
    if (!scheme || !('type' in scheme)) return;
    if (
      scheme.type !== AuthSchemeType.OAUTH2 &&
      scheme.type !== AuthSchemeType.OPEN_ID_CONNECT
    ) return;
    state[credentialKey] = this.exchangeAuthToken();
  }

  /**
   * Validates the handler's configuration.
   */
  _validate(): void {
    if (!this.authConfig.authScheme) {
      throw new Error('auth_scheme is empty.');
    }
  }

  /**
   * Retrieves the auth response from the state.
   */
  getAuthResponse(state: Record<string, any>): AuthCredential | undefined {
    const credentialKey = this.getCredentialKey();
    const cred = state[credentialKey];
    if (cred === null || cred === undefined) {
      return undefined;
    }
    return cred as AuthCredential;
  }

  /**
   * Generates an auth request, possibly generating an auth URI if needed.
   */
  generateAuthRequest(): AuthConfig {
    const scheme = this.authConfig.authScheme;
    if (!scheme || !('type' in scheme)) return deepCopy(this.authConfig);
    if (
      scheme.type !== AuthSchemeType.OAUTH2 &&
      scheme.type !== AuthSchemeType.OPEN_ID_CONNECT
    ) return deepCopy(this.authConfig);

    // auth_uri already in exchanged credential
    if (
      this.authConfig.exchangedAuthCredential &&
      this.authConfig.exchangedAuthCredential.oauth2 &&
      this.authConfig.exchangedAuthCredential.oauth2.auth_uri
    ) {
      return deepCopy(this.authConfig);
    }

    // Check if raw_auth_credential exists
    if (!this.authConfig.rawAuthCredential) {
      throw new Error(`Auth Scheme ${scheme.type} requires auth_credential.`);
    }

    // Check if oauth2 exists in raw_auth_credential
    if (!this.authConfig.rawAuthCredential.oauth2) {
      throw new Error(`Auth Scheme ${scheme.type} requires oauth2 in auth_credential.`);
    }

    // auth_uri in raw credential
    if (this.authConfig.rawAuthCredential.oauth2.auth_uri) {
      return {
        authScheme: scheme,
        rawAuthCredential: this.authConfig.rawAuthCredential,
        exchangedAuthCredential: deepCopy(this.authConfig.rawAuthCredential),
      };
    }

    // Check for client_id and client_secret
    if (
      !this.authConfig.rawAuthCredential.oauth2.client_id ||
      !this.authConfig.rawAuthCredential.oauth2.client_secret
    ) {
      throw new Error(`Auth Scheme ${scheme.type} requires both client_id and client_secret in auth_credential.oauth2.`);
    }

    // Generate new auth URI
    const exchangedCredential = this.generateAuthUri();
    return {
      authScheme: scheme,
      rawAuthCredential: this.authConfig.rawAuthCredential,
      exchangedAuthCredential: exchangedCredential,
    };
  }

  /**
   * Generates a unique key for the given auth scheme and credential.
   */
  getCredentialKey(): string {
    let authScheme = this.authConfig.authScheme;
    let authCredential = this.authConfig.rawAuthCredential;
    // Remove extra fields if present
    if (authScheme && 'modelExtra' in authScheme) {
      authScheme = { ...authScheme };
      delete (authScheme as any).modelExtra;
    }
    const schemeName = authScheme
      ? `${authScheme.type}_${hashObject(authScheme)}`
      : '';
    if (authCredential && 'modelExtra' in authCredential) {
      authCredential = { ...authCredential };
      delete (authCredential as any).modelExtra;
    }
    const credentialName = authCredential
      ? `${authCredential.auth_type}_${hashObject(authCredential)}`
      : '';
    return `temp:adk_${schemeName}_${credentialName}`;
  }

  /**
   * Generates an OAuth2 authorization URI.
   */
  generateAuthUri(): AuthCredential {
    const scheme = this.authConfig.authScheme;
    const credential = this.authConfig.rawAuthCredential;
    let authorizationEndpoint = '';
    let scopes: string[] = [];
    if (scheme && 'authorization_endpoint' in scheme) {
      authorizationEndpoint = (scheme as any).authorization_endpoint;
      scopes = (scheme as any).scopes || [];
    } else if (scheme && 'flows' in scheme) {
      const flows = (scheme as any).flows;
      if (flows.implicit && flows.implicit.authorizationUrl) {
        authorizationEndpoint = flows.implicit.authorizationUrl;
        scopes = Object.keys(flows.implicit.scopes || {});
      } else if (flows.authorizationCode && flows.authorizationCode.authorizationUrl) {
        authorizationEndpoint = flows.authorizationCode.authorizationUrl;
        scopes = Object.keys(flows.authorizationCode.scopes || {});
      } else if (flows.clientCredentials && flows.clientCredentials.tokenUrl) {
        authorizationEndpoint = flows.clientCredentials.tokenUrl;
        scopes = Object.keys(flows.clientCredentials.scopes || {});
      } else if (flows.password && flows.password.tokenUrl) {
        authorizationEndpoint = flows.password.tokenUrl;
        scopes = Object.keys(flows.password.scopes || {});
      }
    }
    if (!authorizationEndpoint) {
      throw new Error('Authorization endpoint is not configured in the auth scheme.');
    }
    // Ensure credential and credential.oauth2 are present
    if (!credential || !credential.oauth2) {
      throw new Error('Raw auth credential and oauth2 must be provided to generate auth URI.');
    }
    // Generate a random state string
    const state = Math.random().toString(36).substring(2);
    // Build the auth URI
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: credential.oauth2.client_id || '',
      redirect_uri: credential.oauth2.redirect_uri || '',
      scope: scopes.join(' '),
      state,
    });
    const authUri = `${authorizationEndpoint}?${params.toString()}`;
    return {
      auth_type: AuthCredentialTypes.OAUTH2,
      oauth2: {
        ...credential.oauth2,
        auth_uri: authUri,
        state,
      },
    };
  }
} 