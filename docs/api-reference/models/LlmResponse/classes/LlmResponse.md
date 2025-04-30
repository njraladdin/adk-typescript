[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/LlmResponse](../README.md) / LlmResponse

# Class: LlmResponse

Defined in: [src/models/LlmResponse.ts:87](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L87)

LLM response class that provides the first candidate response from the model
if available. Otherwise, returns error code and message.

## Extended by

- [`Event`](../../../events/Event/classes/Event.md)

## Constructors

### Constructor

> **new LlmResponse**(`options`): `LlmResponse`

Defined in: [src/models/LlmResponse.ts:137](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L137)

Creates a new LlmResponse instance.

#### Parameters

##### options

[`LlmResponseOptions`](../interfaces/LlmResponseOptions.md) = `{}`

Configuration options for the response

#### Returns

`LlmResponse`

## Methods

### create()

> `static` **create**(`generateContentResponse`): `LlmResponse`

Defined in: [src/models/LlmResponse.ts:153](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L153)

Creates an LlmResponse from a GenerateContentResponse.

#### Parameters

##### generateContentResponse

[`GenerateContentResponse`](../interfaces/GenerateContentResponse.md)

The GenerateContentResponse to create the LlmResponse from.

#### Returns

`LlmResponse`

The LlmResponse.

***

### getText()

> **getText**(): `undefined` \| `string`

Defined in: [src/models/LlmResponse.ts:206](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L206)

Gets the text content of this response, if available.

#### Returns

`undefined` \| `string`

The text content as a string, or undefined if not available.

***

### hasError()

> **hasError**(): `boolean`

Defined in: [src/models/LlmResponse.ts:198](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L198)

Checks if this response has an error.

#### Returns

`boolean`

True if this response has an error, false otherwise.

***

### withCustomMetadata()

> **withCustomMetadata**(`customMetadata`): `LlmResponse`

Defined in: [src/models/LlmResponse.ts:276](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L276)

Creates a copy of this LlmResponse with the given custom metadata.

#### Parameters

##### customMetadata

`Record`\<`string`, `any`\>

The custom metadata.

#### Returns

`LlmResponse`

A new LlmResponse with the updated custom metadata.

***

### withInterrupted()

> **withInterrupted**(`interrupted`): `LlmResponse`

Defined in: [src/models/LlmResponse.ts:258](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L258)

Creates a copy of this LlmResponse with the given interrupted flag.

#### Parameters

##### interrupted

`boolean`

The interrupted flag value.

#### Returns

`LlmResponse`

A new LlmResponse with the updated interrupted flag.

***

### withPartial()

> **withPartial**(`partial`): `LlmResponse`

Defined in: [src/models/LlmResponse.ts:222](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L222)

Creates a copy of this LlmResponse with the given partial flag.

#### Parameters

##### partial

`boolean`

The partial flag value.

#### Returns

`LlmResponse`

A new LlmResponse with the updated partial flag.

***

### withTurnComplete()

> **withTurnComplete**(`turnComplete`): `LlmResponse`

Defined in: [src/models/LlmResponse.ts:240](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L240)

Creates a copy of this LlmResponse with the given turn complete flag.

#### Parameters

##### turnComplete

`boolean`

The turn complete flag value.

#### Returns

`LlmResponse`

A new LlmResponse with the updated turn complete flag.

## Properties

### content?

> `optional` **content**: [`Content`](../../types/interfaces/Content.md)

Defined in: [src/models/LlmResponse.ts:91](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L91)

The content of the response.

***

### customMetadata?

> `optional` **customMetadata**: `Record`\<`string`, `any`\>

Defined in: [src/models/LlmResponse.ts:131](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L131)

The custom metadata of the LlmResponse.
An optional key-value pair to label an LlmResponse.
NOTE: the entire dict must be JSON serializable.

***

### errorCode?

> `optional` **errorCode**: `string`

Defined in: [src/models/LlmResponse.ts:113](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L113)

Error code if the response is an error. Code varies by model.

***

### errorMessage?

> `optional` **errorMessage**: `string`

Defined in: [src/models/LlmResponse.ts:118](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L118)

Error message if the response is an error.

***

### groundingMetadata?

> `optional` **groundingMetadata**: [`GroundingMetadata`](../../types/interfaces/GroundingMetadata.md)

Defined in: [src/models/LlmResponse.ts:96](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L96)

The grounding metadata of the response.

***

### interrupted?

> `optional` **interrupted**: `boolean`

Defined in: [src/models/LlmResponse.ts:124](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L124)

Flag indicating that LLM was interrupted when generating the content.
Usually it's due to user interruption during a bidi streaming.

***

### partial?

> `optional` **partial**: `boolean`

Defined in: [src/models/LlmResponse.ts:102](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L102)

Indicates whether the text content is part of an unfinished text stream.
Only used for streaming mode and when the content is plain text.

***

### turnComplete?

> `optional` **turnComplete**: `boolean`

Defined in: [src/models/LlmResponse.ts:108](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L108)

Indicates whether the response from the model is complete.
Only used for streaming mode.
