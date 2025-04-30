[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthCredential](../README.md) / AuthCredentialTypes

# Enumeration: AuthCredentialTypes

Defined in: [src/auth/AuthCredential.ts:18](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L18)

Enum for authentication credential types.

## Enumeration Members

### API\_KEY

> **API\_KEY**: `"apiKey"`

Defined in: [src/auth/AuthCredential.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L23)

API Key credential
https://swagger.io/docs/specification/v3_0/authentication/api-keys/

***

### HTTP

> **HTTP**: `"http"`

Defined in: [src/auth/AuthCredential.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L29)

Credentials for HTTP Auth schemes
https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml

***

### OAUTH2

> **OAUTH2**: `"oauth2"`

Defined in: [src/auth/AuthCredential.ts:35](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L35)

OAuth2 credentials
https://swagger.io/docs/specification/v3_0/authentication/oauth2/

***

### OPEN\_ID\_CONNECT

> **OPEN\_ID\_CONNECT**: `"openIdConnect"`

Defined in: [src/auth/AuthCredential.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L41)

OpenID Connect credentials
https://swagger.io/docs/specification/v3_0/authentication/openid-connect-discovery/

***

### SERVICE\_ACCOUNT

> **SERVICE\_ACCOUNT**: `"serviceAccount"`

Defined in: [src/auth/AuthCredential.ts:47](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L47)

Service Account credentials
https://cloud.google.com/iam/docs/service-account-creds
