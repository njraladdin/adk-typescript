[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [tools/CodeExecutionTool](../README.md) / executeCode

# Function: executeCode()

> **executeCode**(`params`, `context`): `Promise`\<[`CodeExecutionResult`](../interfaces/CodeExecutionResult.md)\>

Defined in: [src/tools/CodeExecutionTool.ts:87](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/CodeExecutionTool.ts#L87)

Function to execute code in various languages

## Parameters

### params

`Record`\<`string`, `any`\>

Parameters for the function

### context

[`ToolContext`](../../ToolContext/classes/ToolContext.md)

The tool context

## Returns

`Promise`\<[`CodeExecutionResult`](../interfaces/CodeExecutionResult.md)\>

Result of the code execution
