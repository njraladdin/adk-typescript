[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthConfig](../README.md) / AuthConfig

# Interface: AuthConfig

Defined in: [src/auth/AuthConfig.ts:22](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthConfig.ts#L22)

The auth config sent by tool asking client to collect auth credentials and
adk and client will help to fill in the response

## Properties

### authScheme

> **authScheme**: [`AuthScheme`](../../AuthSchemes/interfaces/AuthScheme.md)

Defined in: [src/auth/AuthConfig.ts:24](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthConfig.ts#L24)

The auth scheme used to collect credentials

***

### exchangedAuthCredential?

> `optional` **exchangedAuthCredential**: `null` \| [`AuthCredential`](../../AuthCredential/interfaces/AuthCredential.md)

Defined in: [src/auth/AuthConfig.ts:44](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthConfig.ts#L44)

The exchanged auth credential used to collect credentials. adk and client
will work together to fill it. For those auth scheme that doesn't need to
exchange auth credentials, e.g. API key, service account etc. It's filled by
client directly. For those auth scheme that need to exchange auth credentials,
e.g. OAuth2 and OIDC, it's first filled by adk. If the raw credentials
passed by tool only has client id and client credential, adk will help to
generate the corresponding authorization uri and state and store the processed
credential in this field. If the raw credentials passed by tool already has
authorization uri, state, etc. then it's copied to this field. Client will use
this field to guide the user through the OAuth2 flow and fill auth response in
this field

***

### rawAuthCredential?

> `optional` **rawAuthCredential**: `null` \| [`AuthCredential`](../../AuthCredential/interfaces/AuthCredential.md)

Defined in: [src/auth/AuthConfig.ts:30](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthConfig.ts#L30)

The raw auth credential used to collect credentials. The raw auth
credentials are used in some auth scheme that needs to exchange auth
credentials. e.g. OAuth2 and OIDC. For other auth scheme, it could be None.
