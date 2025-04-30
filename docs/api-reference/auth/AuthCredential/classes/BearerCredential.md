[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthCredential](../README.md) / BearerCredential

# Class: BearerCredential

Defined in: [src/auth/AuthCredential.ts:234](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L234)

Bearer token credential implementation

## Constructors

### Constructor

> **new BearerCredential**(`token`): `BearerCredential`

Defined in: [src/auth/AuthCredential.ts:242](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L242)

Initialize the bearer token credential

#### Parameters

##### token

`string`

The bearer token value

#### Returns

`BearerCredential`

## Methods

### toAuthCredential()

> **toAuthCredential**(): [`AuthCredential`](../interfaces/AuthCredential.md)

Defined in: [src/auth/AuthCredential.ts:249](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L249)

Convert to AuthCredential interface

#### Returns

[`AuthCredential`](../interfaces/AuthCredential.md)

## Properties

### auth\_type

> `readonly` **auth\_type**: [`HTTP`](../enumerations/AuthCredentialTypes.md#http) = `AuthCredentialTypes.HTTP`

Defined in: [src/auth/AuthCredential.ts:235](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L235)
