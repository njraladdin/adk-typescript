[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/BaseLlm](../README.md) / BaseLlm

# Class: `abstract` BaseLlm

Defined in: [src/models/BaseLlm.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlm.ts#L25)

The BaseLlm abstract class.

Attributes:
  model: The name of the LLM, e.g. gemini-1.5-flash or gemini-1.5-flash-001.

## Extended by

- [`Claude`](../../AnthropicLlm/classes/Claude.md)
- [`Gemini`](../../GoogleLlm/classes/Gemini.md)
- [`LiteLlm`](../../LiteLlm/classes/LiteLlm.md)

## Constructors

### Constructor

> **new BaseLlm**(`model`): `BaseLlm`

Defined in: [src/models/BaseLlm.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlm.ts#L31)

#### Parameters

##### model

`string`

#### Returns

`BaseLlm`

## Methods

### supportedModels()

> `static` **supportedModels**(): `string`[]

Defined in: [src/models/BaseLlm.ts:38](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlm.ts#L38)

Returns a list of supported models in regex for LlmRegistry.

#### Returns

`string`[]

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

***

### generateContentAsync()

> `abstract` **generateContentAsync**(`llmRequest`, `stream?`): `AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

Defined in: [src/models/BaseLlm.ts:53](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlm.ts#L53)

Generates one content from the given contents and tools.

#### Parameters

##### llmRequest

[`LlmRequest`](../../LlmRequest/classes/LlmRequest.md)

The request to send to the LLM.

##### stream?

`boolean`

Whether to do streaming call.

#### Returns

`AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

An async generator of LlmResponse.

For non-streaming call, it will only yield one LlmResponse.
For streaming call, it may yield more than one response, but all yielded
responses should be treated as one by merging the parts list.

## Properties

### model

> **model**: `string`

Defined in: [src/models/BaseLlm.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlm.ts#L29)

The name of the LLM, e.g. gemini-1.5-flash or gemini-1.5-flash-001.
