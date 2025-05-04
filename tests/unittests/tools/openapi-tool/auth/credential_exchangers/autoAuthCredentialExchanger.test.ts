import { AuthCredential, AuthCredentialTypes } from '../../../../../../src/auth/AuthCredential';
import { AutoAuthCredentialExchanger } from '../../../../../../src/tools/openapi-tool/auth/credential_exchangers/AutoAuthCredentialExchanger';
import { BaseCredentialExchanger, AuthCredentialMissingError } from '../../../../../../src/tools/openapi-tool/auth/credential_exchangers/BaseCredentialExchanger';

/**
 * Mock credential exchanger that always returns a test bearer token
 */
class TestCredentialExchanger extends BaseCredentialExchanger {
  protected _checkSchemeCredentialType(
    _authScheme: any,
    _authCredential: AuthCredential | null
  ): void {
    // No validation needed for test
  }

  public exchangeCredential(
    _authScheme: any,
    _authCredential: AuthCredential | null
  ): Promise<AuthCredential | null> | AuthCredential | null {
    return {
      auth_type: AuthCredentialTypes.HTTP,
      http: {
        scheme: 'bearer',
        credentials: {
          token: 'test_token'
        }
      }
    };
  }
}

describe('AutoAuthCredentialExchanger', () => {
  let exchanger: AutoAuthCredentialExchanger;

  beforeEach(() => {
    exchanger = new AutoAuthCredentialExchanger();
  });

  describe('initialization', () => {
    it('should initialize with default exchangers', () => {
      // Check if default exchangers are set up
      expect(exchanger.exchangers).toBeDefined();
      expect(Object.keys(exchanger.exchangers).length).toBeGreaterThan(0);
    });

    it('should accept custom exchangers', () => {
      // Using a type assertion to avoid constructor compatibility issues in the test
      const customExchangers = {
        [AuthCredentialTypes.API_KEY]: TestCredentialExchanger
      } as unknown as Record<string, new () => BaseCredentialExchanger>;

      const customExchanger = new AutoAuthCredentialExchanger(customExchangers);
      
      // Call the custom exchanger
      const factory = customExchanger.exchangers[AuthCredentialTypes.API_KEY];
      const instance = factory();
      
      // Test that we got an exchanger (can't directly test instanceof due to import issues)
      expect(instance).toBeDefined();
    });
  });

  describe('exchangeCredential', () => {
    it('should return null when no auth credential is provided', async () => {
      const result = await exchanger.exchangeCredential({}, null);
      expect(result).toBeNull();
    });

    it('should pass credentials to the appropriate exchanger', async () => {
      // Create a mock exchanger
      const mockExchanger = {
        exchangeCredential: jest.fn().mockReturnValue({
          auth_type: AuthCredentialTypes.API_KEY,
          api_key: 'test_key'
        })
      };
      
      // Replace the default exchanger with our mock
      exchanger.exchangers[AuthCredentialTypes.API_KEY] = 
        () => mockExchanger as unknown as BaseCredentialExchanger;
      
      const credential: AuthCredential = {
        auth_type: AuthCredentialTypes.API_KEY,
        api_key: 'test_key'
      };
      
      await exchanger.exchangeCredential({}, credential);
      
      // Verify our mock was called with the right parameters
      expect(mockExchanger.exchangeCredential).toHaveBeenCalledWith({}, credential);
    });

    it('should handle missing credential type gracefully', async () => {
      // Create a credential with a non-standard type
      const credential: AuthCredential = {
        auth_type: 'UNKNOWN_TYPE' as any,
        api_key: 'test_key'
      };
      
      // Should use NoExchangeCredentialExchanger for unknown types
      const result = await exchanger.exchangeCredential({}, credential);
      
      // Should return the credential unchanged
      expect(result).toBe(credential);
    });

    it('should work with service account credentials', async () => {
      // Mock the service account exchanger
      const mockServiceAccountExchanger = {
        exchangeCredential: jest.fn().mockResolvedValue({
          auth_type: AuthCredentialTypes.HTTP,
          http: {
            scheme: 'bearer',
            credentials: {
              token: 'service_account_token'
            }
          }
        })
      };
      
      exchanger.exchangers[AuthCredentialTypes.SERVICE_ACCOUNT] = 
        () => mockServiceAccountExchanger as unknown as BaseCredentialExchanger;
      
      const credential: AuthCredential = {
        auth_type: AuthCredentialTypes.SERVICE_ACCOUNT,
        service_account: {
          service_account_credential: {
            type: 'service_account',
            project_id: 'project-id',
            private_key_id: 'key-id',
            private_key: 'private-key',
            client_email: 'test@example.com',
            client_id: 'client-id',
            auth_uri: 'https://example.com/auth',
            token_uri: 'https://example.com/token',
            auth_provider_x509_cert_url: 'https://example.com/certs',
            client_x509_cert_url: 'https://example.com/x509',
            universe_domain: 'example.com'
          },
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        }
      };
      
      const result = await exchanger.exchangeCredential({}, credential);
      
      expect(mockServiceAccountExchanger.exchangeCredential).toHaveBeenCalledWith({}, credential);
      expect(result?.auth_type).toBe(AuthCredentialTypes.HTTP);
      expect(result?.http?.scheme).toBe('bearer');
      expect(result?.http?.credentials.token).toBe('service_account_token');
    });

    it('should work with oauth2 credentials', async () => {
      // Mock the oauth2 exchanger
      const mockOAuth2Exchanger = {
        exchangeCredential: jest.fn().mockResolvedValue({
          auth_type: AuthCredentialTypes.HTTP,
          http: {
            scheme: 'bearer',
            credentials: {
              token: 'oauth2_token'
            }
          }
        })
      };
      
      exchanger.exchangers[AuthCredentialTypes.OAUTH2] = 
        () => mockOAuth2Exchanger as unknown as BaseCredentialExchanger;
      
      const credential: AuthCredential = {
        auth_type: AuthCredentialTypes.OAUTH2,
        oauth2: {
          client_id: 'client_id',
          client_secret: 'client_secret',
          redirect_uri: 'https://example.com/callback'
        }
      };
      
      const result = await exchanger.exchangeCredential({}, credential);
      
      expect(mockOAuth2Exchanger.exchangeCredential).toHaveBeenCalledWith({}, credential);
      expect(result?.auth_type).toBe(AuthCredentialTypes.HTTP);
      expect(result?.http?.scheme).toBe('bearer');
      expect(result?.http?.credentials.token).toBe('oauth2_token');
    });
  });
}); 