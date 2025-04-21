

/**
 * Enum representing different authentication schemes
 */
export enum AuthScheme {
  /** No authentication */
  NONE = 'NONE',
  
  /** API key authentication */
  API_KEY = 'API_KEY',
  
  /** Basic authentication with username and password */
  BASIC = 'BASIC',
  
  /** OAuth 2.0 authentication */
  OAUTH2 = 'OAUTH2',
  
  /** OpenID Connect authentication */
  OIDC = 'OIDC',
  
  /** Google service account authentication */
  SERVICE_ACCOUNT = 'SERVICE_ACCOUNT',
  
  /** Custom authentication mechanism */
  CUSTOM = 'CUSTOM'
} 