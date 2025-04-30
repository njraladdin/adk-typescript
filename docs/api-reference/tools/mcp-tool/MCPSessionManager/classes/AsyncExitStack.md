[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/mcp-tool/MCPSessionManager](../README.md) / AsyncExitStack

# Class: AsyncExitStack

Defined in: [src/tools/mcp-tool/MCPSessionManager.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPSessionManager.ts#L26)

## Constructors

### Constructor

> **new AsyncExitStack**(): `AsyncExitStack`

#### Returns

`AsyncExitStack`

## Methods

### aclose()

> **aclose**(): `Promise`\<`void`\>

Defined in: [src/tools/mcp-tool/MCPSessionManager.ts:50](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPSessionManager.ts#L50)

Close all registered contexts in reverse order

#### Returns

`Promise`\<`void`\>

***

### enterAsyncContext()

> **enterAsyncContext**\<`T`\>(`context`): `Promise`\<`T`\>

Defined in: [src/tools/mcp-tool/MCPSessionManager.ts:34](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPSessionManager.ts#L34)

Enter an async context and register its cleanup function

#### Type Parameters

##### T

`T`

#### Parameters

##### context

`T`

An object with an aclose method or a cleanup function

#### Returns

`Promise`\<`T`\>

The context that was entered
