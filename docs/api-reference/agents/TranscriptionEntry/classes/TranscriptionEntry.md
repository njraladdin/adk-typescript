[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/TranscriptionEntry](../README.md) / TranscriptionEntry

# Class: TranscriptionEntry

Defined in: [src/agents/TranscriptionEntry.ts:18](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/TranscriptionEntry.ts#L18)

A transcription entry represents audio or text content that needs to be transcribed.

## Constructors

### Constructor

> **new TranscriptionEntry**(`params`): `TranscriptionEntry`

Defined in: [src/agents/TranscriptionEntry.ts:33](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/TranscriptionEntry.ts#L33)

Creates a new instance of TranscriptionEntry.

#### Parameters

##### params

The parameters for the transcription entry.

###### audioData?

`string` \| `ArrayBuffer`

###### metadata?

`Record`\<`string`, `any`\>

###### textContent?

`string`

#### Returns

`TranscriptionEntry`

## Properties

### audioData?

> `optional` **audioData**: `string` \| `ArrayBuffer`

Defined in: [src/agents/TranscriptionEntry.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/TranscriptionEntry.ts#L20)

Audio data as a binary buffer or a string

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [src/agents/TranscriptionEntry.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/TranscriptionEntry.ts#L26)

Metadata for the transcription

***

### textContent?

> `optional` **textContent**: `string`

Defined in: [src/agents/TranscriptionEntry.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/TranscriptionEntry.ts#L23)

Text content
