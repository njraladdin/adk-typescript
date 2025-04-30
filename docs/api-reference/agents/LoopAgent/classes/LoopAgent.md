[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/LoopAgent](../README.md) / LoopAgent

# Class: LoopAgent

Defined in: [src/agents/LoopAgent.ts:34](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LoopAgent.ts#L34)

A shell agent that runs its sub-agents in a loop.

When sub-agent generates an event with escalate or max_iterations are
reached, the loop agent will stop.

## Extends

- [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

## Accessors

### rootAgent

#### Get Signature

> **get** **rootAgent**(): [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:165](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L165)

Gets the root agent of the agent tree.

##### Returns

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

The root agent

#### Inherited from

`BaseAgent.rootAgent`

## Constructors

### Constructor

> **new LoopAgent**(`name`, `options`): `LoopAgent`

Defined in: [src/agents/LoopAgent.ts:47](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LoopAgent.ts#L47)

Creates a new LoopAgent.

#### Parameters

##### name

`string`

The name of the agent

##### options

[`LoopAgentOptions`](../interfaces/LoopAgentOptions.md) = `{}`

Options for the agent

#### Returns

`LoopAgent`

#### Overrides

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`constructor`](../../BaseAgent/classes/BaseAgent.md#constructor)

## Methods

### addSubAgent()

> **addSubAgent**(`agent`): `this`

Defined in: [src/agents/BaseAgent.ts:228](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L228)

Adds a sub-agent to this agent.

#### Parameters

##### agent

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

The sub-agent to add

#### Returns

`this`

This agent for method chaining

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`addSubAgent`](../../BaseAgent/classes/BaseAgent.md#addsubagent)

***

### createInvocationContext()

> `protected` **createInvocationContext**(`parentContext`): [`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

Defined in: [src/agents/BaseAgent.ts:245](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L245)

Creates a new invocation context for this agent.

#### Parameters

##### parentContext

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

The parent invocation context

#### Returns

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

A new invocation context

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`createInvocationContext`](../../BaseAgent/classes/BaseAgent.md#createinvocationcontext)

***

### findAgent()

#### Call Signature

> **findAgent**(`name`): `undefined` \| [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:175](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L175)

Finds an agent by name in the entire agent tree.

##### Parameters

###### name

`string`

The name of the agent to find

##### Returns

`undefined` \| [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

The agent if found, undefined otherwise

##### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`findAgent`](../../BaseAgent/classes/BaseAgent.md#findagent)

#### Call Signature

> **findAgent**(`name`): `undefined` \| [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:38](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L38)

##### Parameters

###### name

`any`

##### Returns

`undefined` \| [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

##### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`findAgent`](../../BaseAgent/classes/BaseAgent.md#findagent)

***

### findSubAgent()

> **findSubAgent**(`name`): `undefined` \| [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:196](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L196)

Finds a sub-agent by name among direct children.

#### Parameters

##### name

`string`

The name of the sub-agent to find

#### Returns

`undefined` \| [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

The sub-agent if found, undefined otherwise

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`findSubAgent`](../../BaseAgent/classes/BaseAgent.md#findsubagent)

***

### invoke()

> **invoke**(`invocationContext`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/agents/BaseAgent.ts:101](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L101)

Invokes the agent with the given context.

#### Parameters

##### invocationContext

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

The invocation context

#### Returns

`AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`invoke`](../../BaseAgent/classes/BaseAgent.md#invoke)

***

### runAsync()

> **runAsync**(`context`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:36](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L36)

#### Parameters

##### context

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

#### Returns

`AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`runAsync`](../../BaseAgent/classes/BaseAgent.md#runasync)

***

### runAsyncImpl()

> `protected` **runAsyncImpl**(`ctx`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/agents/LoopAgent.ts:55](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LoopAgent.ts#L55)

Implementation of the agent's async invocation logic.

#### Parameters

##### ctx

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

The invocation context

#### Returns

`AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Overrides

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`runAsyncImpl`](../../BaseAgent/classes/BaseAgent.md#runasyncimpl)

***

### runLive()

> **runLive**(`context`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:35](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L35)

#### Parameters

##### context

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

#### Returns

`AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`runLive`](../../BaseAgent/classes/BaseAgent.md#runlive)

***

### runLiveImpl()

> `protected` **runLiveImpl**(`ctx`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/agents/LoopAgent.ts:76](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LoopAgent.ts#L76)

Implementation of the agent's live invocation logic.

#### Parameters

##### ctx

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

The invocation context

#### Returns

`AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

#### Overrides

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`runLiveImpl`](../../BaseAgent/classes/BaseAgent.md#runliveimpl)

***

### setParentAgent()

> **setParentAgent**(`parentAgent`): `void`

Defined in: [src/agents/BaseAgent.ts:205](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L205)

Sets the parent agent of this agent.

#### Parameters

##### parentAgent

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

The parent agent

#### Returns

`void`

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`setParentAgent`](../../BaseAgent/classes/BaseAgent.md#setparentagent)

***

### setUserContent()

> **setUserContent**(`content`, `invocationContext`): `void`

Defined in: [src/agents/LoopAgent.ts:86](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LoopAgent.ts#L86)

Sets the user content for the agent.

#### Parameters

##### content

[`Content`](../../../models/types/interfaces/Content.md)

The user content

##### invocationContext

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

The invocation context

#### Returns

`void`

#### Overrides

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`setUserContent`](../../BaseAgent/classes/BaseAgent.md#setusercontent)

## Properties

### afterAgentCallback?

> `optional` **afterAgentCallback**: [`AfterAgentCallback`](../../BaseAgent/type-aliases/AfterAgentCallback.md)

Defined in: [src/agents/BaseAgent.ts:72](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L72)

Callback invoked after the agent run

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`afterAgentCallback`](../../BaseAgent/classes/BaseAgent.md#afteragentcallback)

***

### beforeAgentCallback?

> `optional` **beforeAgentCallback**: [`BeforeAgentCallback`](../../BaseAgent/type-aliases/BeforeAgentCallback.md)

Defined in: [src/agents/BaseAgent.ts:69](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L69)

Callback invoked before the agent run

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`beforeAgentCallback`](../../BaseAgent/classes/BaseAgent.md#beforeagentcallback)

***

### description?

> `optional` **description**: `string`

Defined in: [src/agents/BaseAgent.ts:60](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L60)

The description of the agent

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`description`](../../BaseAgent/classes/BaseAgent.md#description)

***

### name

> **name**: `string`

Defined in: [src/agents/BaseAgent.ts:57](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L57)

The name of the agent

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`name`](../../BaseAgent/classes/BaseAgent.md#name)

***

### parentAgent?

> `optional` **parentAgent**: [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:63](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L63)

The parent agent of this agent

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`parentAgent`](../../BaseAgent/classes/BaseAgent.md#parentagent)

***

### rootAgent

> **rootAgent**: [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:165](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L165)

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`rootAgent`](../../BaseAgent/classes/BaseAgent.md#rootagent-1)

***

### subAgents

> **subAgents**: [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)[] = `[]`

Defined in: [src/agents/BaseAgent.ts:66](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L66)

The sub-agents of this agent

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`subAgents`](../../BaseAgent/classes/BaseAgent.md#subagents)
