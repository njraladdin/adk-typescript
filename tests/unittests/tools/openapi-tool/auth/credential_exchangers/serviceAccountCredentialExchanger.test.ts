/**
 * Tests for ServiceAccountCredentialExchanger
 */

import { AuthCredential, AuthCredentialTypes } from '../../../../../../src/auth/AuthCredential';
import { AuthSchemeType } from '../../../../../../src/tools/openapi-tool/auth/AuthTypes';
import { ServiceAccountCredentialExchanger } from '../../../../../../src/tools/openapi-tool/auth/credential_exchangers/ServiceAccountCredentialExchanger';
import { AuthCredentialMissingError } from '../../../../../../src/tools/openapi-tool/auth/credential_exchangers/BaseCredentialExchanger';
import { OAuth2 } from '../../../../../../src/tools/openapi-tool/auth/AuthHelpers';

describe('ServiceAccountCredentialExchanger', () => {
  let serviceAccountExchanger: ServiceAccountCredentialExchanger;
  let authScheme: OAuth2;

  beforeEach(() => {
    serviceAccountExchanger = new ServiceAccountCredentialExchanger();
    authScheme = new OAuth2({
      type_: AuthSchemeType.oauth2,
      flows: {}
    });

    // Mock the internal _getAccessToken method to avoid actual API calls
    jest.spyOn(
      // @ts-ignore - Accessing private method for testing
      serviceAccountExchanger as any, 
      '_getAccessToken'
    ).mockImplementation(async (...args: any[]) => {
      const credential = args[0] as AuthCredential;
      // Different tokens based on credential type
      if (credential.service_account?.use_default_credential) {
        return 'mock_default_access_token';
      }
      return 'mock_access_token';
    });
  });

  describe('exchangeCredential', () => {
    test('successfully exchanges service account credentials', async () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.SERVICE_ACCOUNT,
        service_account: {
          service_account_credential: {
            type: 'service_account',
            project_id: 'your_project_id',
            private_key_id: 'your_private_key_id',
            private_key: '-----BEGIN PRIVATE KEY-----...',
            client_email: '...@....iam.gserviceaccount.com',
            client_id: 'your_client_id',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/...',
            universe_domain: 'googleapis.com'
          },
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        }
      };

      const result = await serviceAccountExchanger.exchangeCredential(authScheme, authCredential);

      expect(result.auth_type).toBe(AuthCredentialTypes.HTTP);
      expect(result.http?.scheme).toBe('bearer');
      expect(result.http?.credentials.token).toBe('mock_access_token');
    });

    test('successfully exchanges using default credentials', async () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.SERVICE_ACCOUNT,
        service_account: {
          use_default_credential: true,
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        }
      };

      const result = await serviceAccountExchanger.exchangeCredential(authScheme, authCredential);

      expect(result.auth_type).toBe(AuthCredentialTypes.HTTP);
      expect(result.http?.scheme).toBe('bearer');
      expect(result.http?.credentials.token).toBe('mock_default_access_token');
    });

    test('throws error when auth credential is missing', async () => {
      await expect(
        serviceAccountExchanger.exchangeCredential(authScheme, null)
      ).rejects.toThrow(AuthCredentialMissingError);
      
      await expect(
        serviceAccountExchanger.exchangeCredential(authScheme, null)
      ).rejects.toThrow('Service account credentials are missing');
    });

    test('throws error when service account info is missing', async () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.SERVICE_ACCOUNT
      };

      await expect(
        serviceAccountExchanger.exchangeCredential(authScheme, authCredential)
      ).rejects.toThrow('Service account credentials are missing');
    });

    test('throws error when auth type is incorrect', async () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.API_KEY,
        api_key: 'test-key'
      };

      await expect(
        serviceAccountExchanger.exchangeCredential(authScheme, authCredential)
      ).rejects.toThrow('Service account credentials are missing');
    });
  });

  describe('_checkSchemeCredentialType', () => {
    test('succeeds with valid credential', () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.SERVICE_ACCOUNT,
        service_account: {
          service_account_credential: {
            type: 'service_account',
            project_id: 'your_project_id',
            private_key_id: 'your_private_key_id',
            private_key: '-----BEGIN PRIVATE KEY-----...',
            client_email: '...@....iam.gserviceaccount.com',
            client_id: 'your_client_id',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/...',
            universe_domain: 'googleapis.com'
          },
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        }
      };

      // The method should not throw an exception
      expect(() => {
        // @ts-ignore - accessing protected method for testing
        serviceAccountExchanger._checkSchemeCredentialType(authScheme, authCredential);
      }).not.toThrow();
    });
  });
}); 