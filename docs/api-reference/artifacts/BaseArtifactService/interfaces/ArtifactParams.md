[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [artifacts/BaseArtifactService](../README.md) / ArtifactParams

# Interface: ArtifactParams

Defined in: [src/artifacts/BaseArtifactService.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L20)

Parameters for artifact operations.

## Properties

### appName

> **appName**: `string`

Defined in: [src/artifacts/BaseArtifactService.ts:22](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L22)

The application name

***

### artifact?

> `optional` **artifact**: [`Part`](../../../models/types/interfaces/Part.md)

Defined in: [src/artifacts/BaseArtifactService.ts:37](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L37)

The artifact content (for save operations)

***

### filename

> **filename**: `string`

Defined in: [src/artifacts/BaseArtifactService.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L31)

The filename of the artifact

***

### sessionId

> **sessionId**: `string`

Defined in: [src/artifacts/BaseArtifactService.ts:28](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L28)

The session ID

***

### userId

> **userId**: `string`

Defined in: [src/artifacts/BaseArtifactService.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L25)

The user ID

***

### version?

> `optional` **version**: `number`

Defined in: [src/artifacts/BaseArtifactService.ts:34](https://github.com/njraladdin/adk-typescript/blob/main/src/artifacts/BaseArtifactService.ts#L34)

The version of the artifact (for load operations)
