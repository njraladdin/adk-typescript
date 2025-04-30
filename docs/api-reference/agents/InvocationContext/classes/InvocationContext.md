[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/InvocationContext](../README.md) / InvocationContext

# Class: InvocationContext

Defined in: [src/agents/InvocationContext.ts:96](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L96)

An invocation context represents the data of a single invocation of an agent.

## Accessors

### appName

#### Get Signature

> **get** **appName**(): `string`

Defined in: [src/agents/InvocationContext.ts:199](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L199)

The app name from the session

##### Returns

`string`

***

### userId

#### Get Signature

> **get** **userId**(): `string`

Defined in: [src/agents/InvocationContext.ts:204](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L204)

The user ID from the session

##### Returns

`string`

## Constructors

### Constructor

> **new InvocationContext**(`options`): `InvocationContext`

Defined in: [src/agents/InvocationContext.ts:164](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L164)

Creates a new invocation context.

#### Parameters

##### options

[`InvocationContextOptions`](../interfaces/InvocationContextOptions.md) = `{}`

Options for the context

#### Returns

`InvocationContext`

## Methods

### incrementLlmCallCount()

> **incrementLlmCallCount**(): `void`

Defined in: [src/agents/InvocationContext.ts:194](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L194)

Tracks number of llm calls made.

#### Returns

`void`

#### Throws

LlmCallsLimitExceededError If number of llm calls made exceed the set threshold.

## Properties

### activeStreamingTools?

> `optional` **activeStreamingTools**: `Map`\<`string`, [`ActiveStreamingTool`](../../ActiveStreamingTool/classes/ActiveStreamingTool.md)\>

Defined in: [src/agents/InvocationContext.ts:140](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L140)

The running streaming tools of this invocation.

***

### agent

> **agent**: [`BaseAgent`](../../BaseAgent/classes/BaseAgent.md)

Defined in: [src/agents/InvocationContext.ts:121](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L121)

The current agent of this invocation context. Readonly.

***

### artifactService?

> `optional` **artifactService**: [`BaseArtifactService`](../../../artifacts/BaseArtifactService/interfaces/BaseArtifactService.md)

Defined in: [src/agents/InvocationContext.ts:98](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L98)

The artifact service

***

### branch?

> `optional` **branch**: `string`

Defined in: [src/agents/InvocationContext.ts:118](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L118)

The branch of the invocation context.

The format is like agent_1.agent_2.agent_3, where agent_1 is the parent of
agent_2, and agent_2 is the parent of agent_3.

Branch is used when multiple sub-agents shouldn't see their peer agents'
conversation history.

***

### endInvocation

> **endInvocation**: `boolean` = `false`

Defined in: [src/agents/InvocationContext.ts:134](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L134)

Whether to end this invocation.

Set to True in callbacks or tools to terminate this invocation.

***

### invocationId

> **invocationId**: `string`

Defined in: [src/agents/InvocationContext.ts:107](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L107)

The id of this invocation context. Readonly.

***

### live

> **live**: `boolean` = `false`

Defined in: [src/agents/InvocationContext.ts:155](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L155)

Whether this is a live invocation

***

### liveRequestQueue?

> `optional` **liveRequestQueue**: [`LiveRequestQueue`](../../LiveRequestQueue/classes/LiveRequestQueue.md)

Defined in: [src/agents/InvocationContext.ts:137](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L137)

The queue to receive live requests.

***

### llm?

> `optional` **llm**: [`BaseLlm`](../../../models/BaseLlm/classes/BaseLlm.md)

Defined in: [src/agents/InvocationContext.ts:149](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L149)

The LLM model to use

***

### memoryService?

> `optional` **memoryService**: [`BaseMemoryService`](../../../memory/BaseMemoryService/interfaces/BaseMemoryService.md)

Defined in: [src/agents/InvocationContext.ts:104](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L104)

The memory service

***

### runConfig?

> `optional` **runConfig**: [`RunConfig`](../../RunConfig/classes/RunConfig.md)

Defined in: [src/agents/InvocationContext.ts:146](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L146)

Configurations for live agents under this invocation.

***

### session

> **session**: [`Session`](../../../sessions/Session/classes/Session.md)

Defined in: [src/agents/InvocationContext.ts:127](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L127)

The current session of this invocation context. Readonly.

***

### sessionService

> **sessionService**: [`BaseSessionService`](../../../sessions/BaseSessionService/classes/BaseSessionService.md)

Defined in: [src/agents/InvocationContext.ts:101](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L101)

The session service

***

### tools?

> `optional` **tools**: [`ToolContext`](../../../tools/ToolContext/classes/ToolContext.md)

Defined in: [src/agents/InvocationContext.ts:152](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L152)

Tools available in this context

***

### transcriptionCache?

> `optional` **transcriptionCache**: [`TranscriptionEntry`](../../TranscriptionEntry/classes/TranscriptionEntry.md)[]

Defined in: [src/agents/InvocationContext.ts:143](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L143)

Caches necessary data, audio or contents, that are needed by transcription.

***

### userContent?

> `optional` **userContent**: [`Content`](../../../models/types/interfaces/Content.md)

Defined in: [src/agents/InvocationContext.ts:124](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/InvocationContext.ts#L124)

The user content that started this invocation. Readonly.
