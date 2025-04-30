[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/AnthropicLlm](../README.md) / Claude

# Class: Claude

Defined in: [src/models/AnthropicLlm.ts:391](https://github.com/njraladdin/adk-typescript/blob/main/src/models/AnthropicLlm.ts#L391)

Claude class - wrapper around Anthropic's Claude API

## Extends

- [`BaseLlm`](../../BaseLlm/classes/BaseLlm.md)

## Constructors

### Constructor

> **new Claude**(`model`): `Claude`

Defined in: [src/models/AnthropicLlm.ts:398](https://github.com/njraladdin/adk-typescript/blob/main/src/models/AnthropicLlm.ts#L398)

Constructor

#### Parameters

##### model

`string` = `'claude-3-5-sonnet-v2@20241022'`

Model name, defaults to 'claude-3-5-sonnet-v2@20241022'

#### Returns

`Claude`

#### Overrides

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`constructor`](../../BaseLlm/classes/BaseLlm.md#constructor)

## Methods

### supportedModels()

> `static` **supportedModels**(): `string`[]

Defined in: [src/models/AnthropicLlm.ts:515](https://github.com/njraladdin/adk-typescript/blob/main/src/models/AnthropicLlm.ts#L515)

List of supported models

#### Returns

`string`[]

Regular expressions for supported model names

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

Defined in: [src/models/AnthropicLlm.ts:430](https://github.com/njraladdin/adk-typescript/blob/main/src/models/AnthropicLlm.ts#L430)

Generate content asynchronously

#### Parameters

##### llmRequest

[`LlmRequest`](../../LlmRequest/classes/LlmRequest.md)

The request

##### stream

`boolean` = `false`

Whether to stream (currently not supported for Claude)

#### Returns

`AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

AsyncGenerator yielding responses

#### Overrides

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`generateContentAsync`](../../BaseLlm/classes/BaseLlm.md#generatecontentasync)

## Properties

### model

> **model**: `string`

Defined in: [src/models/BaseLlm.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlm.ts#L29)

The name of the LLM, e.g. gemini-1.5-flash or gemini-1.5-flash-001.

#### Inherited from

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`model`](../../BaseLlm/classes/BaseLlm.md#model)
