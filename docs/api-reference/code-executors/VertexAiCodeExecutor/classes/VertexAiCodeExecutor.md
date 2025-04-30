[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [code-executors/VertexAiCodeExecutor](../README.md) / VertexAiCodeExecutor

# Class: VertexAiCodeExecutor

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:149](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L149)

A code executor that uses Vertex AI Code Interpreter Extension to execute code.

## Extends

- [`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md)

## Constructors

### Constructor

> **new VertexAiCodeExecutor**(`options`): `VertexAiCodeExecutor`

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:170](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L170)

Initializes the VertexAiCodeExecutor.

#### Parameters

##### options

[`VertexAiCodeExecutorOptions`](../interfaces/VertexAiCodeExecutorOptions.md) = `{}`

#### Returns

`VertexAiCodeExecutor`

#### Overrides

[`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md).[`constructor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md#constructor)

## Methods

### executeCode()

> **executeCode**(`invocationContext`, `codeExecutionInput`): `Promise`\<[`CodeExecutionResult`](../../CodeExecutionUtils/interfaces/CodeExecutionResult.md)\>

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:217](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L217)

Executes code and returns the code execution result.

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

Defined in: [src/code-executors/BaseCodeExecutor.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L20)

If true, extract and process data files from the model request
and attach them to the code executor.
Supported data file MimeTypes are [text/csv].

Default to false.

#### Inherited from

[`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md).[`optimizeDataFile`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md#optimizedatafile)

***

### resourceName?

> `optional` **resourceName**: `string`

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:155](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L155)

If set, load the existing resource name of the code interpreter extension
instead of creating a new one.
Format: projects/123/locations/us-central1/extensions/456

***

### stateful

> **stateful**: `boolean` = `false`

Defined in: [src/code-executors/BaseCodeExecutor.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L25)

Whether the code executor is stateful. Default to false.

#### Inherited from

[`BaseCodeExecutor`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md).[`stateful`](../../BaseCodeExecutor/classes/BaseCodeExecutor.md#stateful)
