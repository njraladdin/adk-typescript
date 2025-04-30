[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/mcp-tool/MCPSessionManager](../README.md) / MCPSessionManager

# Class: MCPSessionManager

Defined in: [src/tools/mcp-tool/MCPSessionManager.ts:157](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPSessionManager.ts#L157)

Manages MCP client sessions.
This class provides methods for creating and initializing MCP client sessions,
handling different connection parameters (Stdio and SSE).

## Constructors

### Constructor

> **new MCPSessionManager**(`connectionParams`, `exitStack`, `errlog?`): `MCPSessionManager`

Defined in: [src/tools/mcp-tool/MCPSessionManager.ts:168](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPSessionManager.ts#L168)

Initializes the MCP session manager.

#### Parameters

##### connectionParams

Parameters for the MCP connection (Stdio or SSE)

[`StdioServerParameters`](../interfaces/StdioServerParameters.md) | [`SseServerParams`](SseServerParams.md)

##### exitStack

[`AsyncExitStack`](AsyncExitStack.md)

AsyncExitStack to manage the session lifecycle

##### errlog?

`any`

Optional error logging stream

#### Returns

`MCPSessionManager`

## Methods

### initializeSession()

> `static` **initializeSession**(`params`): `Promise`\<[`ClientSession`](../type-aliases/ClientSession.md)\>

Defined in: [src/tools/mcp-tool/MCPSessionManager.ts:195](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPSessionManager.ts#L195)

Initializes an MCP client session

#### Parameters

##### params

Session initialization parameters

###### connectionParams

[`StdioServerParameters`](../interfaces/StdioServerParameters.md) \| [`SseServerParams`](SseServerParams.md)

###### errlog?

`any`

###### exitStack

[`AsyncExitStack`](AsyncExitStack.md)

#### Returns

`Promise`\<[`ClientSession`](../type-aliases/ClientSession.md)\>

A promise that resolves to the initialized ClientSession

***

### createSession()

> **createSession**(): `Promise`\<[`ClientSession`](../type-aliases/ClientSession.md)\>

Defined in: [src/tools/mcp-tool/MCPSessionManager.ts:182](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPSessionManager.ts#L182)

Creates a new MCP client session

#### Returns

`Promise`\<[`ClientSession`](../type-aliases/ClientSession.md)\>

A promise that resolves to a new ClientSession
