[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthSchemes](../README.md) / BearerAuthScheme

# Class: BearerAuthScheme

Defined in: [src/auth/AuthSchemes.ts:116](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L116)

Bearer token authentication scheme

## Implements

- [`AuthScheme`](../interfaces/AuthScheme.md)

## Constructors

### Constructor

> **new BearerAuthScheme**(): `BearerAuthScheme`

#### Returns

`BearerAuthScheme`

## Methods

### generateHeaders()

> **generateHeaders**(`token`): `Record`\<`string`, `string`\>

Defined in: [src/auth/AuthSchemes.ts:124](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L124)

Generate authentication headers for HTTP requests

#### Parameters

##### token

`string`

The bearer token to include in the headers

#### Returns

`Record`\<`string`, `string`\>

The headers to include in HTTP requests

#### Implementation of

[`AuthScheme`](../interfaces/AuthScheme.md).[`generateHeaders`](../interfaces/AuthScheme.md#generateheaders)

## Properties

### type

> **type**: `string` = `'bearer'`

Defined in: [src/auth/AuthSchemes.ts:117](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L117)

The type of authentication scheme

#### Implementation of

[`AuthScheme`](../interfaces/AuthScheme.md).[`type`](../interfaces/AuthScheme.md#type)
