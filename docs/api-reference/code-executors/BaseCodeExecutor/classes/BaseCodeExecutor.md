[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [code-executors/BaseCodeExecutor](../README.md) / BaseCodeExecutor

# Class: `abstract` BaseCodeExecutor

Defined in: [src/code-executors/BaseCodeExecutor.ts:12](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L12)

Abstract base class for all code executors.

The code executor allows the agent to execute code blocks from model responses
and incorporate the execution results into the final response.

## Extended by

- [`UnsafeLocalCodeExecutor`](../../UnsafeLocalCodeExecutor/classes/UnsafeLocalCodeExecutor.md)
- [`VertexAiCodeExecutor`](../../VertexAiCodeExecutor/classes/VertexAiCodeExecutor.md)

## Constructors

### Constructor

> **new BaseCodeExecutor**(): `BaseCodeExecutor`

#### Returns

`BaseCodeExecutor`

## Methods

### executeCode()

> `abstract` **executeCode**(`invocationContext`, `codeExecutionInput`): `Promise`\<[`CodeExecutionResult`](../../CodeExecutionUtils/interfaces/CodeExecutionResult.md)\>

Defined in: [src/code-executors/BaseCodeExecutor.ts:58](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L58)

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

***

### errorRetryAttempts

> **errorRetryAttempts**: `number` = `2`

Defined in: [src/code-executors/BaseCodeExecutor.ts:30](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L30)

The number of attempts to retry on consecutive code execution errors. Default to 2.

***

### executionResultDelimiters

> **executionResultDelimiters**: \[`string`, `string`\]

Defined in: [src/code-executors/BaseCodeExecutor.ts:49](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L49)

The delimiters to format the code execution result.

***

### optimizeDataFile

> **optimizeDataFile**: `boolean` = `false`

Defined in: [src/code-executors/BaseCodeExecutor.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L20)

If true, extract and process data files from the model request
and attach them to the code executor.
Supported data file MimeTypes are [text/csv].

Default to false.

***

### stateful

> **stateful**: `boolean` = `false`

Defined in: [src/code-executors/BaseCodeExecutor.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/BaseCodeExecutor.ts#L25)

Whether the code executor is stateful. Default to false.
