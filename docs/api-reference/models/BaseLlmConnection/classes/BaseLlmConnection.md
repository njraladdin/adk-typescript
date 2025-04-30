[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [models/BaseLlmConnection](../README.md) / BaseLlmConnection

# Class: `abstract` BaseLlmConnection

Defined in: [src/models/BaseLlmConnection.ts:21](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlmConnection.ts#L21)

The base class for a live model connection.

## Extended by

- [`GeminiLlmConnection`](../../GeminiLlmConnection/classes/GeminiLlmConnection.md)

## Constructors

### Constructor

> **new BaseLlmConnection**(): `BaseLlmConnection`

#### Returns

`BaseLlmConnection`

## Methods

### close()

> `abstract` **close**(): `Promise`\<`void`\>

Defined in: [src/models/BaseLlmConnection.ts:64](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlmConnection.ts#L64)

Closes the llm server connection.

#### Returns

`Promise`\<`void`\>

***

### receive()

> `abstract` **receive**(): `AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

Defined in: [src/models/BaseLlmConnection.ts:59](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlmConnection.ts#L59)

Receives the model response using the llm server connection.

#### Returns

`AsyncGenerator`\<[`LlmResponse`](../../LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

An async generator yielding LlmResponse objects.

***

### sendContent()

> `abstract` **sendContent**(`content`): `Promise`\<`void`\>

Defined in: [src/models/BaseLlmConnection.ts:42](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlmConnection.ts#L42)

Sends a user content to the model.

The model will respond immediately upon receiving the content.
If you send function responses, all parts in the content should be function
responses.

#### Parameters

##### content

[`Content`](../../types/interfaces/Content.md)

The content to send to the model.

#### Returns

`Promise`\<`void`\>

***

### sendHistory()

> `abstract` **sendHistory**(`history`): `Promise`\<`void`\>

Defined in: [src/models/BaseLlmConnection.ts:31](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlmConnection.ts#L31)

Sends the conversation history to the model.

You call this method right after setting up the model connection.
The model will respond if the last content is from user, otherwise it will
wait for new user input before responding.

#### Parameters

##### history

[`Content`](../../types/interfaces/Content.md)[]

The conversation history to send to the model.

#### Returns

`Promise`\<`void`\>

***

### sendRealtime()

> `abstract` **sendRealtime**(`blob`): `Promise`\<`void`\>

Defined in: [src/models/BaseLlmConnection.ts:52](https://github.com/njraladdin/adk-typescript/blob/main/src/models/BaseLlmConnection.ts#L52)

Sends a chunk of audio or a frame of video to the model in realtime.

The model may not respond immediately upon receiving the blob. It will do
voice activity detection and decide when to respond.

#### Parameters

##### blob

[`Blob`](../../types/interfaces/Blob.md)

The blob to send to the model.

#### Returns

`Promise`\<`void`\>
