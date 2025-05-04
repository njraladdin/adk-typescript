/**
 * Service Account Credential Exchanger
 * 
 * Exchanges service account credentials for HTTP bearer tokens
 */

import { AuthCredential, AuthCredentialTypes } from '../../../../auth/AuthCredential';
import { BaseCredentialExchanger, AuthCredentialMissingError } from './BaseCredentialExchanger';

/**
 * Handles Service Account credential exchange
 */
export class ServiceAccountCredentialExchanger extends BaseCredentialExchanger {
  /**
   * Checks if the scheme and credential types are compatible for Service Account
   * @param authScheme The authentication scheme
   * @param authCredential The authentication credentials
   */
  protected _checkSchemeCredentialType(
    authScheme: any,
    authCredential: AuthCredential | null
  ): void {
    if (!authCredential) {
      throw new AuthCredentialMissingError(
        "Service account credentials are missing. Please provide valid service account credentials."
      );
    }

    // Check if the auth credential is Service Account
    if (
      authCredential.auth_type !== AuthCredentialTypes.SERVICE_ACCOUNT ||
      !authCredential.service_account
    ) {
      throw new AuthCredentialMissingError(
        "Service account credentials are missing. Ensure auth_type is SERVICE_ACCOUNT and service_account is provided."
      );
    }
  }

  /**
   * Gets an access token from service account credentials
   * @param authCredential Service account credentials
   * @returns Access token from service account
   */
  private async _getAccessToken(authCredential: AuthCredential): Promise<string> {
    // In a real implementation, we would use Google's auth libraries
    // to get an access token from service account credentials
    // This simplified version just returns a mock token
    
    try {
      if (authCredential.service_account?.use_default_credential) {
        // Use default credentials if specified
        return "mock_default_credential_token";
      } else if (authCredential.service_account?.service_account_credential) {
        // Use provided service account credentials
        return "mock_service_account_token";
      } else {
        throw new Error("No valid service account credentials found");
      }
    } catch (error) {
      throw new AuthCredentialMissingError(
        `Failed to exchange service account token: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Exchanges service account credential for HTTP bearer token
   * @param authScheme The auth scheme
   * @param authCredential The service account credential to exchange
   * @returns HTTP bearer token credential
   */
  public async exchangeCredential(
    authScheme: any,
    authCredential: AuthCredential | null
  ): Promise<AuthCredential> {
    // Check if the auth credential is compatible with the auth scheme
    this._checkSchemeCredentialType(authScheme, authCredential);

    if (!authCredential) {
      throw new AuthCredentialMissingError(
        "Service account credentials are missing. Please provide valid service account credentials."
      );
    }

    // Get access token from service account credentials
    const accessToken = await this._getAccessToken(authCredential);

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
} 