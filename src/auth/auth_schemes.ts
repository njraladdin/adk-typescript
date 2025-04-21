

/**
 * Base interface for authentication schemes
 */
export interface AuthScheme {
  /**
   * The type of authentication scheme
   */
  type: string;
  
  /**
   * Generate authentication headers for HTTP requests
   * @param credentials The credentials to use for authentication
   * @returns The headers to include in HTTP requests
   */
  generateHeaders: (credentials: any) => Record<string, string>;
}

/**
 * API key authentication scheme
 */
export class ApiKeyAuthScheme implements AuthScheme {
  type = 'apiKey';
  private headerName: string;
  
  /**
   * Initializes the API key authentication scheme
   * @param headerName The name of the header to include the API key in
   */
  constructor(headerName: string = 'X-Api-Key') {
    this.headerName = headerName;
  }
  
  /**
   * Generate authentication headers for HTTP requests
   * @param apiKey The API key to include in the headers
   * @returns The headers to include in HTTP requests
   */
  generateHeaders(apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {};
    headers[this.headerName] = apiKey;
    return headers;
  }
}

/**
 * Bearer token authentication scheme
 */
export class BearerAuthScheme implements AuthScheme {
  type = 'bearer';
  
  /**
   * Generate authentication headers for HTTP requests
   * @param token The bearer token to include in the headers
   * @returns The headers to include in HTTP requests
   */
  generateHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`
    };
  }
}

/**
 * Basic authentication scheme
 */
export class BasicAuthScheme implements AuthScheme {
  type = 'basic';
  
  /**
   * Generate authentication headers for HTTP requests
   * @param credentials The credentials to use for authentication
   * @param credentials.username The username for basic authentication
   * @param credentials.password The password for basic authentication
   * @returns The headers to include in HTTP requests
   */
  generateHeaders(credentials: { username: string, password: string }): Record<string, string> {
    const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`
    };
  }
} 