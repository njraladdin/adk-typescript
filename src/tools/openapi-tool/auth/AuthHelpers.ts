/**
 * Authentication helpers for OpenAPI tools
 */

import { AuthSchemeType } from './AuthTypes';
import { AuthCredential, AuthCredentialTypes } from '../../../auth/AuthCredential';
import { ApiParameter } from '../common/common';
import axios from 'axios';

// Types
export enum APIKeyIn {
  header = 'header',
  query = 'query',
  cookie = 'cookie',
}

// Auth scheme classes
export class APIKey {
  type_: AuthSchemeType;
  in_: APIKeyIn;
  name: string;

  constructor(config: {
    type_: AuthSchemeType;
    in_: APIKeyIn;
    name: string;
  }) {
    this.type_ = config.type_;
    this.in_ = config.in_;
    this.name = config.name;
  }
}

export class HTTPBase {
  type_: AuthSchemeType;
  scheme: string;

  constructor(config: {
    type_: AuthSchemeType;
    scheme: string;
  }) {
    this.type_ = config.type_;
    this.scheme = config.scheme;
  }
}

export class HTTPBearer extends HTTPBase {
  bearerFormat?: string;

  constructor(config: {
    type_: AuthSchemeType;
    scheme: string;
    bearerFormat?: string;
  }) {
    super({
      type_: config.type_,
      scheme: config.scheme,
    });
    this.bearerFormat = config.bearerFormat;
  }
}

export class OAuth2 {
  type_: AuthSchemeType;
  flows: Record<string, any>;

  constructor(config: {
    type_: AuthSchemeType;
    flows: Record<string, any>;
  }) {
    this.type_ = config.type_;
    this.flows = config.flows;
  }
}

export class OpenIdConnect {
  type_: AuthSchemeType;
  openIdConnectUrl: string;

  constructor(config: {
    type_: AuthSchemeType;
    openIdConnectUrl: string;
  }) {
    this.type_ = config.type_;
    this.openIdConnectUrl = config.openIdConnectUrl;
  }
}

export class OpenIdConnectWithConfig extends OpenIdConnect {
  authorization_endpoint: string;
  token_endpoint: string;
  scopes: string[];

  constructor(config: {
    type_: AuthSchemeType;
    openIdConnectUrl: string;
    authorization_endpoint: string;
    token_endpoint: string;
    scopes: string[];
  }) {
    super({
      type_: config.type_,
      openIdConnectUrl: config.openIdConnectUrl,
    });
    this.authorization_endpoint = config.authorization_endpoint;
    this.token_endpoint = config.token_endpoint;
    this.scopes = config.scopes;
  }
}

// Auth types
export interface HttpCredentials {
  token?: string;
  username?: string;
  password?: string;
}

export interface HttpAuth {
  scheme: string;
  credentials: HttpCredentials;
}

export interface ServiceAccountCredential {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

export interface ServiceAccount {
  service_account_credential: ServiceAccountCredential;
  scopes: string[];
}

// Prefix for internal auth parameters
export const INTERNAL_AUTH_PREFIX = '__auth_';

/**
 * Convert a token to a scheme and credential
 */
export function tokenToSchemeCredential(
  tokenType: string,
  location: string,
  name: string,
  token?: string
): [any, AuthCredential | null] {
  let scheme: any;
  let credential: AuthCredential | null = null;

  if (tokenType.toLowerCase() === 'apikey') {
    scheme = new APIKey({
      type_: AuthSchemeType.apiKey,
      in_: location as APIKeyIn,
      name: name,
    });

    if (token) {
      credential = {
        auth_type: AuthCredentialTypes.API_KEY,
        api_key: token,
      };
    }
  } else if (tokenType.toLowerCase() === 'oauth2token') {
    scheme = new HTTPBearer({
      type_: AuthSchemeType.http,
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });

    if (token) {
      credential = {
        auth_type: AuthCredentialTypes.HTTP,
        http: {
          scheme: 'bearer',
          credentials: {
            token: token
          }
        }
      };
    }
  }

  return [scheme, credential];
}

/**
 * Convert a service account config dict to a scheme and credential
 */
export function serviceAccountDictToSchemeCredential(
  config: Record<string, any>,
  scopes: string[]
): [HTTPBearer, AuthCredential] {
  const scheme = new HTTPBearer({
    type_: AuthSchemeType.http,
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  const credential: AuthCredential = {
    auth_type: AuthCredentialTypes.SERVICE_ACCOUNT,
    service_account: {
      service_account_credential: {
        type: config.type,
        project_id: config.project_id,
        private_key_id: config.private_key_id,
        private_key: config.private_key,
        client_email: config.client_email,
        client_id: config.client_id,
        auth_uri: config.auth_uri,
        token_uri: config.token_uri,
        auth_provider_x509_cert_url: config.auth_provider_x509_cert_url,
        client_x509_cert_url: config.client_x509_cert_url,
        universe_domain: config.universe_domain,
      },
      scopes: scopes,
    },
  };

  return [scheme, credential];
}

/**
 * Convert a ServiceAccount to a scheme and credential
 */
export function serviceAccountSchemeCredential(
  config: ServiceAccount
): [HTTPBearer, AuthCredential] {
  const scheme = new HTTPBearer({
    type_: AuthSchemeType.http,
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  const credential: AuthCredential = {
    auth_type: AuthCredentialTypes.SERVICE_ACCOUNT,
    service_account: config,
  };

  return [scheme, credential];
}

/**
 * Convert an OpenID Connect config dict to a scheme and credential
 */
export function openidDictToSchemeCredential(
  configDict: Record<string, any>,
  scopes: string[],
  credentialDict: Record<string, any>
): [OpenIdConnectWithConfig, AuthCredential] {
  // Validate required fields in the OpenID Connect configuration
  if (!configDict.authorization_endpoint || !configDict.token_endpoint) {
    throw new Error('Invalid OpenID Connect configuration');
  }

  let clientId: string;
  let clientSecret: string;
  let redirectUri: string | undefined;

  // Check if we have google oauth credential format
  if ('web' in credentialDict) {
    clientId = credentialDict.web.client_id;
    clientSecret = credentialDict.web.client_secret;
    redirectUri = credentialDict.web.redirect_uri;
  } else {
    clientId = credentialDict.client_id;
    clientSecret = credentialDict.client_secret;
    redirectUri = credentialDict.redirect_uri;
  }

  // Validate required fields in the credential dictionary
  const missingFields: string[] = [];
  if (!clientId) missingFields.push('client_id');
  if (!clientSecret) missingFields.push('client_secret');
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields in credential_dict: ${missingFields.join(', ')}`);
  }

  const scheme = new OpenIdConnectWithConfig({
    type_: AuthSchemeType.openIdConnect,
    openIdConnectUrl: configDict.openIdConnectUrl || '',
    authorization_endpoint: configDict.authorization_endpoint,
    token_endpoint: configDict.token_endpoint,
    scopes: scopes,
  });

  const credential: AuthCredential = {
    auth_type: AuthCredentialTypes.OPEN_ID_CONNECT,
    oauth2: {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    },
  };

  return [scheme, credential];
}

/**
 * Fetch OpenID Connect configuration from a URL and convert to a scheme and credential
 */
export async function openidUrlToSchemeCredential(
  openidUrl: string,
  scopes: string[],
  credentialDict: Record<string, any>
): Promise<[OpenIdConnectWithConfig, AuthCredential]> {
  try {
    const response = await axios.get(openidUrl, { timeout: 10000 });
    const config = response.data;

    if (!config) {
      throw new Error('Invalid JSON response');
    }

    // Add openIdConnectUrl to the config
    config.openIdConnectUrl = openidUrl;

    return openidDictToSchemeCredential(config, scopes, credentialDict);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid JSON response') {
      throw new Error(`Invalid JSON response from OpenID configuration endpoint ${openidUrl}`);
    }
    throw new Error(`Failed to fetch OpenID configuration from ${openidUrl}`);
  }
}

/**
 * Convert an auth credential to a parameter and keyword args
 */
export function credentialToParam(
  authScheme: any,
  authCredential: AuthCredential | null
): [ApiParameter | null, Record<string, any> | null] {
  if (!authCredential) {
    return [null, null];
  }

  if (authScheme instanceof APIKey) {
    const paramLocation = authScheme.in_;
    const paramName = authScheme.name;

    if (authCredential.auth_type === AuthCredentialTypes.API_KEY && authCredential.api_key) {
      const param = new ApiParameter(paramName, paramLocation, {});
      const kwargs = { [INTERNAL_AUTH_PREFIX + paramName]: authCredential.api_key };
      return [param, kwargs];
    }
  } else if (
    authScheme instanceof HTTPBearer ||
    authScheme instanceof OAuth2 ||
    authScheme instanceof OpenIdConnect
  ) {
    // For bearer tokens, always use Authorization header
    const paramName = 'Authorization';
    const paramLocation = 'header';

    if (authCredential.auth_type === AuthCredentialTypes.HTTP && 
        authCredential.http?.scheme === 'bearer' && 
        authCredential.http?.credentials?.token) {
      const param = new ApiParameter(paramName, paramLocation, {});
      const kwargs = { [INTERNAL_AUTH_PREFIX + paramName]: `Bearer ${authCredential.http.credentials.token}` };
      return [param, kwargs];
    }
  } else if (authScheme instanceof HTTPBase) {
    if (authScheme.scheme === 'basic') {
      throw new Error('Basic Authentication is not supported.');
    }

    if (authCredential.auth_type === AuthCredentialTypes.HTTP && 
        (!authCredential.http || !authCredential.http.credentials)) {
      throw new Error('Invalid HTTP auth credentials');
    }
  }

  throw new Error(`Unsupported auth scheme or credential combination`);
}

/**
 * Convert a dictionary to an auth scheme
 */
export function dictToAuthScheme(data: Record<string, any>): any {
  if (!data.type) {
    throw new Error("Missing 'type' field in security scheme dictionary.");
  }

  switch (data.type) {
    case 'apiKey':
      if (!data.in || !data.name) {
        throw new Error('Invalid security scheme data');
      }
      return new APIKey({
        type_: AuthSchemeType.apiKey,
        in_: data.in as APIKeyIn,
        name: data.name,
      });

    case 'http':
      if (!data.scheme) {
        throw new Error('Invalid security scheme data');
      }
      if (data.scheme === 'bearer') {
        return new HTTPBearer({
          type_: AuthSchemeType.http,
          scheme: data.scheme,
          bearerFormat: data.bearerFormat,
        });
      }
      return new HTTPBase({
        type_: AuthSchemeType.http,
        scheme: data.scheme,
      });

    case 'oauth2':
      return new OAuth2({
        type_: AuthSchemeType.oauth2,
        flows: data.flows || {},
      });

    case 'openIdConnect':
      if (!data.openIdConnectUrl) {
        throw new Error('Invalid security scheme data');
      }
      return new OpenIdConnect({
        type_: AuthSchemeType.openIdConnect,
        openIdConnectUrl: data.openIdConnectUrl,
      });

    default:
      throw new Error(`Invalid security scheme type: ${data.type}`);
  }
} 