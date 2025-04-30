[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthSchemes](../README.md) / ApiKeyAuthScheme

# Class: ApiKeyAuthScheme

Defined in: [src/auth/AuthSchemes.ts:89](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L89)

API key authentication scheme

## Implements

- [`AuthScheme`](../interfaces/AuthScheme.md)

## Constructors

### Constructor

> **new ApiKeyAuthScheme**(`headerName`): `ApiKeyAuthScheme`

Defined in: [src/auth/AuthSchemes.ts:97](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L97)

Initializes the API key authentication scheme

#### Parameters

##### headerName

`string` = `'X-Api-Key'`

The name of the header to include the API key in

#### Returns

`ApiKeyAuthScheme`

## Methods

### generateHeaders()

> **generateHeaders**(`apiKey`): `Record`\<`string`, `string`\>

Defined in: [src/auth/AuthSchemes.ts:106](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L106)

Generate authentication headers for HTTP requests

#### Parameters

##### apiKey

`string`

The API key to include in the headers

#### Returns

`Record`\<`string`, `string`\>

The headers to include in HTTP requests

#### Implementation of

[`AuthScheme`](../interfaces/AuthScheme.md).[`generateHeaders`](../interfaces/AuthScheme.md#generateheaders)

## Properties

### type

> **type**: `string` = `'apiKey'`

Defined in: [src/auth/AuthSchemes.ts:90](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L90)

The type of authentication scheme

#### Implementation of

[`AuthScheme`](../interfaces/AuthScheme.md).[`type`](../interfaces/AuthScheme.md#type)
