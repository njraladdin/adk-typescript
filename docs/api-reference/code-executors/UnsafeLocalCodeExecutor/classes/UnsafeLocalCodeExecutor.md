[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [code-executors/UnsafeLocalCodeExecutor](../README.md) / UnsafeLocalCodeExecutor

# Class: UnsafeLocalCodeExecutor

Defined in: [src/code-executors/UnsafeLocalCodeExecutor.ts:10](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/UnsafeLocalCodeExecutor.ts#L10)

A code executor that unsafely execute code in the current local context.

## Extends

- [`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md)

## Constructors

### Constructor

> **new UnsafeLocalCodeExecutor**(`params`): `UnsafeLocalCodeExecutor`

Defined in: [src/code-executors/UnsafeLocalCodeExecutor.ts:24](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/UnsafeLocalCodeExecutor.ts#L24)

Initializes the UnsafeLocalCodeExecutor.

#### Parameters

##### params

###### codeBlockDelimiters?

\[`string`, `string`\][]

###### errorRetryAttempts?

`number`

###### executionResultDelimiters?

\[`string`, `string`\]

###### optimizeDataFile?

`boolean`

###### stateful?

`boolean`

#### Returns

`UnsafeLocalCodeExecutor`

#### Overrides

[`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md).[`constructor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md#constructor)

## Methods

### executeCode()

> **executeCode**(`invocationContext`, `codeExecutionInput`): `Promise`\<[`CodeExecutionResult`](../../CodeExecutionUtils/interfaces/CodeExecutionResult.md)\>

Defined in: [src/code-executors/UnsafeLocalCodeExecutor.ts:61](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/UnsafeLocalCodeExecutor.ts#L61)

Executes code and return the code execution result.

#### Parameters

##### invocationContext

[`InvocationContext`](../../../agents/InvocationContext/classes/InvocationContext.md)

The invocation context of the code execution.

##### codeExecutionInput

[`CodeExecutionInput`](../../CodeExecutionUtils/interfaces/CodeExecutionInput.md)

The code execution input.

#### Returns

`Promise`\<[`CodeExecutionResult`](../../CodeExecutionUtils/interfaces/CodeExecutionResult.md)\>

The code execution result.

#### Overrides

[`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md).[`executeCode`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md#executecode)

## Properties

### codeBlockDelimiters

> **codeBlockDelimiters**: \[`string`, `string`\][]

Defined in: [src/code-executors/BaseCodeExecutor.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L41)

The list of the enclosing delimiters to identify the code blocks.
For example, the delimiter ['```python\n', '\n```'] can be
used to identify code blocks with the following format:

```python
print("hello")
```

#### Inherited from

[`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md).[`codeBlockDelimiters`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md#codeblockdelimiters)

***

### errorRetryAttempts

> **errorRetryAttempts**: `number` = `2`

Defined in: [src/code-executors/BaseCodeExecutor.ts:30](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L30)

The number of attempts to retry on consecutive code execution errors. Default to 2.

#### Inherited from

[`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md).[`errorRetryAttempts`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md#errorretryattempts)

***

### executionResultDelimiters

> **executionResultDelimiters**: \[`string`, `string`\]

Defined in: [src/code-executors/BaseCodeExecutor.ts:49](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L49)

The delimiters to format the code execution result.

#### Inherited from

[`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md).[`executionResultDelimiters`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md#executionresultdelimiters)

***

### optimizeDataFile

> **optimizeDataFile**: `boolean` = `false`

Defined in: [src/code-executors/UnsafeLocalCodeExecutor.ts:19](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/UnsafeLocalCodeExecutor.ts#L19)

Overrides the BaseCodeExecutor attribute: this executor cannot optimize_data_file.

#### Overrides

[`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md).[`optimizeDataFile`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md#optimizedatafile)

***

### stateful

> **stateful**: `boolean` = `false`

Defined in: [src/code-executors/UnsafeLocalCodeExecutor.ts:14](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/UnsafeLocalCodeExecutor.ts#L14)

Overrides the BaseCodeExecutor attribute: this executor cannot be stateful.

#### Overrides

[`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md).[`stateful`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md#stateful)
