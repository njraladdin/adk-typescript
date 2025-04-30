[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthCredential](../README.md) / OAuth2Auth

# Interface: OAuth2Auth

Defined in: [src/auth/AuthCredential.ts:76](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L76)

Interface for OAuth2 Authentication

## Properties

### auth\_code?

> `optional` **auth\_code**: `string`

Defined in: [src/auth/AuthCredential.ts:90](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L90)

***

### auth\_response\_uri?

> `optional` **auth\_response\_uri**: `string`

Defined in: [src/auth/AuthCredential.ts:89](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L89)

***

### auth\_uri?

> `optional` **auth\_uri**: `string`

Defined in: [src/auth/AuthCredential.ts:83](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L83)

Tool or ADK can generate the auth_uri with the state info thus client
can verify the state

***

### client\_id?

> `optional` **client\_id**: `string`

Defined in: [src/auth/AuthCredential.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L77)

***

### client\_secret?

> `optional` **client\_secret**: `string`

Defined in: [src/auth/AuthCredential.ts:78](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L78)

***

### redirect\_uri?

> `optional` **redirect\_uri**: `string`

Defined in: [src/auth/AuthCredential.ts:88](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L88)

Tool or ADK can decide the redirect_uri if they don't want client to decide

***

### state?

> `optional` **state**: `string`

Defined in: [src/auth/AuthCredential.ts:84](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L84)

***

### token?

> `optional` **token**: `Record`\<`string`, `any`\>

Defined in: [src/auth/AuthCredential.ts:91](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L91)
