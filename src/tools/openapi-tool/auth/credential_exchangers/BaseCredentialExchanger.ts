/**
 * Base Credential Exchanger
 * 
 * Base class for all credential exchangers
 */

import { AuthCredential } from '../../../../auth/AuthCredential';

/**
 * Error thrown when credentials are missing
 */
export class AuthCredentialMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthCredentialMissingError';
  }
}

/**
 * Base class for credential exchangers
 */
export abstract class BaseCredentialExchanger {
  /**
   * Checks if the scheme and credential types are compatible
   * @param authScheme The authentication scheme
   * @param authCredential The authentication credentials
   */
  protected abstract _checkSchemeCredentialType(
    authScheme: any,
    authCredential: AuthCredential | null
  ): void;

  /**
   * Exchanges one credential type for another
   * @param authScheme The auth scheme
   * @param authCredential The auth credential to exchange
   * @returns The exchanged credential, or null if no credential was provided
   */
  public abstract exchangeCredential(
    authScheme: any,
    authCredential: AuthCredential | null
  ): Promise<AuthCredential | null> | AuthCredential | null;
} 