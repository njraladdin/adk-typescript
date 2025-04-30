[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [artifacts/GcsArtifactService](../README.md) / GcsArtifactService

# Class: GcsArtifactService

Defined in: [src/artifacts/GcsArtifactService.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/GcsArtifactService.ts#L25)

An artifact service implementation using Google Cloud Storage (GCS).

## Implements

- [`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md)

## Constructors

### Constructor

> **new GcsArtifactService**(`bucketName`, `options`): `GcsArtifactService`

Defined in: [src/artifacts/GcsArtifactService.ts:36](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/GcsArtifactService.ts#L36)

Initializes the GcsArtifactService.

#### Parameters

##### bucketName

`string`

The name of the bucket to use

##### options

`Record`\<`string`, `any`\> = `{}`

Optional configuration options for the Google Cloud Storage client

#### Returns

`GcsArtifactService`

## Methods

### deleteArtifact()

> **deleteArtifact**(`params`): `Promise`\<`void`\>

Defined in: [src/artifacts/GcsArtifactService.ts:191](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/GcsArtifactService.ts#L191)

Deletes an artifact.

#### Parameters

##### params

[`ArtifactParams`](../../BaseArtifactService/interfaces/ArtifactParams.md)

The artifact parameters

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md).[`deleteArtifact`](../../BaseArtifactService/interfaces/BaseArtifactService.md#deleteartifact)

***

### listArtifactKeys()

> **listArtifactKeys**(`params`): `Promise`\<`string`[]\>

Defined in: [src/artifacts/GcsArtifactService.ts:153](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/GcsArtifactService.ts#L153)

Lists all the artifact filenames within a session.

#### Parameters

##### params

[`ArtifactParams`](../../BaseArtifactService/interfaces/ArtifactParams.md)

The artifact parameters

#### Returns

`Promise`\<`string`[]\>

A list of all artifact filenames within a session

#### Implementation of

[`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md).[`listArtifactKeys`](../../BaseArtifactService/interfaces/BaseArtifactService.md#listartifactkeys)

***

### listVersions()

> **listVersions**(`params`): `Promise`\<`number`[]\>

Defined in: [src/artifacts/GcsArtifactService.ts:211](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/GcsArtifactService.ts#L211)

Lists all versions of an artifact.

#### Parameters

##### params

[`ArtifactParams`](../../BaseArtifactService/interfaces/ArtifactParams.md)

The artifact parameters

#### Returns

`Promise`\<`number`[]\>

A list of all available versions of the artifact

#### Implementation of

[`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md).[`listVersions`](../../BaseArtifactService/interfaces/BaseArtifactService.md#listversions)

***

### loadArtifact()

> **loadArtifact**(`params`): `Promise`\<`undefined` \| [`Part`](../../../models/types/interfaces/Part.md)\>

Defined in: [src/artifacts/GcsArtifactService.ts:116](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/GcsArtifactService.ts#L116)

Gets an artifact from the artifact service storage.

#### Parameters

##### params

[`ArtifactParams`](../../BaseArtifactService/interfaces/ArtifactParams.md)

The artifact parameters

#### Returns

`Promise`\<`undefined` \| [`Part`](../../../models/types/interfaces/Part.md)\>

The artifact or undefined if not found

#### Implementation of

[`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md).[`loadArtifact`](../../BaseArtifactService/interfaces/BaseArtifactService.md#loadartifact)

***

### saveArtifact()

> **saveArtifact**(`params`): `Promise`\<`number`\>

Defined in: [src/artifacts/GcsArtifactService.ts:81](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/GcsArtifactService.ts#L81)

Saves an artifact to the artifact service storage.

#### Parameters

##### params

[`ArtifactParams`](../../BaseArtifactService/interfaces/ArtifactParams.md)

The artifact parameters

#### Returns

`Promise`\<`number`\>

The revision ID

#### Implementation of

[`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md).[`saveArtifact`](../../BaseArtifactService/interfaces/BaseArtifactService.md#saveartifact)
