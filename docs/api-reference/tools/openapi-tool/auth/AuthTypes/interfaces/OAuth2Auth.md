[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/auth/AuthTypes](../README.md) / OAuth2Auth

# Interface: OAuth2Auth

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:146](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L146)

OAuth2 authentication

## Properties

### accessToken?

> `optional` **accessToken**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:160](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L160)

The access token

***

### authorizationCode?

> `optional` **authorizationCode**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:175](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L175)

The authorization code

***

### clientId

> **clientId**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:150](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L150)

The client ID

***

### clientSecret

> **clientSecret**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:155](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L155)

The client secret

***

### codeVerifier?

> `optional` **codeVerifier**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:185](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L185)

The code verifier for PKCE

***

### expiresAt?

> `optional` **expiresAt**: `number`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:170](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L170)

When the token expires

***

### redirectUri?

> `optional` **redirectUri**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:180](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L180)

The redirect URI

***

### refreshToken?

> `optional` **refreshToken**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:165](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L165)

The refresh token
