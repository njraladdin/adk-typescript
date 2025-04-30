[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/LiteLlm](../README.md) / LiteLLMClient

# Class: LiteLLMClient

Defined in: [src/models/LiteLlm.ts:160](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LiteLlm.ts#L160)

LiteLLM client for making completions
This implementation uses any types in places where strict typing is challenging
due to differences between the TypeScript and JavaScript implementations

## Constructors

### Constructor

> **new LiteLLMClient**(): `LiteLLMClient`

#### Returns

`LiteLLMClient`

## Methods

### acompletion()

> **acompletion**(`model`, `messages`, `tools?`, ...`kwargs?`): `Promise`\<`any`\>

Defined in: [src/models/LiteLlm.ts:169](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LiteLlm.ts#L169)

Asynchronously calls completion

#### Parameters

##### model

`string`

The model name

##### messages

`any`[]

The messages to send

##### tools?

`any`[]

The tools to use

##### kwargs?

...`any`[]

Additional arguments

#### Returns

`Promise`\<`any`\>

A promise resolving to the model response

***

### completion()

> **completion**(`model`, `messages`, `tools?`, `stream?`, ...`kwargs?`): `any`

Defined in: [src/models/LiteLlm.ts:200](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LiteLlm.ts#L200)

Synchronously calls completion

#### Parameters

##### model

`string`

The model name

##### messages

`any`[]

The messages to send

##### tools?

`any`[]

The tools to use

##### stream?

`boolean` = `false`

Whether to stream the response

##### kwargs?

...`any`[]

Additional arguments

#### Returns

`any`

An iterable of model responses
