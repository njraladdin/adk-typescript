[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [flows/llm\_flows/AudioTranscriber](../README.md) / AudioTranscriber

# Class: AudioTranscriber

Defined in: [src/flows/llm\_flows/AudioTranscriber.ts:22](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/AudioTranscriber.ts#L22)

A class to handle audio transcription.

## Constructors

### Constructor

> **new AudioTranscriber**(): `AudioTranscriber`

#### Returns

`AudioTranscriber`

## Methods

### transcribeFile()

> **transcribeFile**(`invocationContext`): [`Content`](../../../../models/types/interfaces/Content.md)[]

Defined in: [src/flows/llm\_flows/AudioTranscriber.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/AudioTranscriber.ts#L29)

Transcribe the audio data from the invocation context.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context containing transcription cache

#### Returns

[`Content`](../../../../models/types/interfaces/Content.md)[]

Transcribed content suitable for sending to the model
