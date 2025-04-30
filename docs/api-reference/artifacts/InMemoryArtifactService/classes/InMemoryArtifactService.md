[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [artifacts/InMemoryArtifactService](../README.md) / InMemoryArtifactService

# Class: InMemoryArtifactService

Defined in: [src/artifacts/InMemoryArtifactService.ts:24](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/InMemoryArtifactService.ts#L24)

An in-memory implementation of the artifact service.

## Implements

- [`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md)

## Constructors

### Constructor

> **new InMemoryArtifactService**(): `InMemoryArtifactService`

#### Returns

`InMemoryArtifactService`

## Methods

### deleteArtifact()

> **deleteArtifact**(`params`): `Promise`\<`void`\>

Defined in: [src/artifacts/InMemoryArtifactService.ts:129](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/InMemoryArtifactService.ts#L129)

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

> **listArtifactKeys**(`params`): `string`[]

Defined in: [src/artifacts/InMemoryArtifactService.ts:104](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/InMemoryArtifactService.ts#L104)

Lists all the artifact filenames within a session.

#### Parameters

##### params

[`ArtifactParams`](../../BaseArtifactService/interfaces/ArtifactParams.md)

The artifact parameters

#### Returns

`string`[]

A list of all artifact filenames within a session

#### Implementation of

[`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md).[`listArtifactKeys`](../../BaseArtifactService/interfaces/BaseArtifactService.md#listartifactkeys)

***

### listVersions()

> **listVersions**(`params`): `number`[]

Defined in: [src/artifacts/InMemoryArtifactService.ts:142](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/InMemoryArtifactService.ts#L142)

Lists all versions of an artifact.

#### Parameters

##### params

[`ArtifactParams`](../../BaseArtifactService/interfaces/ArtifactParams.md)

The artifact parameters

#### Returns

`number`[]

A list of all available versions of the artifact

#### Implementation of

[`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md).[`listVersions`](../../BaseArtifactService/interfaces/BaseArtifactService.md#listversions)

***

### loadArtifact()

> **loadArtifact**(`params`): `undefined` \| [`Part`](../../../models/types/interfaces/Part.md)

Defined in: [src/artifacts/InMemoryArtifactService.ts:84](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/InMemoryArtifactService.ts#L84)

Gets an artifact from the artifact service storage.

#### Parameters

##### params

[`ArtifactParams`](../../BaseArtifactService/interfaces/ArtifactParams.md)

The artifact parameters

#### Returns

`undefined` \| [`Part`](../../../models/types/interfaces/Part.md)

The artifact or undefined if not found

#### Implementation of

[`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md).[`loadArtifact`](../../BaseArtifactService/interfaces/BaseArtifactService.md#loadartifact)

***

### saveArtifact()

> **saveArtifact**(`params`): `number`

Defined in: [src/artifacts/InMemoryArtifactService.ts:59](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/InMemoryArtifactService.ts#L59)

Saves an artifact to the artifact service storage.

#### Parameters

##### params

[`ArtifactParams`](../../BaseArtifactService/interfaces/ArtifactParams.md)

The artifact parameters

#### Returns

`number`

The revision ID

#### Implementation of

[`BaseArtifactService`](../../BaseArtifactService/interfaces/BaseArtifactService.md).[`saveArtifact`](../../BaseArtifactService/interfaces/BaseArtifactService.md#saveartifact)
