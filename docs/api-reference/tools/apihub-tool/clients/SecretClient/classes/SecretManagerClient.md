[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/apihub-tool/clients/SecretClient](../README.md) / SecretManagerClient

# Class: SecretManagerClient

Defined in: [src/tools/apihub-tool/clients/SecretClient.ts:28](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/SecretClient.ts#L28)

A client for interacting with Google Cloud Secret Manager.

This class provides a simplified interface for retrieving secrets from
Secret Manager, handling authentication using either a service account
JSON keyfile (passed as a string) or a pre-existing authorization token.

## Constructors

### Constructor

> **new SecretManagerClient**(`params`): `SecretManagerClient`

Defined in: [src/tools/apihub-tool/clients/SecretClient.ts:39](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/SecretClient.ts#L39)

Initializes the SecretManagerClient.

#### Parameters

##### params

Configuration parameters

###### authToken?

`string`

An existing Google Cloud authorization token.

###### serviceAccountJson?

`string`

The content of a service account JSON keyfile (as a string), not the file path. Must be valid JSON.

#### Returns

`SecretManagerClient`

#### Throws

Error if neither serviceAccountJson nor authToken is provided, or if both are provided. Also raised if the serviceAccountJson is not valid JSON.

## Methods

### getSecret()

> **getSecret**(`resourceName`): `Promise`\<`string`\>

Defined in: [src/tools/apihub-tool/clients/SecretClient.ts:71](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/SecretClient.ts#L71)

Retrieves a secret from Google Cloud Secret Manager.

#### Parameters

##### resourceName

`string`

The full resource name of the secret. 
                   Usually you want the "latest" version, e.g., "projects/my-project/secrets/my-secret/versions/latest".

#### Returns

`Promise`\<`string`\>

The secret payload as a string.

#### Throws

Error if the Secret Manager API returns an error
