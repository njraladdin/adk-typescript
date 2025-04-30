[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [auth/AuthCredential](../README.md) / HttpAuth

# Interface: HttpAuth

Defined in: [src/auth/AuthCredential.ts:62](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L62)

Interface for HTTP Authentication

## Properties

### credentials

> **credentials**: [`HttpCredentials`](HttpCredentials.md)

Defined in: [src/auth/AuthCredential.ts:70](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L70)

***

### scheme

> **scheme**: `string`

Defined in: [src/auth/AuthCredential.ts:69](https://github.com/njraladdin/adk-typescript/blob/main/src/auth/AuthCredential.ts#L69)

The name of the HTTP Authorization scheme to be used in the Authorization
header as defined in RFC7235. The values used SHOULD be registered in the
IANA Authentication Scheme registry.
Examples: 'basic', 'bearer'
