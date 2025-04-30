[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/mcp-tool/MCPToolset](../README.md) / MCPToolset

# Class: MCPToolset

Defined in: [src/tools/mcp-tool/MCPToolset.ts:55](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPToolset.ts#L55)

Connects to a MCP Server, and retrieves MCP Tools into ADK Tools.

Example 1 (using fromServer helper):
```typescript
async function loadTools() {
  const [tools, exitStack] = await MCPToolset.fromServer({
    connectionParams: {
      command: 'npx',
      args: ["-y", "@modelcontextprotocol/server-filesystem"]
    }
  });
  
  // Use the tools in an agent
  const agent = new Agent({
    tools
  });
  
  // Later, close the connection
  await exitStack.aclose();
}
```

Example 2 (using async/await with closure):
```typescript
async function loadTools() {
  let toolset: MCPToolset | null = null;
  try {
    toolset = new MCPToolset({
      connectionParams: new SseServerParams({
        url: "http://0.0.0.0:8090/sse"
      })
    });
    
    await toolset.initialize();
    const tools = await toolset.loadTools();
    
    const agent = new Agent({
      tools
    });
    
    // Use the agent...
  } finally {
    if (toolset) {
      await toolset.exit();
    }
  }
}

## Constructors

### Constructor

> **new MCPToolset**(`options`): `MCPToolset`

Defined in: [src/tools/mcp-tool/MCPToolset.ts:68](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPToolset.ts#L68)

Initializes the MCPToolset.

#### Parameters

##### options

Configuration options

###### connectionParams

[`StdioServerParameters`](../../MCPSessionManager/interfaces/StdioServerParameters.md) \| [`SseServerParams`](../../MCPSessionManager/classes/SseServerParams.md)

The connection parameters to the MCP server

###### errlog?

`any`

Optional error logging stream

#### Returns

`MCPToolset`

## Methods

### fromServer()

> `static` **fromServer**(`options`): `Promise`\<\[[`MCPTool`](../../MCPTool/classes/MCPTool.md)[], [`AsyncExitStack`](../../MCPSessionManager/classes/AsyncExitStack.md)\]\>

Defined in: [src/tools/mcp-tool/MCPToolset.ts:99](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPToolset.ts#L99)

Retrieve all tools from the MCP server.

#### Parameters

##### options

Configuration options

###### asyncExitStack?

[`AsyncExitStack`](../../MCPSessionManager/classes/AsyncExitStack.md)

Optional AsyncExitStack to use

###### connectionParams

[`StdioServerParameters`](../../MCPSessionManager/interfaces/StdioServerParameters.md) \| [`SseServerParams`](../../MCPSessionManager/classes/SseServerParams.md)

The connection parameters to the MCP server

###### errlog?

`any`

Optional error logging stream

#### Returns

`Promise`\<\[[`MCPTool`](../../MCPTool/classes/MCPTool.md)[], [`AsyncExitStack`](../../MCPSessionManager/classes/AsyncExitStack.md)\]\>

A tuple containing the list of MCPTools and the AsyncExitStack

***

### exit()

> **exit**(): `Promise`\<`void`\>

Defined in: [src/tools/mcp-tool/MCPToolset.ts:130](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPToolset.ts#L130)

Closes the connection to the MCP Server.

#### Returns

`Promise`\<`void`\>

***

### initialize()

> **initialize**(): `Promise`\<[`ClientSession`](../../MCPSessionManager/type-aliases/ClientSession.md)\>

Defined in: [src/tools/mcp-tool/MCPToolset.ts:122](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPToolset.ts#L122)

Initializes the connection to the MCP Server.

#### Returns

`Promise`\<[`ClientSession`](../../MCPSessionManager/type-aliases/ClientSession.md)\>

***

### loadTools()

> **loadTools**(): `Promise`\<[`MCPTool`](../../MCPTool/classes/MCPTool.md)[]\>

Defined in: [src/tools/mcp-tool/MCPToolset.ts:138](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPToolset.ts#L138)

Loads all tools from the MCP Server.

#### Returns

`Promise`\<[`MCPTool`](../../MCPTool/classes/MCPTool.md)[]\>

Array of MCPTool instances
