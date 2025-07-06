

import * as fs from 'fs';
import * as path from 'path';

import { OpenIdConnectWithConfig } from 'adk-typescript/auth';
import { AuthCredential, AuthCredentialTypes, OAuth2Auth } from 'adk-typescript/auth';
import { OpenAPIToolset } from 'adk-typescript/tools';
import { LlmAgent } from 'adk-typescript/agents';

// --- Authentication Configuration ---
// This section configures how the agent will handle authentication using OpenID Connect (OIDC),
// often layered on top of OAuth 2.0.

// Define the Authentication Scheme using OpenID Connect.
// This object tells the ADK *how* to perform the OIDC/OAuth2 flow.
// It requires details specific to your Identity Provider (IDP), like Google OAuth, Okta, Auth0, etc.
// Note: Replace the example Okta URLs and credentials with your actual IDP details.
// All following fields are required, and available from your IDP.
const authScheme = new OpenIdConnectWithConfig({
  // The URL of the IDP's authorization endpoint where the user is redirected to log in.
  authorizationEndpoint: "https://your-endpoint.okta.com/oauth2/v1/authorize",
  // The URL of the IDP's token endpoint where the authorization code is exchanged for tokens.
  tokenEndpoint: "https://your-token-endpoint.okta.com/oauth2/v1/token",
  // The scopes (permissions) your application requests from the IDP.
  // 'openid' is standard for OIDC. 'profile' and 'email' request user profile info.
  scopes: ['openid', 'profile', "email"]
});

// Define the Authentication Credentials for your specific application.
// This object holds the client identifier and secret that your application uses
// to identify itself to the IDP during the OAuth2 flow.
// !! SECURITY WARNING: Avoid hardcoding secrets in production code. !!
// !! Use environment variables or a secret management system instead. !!
const authCredential = new AuthCredential({
  authType: AuthCredentialTypes.OPEN_ID_CONNECT,
  oauth2: new OAuth2Auth({
    clientId: "CLIENT_ID",
    clientSecret: "CIENT_SECRET"
  })
});

// --- Toolset Configuration from OpenAPI Specification ---
// This section defines a sample set of tools the agent can use, configured with Authentication
// from steps above.
// This sample set of tools use endpoints protected by Okta and requires an OpenID Connect flow
// to acquire end user credentials.

// Helper function to read the specification file
function readSpecFile(): string {
  const specFilePath = path.join(__dirname, 'spec.yaml');
  return fs.readFileSync(specFilePath, 'utf8');
}

const specContent = readSpecFile();

const userinfoToolset = new OpenAPIToolset({
  specStr: specContent,
  specStrType: 'yaml',
  // ** Crucially, associate the authentication scheme and credentials with these tools. **
  // This tells the ADK that the tools require the defined OIDC/OAuth2 flow.
  authScheme: authScheme,
  authCredential: authCredential
});

// --- Agent Configuration ---
// Configure and create the main LLM Agent.
const rootAgent = new LlmAgent({
  name: "enterprise_assistant",
  model: 'gemini-2.0-flash',
  instruction: 'Help user integrate with multiple enterprise systems, including retrieving user information which may require authentication.',
  tools: await userinfoToolset.getTools()
});

// --- Ready for Use ---
// The `rootAgent` is now configured with tools protected by OIDC/OAuth2 authentication.
// When the agent attempts to use one of these tools, the ADK framework will automatically
// trigger the authentication flow defined by `authScheme` and `authCredential`
// if valid credentials are not already available in the session.
// The subsequent interaction flow would guide the user through the login process and handle
// token exchanging, and automatically attach the exchanged token to the endpoint defined in
// the tool.

// Export the agent for use in other modules
export const agent = rootAgent; 