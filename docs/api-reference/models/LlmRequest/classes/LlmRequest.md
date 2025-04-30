[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/LlmRequest](../README.md) / LlmRequest

# Class: LlmRequest

Defined in: [src/models/LlmRequest.ts:22](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L22)

LLM request class that allows passing in tools, output schema and system
instructions to the model.

## Constructors

### Constructor

> **new LlmRequest**(): `LlmRequest`

Defined in: [src/models/LlmRequest.ts:54](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L54)

Creates a new LLM request.

#### Returns

`LlmRequest`

## Methods

### appendInstructions()

> **appendInstructions**(`instructions`): `void`

Defined in: [src/models/LlmRequest.ts:75](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L75)

Appends instructions to the system instruction.

#### Parameters

##### instructions

`string`[]

The instructions to append.

#### Returns

`void`

***

### appendTools()

> **appendTools**(`tools`): `void`

Defined in: [src/models/LlmRequest.ts:91](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L91)

Appends tools to the request.

#### Parameters

##### tools

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md)[]

The tools to append.

#### Returns

`void`

***

### getToolsDict()

> **getToolsDict**(): `Record`\<`string`, [`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md)\>

Defined in: [src/models/LlmRequest.ts:180](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L180)

Get the tools dictionary for this request.

#### Returns

`Record`\<`string`, [`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md)\>

The tools dictionary

***

### setOutputSchema()

> **setOutputSchema**(`baseModel`): `void`

Defined in: [src/models/LlmRequest.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L171)

Sets the output schema for the request.

#### Parameters

##### baseModel

`any`

The schema class to set the output schema to.

#### Returns

`void`

***

### toRequestObject()

> **toRequestObject**(): `any`

Defined in: [src/models/LlmRequest.ts:188](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L188)

Converts this LlmRequest to a plain object for API requests.

#### Returns

`any`

A plain object representation of this request

## Properties

### config

> **config**: [`GenerateContentConfig`](../../types/interfaces/GenerateContentConfig.md)

Defined in: [src/models/LlmRequest.ts:37](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L37)

Additional config for the generate content request.
Tools in generate_content_config should not be set.

***

### contents

> **contents**: [`Content`](../../types/interfaces/Content.md)[] = `[]`

Defined in: [src/models/LlmRequest.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L31)

The contents to send to the model.

***

### liveConnectConfig

> **liveConnectConfig**: [`LiveConnectConfig`](../../types/interfaces/LiveConnectConfig.md)

Defined in: [src/models/LlmRequest.ts:42](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L42)

Configuration for live connections

***

### model?

> `optional` **model**: `string` = `undefined`

Defined in: [src/models/LlmRequest.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRequest.ts#L26)

The model name.
