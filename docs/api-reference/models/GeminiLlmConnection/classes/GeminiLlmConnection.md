[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/GeminiLlmConnection](../README.md) / GeminiLlmConnection

# Class: GeminiLlmConnection

Defined in: [src/models/GeminiLlmConnection.ts:61](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GeminiLlmConnection.ts#L61)

The Gemini model connection.

## Extends

- [`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md)

## Constructors

### Constructor

> **new GeminiLlmConnection**(`geminiSession`): `GeminiLlmConnection`

Defined in: [src/models/GeminiLlmConnection.ts:68](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GeminiLlmConnection.ts#L68)

Constructor for GeminiLlmConnection

#### Parameters

##### geminiSession

`AsyncSession`

The Gemini async session

#### Returns

`GeminiLlmConnection`

#### Overrides

[`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md).[`constructor`](../../BaseLlmConnection/classes/BaseLlmConnection.md#constructor)

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [src/models/GeminiLlmConnection.ts:272](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GeminiLlmConnection.ts#L272)

Closes the llm server connection.

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md).[`close`](../../BaseLlmConnection/classes/BaseLlmConnection.md#close)

***

### receive()

> **receive**(): `AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

Defined in: [src/models/GeminiLlmConnection.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GeminiLlmConnection.ts#L171)

Receives the model response using the llm server connection.

#### Returns

`AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

An async generator yielding LlmResponse objects.

#### Overrides

[`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md).[`receive`](../../BaseLlmConnection/classes/BaseLlmConnection.md#receive)

***

### sendContent()

> **sendContent**(`content`): `Promise`\<`void`\>

Defined in: [src/models/GeminiLlmConnection.ts:109](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GeminiLlmConnection.ts#L109)

Sends a user content to the gemini model.

The model will respond immediately upon receiving the content.
If you send function responses, all parts in the content should be function
responses.

#### Parameters

##### content

[`Content`](../../types/interfaces/Content.md)

The content to send to the model.

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md).[`sendContent`](../../BaseLlmConnection/classes/BaseLlmConnection.md#sendcontent)

***

### sendHistory()

> **sendHistory**(`history`): `Promise`\<`void`\>

Defined in: [src/models/GeminiLlmConnection.ts:82](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GeminiLlmConnection.ts#L82)

Sends the conversation history to the gemini model.

You call this method right after setting up the model connection.
The model will respond if the last content is from user, otherwise it will
wait for new user input before responding.

#### Parameters

##### history

[`Content`](../../types/interfaces/Content.md)[]

The conversation history to send to the model.

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md).[`sendHistory`](../../BaseLlmConnection/classes/BaseLlmConnection.md#sendhistory)

***

### sendRealtime()

> **sendRealtime**(`blob`): `Promise`\<`void`\>

Defined in: [src/models/GeminiLlmConnection.ts:143](https://github.com/njraladdin/adk-typescript/blob/main/src/models/GeminiLlmConnection.ts#L143)

Sends a chunk of audio or a frame of video to the model in realtime.

The model may not respond immediately upon receiving the blob. It will do
voice activity detection and decide when to respond.

#### Parameters

##### blob

[`Blob`](../../types/interfaces/Blob.md)

The blob to send to the model.

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseLlmConnection`](../../BaseLlmConnection/classes/BaseLlmConnection.md).[`sendRealtime`](../../BaseLlmConnection/classes/BaseLlmConnection.md#sendrealtime)
