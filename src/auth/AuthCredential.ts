/**
 * Enum for authentication credential types.
 */
export enum AuthCredentialTypes {
  /**
   * API Key credential
   * https://swagger.io/docs/specification/v3_0/authentication/api-keys/
   */
  API_KEY = 'apiKey',

  /**
   * Credentials for HTTP Auth schemes
   * https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml
   */
  HTTP = 'http',

  /**
   * OAuth2 credentials
   * https://swagger.io/docs/specification/v3_0/authentication/oauth2/
   */
  OAUTH2 = 'oauth2',

  /**
   * OpenID Connect credentials
   * https://swagger.io/docs/specification/v3_0/authentication/openid-connect-discovery/
   */
  OPEN_ID_CONNECT = 'openIdConnect',

  /**
   * Service Account credentials
   * https://cloud.google.com/iam/docs/service-account-creds
   */
  SERVICE_ACCOUNT = 'serviceAccount',
}

/**
 * Interface for HTTP credentials like username, password, token
 */
export interface HttpCredentials {
  username?: string;
  password?: string;
  token?: string;
}

/**
 * Interface for HTTP Authentication
 */
export interface HttpAuth {
  /**
   * The name of the HTTP Authorization scheme to be used in the Authorization
   * header as defined in RFC7235. The values used SHOULD be registered in the
   * IANA Authentication Scheme registry.
   * Examples: 'basic', 'bearer'
   */
  scheme: string;
  credentials: HttpCredentials;
}

/**
 * Interface for OAuth2 Authentication
 */
export interface OAuth2Auth {
  client_id?: string;
  client_secret?: string;
  /** 
   * Tool or ADK can generate the auth_uri with the state info thus client
   * can verify the state
   */
  auth_uri?: string;
  state?: string;
  /**
   * Tool or ADK can decide the redirect_uri if they don't want client to decide
   */
  redirect_uri?: string;
  auth_response_uri?: string;
  auth_code?: string;
  /**
   * OAuth2 access token
   */
  access_token?: string;
  /**
   * OAuth2 refresh token
   */
  refresh_token?: string;
}

/**
 * Interface for Google Service Account configuration
 */
export interface ServiceAccountCredential {
  /**
   * The type should be "service_account"
   */
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

/**
 * Interface for Google Service Account with scopes
 */
export interface ServiceAccount {
  service_account_credential?: ServiceAccountCredential;
  scopes: string[];
  use_default_credential?: boolean;
}

/**
 * Interface for authentication credentials
 * 
 * Examples:
 * 
 * API Key Auth:
 * ```
 * {
 *   auth_type: AuthCredentialTypes.API_KEY,
 *   api_key: "1234"
 * }
 * ```
 * 
 * HTTP Auth:
 * ```
 * {
 *   auth_type: AuthCredentialTypes.HTTP,
 *   http: {
 *     scheme: "basic",
 *     credentials: { username: "user", password: "password" }
 *   }
 * }
 * ```
 * 
 * OAuth2 Bearer Token in HTTP Header:
 * ```
 * {
 *   auth_type: AuthCredentialTypes.HTTP,
 *   http: {
 *     scheme: "bearer",
 *     credentials: { token: "eyAkaknabna...." }
 *   }
 * }
 * ```
 * 
 * OAuth2 Auth with Authorization Code Flow:
 * ```
 * {
 *   auth_type: AuthCredentialTypes.OAUTH2,
 *   oauth2: {
 *     client_id: "1234",
 *     client_secret: "secret"
 *   }
 * }
 * ```
 * 
 * OpenID Connect Auth:
 * ```
 * {
 *   auth_type: AuthCredentialTypes.OPEN_ID_CONNECT,
 *   oauth2: {
 *     client_id: "1234",
 *     client_secret: "secret",
 *     redirect_uri: "https://example.com",
 *     scopes: ["scope1", "scope2"]
 *   }
 * }
 * ```
 * 
 * Auth with resource reference:
 * ```
 * {
 *   auth_type: AuthCredentialTypes.API_KEY,
 *   resource_ref: "projects/1234/locations/us-central1/resources/resource1"
 * }
 * ```
 */
export interface AuthCredential {
  auth_type: AuthCredentialTypes;
  
  /**
   * Resource reference for the credential.
   * This will be supported in the future.
   */
  resource_ref?: string;
  
  api_key?: string;
  http?: HttpAuth;
  service_account?: ServiceAccount;
  oauth2?: OAuth2Auth;
}

/**
 * API key credential implementation
 */
export class ApiKeyCredential {
  readonly auth_type = AuthCredentialTypes.API_KEY;
  private apiKey: string;
  
  /**
   * Initialize the API key credential
   * @param apiKey The API key value
   */
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Convert to AuthCredential interface
   */
  toAuthCredential(): AuthCredential {
    return {
      auth_type: this.auth_type,
      api_key: this.apiKey
    };
  }
}

/**
 * Bearer token credential implementation
 */
export class BearerCredential {
  readonly auth_type = AuthCredentialTypes.HTTP;
  private access_token: string;
  
  /**
   * Initialize the bearer token credential
   * @param token The bearer token value
   */
  constructor(token: string) {
    this.access_token = token;
  }
  
  /**
   * Convert to AuthCredential interface
   */
  toAuthCredential(): AuthCredential {
    return {
      auth_type: this.auth_type,
      http: {
        scheme: 'bearer',
        credentials: {
          token: this.access_token
        }
      }
    };
  }
}

/**
 * Basic auth credential implementation
 */
export class BasicCredential {
  readonly auth_type = AuthCredentialTypes.HTTP;
  private username: string;
  private password: string;
  
  /**
   * Initialize the basic auth credential
   * @param username The username
   * @param password The password
   */
  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
  
  /**
   * Convert to AuthCredential interface
   */
  toAuthCredential(): AuthCredential {
    return {
      auth_type: this.auth_type,
      http: {
        scheme: 'basic',
        credentials: {
          username: this.username,
          password: this.password
        }
      }
    };
  }
} 