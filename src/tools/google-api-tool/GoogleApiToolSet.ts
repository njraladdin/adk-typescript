import * as fs from 'fs';
import * as path from 'path';
import { GoogleApiTool, RestApiTool } from './GoogleApiTool';
import { GoogleApiToOpenApiConverterImpl } from './GoogleApiToOpenApiConverter';
import { BaseToolset, ToolPredicate } from '../BaseToolset';
import { ReadonlyContext } from '../../agents/ReadonlyContext';
import { OpenAPIToolset as OpenAPIToolsetImpl } from '../openapi-tool';



/**
 * OpenIdConnectWithConfig interface
 */
export interface OpenIdConnectWithConfig {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  revocationEndpoint: string;
  tokenEndpointAuthMethodsSupported: string[];
  grantTypesSupported: string[];
  scopes: string[];
}

/**
 * GoogleApiToOpenApiConverter interface (placeholder for actual implementation)
 */
export interface GoogleApiToOpenApiConverter {
  convert: () => Promise<Record<string, any>>;
}

/**
 * GoogleApiToolset contains tools for interacting with Google APIs.
 * 
 * Usually one toolset will contain tools only related to one Google API, e.g.
 * Google BigQuery API toolset will contain tools only related to Google
 * BigQuery API, like list dataset tool, list table tool etc.
 */
export class GoogleApiToolset extends BaseToolset {
  private openApiToolset: OpenAPIToolsetImpl;
  private toolFilter?: ToolPredicate | string[];
  private clientId?: string;
  private clientSecret?: string;

  /**
   * Create a new GoogleApiToolset
   * @param openApiToolset The underlying OpenAPIToolset
   * @param clientId Optional OAuth2 client ID
   * @param clientSecret Optional OAuth2 client secret
   * @param toolFilter Optional tool filter
   */
  constructor(
    openApiToolset: OpenAPIToolsetImpl,
    clientId?: string,
    clientSecret?: string,
    toolFilter?: ToolPredicate | string[]
  ) {
    super();
    this.openApiToolset = openApiToolset;
    this.toolFilter = toolFilter;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Get all tools in the toolset
   * @param readonlyContext Context used to filter tools available to the agent.
   *   If undefined, all tools in the toolset are returned.
   * @returns All GoogleApiTool instances in this toolset
   */
  async getTools(readonlyContext?: ReadonlyContext): Promise<GoogleApiTool[]> {
    const tools: GoogleApiTool[] = [];

    for (const tool of await this.openApiToolset.getTools(readonlyContext)) {
      if (this.toolFilter && (
        (typeof this.toolFilter === 'function' && !this.toolFilter(tool, readonlyContext)) ||
        (Array.isArray(this.toolFilter) && !this.toolFilter.includes(tool.name))
      )) {
        continue;
      }
      const googleApiTool = new GoogleApiTool(tool as any);
      if (this.clientId && this.clientSecret) {
        googleApiTool.configureAuth(this.clientId, this.clientSecret);
      }
      tools.push(googleApiTool);
    }

    return tools;
  }

  /**
   * Set tool filter
   * @param toolFilter The tool filter to set
   */
  setToolFilter(toolFilter: ToolPredicate | string[]): void {
    this.toolFilter = toolFilter;
  }

  /**
   * Configure authentication for all tools in the toolset
   * @param clientId The OAuth2 client ID
   * @param clientSecret The OAuth2 client secret
   */
  configureAuth(clientId: string, clientSecret: string): void {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Load a toolset for a specific Google API
   * 
   * @param apiName The name of the Google API
   * @param apiVersion The version of the Google API
   * @returns A new GoogleApiToolset for the specified API
   */
  static async loadToolset(apiName: string, apiVersion: string): Promise<GoogleApiToolset> {
    const specDict = await new GoogleApiToOpenApiConverterImpl(apiName, apiVersion).convert();
    const scope = Object.keys(
      specDict['components']['securitySchemes']['oauth2']['flows']['authorizationCode']['scopes']
    )[0];
    
    return new GoogleApiToolset(
      GoogleApiToolset._loadToolsetWithOidcAuth({ specDict, scopes: [scope] })
    );
  }

  /**
   * Load a tool set with OpenID Connect authentication
   * 
   * @param options Configuration options
   * @returns An OpenAPIToolsetImpl
   */
  private static _loadToolsetWithOidcAuth(options: {
    specFile?: string;
    specDict?: Record<string, any>;
    scopes?: string[];
  }): OpenAPIToolsetImpl {
    let specStr: string | undefined;
    
    // Load spec from file if provided
    if (options.specFile) {
      // Get the frame of the caller
      const callerFrame = new Error().stack?.split('\n')[1];
      // Get the filename of the caller
      const callerFilename = callerFrame?.match(/at .+ \((.+):\d+:\d+\)/)?.[1] || '';
      // Get the directory of the caller
      const callerDir = path.dirname(path.resolve(callerFilename));
      // Join the directory path with the filename
      const yamlPath = path.join(callerDir, options.specFile);
      
      try {
        specStr = fs.readFileSync(yamlPath, 'utf-8');
      } catch (error) {
        console.error(`Error reading spec file: ${yamlPath}`, error);
      }
    }
    
         return new OpenAPIToolsetImpl({
      specDict: options.specDict,
      specStr: specStr,
      specStrType: 'yaml',
      // TODO: Add proper OIDC auth scheme configuration
      // authScheme: new OpenIdConnectWithConfig({
      //   authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      //   tokenEndpoint: 'https://oauth2.googleapis.com/token',
      //   userinfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
      //   revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      //   tokenEndpointAuthMethodsSupported: ['client_secret_post', 'client_secret_basic'],
      //   grantTypesSupported: ['authorization_code'],
      //   scopes: options.scopes,
      // }),
    });
  }

  /**
   * Performs cleanup and releases resources held by the toolset.
   */
  async close(): Promise<void> {
    if (this.openApiToolset) {
      await this.openApiToolset.close();
    }
  }
}

// Keep the old class name for backward compatibility
export const GoogleApiToolSet = GoogleApiToolset; 