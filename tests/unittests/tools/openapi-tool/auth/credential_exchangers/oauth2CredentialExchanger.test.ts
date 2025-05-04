/**
 * Tests for OAuth2CredentialExchanger
 */

import { AuthCredential, AuthCredentialTypes } from '../../../../../../src/auth/AuthCredential';
import { AuthSchemeType } from '../../../../../../src/tools/openapi-tool/auth/AuthTypes';
import { OpenIdConnectWithConfig } from '../../../../../../src/tools/openapi-tool/auth/AuthHelpers';
import { OAuth2CredentialExchanger } from '../../../../../../src/tools/openapi-tool/auth/credential_exchangers/OAuth2CredentialExchanger';
import { AuthCredentialMissingError } from '../../../../../../src/tools/openapi-tool/auth/credential_exchangers/BaseCredentialExchanger';

describe('OAuth2CredentialExchanger', () => {
  let oauth2Exchanger: OAuth2CredentialExchanger;
  let authScheme: OpenIdConnectWithConfig;

  beforeEach(() => {
    oauth2Exchanger = new OAuth2CredentialExchanger();
    authScheme = new OpenIdConnectWithConfig({
      type_: AuthSchemeType.openIdConnect,
      openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
      authorization_endpoint: 'https://example.com/auth',
      token_endpoint: 'https://example.com/token',
      scopes: ['openid', 'profile']
    });
  });

  describe('_checkSchemeCredentialType', () => {
    test('success with valid credential', () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.OAUTH2,
        oauth2: {
          client_id: 'test_client',
          client_secret: 'test_secret',
          redirect_uri: 'http://localhost:8080'
        }
      };

      // The method should not throw an exception
      expect(() => {
        // @ts-ignore - accessing protected method for testing
        oauth2Exchanger._checkSchemeCredentialType(authScheme, authCredential);
      }).not.toThrow();
    });

    test('throws error when credential is missing', () => {
      expect(() => {
        // @ts-ignore - accessing protected method for testing
        oauth2Exchanger._checkSchemeCredentialType(authScheme, null);
      }).toThrow('auth_credential is empty');
    });

    test('throws error with invalid auth scheme type', () => {
      const invalidScheme = { ...authScheme, type_: AuthSchemeType.apiKey };
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.OAUTH2,
        oauth2: {
          client_id: 'test_client',
          client_secret: 'test_secret',
          redirect_uri: 'http://localhost:8080'
        }
      };

      expect(() => {
        // @ts-ignore - accessing protected method for testing
        oauth2Exchanger._checkSchemeCredentialType(invalidScheme, authCredential);
      }).toThrow('Invalid security scheme');
    });

    test('throws error when oauth2 details are missing', () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.OAUTH2
      };

      expect(() => {
        // @ts-ignore - accessing protected method for testing
        oauth2Exchanger._checkSchemeCredentialType(authScheme, authCredential);
      }).toThrow('auth_credential is not configured with oauth2 details');
    });
  });

  describe('generateAuthToken', () => {
    test('successfully generates access token', () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.OAUTH2,
        oauth2: {
          client_id: 'test_client',
          client_secret: 'test_secret',
          redirect_uri: 'http://localhost:8080',
          auth_response_uri: 'https://example.com/callback?code=test_code',
          access_token: 'test_access_token'
        }
      };

      const updatedCredential = oauth2Exchanger.generateAuthToken(authCredential);

      expect(updatedCredential.auth_type).toBe(AuthCredentialTypes.HTTP);
      expect(updatedCredential.http?.scheme).toBe('bearer');
      expect(updatedCredential.http?.credentials.token).toBe('test_access_token');
    });

    test('throws error when access token is missing', () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.OAUTH2,
        oauth2: {
          client_id: 'test_client',
          client_secret: 'test_secret',
          redirect_uri: 'http://localhost:8080'
        }
      };

      expect(() => {
        oauth2Exchanger.generateAuthToken(authCredential);
      }).toThrow('No access token available');
    });
  });

  describe('exchangeCredential', () => {
    test('generates auth token when auth_response_uri is present', () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.OAUTH2,
        oauth2: {
          client_id: 'test_client',
          client_secret: 'test_secret',
          redirect_uri: 'http://localhost:8080',
          auth_response_uri: 'https://example.com/callback?code=test_code',
          access_token: 'test_access_token'
        }
      };

      const updatedCredential = oauth2Exchanger.exchangeCredential(authScheme, authCredential);

      expect(updatedCredential.auth_type).toBe(AuthCredentialTypes.HTTP);
      expect(updatedCredential.http?.scheme).toBe('bearer');
      expect(updatedCredential.http?.credentials.token).toBe('test_access_token');
    });

    test('throws error when auth_credential is missing', () => {
      expect(() => {
        oauth2Exchanger.exchangeCredential(authScheme, null);
      }).toThrow('auth_credential is empty');
    });
  });
}); 