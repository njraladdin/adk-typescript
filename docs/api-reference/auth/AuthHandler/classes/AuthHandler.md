[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthHandler](../README.md) / AuthHandler

# Class: AuthHandler

Defined in: [src/auth/AuthHandler.ts:37](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthHandler.ts#L37)

## Constructors

### Constructor

> **new AuthHandler**(`authConfig`): `AuthHandler`

Defined in: [src/auth/AuthHandler.ts:40](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthHandler.ts#L40)

#### Parameters

##### authConfig

[`AuthConfig`](../../AuthConfig/interfaces/AuthConfig.md)

#### Returns

`AuthHandler`

## Methods

### \_validate()

> **\_validate**(): `void`

Defined in: [src/auth/AuthHandler.ts:74](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthHandler.ts#L74)

Validates the handler's configuration.

#### Returns

`void`

***

### exchangeAuthToken()

> **exchangeAuthToken**(): `undefined` \| [`AuthCredential`](../../AuthCredential/interfaces/AuthCredential.md)

Defined in: [src/auth/AuthHandler.ts:48](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthHandler.ts#L48)

Exchanges an auth token from the authorization response.
Returns an AuthCredential object containing the access token.

#### Returns

`undefined` \| [`AuthCredential`](../../AuthCredential/interfaces/AuthCredential.md)

***

### generateAuthRequest()

> **generateAuthRequest**(): [`AuthConfig`](../../AuthConfig/interfaces/AuthConfig.md)

Defined in: [src/auth/AuthHandler.ts:95](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthHandler.ts#L95)

Generates an auth request, possibly generating an auth URI if needed.

#### Returns

[`AuthConfig`](../../AuthConfig/interfaces/AuthConfig.md)

***

### generateAuthUri()

> **generateAuthUri**(): [`AuthCredential`](../../AuthCredential/interfaces/AuthCredential.md)

Defined in: [src/auth/AuthHandler.ts:175](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthHandler.ts#L175)

Generates an OAuth2 authorization URI.

#### Returns

[`AuthCredential`](../../AuthCredential/interfaces/AuthCredential.md)

***

### getAuthResponse()

> **getAuthResponse**(`state`): `undefined` \| [`AuthCredential`](../../AuthCredential/interfaces/AuthCredential.md)

Defined in: [src/auth/AuthHandler.ts:83](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthHandler.ts#L83)

Retrieves the auth response from the state.

#### Parameters

##### state

`Record`\<`string`, `any`\>

#### Returns

`undefined` \| [`AuthCredential`](../../AuthCredential/interfaces/AuthCredential.md)

***

### getCredentialKey()

> **getCredentialKey**(): `string`

Defined in: [src/auth/AuthHandler.ts:151](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthHandler.ts#L151)

Generates a unique key for the given auth scheme and credential.

#### Returns

`string`

***

### parseAndStoreAuthResponse()

> **parseAndStoreAuthResponse**(`state`): `void`

Defined in: [src/auth/AuthHandler.ts:59](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthHandler.ts#L59)

Parses and stores the auth response in the state.

#### Parameters

##### state

`Record`\<`string`, `any`\>

#### Returns

`void`

## Properties

### authConfig

> **authConfig**: [`AuthConfig`](../../AuthConfig/interfaces/AuthConfig.md)

Defined in: [src/auth/AuthHandler.ts:38](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthHandler.ts#L38)
