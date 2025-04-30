[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [cli/cli](../README.md) / runInputFile

# Function: runInputFile()

> **runInputFile**(`appName`, `rootAgent`, `artifactService`, `session`, `sessionService`, `inputPath`): `Promise`\<`void`\>

Defined in: [src/cli/cli.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/cli/cli.ts#L45)

Run an agent using input from a file

## Parameters

### appName

`string`

Name of the application

### rootAgent

[`LlmAgent`](../../../agents/LlmAgent/classes/LlmAgent.md)

The root agent to run

### artifactService

[`BaseArtifactService`](../../../artifacts/BaseArtifactService/interfaces/BaseArtifactService.md)

Service for managing artifacts

### session

[`SessionInterface`](../../../sessions/types/interfaces/SessionInterface.md)

The session to use

### sessionService

[`BaseSessionService`](../../../sessions/BaseSessionService/classes/BaseSessionService.md)

Service for managing sessions

### inputPath

`string`

Path to the input file

## Returns

`Promise`\<`void`\>
