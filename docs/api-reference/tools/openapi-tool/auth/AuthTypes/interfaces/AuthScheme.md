[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/auth/AuthTypes](../README.md) / AuthScheme

# Interface: AuthScheme

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L85)

Auth scheme interface

## Properties

### bearerFormat?

> `optional` **bearerFormat**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:109](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L109)

The bearer format for HTTP authentication

***

### flows?

> `optional` **flows**: `object`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:114](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L114)

The OAuth2 flows

#### authorizationCode?

> `optional` **authorizationCode**: [`OAuth2Flow`](OAuth2Flow.md)

#### clientCredentials?

> `optional` **clientCredentials**: [`OAuth2Flow`](OAuth2Flow.md)

#### implicit?

> `optional` **implicit**: [`OAuth2Flow`](OAuth2Flow.md)

#### password?

> `optional` **password**: [`OAuth2Flow`](OAuth2Flow.md)

***

### in?

> `optional` **in**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:99](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L99)

The location of the authentication parameter

***

### name?

> `optional` **name**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:94](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L94)

The name of the authentication parameter

***

### openIdConnectConfig?

> `optional` **openIdConnectConfig**: [`OpenIdConnectConfig`](OpenIdConnectConfig.md)

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:129](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L129)

OpenID Connect configuration

***

### openIdConnectUrl?

> `optional` **openIdConnectUrl**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:124](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L124)

The OpenID Connect URL

***

### scheme?

> `optional` **scheme**: `string`

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:104](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L104)

The scheme for HTTP authentication

***

### type\_

> **type\_**: [`AuthSchemeType`](../enumerations/AuthSchemeType.md)

Defined in: [src/tools/openapi-tool/auth/AuthTypes.ts:89](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/auth/AuthTypes.ts#L89)

The type of authentication scheme
