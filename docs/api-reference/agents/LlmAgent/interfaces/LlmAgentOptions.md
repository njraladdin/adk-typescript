[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/LlmAgent](../README.md) / LlmAgentOptions

# Interface: LlmAgentOptions

Defined in: [src/agents/LlmAgent.ts:73](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L73)

Extended options for LLM agents.

## Extends

- [`AgentOptions`](../../BaseAgent/interfaces/AgentOptions.md)

## Indexable

\[`key`: `string`\]: `any`

Additional agent-specific options

## Properties

### afterModelCallback?

> `optional` **afterModelCallback**: `AfterModelCallback`

Defined in: [src/agents/LlmAgent.ts:126](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L126)

Callback after model invocation

***

### afterToolCallback?

> `optional` **afterToolCallback**: `AfterToolCallback`

Defined in: [src/agents/LlmAgent.ts:132](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L132)

Callback after tool invocation

***

### beforeModelCallback?

> `optional` **beforeModelCallback**: `BeforeModelCallback`

Defined in: [src/agents/LlmAgent.ts:123](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L123)

Callback before model invocation

***

### beforeToolCallback?

> `optional` **beforeToolCallback**: `BeforeToolCallback`

Defined in: [src/agents/LlmAgent.ts:129](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L129)

Callback before tool invocation

***

### codeExecutor?

> `optional` **codeExecutor**: [`BaseCodeExecutor`](../../../code-executors/BaseCodeExecutor/classes/BaseCodeExecutor.md)

Defined in: [src/agents/LlmAgent.ts:117](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L117)

Code executor for running code blocks

***

### description?

> `optional` **description**: `string`

Defined in: [src/agents/BaseAgent.ts:43](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L43)

The description of the agent

#### Inherited from

[`AgentOptions`](../../BaseAgent/interfaces/AgentOptions.md).[`description`](../../BaseAgent/interfaces/AgentOptions.md#description)

***

### disallowTransferToParent?

> `optional` **disallowTransferToParent**: `boolean`

Defined in: [src/agents/LlmAgent.ts:84](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L84)

Whether to disallow transfers to the parent agent

***

### disallowTransferToPeers?

> `optional` **disallowTransferToPeers**: `boolean`

Defined in: [src/agents/LlmAgent.ts:87](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L87)

Whether to disallow transfers to peer agents

***

### examples?

> `optional` **examples**: `ExamplesUnion`

Defined in: [src/agents/LlmAgent.ts:120](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L120)

Examples for the agent

***

### flow?

> `optional` **flow**: [`BaseLlmFlow`](../../../flows/llm_flows/BaseLlmFlow/classes/BaseLlmFlow.md)

Defined in: [src/agents/LlmAgent.ts:78](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L78)

The LLM flow to use

***

### generateContentConfig?

> `optional` **generateContentConfig**: `any`

Defined in: [src/agents/LlmAgent.ts:99](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L99)

Content generation configuration

***

### globalInstruction?

> `optional` **globalInstruction**: `string` \| `InstructionProvider`

Defined in: [src/agents/LlmAgent.ts:96](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L96)

Global instruction for all agents in the tree

***

### includeContents?

> `optional` **includeContents**: `"default"` \| `"none"`

Defined in: [src/agents/LlmAgent.ts:102](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L102)

Include contents setting

***

### inputSchema?

> `optional` **inputSchema**: `any`

Defined in: [src/agents/LlmAgent.ts:105](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L105)

Input schema for validation

***

### instruction?

> `optional` **instruction**: `string` \| `InstructionProvider`

Defined in: [src/agents/LlmAgent.ts:93](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L93)

The instruction template for the agent

***

### model?

> `optional` **model**: `string` \| [`BaseLlm`](../../../models/BaseLlm/classes/BaseLlm.md)

Defined in: [src/agents/LlmAgent.ts:81](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L81)

The LLM model to use

***

### name

> **name**: `string`

Defined in: [src/agents/LlmAgent.ts:75](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L75)

The name of the agent

***

### outputKey?

> `optional` **outputKey**: `string`

Defined in: [src/agents/LlmAgent.ts:111](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L111)

Output key for state storage

***

### outputSchema?

> `optional` **outputSchema**: `any`

Defined in: [src/agents/LlmAgent.ts:108](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L108)

Output schema for validation

***

### parentAgent?

> `optional` **parentAgent**: [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/BaseAgent.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/BaseAgent.ts#L46)

The parent agent

#### Inherited from

[`AgentOptions`](../../BaseAgent/interfaces/AgentOptions.md).[`parentAgent`](../../BaseAgent/interfaces/AgentOptions.md#parentagent)

***

### planner?

> `optional` **planner**: [`BasePlanner`](../../../planners/BasePlanner/classes/BasePlanner.md)

Defined in: [src/agents/LlmAgent.ts:114](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L114)

Planner for step-by-step execution

***

### tools?

> `optional` **tools**: `ToolUnion`[]

Defined in: [src/agents/LlmAgent.ts:90](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/LlmAgent.ts#L90)

Tools available to this agent
