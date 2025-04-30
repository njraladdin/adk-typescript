[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/LlmResponse](../README.md) / LlmResponseOptions

# Interface: LlmResponseOptions

Defined in: [src/models/LlmResponse.ts:36](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L36)

Options for creating an LlmResponse.

## Properties

### content?

> `optional` **content**: [`Content`](../../types/interfaces/Content.md)

Defined in: [src/models/LlmResponse.ts:40](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L40)

The content of the response.

***

### customMetadata?

> `optional` **customMetadata**: `Record`\<`string`, `any`\>

Defined in: [src/models/LlmResponse.ts:80](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L80)

The custom metadata of the LlmResponse.
An optional key-value pair to label an LlmResponse.
NOTE: the entire dict must be JSON serializable.

***

### errorCode?

> `optional` **errorCode**: `string`

Defined in: [src/models/LlmResponse.ts:62](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L62)

Error code if the response is an error. Code varies by model.

***

### errorMessage?

> `optional` **errorMessage**: `string`

Defined in: [src/models/LlmResponse.ts:67](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L67)

Error message if the response is an error.

***

### groundingMetadata?

> `optional` **groundingMetadata**: [`GroundingMetadata`](../../types/interfaces/GroundingMetadata.md)

Defined in: [src/models/LlmResponse.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L45)

The grounding metadata of the response.

***

### interrupted?

> `optional` **interrupted**: `boolean`

Defined in: [src/models/LlmResponse.ts:73](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L73)

Flag indicating that LLM was interrupted when generating the content.
Usually it's due to user interruption during a bidi streaming.

***

### partial?

> `optional` **partial**: `boolean`

Defined in: [src/models/LlmResponse.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L51)

Indicates whether the text content is part of an unfinished text stream.
Only used for streaming mode and when the content is plain text.

***

### turnComplete?

> `optional` **turnComplete**: `boolean`

Defined in: [src/models/LlmResponse.ts:57](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L57)

Indicates whether the response from the model is complete.
Only used for streaming mode.
