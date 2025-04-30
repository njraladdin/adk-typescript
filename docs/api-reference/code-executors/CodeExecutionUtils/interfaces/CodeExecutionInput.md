[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [code-executors/CodeExecutionUtils](../README.md) / CodeExecutionInput

# Interface: CodeExecutionInput

Defined in: [src/code-executors/CodeExecutionUtils.ts:32](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutionUtils.ts#L32)

A structure that contains the input of code execution.

## Properties

### code

> **code**: `string`

Defined in: [src/code-executors/CodeExecutionUtils.ts:36](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutionUtils.ts#L36)

The code to execute.

***

### executionId?

> `optional` **executionId**: `string`

Defined in: [src/code-executors/CodeExecutionUtils.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutionUtils.ts#L46)

The execution ID for the stateful code execution.

***

### inputFiles

> **inputFiles**: [`File`](File.md)[]

Defined in: [src/code-executors/CodeExecutionUtils.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutionUtils.ts#L41)

The input files available to the code.
