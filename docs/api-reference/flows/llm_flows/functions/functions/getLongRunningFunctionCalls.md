[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [flows/llm\_flows/functions](../README.md) / getLongRunningFunctionCalls

# Function: getLongRunningFunctionCalls()

> **getLongRunningFunctionCalls**(`functionCalls`, `toolsDict`): `Set`\<`string`\>

Defined in: [src/flows/llm\_flows/functions.ts:109](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/functions.ts#L109)

Gets the set of long-running function call IDs

## Parameters

### functionCalls

`any`[]

The list of function calls

### toolsDict

`Record`\<`string`, [`BaseTool`](../../../../tools/BaseTool/classes/BaseTool.md)\>

Dictionary mapping tool names to tool instances

## Returns

`Set`\<`string`\>

Set of function call IDs for long-running tools
