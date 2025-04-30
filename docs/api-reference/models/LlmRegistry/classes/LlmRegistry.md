[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/LlmRegistry](../README.md) / LlmRegistry

# Class: LlmRegistry

Defined in: [src/models/LlmRegistry.ts:35](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRegistry.ts#L35)

Registry for LLMs.

## Constructors

### Constructor

> **new LlmRegistry**(): `LlmRegistry`

#### Returns

`LlmRegistry`

## Methods

### newLlm()

> `static` **newLlm**(`model`): [`BaseLlm`](../../BaseLlm/classes/BaseLlm.md)

Defined in: [src/models/LlmRegistry.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRegistry.ts#L41)

Creates a new LLM instance.

#### Parameters

##### model

`string`

The model name.

#### Returns

[`BaseLlm`](../../BaseLlm/classes/BaseLlm.md)

The LLM instance.

***

### register()

> `static` **register**(`llmClass`): `void`

Defined in: [src/models/LlmRegistry.ts:68](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRegistry.ts#L68)

Registers a new LLM class.

#### Parameters

##### llmClass

`LlmConstructor`

The constructor class that implements the model.

#### Returns

`void`

***

### resolve()

> `static` **resolve**(`model`): `LlmConstructor`

Defined in: [src/models/LlmRegistry.ts:86](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmRegistry.ts#L86)

Resolves the model to a BaseLlm constructor.

#### Parameters

##### model

`string`

The model name.

#### Returns

`LlmConstructor`

The BaseLlm constructor.

#### Throws

Error if the model is not found.
