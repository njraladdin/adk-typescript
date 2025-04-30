[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [artifacts/BaseArtifactService](../README.md) / BaseArtifactService

# Interface: BaseArtifactService

Defined in: [src/artifacts/BaseArtifactService.ts:44](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L44)

Interface for artifact services.
Artifact services provide functionality to store and retrieve artifacts.

## Methods

### deleteArtifact()

> **deleteArtifact**(`params`): `Promise`\<`void`\>

Defined in: [src/artifacts/BaseArtifactService.ts:67](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L67)

Deletes an artifact.

#### Parameters

##### params

[`ArtifactParams`](ArtifactParams.md)

The artifact parameters

#### Returns

`Promise`\<`void`\>

A promise that resolves when the operation is complete

***

### listArtifactKeys()

> **listArtifactKeys**(`params`): `string`[] \| `Promise`\<`string`[]\>

Defined in: [src/artifacts/BaseArtifactService.ts:75](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L75)

Lists all the artifact filenames within a session.

#### Parameters

##### params

[`ArtifactParams`](ArtifactParams.md)

The artifact parameters

#### Returns

`string`[] \| `Promise`\<`string`[]\>

A list of all artifact filenames within a session

***

### listVersions()

> **listVersions**(`params`): `number`[] \| `Promise`\<`number`[]\>

Defined in: [src/artifacts/BaseArtifactService.ts:83](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L83)

Lists all versions of an artifact.

#### Parameters

##### params

[`ArtifactParams`](ArtifactParams.md)

The artifact parameters

#### Returns

`number`[] \| `Promise`\<`number`[]\>

A list of all available versions of the artifact

***

### loadArtifact()

> **loadArtifact**(`params`): `undefined` \| [`Part`](../../../models/types/interfaces/Part.md) \| `Promise`\<`undefined` \| [`Part`](../../../models/types/interfaces/Part.md)\>

Defined in: [src/artifacts/BaseArtifactService.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L51)

Loads an artifact.

#### Parameters

##### params

[`ArtifactParams`](ArtifactParams.md)

The artifact parameters

#### Returns

`undefined` \| [`Part`](../../../models/types/interfaces/Part.md) \| `Promise`\<`undefined` \| [`Part`](../../../models/types/interfaces/Part.md)\>

The loaded artifact, or undefined if not found

***

### saveArtifact()

> **saveArtifact**(`params`): `number` \| `Promise`\<`number`\>

Defined in: [src/artifacts/BaseArtifactService.ts:59](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L59)

Saves an artifact.

#### Parameters

##### params

[`ArtifactParams`](ArtifactParams.md)

The artifact parameters

#### Returns

`number` \| `Promise`\<`number`\>

The version of the saved artifact
