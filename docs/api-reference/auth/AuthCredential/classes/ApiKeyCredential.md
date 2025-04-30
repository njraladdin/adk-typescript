[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthCredential](../README.md) / ApiKeyCredential

# Class: ApiKeyCredential

Defined in: [src/auth/AuthCredential.ts:208](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L208)

API key credential implementation

## Constructors

### Constructor

> **new ApiKeyCredential**(`apiKey`): `ApiKeyCredential`

Defined in: [src/auth/AuthCredential.ts:216](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L216)

Initialize the API key credential

#### Parameters

##### apiKey

`string`

The API key value

#### Returns

`ApiKeyCredential`

## Methods

### toAuthCredential()

> **toAuthCredential**(): [`AuthCredential`](../interfaces/AuthCredential.md)

Defined in: [src/auth/AuthCredential.ts:223](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L223)

Convert to AuthCredential interface

#### Returns

[`AuthCredential`](../interfaces/AuthCredential.md)

## Properties

### auth\_type

> `readonly` **auth\_type**: [`API_KEY`](../enumerations/AuthCredentialTypes.md#api_key) = `AuthCredentialTypes.API_KEY`

Defined in: [src/auth/AuthCredential.ts:209](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L209)
