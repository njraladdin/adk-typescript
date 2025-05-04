/**
 * Auto Auth Credential Exchanger
 * 
 * Automatically selects the appropriate credential exchanger based on auth type
 */

import { AuthCredential, AuthCredentialTypes } from '../../../../auth/AuthCredential';
import { BaseCredentialExchanger } from './BaseCredentialExchanger';

// We need to implement or mock these if they don't exist
// For now creating placeholder classes that will need to be replaced
// with actual implementations or imported from the right location
class OAuth2CredentialExchanger extends BaseCredentialExchanger {
  protected _checkSchemeCredentialType(
    _authScheme: any, 
    _authCredential: AuthCredential | null
  ): void {
    // Implementation will be provided in the actual class
  }

  public exchangeCredential(
    authScheme: any,
    authCredential: AuthCredential | null
  ): Promise<AuthCredential | null> | AuthCredential | null {
    // Implementation will be provided in the actual class
    return authCredential;
  }
}

// We need to implement or mock these if they don't exist
class ServiceAccountCredentialExchanger extends BaseCredentialExchanger {
  protected _checkSchemeCredentialType(
    _authScheme: any, 
    _authCredential: AuthCredential | null
  ): void {
    // Implementation will be provided in the actual class
  }

  public exchangeCredential(
    authScheme: any,
    authCredential: AuthCredential | null
  ): Promise<AuthCredential | null> | AuthCredential | null {
    // Implementation will be provided in the actual class
    return authCredential;
  }
}

/**
 * No-op credential exchanger that returns credentials unchanged
 */
class NoExchangeCredentialExchanger extends BaseCredentialExchanger {
  protected _checkSchemeCredentialType(
    _authScheme: any,
    _authCredential: AuthCredential | null
  ): void {
    // No validation needed
  }

  public exchangeCredential(
    _authScheme: any,
    authCredential: AuthCredential | null
  ): Promise<AuthCredential | null> | AuthCredential | null {
    return authCredential;
  }
}

/**
 * Defines a function type that creates a credential exchanger
 */
type ExchangerFactory = () => BaseCredentialExchanger;

/**
 * AutoAuthCredentialExchanger selects the appropriate credential exchanger
 * based on the auth credential type
 */
export class AutoAuthCredentialExchanger extends BaseCredentialExchanger {
  /**
   * Map of auth credential types to credential exchanger factories
   */
  public exchangers: Record<string, ExchangerFactory>;

  /**
   * Create a new AutoAuthCredentialExchanger
   * @param customExchangers Optional map of auth credential types to exchanger factories
   */
  constructor(customExchangers?: Record<string, new () => BaseCredentialExchanger>) {
    super();

    // Default exchangers
    this.exchangers = {
      [AuthCredentialTypes.API_KEY]: () => new NoExchangeCredentialExchanger(),
      [AuthCredentialTypes.HTTP]: () => new NoExchangeCredentialExchanger(),
      [AuthCredentialTypes.OAUTH2]: () => new OAuth2CredentialExchanger(),
      [AuthCredentialTypes.OPEN_ID_CONNECT]: () => new OAuth2CredentialExchanger(),
      [AuthCredentialTypes.SERVICE_ACCOUNT]: () => new ServiceAccountCredentialExchanger(),
    };

    // Add custom exchangers if provided
    if (customExchangers) {
      for (const [authType, exchangerClass] of Object.entries(customExchangers)) {
        this.exchangers[authType] = () => new exchangerClass();
      }
    }
  }

  /**
   * Placeholder for the check scheme credential type method
   * Not needed for this exchanger as each sub-exchanger will handle its own validation
   */
  protected _checkSchemeCredentialType(
    _authScheme: any,
    _authCredential: AuthCredential | null
  ): void {
    // No validation needed at this level
  }

  /**
   * Exchange credentials based on the auth credential type
   * @param authScheme Auth scheme
   * @param authCredential Auth credential
   * @returns Exchanged credential
   */
  public async exchangeCredential(
    authScheme: any,
    authCredential: AuthCredential | null
  ): Promise<AuthCredential | null> {
    // If no auth credential, return null
    if (!authCredential) {
      return null;
    }

    // Get the auth type
    const authType = authCredential.auth_type;

    // Get the appropriate exchanger
    const exchangerFactory = this.exchangers[authType] || (() => new NoExchangeCredentialExchanger());
    const exchanger = exchangerFactory();

    // Exchange the credential
    return exchanger.exchangeCredential(authScheme, authCredential);
  }
} 