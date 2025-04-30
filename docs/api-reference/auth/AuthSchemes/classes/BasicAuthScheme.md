[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthSchemes](../README.md) / BasicAuthScheme

# Class: BasicAuthScheme

Defined in: [src/auth/AuthSchemes.ts:134](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L134)

Basic authentication scheme

## Implements

- [`AuthScheme`](../interfaces/AuthScheme.md)

## Constructors

### Constructor

> **new BasicAuthScheme**(): `BasicAuthScheme`

#### Returns

`BasicAuthScheme`

## Methods

### generateHeaders()

> **generateHeaders**(`credentials`): `Record`\<`string`, `string`\>

Defined in: [src/auth/AuthSchemes.ts:144](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L144)

Generate authentication headers for HTTP requests

#### Parameters

##### credentials

The credentials to use for authentication

###### password

`string`

The password for basic authentication

###### username

`string`

The username for basic authentication

#### Returns

`Record`\<`string`, `string`\>

The headers to include in HTTP requests

#### Implementation of

[`AuthScheme`](../interfaces/AuthScheme.md).[`generateHeaders`](../interfaces/AuthScheme.md#generateheaders)

## Properties

### type

> **type**: `string` = `'basic'`

Defined in: [src/auth/AuthSchemes.ts:135](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthSchemes.ts#L135)

The type of authentication scheme

#### Implementation of

[`AuthScheme`](../interfaces/AuthScheme.md).[`type`](../interfaces/AuthScheme.md#type)
