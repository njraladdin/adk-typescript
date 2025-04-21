

import axios from 'axios';

/**
 * Base interface for API Hub clients
 */
export interface BaseAPIHubClient {
  /**
   * From a given resource name, get the spec in the API Hub.
   * @param resourceName The resource name
   * @returns The spec content as a string
   */
  getSpecContent(resourceName: string): Promise<string>;
}

/**
 * Client for interacting with the API Hub service
 */
export class APIHubClient implements BaseAPIHubClient {
  private rootUrl: string = 'https://apihub.googleapis.com/v1';
  private accessToken: string | null = null;
  private serviceAccount: string | null = null;
  private credentialCache: any = null;

  /**
   * Initializes the APIHubClient.
   * 
   * You must set either accessToken or serviceAccountJson. This
   * credential is used for sending request to API Hub API.
   * 
   * @param params Configuration parameters
   * @param params.accessToken Google Access token. Generate with gcloud cli `gcloud auth print-access-token`. Useful for local testing.
   * @param params.serviceAccountJson The service account configuration as a JSON string. Required if not using default service credential.
   */
  constructor(params: {
    accessToken?: string;
    serviceAccountJson?: string;
  }) {
    if (params.accessToken) {
      this.accessToken = params.accessToken;
    } else if (params.serviceAccountJson) {
      this.serviceAccount = params.serviceAccountJson;
    }
  }

  /**
   * From a given path, get the first spec available in the API Hub.
   * 
   * - If path includes /apis/apiname, get the first spec of that API
   * - If path includes /apis/apiname/versions/versionname, get the first spec of that API Version
   * - If path includes /apis/apiname/versions/versionname/specs/specname, return that spec
   * 
   * Path can be resource name (projects/xxx/locations/us-central1/apis/apiname),
   * and URL from the UI (https://console.cloud.google.com/apigee/api-hub/apis/apiname?project=xxx)
   * 
   * @param path The path to the API, API Version, or API Spec.
   * @returns The content of the first spec available in the API Hub.
   */
  async getSpecContent(path: string): Promise<string> {
    const [apiResourceName, apiVersionResourceName, apiSpecResourceName] = 
      this.extractResourceName(path);

    if (apiResourceName && !apiVersionResourceName) {
      const api = await this.getApi(apiResourceName);
      const versions = api.versions || [];
      if (!versions.length) {
        throw new Error(`No versions found in API Hub resource: ${apiResourceName}`);
      }
      const apiVersionResourceName = versions[0];
    }

    let localApiVersionResourceName = apiVersionResourceName;
    let localApiSpecResourceName = apiSpecResourceName;

    if (localApiVersionResourceName && !localApiSpecResourceName) {
      const apiVersion = await this.getApiVersion(localApiVersionResourceName);
      const specResourceNames = apiVersion.specs || [];
      if (!specResourceNames.length) {
        throw new Error(`No specs found in API Hub version: ${localApiVersionResourceName}`);
      }
      localApiSpecResourceName = specResourceNames[0];
    }

    if (localApiSpecResourceName) {
      const specContent = await this.fetchSpec(localApiSpecResourceName);
      return specContent;
    }

    throw new Error(`No API Hub resource found in path: ${path}`);
  }

  /**
   * Lists all APIs in the specified project and location.
   * 
   * @param project The Google Cloud project name.
   * @param location The location of the API Hub resources (e.g., 'us-central1').
   * @returns A list of API objects, or an empty list if an error occurs.
   */
  async listApis(project: string, location: string): Promise<any[]> {
    const url = `${this.rootUrl}/projects/${project}/locations/${location}/apis`;
    const token = await this.getAccessToken();
    
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data.apis || [];
  }

  /**
   * Get API detail by API name.
   * 
   * @param apiResourceName Resource name of this API, like projects/xxx/locations/us-central1/apis/apiname
   * @returns An API and details
   */
  async getApi(apiResourceName: string): Promise<any> {
    const url = `${this.rootUrl}/${apiResourceName}`;
    const token = await this.getAccessToken();
    
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  }

  /**
   * Gets details of a specific API version.
   * 
   * @param apiVersionName The resource name of the API version.
   * @returns The API version details
   */
  async getApiVersion(apiVersionName: string): Promise<any> {
    const url = `${this.rootUrl}/${apiVersionName}`;
    const token = await this.getAccessToken();
    
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  }

  /**
   * Retrieves the content of a specific API specification.
   * 
   * @param apiSpecResourceName The resource name of the API spec.
   * @returns The decoded content of the specification
   * @private
   */
  private async fetchSpec(apiSpecResourceName: string): Promise<string> {
    const url = `${this.rootUrl}/${apiSpecResourceName}:contents`;
    const token = await this.getAccessToken();
    
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const contentBase64 = response.data.contents || '';
    if (contentBase64) {
      // In Node.js
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(contentBase64, 'base64').toString('utf-8');
      }
      // In browser
      return atob(contentBase64);
    } else {
      return '';
    }
  }

  /**
   * Extracts the resource names of an API, API Version, and API Spec from a given URL or path.
   * 
   * @param urlOrPath The URL (UI or resource) or path string.
   * @returns A tuple containing the API resource name, API version resource name, and API spec resource name.
   * @private
   */
  private extractResourceName(urlOrPath: string): [string, string | null, string | null] {
    let queryParams: Record<string, string[]> | null = null;
    let path: string;
    
    try {
      const parsedUrl = new URL(urlOrPath);
      path = parsedUrl.pathname;
      queryParams = {};
      
      // Parse the query string
      for (const [key, value] of parsedUrl.searchParams.entries()) {
        if (!queryParams[key]) {
          queryParams[key] = [];
        }
        queryParams[key].push(value);
      }
      
      // This is a path from UI. Remove unnecessary prefix.
      if (path.includes('api-hub/')) {
        path = path.split('api-hub')[1];
      }
    } catch (e) {
      path = urlOrPath;
    }

    const pathSegments = path.split('/').filter(segment => segment);

    let project: string | null = null;
    let location: string | null = null;
    let apiId: string | null = null;
    let versionId: string | null = null;
    let specId: string | null = null;

    if (pathSegments.includes('projects')) {
      const projectIndex = pathSegments.indexOf('projects');
      if (projectIndex + 1 < pathSegments.length) {
        project = pathSegments[projectIndex + 1];
      }
    } else if (queryParams && queryParams['project']) {
      project = queryParams['project'][0];
    }

    if (!project) {
      throw new Error(
        `Project ID not found in URL or path in APIHubClient. Input path is '${urlOrPath}'. ` +
        `Please make sure there is either '/projects/PROJECT_ID' in the path or 'project=PROJECT_ID' query param in the input.`
      );
    }

    if (pathSegments.includes('locations')) {
      const locationIndex = pathSegments.indexOf('locations');
      if (locationIndex + 1 < pathSegments.length) {
        location = pathSegments[locationIndex + 1];
      }
    }
    
    if (!location) {
      throw new Error(
        `Location not found in URL or path in APIHubClient. Input path is '${urlOrPath}'. ` +
        `Please make sure there is either '/location/LOCATION_ID' in the path.`
      );
    }

    if (pathSegments.includes('apis')) {
      const apiIndex = pathSegments.indexOf('apis');
      if (apiIndex + 1 < pathSegments.length) {
        apiId = pathSegments[apiIndex + 1];
      }
    }
    
    if (!apiId) {
      throw new Error(
        `API id not found in URL or path in APIHubClient. Input path is '${urlOrPath}'. ` +
        `Please make sure there is either '/apis/API_ID' in the path.`
      );
    }
    
    if (pathSegments.includes('versions')) {
      const versionIndex = pathSegments.indexOf('versions');
      if (versionIndex + 1 < pathSegments.length) {
        versionId = pathSegments[versionIndex + 1];
      }
    }

    if (pathSegments.includes('specs')) {
      const specIndex = pathSegments.indexOf('specs');
      if (specIndex + 1 < pathSegments.length) {
        specId = pathSegments[specIndex + 1];
      }
    }

    const apiResourceName = `projects/${project}/locations/${location}/apis/${apiId}`;
    const apiVersionResourceName = versionId ? `${apiResourceName}/versions/${versionId}` : null;
    const apiSpecResourceName = (versionId && specId) ? `${apiVersionResourceName}/specs/${specId}` : null;

    return [
      apiResourceName,
      apiVersionResourceName,
      apiSpecResourceName,
    ];
  }

  /**
   * Gets the access token for service account authentication
   * 
   * @returns The access token
   * @private
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    if (this.credentialCache && !this.isCredentialExpired(this.credentialCache)) {
      return this.credentialCache.token;
    }

    throw new Error('Authentication not implemented: please provide an access token to the API Hub client');
  }

  /**
   * Checks if the credential is expired
   * 
   * @param credential The credential to check
   * @returns True if expired, false otherwise
   * @private
   */
  private isCredentialExpired(credential: any): boolean {
    return credential.expired || false;
  }
} 