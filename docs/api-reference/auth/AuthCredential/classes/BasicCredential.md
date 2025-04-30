[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthCredential](../README.md) / BasicCredential

# Class: BasicCredential

Defined in: [src/auth/AuthCredential.ts:265](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L265)

Basic auth credential implementation

## Constructors

### Constructor

> **new BasicCredential**(`username`, `password`): `BasicCredential`

Defined in: [src/auth/AuthCredential.ts:275](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L275)

Initialize the basic auth credential

#### Parameters

##### username

`string`

The username

##### password

`string`

The password

#### Returns

`BasicCredential`

## Methods

### toAuthCredential()

> **toAuthCredential**(): [`AuthCredential`](../interfaces/AuthCredential.md)

Defined in: [src/auth/AuthCredential.ts:283](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L283)

Convert to AuthCredential interface

#### Returns

[`AuthCredential`](../interfaces/AuthCredential.md)

## Properties

### auth\_type

> `readonly` **auth\_type**: [`HTTP`](../enumerations/AuthCredentialTypes.md#http) = `AuthCredentialTypes.HTTP`

Defined in: [src/auth/AuthCredential.ts:266](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L266)
