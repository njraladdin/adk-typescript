[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/GoogleLlm](../README.md) / Gemini

# Class: Gemini

Defined in: [src/models/GoogleLlm.ts:516](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GoogleLlm.ts#L516)

Integration for Gemini models.

## Extends

- [`BaseLlm`](../../BaseLlm/classes/BaseLlm.md)

## Constructors

### Constructor

> **new Gemini**(`model`): `Gemini`

Defined in: [src/models/GoogleLlm.ts:526](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GoogleLlm.ts#L526)

Constructor

#### Parameters

##### model

`string` = `'gemini-1.5-flash'`

The name of the Gemini model, defaults to 'gemini-1.5-flash'

#### Returns

`Gemini`

#### Overrides

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`constructor`](../../BaseLlm/classes/BaseLlm.md#constructor)

## Methods

### supportedModels()

> `static` **supportedModels**(): `string`[]

Defined in: [src/models/GoogleLlm.ts:534](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GoogleLlm.ts#L534)

List of supported models

#### Returns

`string`[]

An array of regex patterns for supported model names

#### Overrides

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`supportedModels`](../../BaseLlm/classes/BaseLlm.md#supportedmodels)

***

### connect()

> **connect**(`llmRequest`): [`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md)

Defined in: [src/models/GoogleLlm.ts:732](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GoogleLlm.ts#L732)

Connect to the Gemini model and create a connection
This implementation is synchronous to match the BaseLlm interface
The implementation itself uses async/await internally

#### Parameters

##### llmRequest

[`LlmRequest`](../../LlmRequest/classes/LlmRequest.md)

#### Returns

[`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md)

#### Overrides

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`connect`](../../BaseLlm/classes/BaseLlm.md#connect)

***

### generateContentAsync()

> **generateContentAsync**(`llmRequest`, `stream`): `AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

Defined in: [src/models/GoogleLlm.ts:551](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GoogleLlm.ts#L551)

Generate content asynchronously

#### Parameters

##### llmRequest

[`LlmRequest`](../../LlmRequest/classes/LlmRequest.md)

The request to send to the Gemini model

##### stream

`boolean` = `false`

Whether to use streaming mode

#### Returns

`AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

AsyncGenerator yielding LlmResponse objects

#### Overrides

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`generateContentAsync`](../../BaseLlm/classes/BaseLlm.md#generatecontentasync)

## Properties

### model

> **model**: `string`

Defined in: [src/models/BaseLlm.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlm.ts#L29)

The name of the LLM, e.g. gemini-1.5-flash or gemini-1.5-flash-001.

#### Inherited from

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md).[`model`](../../BaseLlm/classes/BaseLlm.md#model)
