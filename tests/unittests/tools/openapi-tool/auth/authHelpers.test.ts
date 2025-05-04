import { AuthSchemeType } from '../../../../../src/tools/openapi-tool/auth/AuthTypes';
import { AuthCredential, AuthCredentialTypes } from '../../../../../src/auth/AuthCredential';
import { 
  tokenToSchemeCredential,
  serviceAccountDictToSchemeCredential,
  serviceAccountSchemeCredential,
  openidDictToSchemeCredential,
  openidUrlToSchemeCredential,
  credentialToParam,
  dictToAuthScheme,
  INTERNAL_AUTH_PREFIX,
  APIKeyIn,
  APIKey,
  HTTPBase,
  HTTPBearer,
  OAuth2,
  OpenIdConnect,
  OpenIdConnectWithConfig,
  HttpAuth,
  HttpCredentials,
  ServiceAccount
} from '../../../../../src/tools/openapi-tool/auth/AuthHelpers';
import axios from 'axios';

// Mock axios for testing
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthHelpers', () => {
  describe('tokenToSchemeCredential', () => {
    test('api key header', () => {
      const [scheme, credential] = tokenToSchemeCredential(
        'apikey', 'header', 'X-API-Key', 'test_key'
      );

      expect(scheme).toBeInstanceOf(APIKey);
      expect(scheme.type_).toBe(AuthSchemeType.apiKey);
      expect(scheme.in_).toBe(APIKeyIn.header);
      expect(scheme.name).toBe('X-API-Key');
      expect(credential).toEqual({
        auth_type: AuthCredentialTypes.API_KEY,
        api_key: 'test_key'
      });
    });

    test('api key query', () => {
      const [scheme, credential] = tokenToSchemeCredential(
        'apikey', 'query', 'api_key', 'test_key'
      );

      expect(scheme).toBeInstanceOf(APIKey);
      expect(scheme.type_).toBe(AuthSchemeType.apiKey);
      expect(scheme.in_).toBe(APIKeyIn.query);
      expect(scheme.name).toBe('api_key');
      expect(credential).toEqual({
        auth_type: AuthCredentialTypes.API_KEY,
        api_key: 'test_key'
      });
    });

    test('api key cookie', () => {
      const [scheme, credential] = tokenToSchemeCredential(
        'apikey', 'cookie', 'session_id', 'test_key'
      );

      expect(scheme).toBeInstanceOf(APIKey);
      expect(scheme.type_).toBe(AuthSchemeType.apiKey);
      expect(scheme.in_).toBe(APIKeyIn.cookie);
      expect(scheme.name).toBe('session_id');
      expect(credential).toEqual({
        auth_type: AuthCredentialTypes.API_KEY,
        api_key: 'test_key'
      });
    });

    test('api key no credential', () => {
      const [scheme, credential] = tokenToSchemeCredential(
        'apikey', 'cookie', 'session_id'
      );

      expect(scheme).toBeInstanceOf(APIKey);
      expect(credential).toBeNull();
    });

    test('oauth2 token', () => {
      const [scheme, credential] = tokenToSchemeCredential(
        'oauth2Token', 'header', 'Authorization', 'test_token'
      );

      expect(scheme).toBeInstanceOf(HTTPBearer);
      expect(scheme.bearerFormat).toBe('JWT');
      expect(credential).toEqual({
        auth_type: AuthCredentialTypes.HTTP,
        http: {
          scheme: 'bearer',
          credentials: {
            token: 'test_token'
          }
        }
      });
    });

    test('oauth2 no credential', () => {
      const [scheme, credential] = tokenToSchemeCredential(
        'oauth2Token', 'header', 'Authorization'
      );

      expect(scheme).toBeInstanceOf(HTTPBearer);
      expect(credential).toBeNull();
    });
  });

  describe('serviceAccountDictToSchemeCredential', () => {
    test('creates scheme and credential from config', () => {
      const config = {
        type: 'service_account',
        project_id: 'project_id',
        private_key_id: 'private_key_id',
        private_key: 'private_key',
        client_email: 'client_email',
        client_id: 'client_id',
        auth_uri: 'auth_uri',
        token_uri: 'token_uri',
        auth_provider_x509_cert_url: 'auth_provider_x509_cert_url',
        client_x509_cert_url: 'client_x509_cert_url',
        universe_domain: 'universe_domain'
      };
      const scopes = ['scope1', 'scope2'];

      const [scheme, credential] = serviceAccountDictToSchemeCredential(config, scopes);

      expect(scheme).toBeInstanceOf(HTTPBearer);
      expect(scheme.bearerFormat).toBe('JWT');
      expect(credential.auth_type).toBe(AuthCredentialTypes.SERVICE_ACCOUNT);
      expect(credential.service_account?.scopes).toEqual(scopes);
      expect(credential.service_account?.service_account_credential?.project_id).toBe('project_id');
    });
  });

  describe('serviceAccountSchemeCredential', () => {
    test('creates scheme and credential from ServiceAccount', () => {
      const config: ServiceAccount = {
        service_account_credential: {
          type: 'service_account',
          project_id: 'project_id',
          private_key_id: 'private_key_id',
          private_key: 'private_key',
          client_email: 'client_email',
          client_id: 'client_id',
          auth_uri: 'auth_uri',
          token_uri: 'token_uri',
          auth_provider_x509_cert_url: 'auth_provider_x509_cert_url',
          client_x509_cert_url: 'client_x509_cert_url',
          universe_domain: 'universe_domain'
        },
        scopes: ['scope1', 'scope2']
      };

      const [scheme, credential] = serviceAccountSchemeCredential(config);

      expect(scheme).toBeInstanceOf(HTTPBearer);
      expect(scheme.bearerFormat).toBe('JWT');
      expect(credential.auth_type).toBe(AuthCredentialTypes.SERVICE_ACCOUNT);
      expect(credential.service_account).toEqual(config);
    });
  });

  describe('openidDictToSchemeCredential', () => {
    test('creates scheme and credential from config', () => {
      const configDict = {
        authorization_endpoint: 'auth_url',
        token_endpoint: 'token_url',
        openIdConnectUrl: 'openid_url'
      };
      const credentialDict = {
        client_id: 'client_id',
        client_secret: 'client_secret',
        redirect_uri: 'redirect_uri'
      };
      const scopes = ['scope1', 'scope2'];

      const [scheme, credential] = openidDictToSchemeCredential(
        configDict, scopes, credentialDict
      );

      expect(scheme).toBeInstanceOf(OpenIdConnectWithConfig);
      expect(scheme.authorization_endpoint).toBe('auth_url');
      expect(scheme.token_endpoint).toBe('token_url');
      expect(scheme.scopes).toEqual(scopes);
      expect(credential.auth_type).toBe(AuthCredentialTypes.OPEN_ID_CONNECT);
      expect(credential.oauth2?.client_id).toBe('client_id');
      expect(credential.oauth2?.client_secret).toBe('client_secret');
      expect(credential.oauth2?.redirect_uri).toBe('redirect_uri');
    });

    test('handles missing openid_url', () => {
      const configDict = {
        authorization_endpoint: 'auth_url',
        token_endpoint: 'token_url'
      };
      const credentialDict = {
        client_id: 'client_id',
        client_secret: 'client_secret',
        redirect_uri: 'redirect_uri'
      };
      const scopes = ['scope1', 'scope2'];

      const [scheme, credential] = openidDictToSchemeCredential(
        configDict, scopes, credentialDict
      );

      expect(scheme.openIdConnectUrl).toBe('');
    });

    test('handles google oauth credential format', () => {
      const configDict = {
        authorization_endpoint: 'auth_url',
        token_endpoint: 'token_url',
        openIdConnectUrl: 'openid_url'
      };
      const credentialDict = {
        web: {
          client_id: 'client_id',
          client_secret: 'client_secret',
          redirect_uri: 'redirect_uri'
        }
      };
      const scopes = ['scope1', 'scope2'];

      const [scheme, credential] = openidDictToSchemeCredential(
        configDict, scopes, credentialDict
      );

      expect(scheme).toBeInstanceOf(OpenIdConnectWithConfig);
      expect(credential.auth_type).toBe(AuthCredentialTypes.OPEN_ID_CONNECT);
      expect(credential.oauth2?.client_id).toBe('client_id');
      expect(credential.oauth2?.client_secret).toBe('client_secret');
      expect(credential.oauth2?.redirect_uri).toBe('redirect_uri');
    });

    test('throws error for invalid config', () => {
      const configDict = {
        invalid_field: 'value'
      };
      const credentialDict = {
        client_id: 'client_id',
        client_secret: 'client_secret'
      };
      const scopes = ['scope1', 'scope2'];

      expect(() => {
        openidDictToSchemeCredential(configDict, scopes, credentialDict);
      }).toThrow('Invalid OpenID Connect configuration');
    });

    test('throws error for missing credential fields', () => {
      const configDict = {
        authorization_endpoint: 'auth_url',
        token_endpoint: 'token_url'
      };
      const credentialDict = {
        client_id: 'client_id'
      };
      const scopes = ['scope1', 'scope2'];

      expect(() => {
        openidDictToSchemeCredential(configDict, scopes, credentialDict);
      }).toThrow('Missing required fields in credential_dict: client_secret');
    });
  });

  describe('openidUrlToSchemeCredential', () => {
    test('fetches config and creates scheme and credential', async () => {
      const mockResponse = {
        authorization_endpoint: 'auth_url',
        token_endpoint: 'token_url',
        userinfo_endpoint: 'userinfo_url'
      };
      mockedAxios.get.mockResolvedValueOnce({ 
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });

      const credentialDict = {
        client_id: 'client_id',
        client_secret: 'client_secret',
        redirect_uri: 'redirect_uri'
      };
      const scopes = ['scope1', 'scope2'];

      const [scheme, credential] = await openidUrlToSchemeCredential(
        'openid_url', scopes, credentialDict
      );

      expect(scheme).toBeInstanceOf(OpenIdConnectWithConfig);
      expect(scheme.authorization_endpoint).toBe('auth_url');
      expect(scheme.token_endpoint).toBe('token_url');
      expect(scheme.scopes).toEqual(scopes);
      expect(credential.auth_type).toBe(AuthCredentialTypes.OPEN_ID_CONNECT);
      expect(credential.oauth2?.client_id).toBe('client_id');
      expect(credential.oauth2?.client_secret).toBe('client_secret');
      expect(credential.oauth2?.redirect_uri).toBe('redirect_uri');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('openid_url', { timeout: 10000 });
    });

    test('preserves openid_url in scheme', async () => {
      const mockResponse = {
        authorization_endpoint: 'auth_url',
        token_endpoint: 'token_url',
        userinfo_endpoint: 'userinfo_url'
      };
      mockedAxios.get.mockResolvedValueOnce({ 
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });

      const credentialDict = {
        client_id: 'client_id',
        client_secret: 'client_secret',
        redirect_uri: 'redirect_uri'
      };
      const scopes = ['scope1', 'scope2'];

      const [scheme, credential] = await openidUrlToSchemeCredential(
        'openid_url', scopes, credentialDict
      );

      expect(scheme.openIdConnectUrl).toBe('openid_url');
    });

    test('throws error on request exception', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Test Error'));
      
      const credentialDict = {
        client_id: 'client_id', 
        client_secret: 'client_secret'
      };

      await expect(
        openidUrlToSchemeCredential('openid_url', [], credentialDict)
      ).rejects.toThrow('Failed to fetch OpenID configuration from openid_url');
    });

    test('throws error on invalid JSON', async () => {
      mockedAxios.get.mockResolvedValueOnce({ 
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
      
      const credentialDict = {
        client_id: 'client_id', 
        client_secret: 'client_secret'
      };

      await expect(
        openidUrlToSchemeCredential('openid_url', [], credentialDict)
      ).rejects.toThrow('Invalid JSON response from OpenID configuration endpoint openid_url');
    });
  });

  describe('credentialToParam', () => {
    test('api key header', () => {
      const authScheme = new APIKey({
        type_: AuthSchemeType.apiKey,
        in_: APIKeyIn.header,
        name: 'X-API-Key'
      });
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.API_KEY,
        api_key: 'test_key'
      };

      const [param, kwargs] = credentialToParam(authScheme, authCredential);

      expect(param!.originalName).toBe('X-API-Key');
      expect(param!.paramLocation).toBe('header');
      expect(kwargs).toEqual({ [INTERNAL_AUTH_PREFIX + 'X-API-Key']: 'test_key' });
    });

    test('api key query', () => {
      const authScheme = new APIKey({
        type_: AuthSchemeType.apiKey,
        in_: APIKeyIn.query,
        name: 'api_key'
      });
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.API_KEY,
        api_key: 'test_key'
      };

      const [param, kwargs] = credentialToParam(authScheme, authCredential);

      expect(param!.originalName).toBe('api_key');
      expect(param!.paramLocation).toBe('query');
      expect(kwargs).toEqual({ [INTERNAL_AUTH_PREFIX + 'api_key']: 'test_key' });
    });

    test('api key cookie', () => {
      const authScheme = new APIKey({
        type_: AuthSchemeType.apiKey,
        in_: APIKeyIn.cookie,
        name: 'session_id'
      });
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.API_KEY,
        api_key: 'test_key'
      };

      const [param, kwargs] = credentialToParam(authScheme, authCredential);

      expect(param!.originalName).toBe('session_id');
      expect(param!.paramLocation).toBe('cookie');
      expect(kwargs).toEqual({ [INTERNAL_AUTH_PREFIX + 'session_id']: 'test_key' });
    });

    test('http bearer', () => {
      const authScheme = new HTTPBearer({
        type_: AuthSchemeType.http,
        scheme: 'bearer',
        bearerFormat: 'JWT'
      });
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.HTTP,
        http: {
          scheme: 'bearer',
          credentials: {
            token: 'test_token'
          }
        }
      };

      const [param, kwargs] = credentialToParam(authScheme, authCredential);

      expect(param!.originalName).toBe('Authorization');
      expect(param!.paramLocation).toBe('header');
      expect(kwargs).toEqual({ [INTERNAL_AUTH_PREFIX + 'Authorization']: 'Bearer test_token' });
    });

    test('http basic not supported', () => {
      const authScheme = new HTTPBase({
        type_: AuthSchemeType.http,
        scheme: 'basic'
      });
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.HTTP,
        http: {
          scheme: 'basic',
          credentials: {
            username: 'user',
            password: 'password'
          }
        }
      };

      expect(() => {
        credentialToParam(authScheme, authCredential);
      }).toThrow('Basic Authentication is not supported.');
    });

    test('http invalid credentials no http', () => {
      const authScheme = new HTTPBase({
        type_: AuthSchemeType.http,
        scheme: 'basic'
      });
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.HTTP
      };

      expect(() => {
        credentialToParam(authScheme, authCredential);
      }).toThrow('Basic Authentication is not supported.');
    });

    test('oauth2', () => {
      const authScheme = new OAuth2({
        type_: AuthSchemeType.oauth2,
        flows: {}
      });
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.HTTP,
        http: {
          scheme: 'bearer',
          credentials: {
            token: 'test_token'
          }
        }
      };

      const [param, kwargs] = credentialToParam(authScheme, authCredential);

      expect(param!.originalName).toBe('Authorization');
      expect(param!.paramLocation).toBe('header');
      expect(kwargs).toEqual({ [INTERNAL_AUTH_PREFIX + 'Authorization']: 'Bearer test_token' });
    });

    test('openid connect', () => {
      const authScheme = new OpenIdConnect({
        type_: AuthSchemeType.openIdConnect,
        openIdConnectUrl: 'openid_url'
      });
      const authCredential: AuthCredential = {
        auth_type: AuthCredentialTypes.HTTP,
        http: {
          scheme: 'bearer',
          credentials: {
            token: 'test_token'
          }
        }
      };

      const [param, kwargs] = credentialToParam(authScheme, authCredential);

      expect(param!.originalName).toBe('Authorization');
      expect(param!.paramLocation).toBe('header');
      expect(kwargs).toEqual({ [INTERNAL_AUTH_PREFIX + 'Authorization']: 'Bearer test_token' });
    });

    test('openid no credential', () => {
      const authScheme = new OpenIdConnect({
        type_: AuthSchemeType.openIdConnect,
        openIdConnectUrl: 'openid_url'
      });

      const [param, kwargs] = credentialToParam(authScheme, null);

      expect(param).toBeNull();
      expect(kwargs).toBeNull();
    });

    test('oauth2 no credential', () => {
      const authScheme = new OAuth2({
        type_: AuthSchemeType.oauth2,
        flows: {}
      });

      const [param, kwargs] = credentialToParam(authScheme, null);

      expect(param).toBeNull();
      expect(kwargs).toBeNull();
    });
  });

  describe('dictToAuthScheme', () => {
    test('api key', () => {
      const data = { 
        type: 'apiKey', 
        in: 'header', 
        name: 'X-API-Key' 
      };

      const scheme = dictToAuthScheme(data);

      expect(scheme).toBeInstanceOf(APIKey);
      expect(scheme.type_).toBe(AuthSchemeType.apiKey);
      expect(scheme.in_).toBe(APIKeyIn.header);
      expect(scheme.name).toBe('X-API-Key');
    });

    test('http bearer', () => {
      const data = { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT' 
      };

      const scheme = dictToAuthScheme(data);

      expect(scheme).toBeInstanceOf(HTTPBearer);
      expect(scheme.scheme).toBe('bearer');
      expect(scheme.bearerFormat).toBe('JWT');
    });

    test('http base', () => {
      const data = { 
        type: 'http', 
        scheme: 'basic' 
      };

      const scheme = dictToAuthScheme(data);

      expect(scheme).toBeInstanceOf(HTTPBase);
      expect(scheme.scheme).toBe('basic');
    });

    test('oauth2', () => {
      const data = {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/auth',
            tokenUrl: 'https://example.com/token',
          }
        }
      };

      const scheme = dictToAuthScheme(data);

      expect(scheme).toBeInstanceOf(OAuth2);
      expect(scheme.flows?.authorizationCode).toBeDefined();
    });

    test('openid connect', () => {
      const data = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration'
      };

      const scheme = dictToAuthScheme(data);

      expect(scheme).toBeInstanceOf(OpenIdConnect);
      expect(scheme.openIdConnectUrl).toBe('https://example.com/.well-known/openid-configuration');
    });

    test('missing type', () => {
      const data = { 
        in: 'header', 
        name: 'X-API-Key' 
      };
      
      expect(() => {
        dictToAuthScheme(data);
      }).toThrow("Missing 'type' field in security scheme dictionary.");
    });

    test('invalid type', () => {
      const data = { 
        type: 'invalid', 
        in: 'header', 
        name: 'X-API-Key' 
      };
      
      expect(() => {
        dictToAuthScheme(data);
      }).toThrow('Invalid security scheme type: invalid');
    });

    test('invalid data', () => {
      const data = { 
        type: 'apiKey', 
        in: 'header' 
      };  // Missing 'name'
      
      expect(() => {
        dictToAuthScheme(data);
      }).toThrow('Invalid security scheme data');
    });
  });
}); 