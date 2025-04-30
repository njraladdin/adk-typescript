[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/auth/AuthTypes](../README.md) / AuthCredential

# Interface: AuthCredential

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:226](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L226)

Auth credential interface

## Properties

### apiKey?

> `optional` **apiKey**: [`ApiKeyAuth`](ApiKeyAuth.md)

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:240](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L240)

API key authentication credentials

***

### authType

> **authType**: [`AuthCredentialTypes`](../enumerations/AuthCredentialTypes.md)

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:230](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L230)

The type of authentication credential

***

### httpBasic?

> `optional` **httpBasic**: [`HttpBasicAuth`](HttpBasicAuth.md)

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:245](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L245)

HTTP basic authentication credentials

***

### httpBearer?

> `optional` **httpBearer**: [`HttpBearerAuth`](HttpBearerAuth.md)

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:250](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L250)

HTTP bearer authentication credentials

***

### oauth2?

> `optional` **oauth2**: [`OAuth2Auth`](OAuth2Auth.md)

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:235](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L235)

OAuth2 authentication credentials
