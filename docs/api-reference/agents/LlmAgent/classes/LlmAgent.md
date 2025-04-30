[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/LlmAgent](../README.md) / LlmAgent

# Class: LlmAgent

Defined in: [src/agents/LlmAgent.ts:150](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L150)

An agent that uses an LLM flow to process requests.

## Extends

- [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

## Accessors

### canonicalModel

#### Get Signature

> **get** **canonicalModel**(): [`BaseLlm`](../../../models/BaseLlm/classes/BaseLlm.md)

Defined in: [src/agents/LlmAgent.ts:392](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L392)

Gets the resolved model as a BaseLlm.
This method is only for use by Agent Development Kit.

##### Returns

[`BaseLlm`](../../../models/BaseLlm/classes/BaseLlm.md)

***

### canonicalTools

#### Get Signature

> **get** **canonicalTools**(): [`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md)[]

Defined in: [src/agents/LlmAgent.ts:438](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L438)

Gets the resolved tools as BaseTool instances.
This method is only for use by Agent Development Kit.

##### Returns

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md)[]

***

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

> **new LlmAgent**(`options`): `LlmAgent`

Defined in: [src/agents/LlmAgent.ts:213](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L213)

Creates a new LLM agent.

#### Parameters

##### options

[`LlmAgentOptions`](../interfaces/LlmAgentOptions.md)

Options for the agent including name

#### Returns

`LlmAgent`

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

### canonicalGlobalInstruction()

> **canonicalGlobalInstruction**(`ctx`): `string`

Defined in: [src/agents/LlmAgent.ts:426](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L426)

Gets the resolved global instruction.
This method is only for use by Agent Development Kit.

#### Parameters

##### ctx

[`ReadonlyContext`](../../ReadonlyContext/classes/ReadonlyContext.md)

#### Returns

`string`

***

### canonicalInstruction()

> **canonicalInstruction**(`ctx`): `string`

Defined in: [src/agents/LlmAgent.ts:414](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L414)

Gets the resolved instruction for this agent.
This method is only for use by Agent Development Kit.

#### Parameters

##### ctx

[`ReadonlyContext`](../../ReadonlyContext/classes/ReadonlyContext.md)

#### Returns

`string`

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

### createSession()

> **createSession**(`options`): `Promise`\<[`Session`](../../../sessions/Session/classes/Session.md)\>

Defined in: [src/agents/LlmAgent.ts:250](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L250)

Creates a new session for this agent

#### Parameters

##### options

`Partial`\<[`SessionOptions`](../../../sessions/Session/interfaces/SessionOptions.md)\> = `{}`

#### Returns

`Promise`\<[`Session`](../../../sessions/Session/classes/Session.md)\>

A promise resolving to a new Session object

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

> `protected` **runAsyncImpl**(`invocationContext`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/agents/LlmAgent.ts:347](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L347)

Implementation of the agent's async invocation logic.

#### Parameters

##### invocationContext

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

> `protected` **runLiveImpl**(`invocationContext`): `AsyncGenerator`\<[`Event`](../../../events/Event/classes/Event.md), `void`, `unknown`\>

Defined in: [src/agents/LlmAgent.ts:364](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L364)

Implementation of the agent's live invocation logic.

#### Parameters

##### invocationContext

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

Defined in: [src/agents/LlmAgent.ts:384](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L384)

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

### afterModelCallback?

> `optional` **afterModelCallback**: `AfterModelCallback`

Defined in: [src/agents/LlmAgent.ts:200](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L200)

Callback after model invocation

***

### afterToolCallback?

> `optional` **afterToolCallback**: `AfterToolCallback`

Defined in: [src/agents/LlmAgent.ts:206](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L206)

Callback after tool invocation

***

### beforeAgentCallback?

> `optional` **beforeAgentCallback**: [`BeforeAgentCallback`](../../BaseAgent/type-aliases/BeforeAgentCallback.md)

Defined in: [src/agents/BaseAgent.ts:69](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L69)

Callback invoked before the agent run

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`beforeAgentCallback`](../../BaseAgent/classes/BaseAgent.md#beforeagentcallback)

***

### beforeModelCallback?

> `optional` **beforeModelCallback**: `BeforeModelCallback`

Defined in: [src/agents/LlmAgent.ts:197](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L197)

Callback before model invocation

***

### beforeToolCallback?

> `optional` **beforeToolCallback**: `BeforeToolCallback`

Defined in: [src/agents/LlmAgent.ts:203](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L203)

Callback before tool invocation

***

### codeExecutor?

> `optional` **codeExecutor**: [`BaseCodeExecutor`](../../../code-executors/BaseCodeExecutor/classes/BaseCodeExecutor.md)

Defined in: [src/agents/LlmAgent.ts:191](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L191)

Code executor for running code blocks

***

### description?

> `optional` **description**: `string`

Defined in: [src/agents/BaseAgent.ts:60](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L60)

The description of the agent

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`description`](../../BaseAgent/classes/BaseAgent.md#description)

***

### disallowTransferToParent

> **disallowTransferToParent**: `boolean` = `false`

Defined in: [src/agents/LlmAgent.ts:170](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L170)

Whether to disallow transfers to the parent agent

***

### disallowTransferToPeers

> **disallowTransferToPeers**: `boolean` = `false`

Defined in: [src/agents/LlmAgent.ts:173](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L173)

Whether to disallow transfers to peer agents

***

### examples?

> `optional` **examples**: `ExamplesUnion`

Defined in: [src/agents/LlmAgent.ts:194](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L194)

Examples for the agent

***

### generateContentConfig?

> `optional` **generateContentConfig**: `any`

Defined in: [src/agents/LlmAgent.ts:167](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L167)

Content generation configuration

***

### globalInstruction

> **globalInstruction**: `string` \| `InstructionProvider` = `''`

Defined in: [src/agents/LlmAgent.ts:161](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L161)

Global instruction for all agents in the tree

***

### includeContents

> **includeContents**: `"default"` \| `"none"` = `'default'`

Defined in: [src/agents/LlmAgent.ts:176](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L176)

Include contents setting

***

### inputSchema?

> `optional` **inputSchema**: `any`

Defined in: [src/agents/LlmAgent.ts:179](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L179)

Input schema for validation

***

### instruction

> **instruction**: `string` \| `InstructionProvider` = `''`

Defined in: [src/agents/LlmAgent.ts:158](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L158)

The instruction template for the agent

***

### model

> **model**: `string` \| [`BaseLlm`](../../../models/BaseLlm/classes/BaseLlm.md) = `''`

Defined in: [src/agents/LlmAgent.ts:155](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L155)

The LLM model used by this agent

***

### name

> **name**: `string`

Defined in: [src/agents/BaseAgent.ts:57](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L57)

The name of the agent

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`name`](../../BaseAgent/classes/BaseAgent.md#name)

***

### outputKey?

> `optional` **outputKey**: `string`

Defined in: [src/agents/LlmAgent.ts:185](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L185)

Output key for state storage

***

### outputSchema?

> `optional` **outputSchema**: `any`

Defined in: [src/agents/LlmAgent.ts:182](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L182)

Output schema for validation

***

### parentAgent?

> `optional` **parentAgent**: [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:63](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L63)

The parent agent of this agent

#### Inherited from

[`BaseAgent`](../../BaseAgent/classes/BaseAgent.md).[`parentAgent`](../../BaseAgent/classes/BaseAgent.md#parentagent)

***

### planner?

> `optional` **planner**: [`BasePlanner`](../../../planners/BasePlanner/classes/BasePlanner.md)

Defined in: [src/agents/LlmAgent.ts:188](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L188)

Planner for step-by-step execution

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

***

### tools

> **tools**: `ToolUnion`[] = `[]`

Defined in: [src/agents/LlmAgent.ts:164](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L164)

Tools available to this agent
