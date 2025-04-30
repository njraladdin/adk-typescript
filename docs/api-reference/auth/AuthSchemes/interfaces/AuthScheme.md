[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthSchemes](../README.md) / AuthScheme

# Interface: AuthScheme

Defined in: [src/auth/AuthSchemes.ts:72](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L72)

Base interface for authentication schemes

## Properties

### generateHeaders()

> **generateHeaders**: (`credentials`) => `Record`\<`string`, `string`\>

Defined in: [src/auth/AuthSchemes.ts:83](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L83)

Generate authentication headers for HTTP requests

#### Parameters

##### credentials

`any`

The credentials to use for authentication

#### Returns

`Record`\<`string`, `string`\>

The headers to include in HTTP requests

***

### type

> **type**: `string`

Defined in: [src/auth/AuthSchemes.ts:76](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L76)

The type of authentication scheme
