[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [evaluation/EvaluationGenerator](../README.md) / EvaluationGenerator

# Class: EvaluationGenerator

Defined in: [src/evaluation/EvaluationGenerator.ts:62](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L62)

Generates evaluation data from test files

## Constructors

### Constructor

> **new EvaluationGenerator**(): `EvaluationGenerator`

#### Returns

`EvaluationGenerator`

## Methods

### \_processQuery()

> `static` **\_processQuery**(`data`, `moduleName`, `agentName?`, `initialSession?`): `Promise`\<[`EvalEntry`](../interfaces/EvalEntry.md)\>

Defined in: [src/evaluation/EvaluationGenerator.ts:127](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L127)

Process a query using the agent and evaluation dataset.

#### Parameters

##### data

[`EvalEntry`](../interfaces/EvalEntry.md)

The evaluation data entry

##### moduleName

`string`

The module name/path

##### agentName?

`string`

The agent name (optional)

##### initialSession?

`Record`\<`string`, `any`\> = `{}`

Initial session data (optional)

#### Returns

`Promise`\<[`EvalEntry`](../interfaces/EvalEntry.md)\>

***

### \_processQueryWithRootAgent()

> `static` **\_processQueryWithRootAgent**(`data`, `rootAgent`, `resetFunc?`, `initialSession?`, `sessionId?`, `sessionService?`, `artifactService?`): `Promise`\<[`EvalEntry`](../interfaces/EvalEntry.md)\>

Defined in: [src/evaluation/EvaluationGenerator.ts:200](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L200)

Process a query using the agent and evaluation dataset (core logic).

#### Parameters

##### data

[`EvalEntry`](../interfaces/EvalEntry.md)

The evaluation data entry

##### rootAgent

[`BaseAgent`](../../../agents/BaseAgent/classes/BaseAgent.md)

The root agent instance

##### resetFunc?

() => `void`

Function to reset agent state (optional)

##### initialSession?

`Record`\<`string`, `any`\> = `{}`

Initial session data (optional)

##### sessionId?

`string`

Session ID (optional)

##### sessionService?

[`InMemorySessionService`](../../../sessions/InMemorySessionService/classes/InMemorySessionService.md)

Session service (optional)

##### artifactService?

[`InMemoryArtifactService`](../../../artifacts/InMemoryArtifactService/classes/InMemoryArtifactService.md)

Artifact service (optional)

#### Returns

`Promise`\<[`EvalEntry`](../interfaces/EvalEntry.md)\>

***

### \_processQueryWithSession()

> `static` **\_processQueryWithSession**(`sessionData`, `data`): [`EvalEntry`](../interfaces/EvalEntry.md)

Defined in: [src/evaluation/EvaluationGenerator.ts:313](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L313)

Process the queries using the existing session data without invoking the runner.

#### Parameters

##### sessionData

[`SessionInterface`](../../../sessions/types/interfaces/SessionInterface.md)

The session data

##### data

[`EvalEntry`](../interfaces/EvalEntry.md)

The evaluation data entry

#### Returns

[`EvalEntry`](../interfaces/EvalEntry.md)

***

### applyBeforeToolCallback()

> `static` **applyBeforeToolCallback**(`agent`, `callback`, `allMockTools`, `evalDataset`): `void`

Defined in: [src/evaluation/EvaluationGenerator.ts:413](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L413)

Recursively apply the before_tool_callback to the root agent and all its subagents.

#### Parameters

##### agent

[`BaseAgent`](../../../agents/BaseAgent/classes/BaseAgent.md)

The agent to apply the callback to

##### callback

[`BeforeToolCallback`](../type-aliases/BeforeToolCallback.md)

The callback function

##### allMockTools

`Set`\<`string`\>

Set of tool names that need to be mocked

##### evalDataset

[`EvalEntry`](../interfaces/EvalEntry.md)[]

The evaluation dataset

#### Returns

`void`

***

### beforeToolCallback()

> `static` **beforeToolCallback**(`tool`, `args`, `toolContext`, `evalDataset`): `undefined` \| `Record`\<`string`, `any`\>

Defined in: [src/evaluation/EvaluationGenerator.ts:369](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L369)

Intercept specific tool calls and return predefined outputs from eval_dataset.

#### Parameters

##### tool

[`BaseTool`](../../../tools/BaseTool/classes/BaseTool.md)

The tool being called

##### args

`Record`\<`string`, `any`\>

The tool arguments

##### toolContext

[`ToolContext`](../../../tools/ToolContext/classes/ToolContext.md)

The tool context

##### evalDataset

[`EvalEntry`](../interfaces/EvalEntry.md)[]

The evaluation dataset

#### Returns

`undefined` \| `Record`\<`string`, `any`\>

***

### generateResponses()

> `static` **generateResponses**(`evalDataset`, `agentModulePath`, `repeatNum`, `agentName?`, `initialSession?`): `Promise`\<[`EvalEntry`](../interfaces/EvalEntry.md)[]\>

Defined in: [src/evaluation/EvaluationGenerator.ts:71](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L71)

Generates evaluation responses for the given dataset and agent.

#### Parameters

##### evalDataset

[`EvalEntry`](../interfaces/EvalEntry.md)[]

The dataset to evaluate

##### agentModulePath

`string`

Path to the module that contains the root agent

##### repeatNum

`number` = `3`

Number of times to repeat the eval dataset

##### agentName?

`string`

The name of the agent to evaluate (optional)

##### initialSession?

`Record`\<`string`, `any`\> = `{}`

Initial session data (optional)

#### Returns

`Promise`\<[`EvalEntry`](../interfaces/EvalEntry.md)[]\>

***

### generateResponsesFromSession()

> `static` **generateResponsesFromSession**(`sessionPath`, `evalDataset`): `Promise`\<[`EvalEntry`](../interfaces/EvalEntry.md)[]\>

Defined in: [src/evaluation/EvaluationGenerator.ts:98](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/EvaluationGenerator.ts#L98)

Generates evaluation responses by combining session data with evaluation data.

#### Parameters

##### sessionPath

`string`

Path to a JSON file that contains session data

##### evalDataset

[`EvalEntry`](../interfaces/EvalEntry.md)[]

The evaluation dataset to combine with session data

#### Returns

`Promise`\<[`EvalEntry`](../interfaces/EvalEntry.md)[]\>
