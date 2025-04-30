[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/BaseAgent](../README.md) / BaseAgent

# Class: `abstract` BaseAgent

Defined in: [src/agents/BaseAgent.ts:55](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L55)

Abstract base class for all agents.

## Extended by

- [`LanggraphAgent`](../../LanggraphAgent/classes/LanggraphAgent.md)
- [`ReasoningAgent`](../../LegacyAgents/classes/ReasoningAgent.md)
- [`PlanningAgent`](../../LegacyAgents/classes/PlanningAgent.md)
- [`LlmAgent`](../../LlmAgent/classes/LlmAgent.md)
- [`LoopAgent`](../../LoopAgent/classes/LoopAgent.md)
- [`ParallelAgent`](../../ParallelAgent/classes/ParallelAgent.md)
- [`RemoteAgent`](../../RemoteAgent/classes/RemoteAgent.md)
- [`SequentialAgent`](../../SequentialAgent/classes/SequentialAgent.md)

## Accessors

### rootAgent

#### Get Signature

> **get** **rootAgent**(): `BaseAgent`

Defined in: [src/agents/BaseAgent.ts:165](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L165)

Gets the root agent of the agent tree.

##### Returns

`BaseAgent`

The root agent

## Constructors

### Constructor

> **new BaseAgent**(`name`, `options`): `BaseAgent`

Defined in: [src/agents/BaseAgent.ts:80](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L80)

Creates a new agent.

#### Parameters

##### name

`string`

The name of the agent

##### options

[`AgentOptions`](../interfaces/AgentOptions.md) = `{}`

Options for the agent

#### Returns

`BaseAgent`

## Methods

### addSubAgent()

> **addSubAgent**(`agent`): `this`

Defined in: [src/agents/BaseAgent.ts:228](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L228)

Adds a sub-agent to this agent.

#### Parameters

##### agent

`BaseAgent`

The sub-agent to add

#### Returns

`this`

This agent for method chaining

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

***

### findAgent()

#### Call Signature

> **findAgent**(`name`): `undefined` \| `BaseAgent`

Defined in: [src/agents/BaseAgent.ts:175](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L175)

Finds an agent by name in the entire agent tree.

##### Parameters

###### name

`string`

The name of the agent to find

##### Returns

`undefined` \| `BaseAgent`

The agent if found, undefined otherwise

#### Call Signature

> **findAgent**(`name`): `undefined` \| `BaseAgent`

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:38](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L38)

##### Parameters

###### name

`any`

##### Returns

`undefined` \| `BaseAgent`

***

### findSubAgent()

> **findSubAgent**(`name`): `undefined` \| `BaseAgent`

Defined in: [src/agents/BaseAgent.ts:196](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L196)

Finds a sub-agent by name among direct children.

#### Parameters

##### name

`string`

The name of the sub-agent to find

#### Returns

`undefined` \| `BaseAgent`

The sub-agent if found, undefined otherwise

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

***

### runAsync()

> **runAsync**(`context`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:36](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L36)

#### Parameters

##### context

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

#### Returns

`AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

***

### runAsyncImpl()

> `abstract` `protected` **runAsyncImpl**(`invocationContext`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/agents/BaseAgent.ts:138](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L138)

Implementation of the agent's async invocation logic.

#### Parameters

##### invocationContext

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

The invocation context

#### Returns

`AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

***

### runLive()

> **runLive**(`context`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:35](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L35)

#### Parameters

##### context

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

#### Returns

`AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

***

### runLiveImpl()

> `abstract` `protected` **runLiveImpl**(`invocationContext`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/agents/BaseAgent.ts:148](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L148)

Implementation of the agent's live invocation logic.

#### Parameters

##### invocationContext

[`InvocationContext`](../../InvocationContext/classes/InvocationContext.md)

The invocation context

#### Returns

`AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

An async generator of events

***

### setParentAgent()

> **setParentAgent**(`parentAgent`): `void`

Defined in: [src/agents/BaseAgent.ts:205](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L205)

Sets the parent agent of this agent.

#### Parameters

##### parentAgent

`BaseAgent`

The parent agent

#### Returns

`void`

***

### setUserContent()

> `abstract` **setUserContent**(`content`, `invocationContext`): `void`

Defined in: [src/agents/BaseAgent.ts:158](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L158)

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

## Properties

### afterAgentCallback?

> `optional` **afterAgentCallback**: [`AfterAgentCallback`](../type-aliases/AfterAgentCallback.md)

Defined in: [src/agents/BaseAgent.ts:72](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L72)

Callback invoked after the agent run

***

### beforeAgentCallback?

> `optional` **beforeAgentCallback**: [`BeforeAgentCallback`](../type-aliases/BeforeAgentCallback.md)

Defined in: [src/agents/BaseAgent.ts:69](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L69)

Callback invoked before the agent run

***

### description?

> `optional` **description**: `string`

Defined in: [src/agents/BaseAgent.ts:60](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L60)

The description of the agent

***

### name

> **name**: `string`

Defined in: [src/agents/BaseAgent.ts:57](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L57)

The name of the agent

***

### parentAgent?

> `optional` **parentAgent**: `BaseAgent`

Defined in: [src/agents/BaseAgent.ts:63](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L63)

The parent agent of this agent

***

### rootAgent

> **rootAgent**: `BaseAgent`

Defined in: [src/agents/BaseAgent.ts:165](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L165)

***

### subAgents

> **subAgents**: `BaseAgent`[] = `[]`

Defined in: [src/agents/BaseAgent.ts:66](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L66)

The sub-agents of this agent
