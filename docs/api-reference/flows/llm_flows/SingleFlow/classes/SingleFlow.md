[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [flows/llm\_flows/SingleFlow](../README.md) / SingleFlow

# Class: SingleFlow

Defined in: [src/flows/llm\_flows/SingleFlow.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/SingleFlow.ts#L23)

A simple flow that only executes one LLM call.

This is the TypeScript equivalent of the Python SingleFlow implementation,
which automatically includes several request and response processors.

## Extends

- [`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md)

## Extended by

- [`AutoFlow`](../../AutoFlow/classes/AutoFlow.md)

## Constructors

### Constructor

> **new SingleFlow**(`additionalRequestProcessors`, `additionalResponseProcessors`): `SingleFlow`

Defined in: [src/flows/llm\_flows/SingleFlow.ts:30](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/SingleFlow.ts#L30)

Constructs a new SingleFlow with the given request processors.

#### Parameters

##### additionalRequestProcessors

[`BaseLlmRequestProcessor`](../../BaseLlmProcessor/interfaces/BaseLlmRequestProcessor.md)[] = `[]`

Additional request processors to use

##### additionalResponseProcessors

[`BaseLlmResponseProcessor`](../../BaseLlmProcessor/interfaces/BaseLlmResponseProcessor.md)[] = `[]`

Additional response processors to use

#### Returns

`SingleFlow`

#### Overrides

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`constructor`](../../BaseLlmFlow/classes/BaseLlmFlow.md#constructor)

## Methods

### \_callLlmAsync()

> `protected` **\_callLlmAsync**(`invocationContext`, `llmRequest`, `modelResponseEvent`): `AsyncGenerator`\<[`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:723](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L723)

Calls the LLM asynchronously.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### llmRequest

[`LlmRequest`](../../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request

##### modelResponseEvent

[`Event`](../../../../events/Event/classes/Event.md)

The model response event

#### Returns

`AsyncGenerator`\<[`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md), `void`, `unknown`\>

An async generator of LLM responses

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_callLlmAsync`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_callllmasync)

***

### \_finalizeModelResponseEvent()

> `protected` **\_finalizeModelResponseEvent**(`llmRequest`, `llmResponse`, `modelResponseEvent`): [`Event`](../../../../events/Event/classes/Event.md)

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:867](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L867)

Finalizes the model response event.

#### Parameters

##### llmRequest

[`LlmRequest`](../../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request

##### llmResponse

[`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md)

The LLM response

##### modelResponseEvent

[`Event`](../../../../events/Event/classes/Event.md)

The model response event

#### Returns

[`Event`](../../../../events/Event/classes/Event.md)

The finalized event

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_finalizeModelResponseEvent`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_finalizemodelresponseevent)

***

### \_getAgentToRun()

> `protected` **\_getAgentToRun**(`invocationContext`, `transferToAgent`): [`BaseAgent`](../../../../agents/BaseAgent/classes/BaseAgent.md)

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:684](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L684)

Gets the agent to run for a transfer_to_agent function call.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### transferToAgent

`any`

The agent to transfer to

#### Returns

[`BaseAgent`](../../../../agents/BaseAgent/classes/BaseAgent.md)

The agent to run

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_getAgentToRun`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_getagenttorun)

***

### \_handleAfterModelCallback()

> `protected` **\_handleAfterModelCallback**(`invocationContext`, `llmResponse`, `modelResponseEvent`): `undefined` \| [`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md)

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:840](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L840)

Handles the after model callback.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### llmResponse

[`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md)

The LLM response

##### modelResponseEvent

[`Event`](../../../../events/Event/classes/Event.md)

The model response event

#### Returns

`undefined` \| [`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md)

The altered LLM response or undefined

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_handleAfterModelCallback`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_handleaftermodelcallback)

***

### \_handleBeforeModelCallback()

> `protected` **\_handleBeforeModelCallback**(`invocationContext`, `llmRequest`, `modelResponseEvent`): `undefined` \| [`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md)

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:813](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L813)

Handles the before model callback.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### llmRequest

[`LlmRequest`](../../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request

##### modelResponseEvent

[`Event`](../../../../events/Event/classes/Event.md)

The model response event

#### Returns

`undefined` \| [`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md)

The callback response or undefined

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_handleBeforeModelCallback`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_handlebeforemodelcallback)

***

### \_postprocessAsync()

> `protected` **\_postprocessAsync**(`invocationContext`, `llmRequest`, `llmResponse`, `modelResponseEvent`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:490](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L490)

Postprocesses the response after the LLM call.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### llmRequest

[`LlmRequest`](../../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request

##### llmResponse

[`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md)

The LLM response

##### modelResponseEvent

[`Event`](../../../../events/Event/classes/Event.md)

The model response event

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_postprocessAsync`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_postprocessasync)

***

### \_postprocessHandleFunctionCallsAsync()

> `protected` **\_postprocessHandleFunctionCallsAsync**(`invocationContext`, `functionCallEvent`, `llmRequest`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:626](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L626)

Handles function calls in the response.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### functionCallEvent

[`Event`](../../../../events/Event/classes/Event.md)

The function call event

##### llmRequest

[`LlmRequest`](../../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_postprocessHandleFunctionCallsAsync`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_postprocesshandlefunctioncallsasync)

***

### \_postprocessLive()

> `protected` **\_postprocessLive**(`invocationContext`, `llmRequest`, `llmResponse`, `modelResponseEvent`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:535](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L535)

Postprocesses the response for the live API.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### llmRequest

[`LlmRequest`](../../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request

##### llmResponse

[`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md)

The LLM response

##### modelResponseEvent

[`Event`](../../../../events/Event/classes/Event.md)

The model response event

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_postprocessLive`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_postprocesslive)

***

### \_postprocessRunProcessorsAsync()

> `protected` **\_postprocessRunProcessorsAsync**(`invocationContext`, `llmResponse`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:606](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L606)

Runs the response processors.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### llmResponse

[`LlmResponse`](../../../../models/LlmResponse/classes/LlmResponse.md)

The LLM response

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_postprocessRunProcessorsAsync`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_postprocessrunprocessorsasync)

***

### \_preprocessAsync()

> `protected` **\_preprocessAsync**(`invocationContext`, `llmRequest`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:437](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L437)

Preprocesses the request before calling the LLM.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### llmRequest

[`LlmRequest`](../../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_preprocessAsync`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_preprocessasync)

***

### \_receiveFromModel()

> `protected` **\_receiveFromModel**(`llmConnection`, `eventId`, `invocationContext`, `llmRequest`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:310](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L310)

Receives data from the model and processes events.

#### Parameters

##### llmConnection

[`BaseLlmConnection`](../../../../models/BaseLlmConnection/classes/BaseLlmConnection.md)

The LLM connection

##### eventId

`string`

The event ID

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

##### llmRequest

[`LlmRequest`](../../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_receiveFromModel`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_receivefrommodel)

***

### \_runOneStepAsync()

> `protected` **\_runOneStepAsync**(`invocationContext`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:393](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L393)

Runs one step of the flow asynchronously.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_runOneStepAsync`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_runonestepasync)

***

### \_sendToModel()

> `protected` **\_sendToModel**(`llmConnection`, `invocationContext`): `Promise`\<`void`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:219](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L219)

Sends data to the model in a loop.

#### Parameters

##### llmConnection

[`BaseLlmConnection`](../../../../models/BaseLlmConnection/classes/BaseLlmConnection.md)

The LLM connection

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`_sendToModel`](../../BaseLlmFlow/classes/BaseLlmFlow.md#_sendtomodel)

***

### runAsync()

> **runAsync**(`invocationContext`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:359](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L359)

Runs the flow asynchronously.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`runAsync`](../../BaseLlmFlow/classes/BaseLlmFlow.md#runasync)

***

### runLive()

> **runLive**(`invocationContext`): `AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:103](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L103)

Runs the flow using live API.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context

#### Returns

`AsyncGenerator`\<[`Event`](../../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`runLive`](../../BaseLlmFlow/classes/BaseLlmFlow.md#runlive)

## Properties

### requestProcessors

> `protected` **requestProcessors**: [`BaseLlmRequestProcessor`](../../BaseLlmProcessor/interfaces/BaseLlmRequestProcessor.md)[] = `[]`

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L77)

List of request processors to run before LLM call

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`requestProcessors`](../../BaseLlmFlow/classes/BaseLlmFlow.md#requestprocessors)

***

### responseProcessors

> `protected` **responseProcessors**: [`BaseLlmResponseProcessor`](../../BaseLlmProcessor/interfaces/BaseLlmResponseProcessor.md)[] = `[]`

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:82](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L82)

List of response processors to run after LLM call

#### Inherited from

[`BaseLlmFlow`](../../BaseLlmFlow/classes/BaseLlmFlow.md).[`responseProcessors`](../../BaseLlmFlow/classes/BaseLlmFlow.md#responseprocessors)
