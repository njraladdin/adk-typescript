[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthTool](../README.md) / AuthConfig

# Interface: AuthConfig

Defined in: [src/auth/AuthTool.ts:9](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthTool.ts#L9)

Configuration for authentication

## Properties

### authScheme

> **authScheme**: [`AuthScheme`](../../AuthScheme/enumerations/AuthScheme.md)

Defined in: [src/auth/AuthTool.ts:13](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthTool.ts#L13)

The authentication scheme used to collect credentials

***

### exchangedAuthCredential?

> `optional` **exchangedAuthCredential**: [`AuthCredential`](../../AuthCredential/interfaces/AuthCredential.md)

Defined in: [src/auth/AuthTool.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthTool.ts#L29)

The exchanged auth credential
For auth schemes that don't need to exchange credentials (e.g., API key), 
it's filled by client directly
For auth schemes that need to exchange credentials (e.g., OAuth2), 
it's first filled by ADK

***

### rawAuthCredential?

> `optional` **rawAuthCredential**: [`AuthCredential`](../../AuthCredential/interfaces/AuthCredential.md)

Defined in: [src/auth/AuthTool.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthTool.ts#L20)

The raw auth credential used to collect credentials
Used in some auth schemes that need to exchange auth credentials
For other auth schemes, it could be null
