[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/LiteLlm](../README.md) / LiteLlm

# Class: LiteLlm

Defined in: [src/models/LiteLlm.ts:620](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LiteLlm.ts#L620)

LiteLlm class - wrapper around LiteLLM

## Extends

- [`BaseLlm`](../../BaseLlm/classes/BaseLlm.md)

## Constructors

### Constructor

> **new LiteLlm**(`model`, `additionalArgs`): `LiteLlm`

Defined in: [src/models/LiteLlm.ts:629](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LiteLlm.ts#L629)

Constructor

#### Parameters

##### model

`string`

The model name

##### additionalArgs

`Record`\<`string`, `any`\> = `{}`

Additional arguments

#### Returns

`LiteLlm`

#### Overrides

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`constructor`](../../BaseLlm/classes/BaseLlm.md#constructor)

## Methods

### supportedModels()

> `static` **supportedModels**(): `string`[]

Defined in: [src/models/LiteLlm.ts:771](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LiteLlm.ts#L771)

List of supported models

#### Returns

`string`[]

Empty array - LiteLlm supports all models

#### Overrides

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`supportedModels`](../../BaseLlm/classes/BaseLlm.md#supportedmodels)

***

### connect()

> **connect**(`llmRequest`): [`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md)

Defined in: [src/models/BaseLlm.ts:64](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlm.ts#L64)

Creates a live connection to the LLM.

#### Parameters

##### llmRequest

[`LlmRequest`](../../LlmRequest/classes/LlmRequest.md)

The request to send to the LLM.

#### Returns

[`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md)

The connection to the LLM.

#### Inherited from

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`connect`](../../BaseLlm/classes/BaseLlm.md#connect)

***

### generateContentAsync()

> **generateContentAsync**(`llmRequest`, `stream`): `AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

Defined in: [src/models/LiteLlm.ts:647](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LiteLlm.ts#L647)

Generate content asynchronously

#### Parameters

##### llmRequest

[`LlmRequest`](../../LlmRequest/classes/LlmRequest.md)

The request

##### stream

`boolean` = `false`

Whether to stream

#### Returns

`AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

AsyncGenerator yielding responses

#### Overrides

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`generateContentAsync`](../../BaseLlm/classes/BaseLlm.md#generatecontentasync)

## Properties

### llmClient

> **llmClient**: [`LiteLLMClient`](LiteLLMClient.md)

Defined in: [src/models/LiteLlm.ts:621](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LiteLlm.ts#L621)

***

### model

> **model**: `string`

Defined in: [src/models/BaseLlm.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlm.ts#L29)

The name of the LLM, e.g. gemini-1.5-flash or gemini-1.5-flash-001.

#### Inherited from

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`model`](../../BaseLlm/classes/BaseLlm.md#model)
