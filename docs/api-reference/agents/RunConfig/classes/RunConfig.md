[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/RunConfig](../README.md) / RunConfig

# Class: RunConfig

Defined in: [src/agents/RunConfig.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L41)

Configuration for running an agent

## Constructors

### Constructor

> **new RunConfig**(`config`): `RunConfig`

Defined in: [src/agents/RunConfig.ts:96](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L96)

Creates a new RunConfig with default values

#### Parameters

##### config

`Partial`\<`RunConfig`\> = `{}`

#### Returns

`RunConfig`

## Properties

### disabledTools?

> `optional` **disabledTools**: `string`[]

Defined in: [src/agents/RunConfig.ts:65](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L65)

Specific tools to disable

***

### enabledTools?

> `optional` **enabledTools**: `string`[]

Defined in: [src/agents/RunConfig.ts:60](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L60)

Specific tools to enable (if undefined, all tools are enabled)

***

### maxLlmCalls?

> `optional` **maxLlmCalls**: `number`

Defined in: [src/agents/RunConfig.ts:80](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L80)

Maximum number of LLM calls to make before raising an error

***

### outputAudioTranscription?

> `optional` **outputAudioTranscription**: [`AudioTranscriptionConfig`](../interfaces/AudioTranscriptionConfig.md)

Defined in: [src/agents/RunConfig.ts:91](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L91)

Configuration for audio transcription

***

### responseModalities?

> `optional` **responseModalities**: `string`[]

Defined in: [src/agents/RunConfig.ts:86](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L86)

Response modalities for multi-modal output
e.g., ['TEXT', 'AUDIO']

***

### saveInputBlobsAsArtifacts?

> `optional` **saveInputBlobsAsArtifacts**: `boolean`

Defined in: [src/agents/RunConfig.ts:70](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L70)

Whether to save input blobs as artifacts

***

### streamingMode?

> `optional` **streamingMode**: [`StreamingMode`](../enumerations/StreamingMode.md)

Defined in: [src/agents/RunConfig.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L45)

The streaming mode to use for agent responses

***

### supportCfc?

> `optional` **supportCfc**: `boolean`

Defined in: [src/agents/RunConfig.ts:75](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L75)

Whether to support code function calling

***

### timeoutMs?

> `optional` **timeoutMs**: `number`

Defined in: [src/agents/RunConfig.ts:55](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L55)

Timeout in milliseconds

***

### trace?

> `optional` **trace**: `boolean`

Defined in: [src/agents/RunConfig.ts:50](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/RunConfig.ts#L50)

Whether to trace execution
