[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [events/Event](../README.md) / Event

# Class: Event

Defined in: [src/events/Event.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L25)

Represents an event in a conversation between agents and users.

It is used to store the content of the conversation, as well as the actions
taken by the agents like function calls, etc.

## Extends

- [`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

## Constructors

### Constructor

> **new Event**(`params`): `Event`

Defined in: [src/events/Event.ts:72](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L72)

Constructor for Event class

#### Parameters

##### params

###### actions?

[`EventActions`](../../EventActions/classes/EventActions.md)

###### author

`string`

###### branch?

`string`

###### content?

`any`

###### customMetadata?

`Record`\<`string`, `any`\>

###### errorCode?

`string`

###### errorMessage?

`string`

###### id?

`string`

###### interrupted?

`boolean`

###### invocationId?

`string`

###### longRunningToolIds?

`Set`\<`string`\>

###### partial?

`boolean`

###### timestamp?

`number`

###### turnComplete?

`boolean`

#### Returns

`Event`

#### Overrides

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`constructor`](../../../models/LlmResponse/classes/LlmResponse.md#constructor)

## Methods

### create()

> `static` **create**(`generateContentResponse`): [`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

Defined in: [src/models/LlmResponse.ts:153](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L153)

Creates an LlmResponse from a GenerateContentResponse.

#### Parameters

##### generateContentResponse

[`GenerateContentResponse`](../../../models/LlmResponse/interfaces/GenerateContentResponse.md)

The GenerateContentResponse to create the LlmResponse from.

#### Returns

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

The LlmResponse.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`create`](../../../models/LlmResponse/classes/LlmResponse.md#create)

***

### newId()

> `static` **newId**(): `string`

Defined in: [src/events/Event.ts:165](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L165)

Generate a new random ID for an event.

#### Returns

`string`

***

### getFunctionCalls()

> **getFunctionCalls**(): [`FunctionCall`](../../../models/types/interfaces/FunctionCall.md)[]

Defined in: [src/events/Event.ts:123](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L123)

Returns the function calls in the event.

#### Returns

[`FunctionCall`](../../../models/types/interfaces/FunctionCall.md)[]

***

### getFunctionResponses()

> **getFunctionResponses**(): [`FunctionResponse`](../../../models/types/interfaces/FunctionResponse.md)[]

Defined in: [src/events/Event.ts:138](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L138)

Returns the function responses in the event.

#### Returns

[`FunctionResponse`](../../../models/types/interfaces/FunctionResponse.md)[]

***

### getText()

> **getText**(): `undefined` \| `string`

Defined in: [src/models/LlmResponse.ts:206](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L206)

Gets the text content of this response, if available.

#### Returns

`undefined` \| `string`

The text content as a string, or undefined if not available.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`getText`](../../../models/LlmResponse/classes/LlmResponse.md#gettext)

***

### hasError()

> **hasError**(): `boolean`

Defined in: [src/models/LlmResponse.ts:198](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L198)

Checks if this response has an error.

#### Returns

`boolean`

True if this response has an error, false otherwise.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`hasError`](../../../models/LlmResponse/classes/LlmResponse.md#haserror)

***

### hasTrailingCodeExecutionResult()

> **hasTrailingCodeExecutionResult**(): `boolean`

Defined in: [src/events/Event.ts:153](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L153)

Returns whether the event has a trailing code execution result.

#### Returns

`boolean`

***

### isFinalResponse()

> **isFinalResponse**(): `boolean`

Defined in: [src/events/Event.ts:108](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L108)

Returns whether the event is the final response of the agent.

#### Returns

`boolean`

***

### withCustomMetadata()

> **withCustomMetadata**(`customMetadata`): [`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

Defined in: [src/models/LlmResponse.ts:276](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L276)

Creates a copy of this LlmResponse with the given custom metadata.

#### Parameters

##### customMetadata

`Record`\<`string`, `any`\>

The custom metadata.

#### Returns

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

A new LlmResponse with the updated custom metadata.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`withCustomMetadata`](../../../models/LlmResponse/classes/LlmResponse.md#withcustommetadata)

***

### withInterrupted()

> **withInterrupted**(`interrupted`): [`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

Defined in: [src/models/LlmResponse.ts:258](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L258)

Creates a copy of this LlmResponse with the given interrupted flag.

#### Parameters

##### interrupted

`boolean`

The interrupted flag value.

#### Returns

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

A new LlmResponse with the updated interrupted flag.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`withInterrupted`](../../../models/LlmResponse/classes/LlmResponse.md#withinterrupted)

***

### withPartial()

> **withPartial**(`partial`): [`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

Defined in: [src/models/LlmResponse.ts:222](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L222)

Creates a copy of this LlmResponse with the given partial flag.

#### Parameters

##### partial

`boolean`

The partial flag value.

#### Returns

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

A new LlmResponse with the updated partial flag.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`withPartial`](../../../models/LlmResponse/classes/LlmResponse.md#withpartial)

***

### withTurnComplete()

> **withTurnComplete**(`turnComplete`): [`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

Defined in: [src/models/LlmResponse.ts:240](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L240)

Creates a copy of this LlmResponse with the given turn complete flag.

#### Parameters

##### turnComplete

`boolean`

The turn complete flag value.

#### Returns

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md)

A new LlmResponse with the updated turn complete flag.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`withTurnComplete`](../../../models/LlmResponse/classes/LlmResponse.md#withturncomplete)

## Properties

### actions

> **actions**: [`EventActions`](../../EventActions/classes/EventActions.md)

Defined in: [src/events/Event.ts:39](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L39)

The actions taken by the agent.

***

### author

> **author**: `string`

Defined in: [src/events/Event.ts:34](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L34)

'user' or the name of the agent, indicating who appended the event to the session.

***

### branch?

> `optional` **branch**: `string`

Defined in: [src/events/Event.ts:57](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L57)

The branch of the event.

The format is like agent_1.agent_2.agent_3, where agent_1 is the parent of
agent_2, and agent_2 is the parent of agent_3.

Branch is used when multiple sub-agent shouldn't see their peer agents'
conversation history.

***

### content?

> `optional` **content**: [`Content`](../../../models/types/interfaces/Content.md)

Defined in: [src/models/LlmResponse.ts:91](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L91)

The content of the response.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`content`](../../../models/LlmResponse/classes/LlmResponse.md#content)

***

### customMetadata?

> `optional` **customMetadata**: `Record`\<`string`, `any`\>

Defined in: [src/models/LlmResponse.ts:131](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L131)

The custom metadata of the LlmResponse.
An optional key-value pair to label an LlmResponse.
NOTE: the entire dict must be JSON serializable.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`customMetadata`](../../../models/LlmResponse/classes/LlmResponse.md#custommetadata)

***

### errorCode?

> `optional` **errorCode**: `string`

Defined in: [src/models/LlmResponse.ts:113](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L113)

Error code if the response is an error. Code varies by model.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`errorCode`](../../../models/LlmResponse/classes/LlmResponse.md#errorcode)

***

### errorMessage?

> `optional` **errorMessage**: `string`

Defined in: [src/models/LlmResponse.ts:118](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L118)

Error message if the response is an error.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`errorMessage`](../../../models/LlmResponse/classes/LlmResponse.md#errormessage)

***

### groundingMetadata?

> `optional` **groundingMetadata**: [`GroundingMetadata`](../../../models/types/interfaces/GroundingMetadata.md)

Defined in: [src/models/LlmResponse.ts:96](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L96)

The grounding metadata of the response.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`groundingMetadata`](../../../models/LlmResponse/classes/LlmResponse.md#groundingmetadata)

***

### id

> **id**: `string` = `''`

Defined in: [src/events/Event.ts:62](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L62)

The unique identifier of the event.

***

### interrupted?

> `optional` **interrupted**: `boolean`

Defined in: [src/models/LlmResponse.ts:124](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L124)

Flag indicating that LLM was interrupted when generating the content.
Usually it's due to user interruption during a bidi streaming.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`interrupted`](../../../models/LlmResponse/classes/LlmResponse.md#interrupted)

***

### invocationId

> **invocationId**: `string` = `''`

Defined in: [src/events/Event.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L29)

The invocation ID of the event.

***

### longRunningToolIds?

> `optional` **longRunningToolIds**: `Set`\<`string`\>

Defined in: [src/events/Event.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L46)

Set of ids of the long running function calls.
Agent client will know from this field about which function call is long running.
only valid for function call event

***

### partial?

> `optional` **partial**: `boolean`

Defined in: [src/models/LlmResponse.ts:102](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L102)

Indicates whether the text content is part of an unfinished text stream.
Only used for streaming mode and when the content is plain text.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`partial`](../../../models/LlmResponse/classes/LlmResponse.md#partial)

***

### timestamp

> **timestamp**: `number`

Defined in: [src/events/Event.ts:67](https://github.com/njraladdin/adk-typescript/blob/main/src/events/Event.ts#L67)

The timestamp of the event.

***

### turnComplete?

> `optional` **turnComplete**: `boolean`

Defined in: [src/models/LlmResponse.ts:108](https://github.com/njraladdin/adk-typescript/blob/main/src/models/LlmResponse.ts#L108)

Indicates whether the response from the model is complete.
Only used for streaming mode.

#### Inherited from

[`LlmResponse`](../../../models/LlmResponse/classes/LlmResponse.md).[`turnComplete`](../../../models/LlmResponse/classes/LlmResponse.md#turncomplete)
