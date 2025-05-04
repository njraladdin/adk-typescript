/**
 * OAuth2 Credential Exchanger
 * 
 * Exchanges OAuth2 credentials for HTTP bearer tokens
 */

import { AuthCredential, AuthCredentialTypes } from '../../../../auth/AuthCredential';
import { BaseCredentialExchanger } from './BaseCredentialExchanger';
import { AuthSchemeType } from '../AuthTypes';
import { OpenIdConnectWithConfig } from '../AuthHelpers';

/**
 * Handles OAuth2 credential exchange
 */
export class OAuth2CredentialExchanger extends BaseCredentialExchanger {
  /**
   * Checks if the scheme and credential types are compatible for OAuth2
   * @param authScheme The authentication scheme
   * @param authCredential The authentication credentials
   */
  protected _checkSchemeCredentialType(
    authScheme: any,
    authCredential: AuthCredential | null
  ): void {
    if (!authCredential) {
      throw new Error(
        "auth_credential is empty. Please create AuthCredential using oauth2 details."
      );
    }

    // Check if the auth scheme is OpenID Connect
    if (!authScheme || authScheme.type_ !== AuthSchemeType.openIdConnect) {
      throw new Error(
        "Invalid security scheme. OAuth2CredentialExchanger only supports OpenID Connect."
      );
    }

    // Check if the auth credential is OAuth2
    if (
      authCredential.auth_type !== AuthCredentialTypes.OAUTH2 ||
      !authCredential.oauth2
    ) {
      throw new Error(
        "auth_credential is not configured with oauth2 details."
      );
    }
  }

  /**
   * Generates an auth token from OAuth2 credential
   * @param authCredential OAuth2 auth credential
   * @returns HTTP auth credential with bearer token
   */
  public generateAuthToken(authCredential: AuthCredential): AuthCredential {
    // Verify that auth_credential is configured with OAuth2
    if (
      authCredential.auth_type !== AuthCredentialTypes.OAUTH2 ||
      !authCredential.oauth2
    ) {
      throw new Error("auth_credential is not configured with oauth2 details.");
    }

    // In a real implementation, we would exchange the code for a token
    // For now, we'll use the access_token directly if it's available
    const accessToken = authCredential.oauth2.access_token;
    
    if (!accessToken) {
      throw new Error(
        "No access token available. Ensure auth_response_uri or access_token is set."
      );
    }

    // Return HTTP bearer token credential
    return {
      auth_type: AuthCredentialTypes.HTTP,
      http: {
        scheme: "bearer",
        credentials: {
          token: accessToken
        }
      }
    };
  }

  /**
   * Exchanges OAuth2 credential for HTTP bearer token
   * @param authScheme The auth scheme (OpenID Connect)
   * @param authCredential The OAuth2 credential
   * @returns HTTP bearer token credential
   */
  public exchangeCredential(
    authScheme: OpenIdConnectWithConfig,
    authCredential: AuthCredential | null
  ): AuthCredential {
    // Check if the auth credential is compatible with the auth scheme
    this._checkSchemeCredentialType(authScheme, authCredential);

    if (!authCredential) {
      throw new Error(
        "auth_credential is empty. Please create AuthCredential using oauth2 details."
      );
    }

    // Generate auth token from the OAuth2 credential
    return this.generateAuthToken(authCredential);
  }
} 