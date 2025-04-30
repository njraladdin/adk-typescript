[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [code-executors/CodeExecutorContext](../README.md) / CodeExecutorContext

# Class: CodeExecutorContext

Defined in: [src/code-executors/CodeExecutorContext.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L20)

The persistent context used to configure the code executor.

## Constructors

### Constructor

> **new CodeExecutorContext**(`sessionState`): `CodeExecutorContext`

Defined in: [src/code-executors/CodeExecutorContext.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L29)

Initializes the code executor context.

#### Parameters

##### sessionState

[`State`](../../../sessions/State/classes/State.md)

The session state to get the code executor context from.

#### Returns

`CodeExecutorContext`

## Methods

### addInputFiles()

> **addInputFiles**(`inputFiles`): `void`

Defined in: [src/code-executors/CodeExecutorContext.ts:106](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L106)

Adds the input files to the code executor context.

#### Parameters

##### inputFiles

[`File`](../../CodeExecutionUtils/interfaces/File.md)[]

The input files to add to the code executor context.

#### Returns

`void`

***

### addProcessedFileNames()

> **addProcessedFileNames**(`fileNames`): `void`

Defined in: [src/code-executors/CodeExecutorContext.ts:82](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L82)

Adds the processed file name to the session state.

#### Parameters

##### fileNames

`string`[]

The processed file names to add to the session state.

#### Returns

`void`

***

### clearInputFiles()

> **clearInputFiles**(): `void`

Defined in: [src/code-executors/CodeExecutorContext.ts:121](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L121)

Removes the input files and processed file names to the code executor context.

#### Returns

`void`

***

### getErrorCount()

> **getErrorCount**(`invocationId`): `number`

Defined in: [src/code-executors/CodeExecutorContext.ts:136](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L136)

Gets the error count from the session state.

#### Parameters

##### invocationId

`string`

The invocation ID to get the error count for.

#### Returns

`number`

The error count for the given invocation ID.

***

### getExecutionId()

> **getExecutionId**(): `undefined` \| `string`

Defined in: [src/code-executors/CodeExecutorContext.ts:49](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L49)

Gets the session ID for the code executor.

#### Returns

`undefined` \| `string`

The session ID for the code executor context.

***

### getInputFiles()

> **getInputFiles**(): [`File`](../../CodeExecutionUtils/interfaces/File.md)[]

Defined in: [src/code-executors/CodeExecutorContext.ts:94](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L94)

Gets the code executor input file names from the session state.

#### Returns

[`File`](../../CodeExecutionUtils/interfaces/File.md)[]

A list of input files in the code executor context.

***

### getProcessedFileNames()

> **getProcessedFileNames**(): `string`[]

Defined in: [src/code-executors/CodeExecutorContext.ts:70](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L70)

Gets the processed file names from the session state.

#### Returns

`string`[]

A list of processed file names in the code executor context.

***

### getStateDelta()

> **getStateDelta**(): `Record`\<`string`, `any`\>

Defined in: [src/code-executors/CodeExecutorContext.ts:39](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L39)

Gets the state delta to update in the persistent session state.

#### Returns

`Record`\<`string`, `any`\>

The state delta to update in the persistent session state.

***

### incrementErrorCount()

> **incrementErrorCount**(`invocationId`): `void`

Defined in: [src/code-executors/CodeExecutorContext.ts:149](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L149)

Increments the error count from the session state.

#### Parameters

##### invocationId

`string`

The invocation ID to increment the error count for.

#### Returns

`void`

***

### resetErrorCount()

> **resetErrorCount**(`invocationId`): `void`

Defined in: [src/code-executors/CodeExecutorContext.ts:164](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L164)

Resets the error count from the session state.

#### Parameters

##### invocationId

`string`

The invocation ID to reset the error count for.

#### Returns

`void`

***

### setExecutionId()

> **setExecutionId**(`sessionId`): `void`

Defined in: [src/code-executors/CodeExecutorContext.ts:61](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L61)

Sets the session ID for the code executor.

#### Parameters

##### sessionId

`string`

The session ID for the code executor.

#### Returns

`void`

***

### updateCodeExecutionResult()

> **updateCodeExecutionResult**(`invocationId`, `code`, `resultStdout`, `resultStderr`): `void`

Defined in: [src/code-executors/CodeExecutorContext.ts:184](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutorContext.ts#L184)

Updates the code execution result.

#### Parameters

##### invocationId

`string`

The invocation ID to update the code execution result for.

##### code

`string`

The code to execute.

##### resultStdout

`string`

The standard output of the code execution.

##### resultStderr

`string`

The standard error of the code execution.

#### Returns

`void`
