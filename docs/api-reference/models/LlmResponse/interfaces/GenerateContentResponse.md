[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/LlmResponse](../README.md) / GenerateContentResponse

# Interface: GenerateContentResponse

Defined in: [src/models/LlmResponse.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L20)

Interface representing a response from the LLM model API.

## Properties

### candidates?

> `optional` **candidates**: `object`[]

Defined in: [src/models/LlmResponse.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L21)

#### content?

> `optional` **content**: [`Content`](../../types/interfaces/Content.md)

#### finish\_message?

> `optional` **finish\_message**: `string`

#### finish\_reason?

> `optional` **finish\_reason**: `string`

#### grounding\_metadata?

> `optional` **grounding\_metadata**: [`GroundingMetadata`](../../types/interfaces/GroundingMetadata.md)

***

### prompt\_feedback?

> `optional` **prompt\_feedback**: `object`

Defined in: [src/models/LlmResponse.ts:27](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L27)

#### block\_reason?

> `optional` **block\_reason**: `string`

#### block\_reason\_message?

> `optional` **block\_reason\_message**: `string`
