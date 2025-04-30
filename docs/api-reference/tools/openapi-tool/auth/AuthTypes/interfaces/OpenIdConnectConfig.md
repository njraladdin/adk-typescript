[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/auth/AuthTypes](../README.md) / OpenIdConnectConfig

# Interface: OpenIdConnectConfig

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L20)

OpenID Connect configuration

## Properties

### authorizationEndpoint

> **authorizationEndpoint**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:24](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L24)

The authorization endpoint URL

***

### grantTypesSupported

> **grantTypesSupported**: `string`[]

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:49](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L49)

The supported grant types

***

### revocationEndpoint

> **revocationEndpoint**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:39](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L39)

The token revocation endpoint URL

***

### scopes

> **scopes**: `string`[]

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:54](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L54)

The requested scopes

***

### tokenEndpoint

> **tokenEndpoint**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L29)

The token endpoint URL

***

### tokenEndpointAuthMethodsSupported

> **tokenEndpointAuthMethodsSupported**: `string`[]

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:44](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L44)

The supported token endpoint authentication methods

***

### userinfoEndpoint

> **userinfoEndpoint**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:34](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L34)

The user info endpoint URL
