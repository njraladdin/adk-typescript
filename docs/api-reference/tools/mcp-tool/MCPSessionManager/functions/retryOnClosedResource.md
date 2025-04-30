[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/mcp-tool/MCPSessionManager](../README.md) / retryOnClosedResource

# Function: retryOnClosedResource()

> **retryOnClosedResource**(`asyncReinitFuncName`): (`_target`, `_propertyKey`, `descriptor`) => `PropertyDescriptor`

Defined in: [src/tools/mcp-tool/MCPSessionManager.ts:117](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPSessionManager.ts#L117)

A decorator factory that creates a function to retry operations when resources are closed.

## Parameters

### asyncReinitFuncName

`string`

Name of the method to call for reinitialization

## Returns

> (`_target`, `_propertyKey`, `descriptor`): `PropertyDescriptor`

### Parameters

#### \_target

`any`

#### \_propertyKey

`string`

#### descriptor

`PropertyDescriptor`

### Returns

`PropertyDescriptor`
