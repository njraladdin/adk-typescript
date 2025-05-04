/**
 * Tests for the BaseCredentialExchanger class.
 */

import { AuthCredential, AuthCredentialTypes } from '../../../../../../src/auth/AuthCredential';
import { 
  AuthCredentialMissingError,
  BaseCredentialExchanger 
} from '../../../../../../src/tools/openapi-tool/auth/credential_exchangers/BaseCredentialExchanger';
import { AuthSchemeType } from '../../../../../../src/tools/openapi-tool/auth/AuthTypes';
import { APIKey, APIKeyIn } from '../../../../../../src/tools/openapi-tool/auth/AuthHelpers';

/**
 * Mock implementation of BaseCredentialExchanger for testing
 */
class MockCredentialExchanger extends BaseCredentialExchanger {
  protected _checkSchemeCredentialType(
    authScheme: any,
    authCredential: AuthCredential | null
  ): void {
    // Do nothing for testing
  }

  public exchangeCredential(
    authScheme: any,
    authCredential: AuthCredential | null
  ): AuthCredential {
    return {
      auth_type: AuthCredentialTypes.API_KEY,
      api_key: 'some-token'
    };
  }
}

describe('BaseCredentialExchanger', () => {
  let mockExchanger: MockCredentialExchanger;
  let apiKeyScheme: APIKey;

  beforeEach(() => {
    mockExchanger = new MockCredentialExchanger();
    apiKeyScheme = new APIKey({
      type_: AuthSchemeType.apiKey,
      in_: APIKeyIn.header,
      name: 'x-api-key'
    });
  });

  describe('AuthCredentialMissingError', () => {
    test('error message is correctly set', () => {
      const errorMessage = 'Test missing credential';
      const error = new AuthCredentialMissingError(errorMessage);
      
      expect(error.message).toBe(errorMessage);
      expect(error.name).toBe('AuthCredentialMissingError');
    });
  });

  describe('BaseCredentialExchanger', () => {
    test('can be extended and implemented by subclasses', () => {
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.API_KEY,
        api_key: 'test-token'
      };
      
      const result = mockExchanger.exchangeCredential(apiKeyScheme, authCredential);
      
      expect(result.auth_type).toBe(AuthCredentialTypes.API_KEY);
      expect(result.api_key).toBe('some-token');
    });

    test('has abstract methods', () => {
      // We can't check abstract methods directly with Object.getOwnPropertyNames
      // as abstract methods in TypeScript are enforced at compile time, not runtime.
      // Instead, let's verify that attempting to use the abstract class without
      // implementing the required methods causes a TypeScript error.
      
      // This test verifies that BaseCredentialExchanger is correctly defined as abstract,
      // though we can't test it at runtime.
      
      // The following code would fail at compile time, which is the expected behavior
      // for abstract classes (we've commented it out):
      
      /* 
      // This would fail with: 
      // Cannot instantiate an abstract class
      const baseExchanger = new BaseCredentialExchanger();
      
      // This would fail with:
      // Non-abstract class must implement inherited abstract member
      class InvalidExchanger extends BaseCredentialExchanger {}
      */
      
      // Just verify we can extend it properly
      expect(mockExchanger).toBeInstanceOf(BaseCredentialExchanger);
      expect(mockExchanger.exchangeCredential).toBeDefined();
      
      // Verify the abstract method is callable on the subclass
      const result = mockExchanger.exchangeCredential(null, null);
      expect(result).toBeDefined();
    });
  });
}); 