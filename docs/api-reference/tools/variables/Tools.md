[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../README.md)

***

[ADK TypeScript API Reference](../../modules.md) / [tools](../README.md) / Tools

# Variable: Tools

> `const` **Tools**: `object`

Defined in: [src/tools/index.ts:59](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/index.ts#L59)

Tool categories collection

## Type declaration

### agent

> **agent**: `object`

Agent control tools

#### agent.exitLoop

> **exitLoop**: `object`

Exit loop tool

#### agent.exitLoop.description

> **description**: `string` = `'Exits the loop. Call this function only when you are instructed to do so.'`

#### agent.exitLoop.execute()

> **execute**: () => `Promise`\<`any`\>

##### Returns

`Promise`\<`any`\>

#### agent.exitLoop.name

> **name**: `string` = `'exit_loop'`

#### agent.getUserChoice

> **getUserChoice**: `object`

Get user choice tool

#### agent.getUserChoice.description

> **description**: `string` = `'Provides options to the user and asks them to choose one'`

#### agent.getUserChoice.execute()

> **execute**: (`options`) => `Promise`\<`any`\>

##### Parameters

###### options

`string`[]

##### Returns

`Promise`\<`any`\>

#### agent.getUserChoice.name

> **name**: `string` = `'get_user_choice'`

#### agent.transferToAgent

> **transferToAgent**: `object`

Transfer to agent tool

#### agent.transferToAgent.description

> **description**: `string` = `'Transfers the question to another agent'`

#### agent.transferToAgent.execute()

> **execute**: (`agentName`) => `Promise`\<`any`\>

##### Parameters

###### agentName

`string`

##### Returns

`Promise`\<`any`\>

#### agent.transferToAgent.name

> **name**: `string` = `'transfer_to_agent'`

### code

> **code**: `object`

Code-related tools

#### code.codeExecution

> **codeExecution**: `object`

Code execution tool (built-in)

#### code.codeExecution.description

> **description**: `string` = `'A built-in tool that enables Gemini models to execute code'`

#### code.codeExecution.execute()

> **execute**: () => `Promise`\<`any`\>

##### Returns

`Promise`\<`any`\>

#### code.codeExecution.name

> **name**: `string` = `'code_execution'`

#### code.executeCode

> **executeCode**: `object`

Local code execution tool

#### code.executeCode.description

> **description**: `string` = `'Executes code in various programming languages locally'`

#### code.executeCode.execute()

> **execute**: (`params`) => `Promise`\<`any`\>

##### Parameters

###### params

###### code

`string`

###### language

`string`

##### Returns

`Promise`\<`any`\>

#### code.executeCode.name

> **name**: `string` = `'execute_code'`

### file

> **file**: `object`

File system related tools

#### file.read

> **read**: `object`

Read file tool

#### file.read.description

> **description**: `string` = `'Read content from a file'`

#### file.read.execute()

> **execute**: (`filePath`) => `Promise`\<`any`\>

##### Parameters

###### filePath

`string`

##### Returns

`Promise`\<`any`\>

#### file.read.name

> **name**: `string` = `'file_read'`

#### file.write

> **write**: `object`

Write file tool

#### file.write.description

> **description**: `string` = `'Write content to a file'`

#### file.write.execute()

> **execute**: (`args`) => `Promise`\<`any`\>

##### Parameters

###### args

###### content

`string`

###### filePath

`string`

##### Returns

`Promise`\<`any`\>

#### file.write.name

> **name**: `string` = `'file_write'`

### instruction

> **instruction**: `object`

Instruction enhancement tools

#### instruction.examples

> **examples**: `object`

Example tool for few-shot learning

#### instruction.examples.description

> **description**: `string` = `'A tool that adds examples to guide the model responses'`

#### instruction.examples.execute()

> **execute**: (`examples`) => `Promise`\<`any`\>

##### Parameters

###### examples

`any`[]

##### Returns

`Promise`\<`any`\>

#### instruction.examples.name

> **name**: `string` = `'example_tool'`

### mcp

> **mcp**: `object`

MCP tools

#### mcp.createSseToolset

> **createSseToolset**: `object`

Create an MCP toolset with SSE connection

#### mcp.createSseToolset.description

> **description**: `string` = `'Creates an MCP toolset using SSE connection'`

#### mcp.createSseToolset.execute()

> **execute**: (`params`) => `Promise`\<`any`\>

##### Parameters

###### params

###### headers?

`Record`\<`string`, `any`\>

###### url

`string`

##### Returns

`Promise`\<`any`\>

#### mcp.createSseToolset.name

> **name**: `string` = `'create_mcp_sse_toolset'`

#### mcp.createStdioToolset

> **createStdioToolset**: `object`

Create an MCP toolset with stdio connection

#### mcp.createStdioToolset.description

> **description**: `string` = `'Creates an MCP toolset using stdio connection'`

#### mcp.createStdioToolset.execute()

> **execute**: (`params`) => `Promise`\<`any`\>

##### Parameters

###### params

###### args

`string`[]

###### command

`string`

##### Returns

`Promise`\<`any`\>

#### mcp.createStdioToolset.name

> **name**: `string` = `'create_mcp_stdio_toolset'`

### memory

> **memory**: `object`

Memory-related tools

#### memory.loadMemory

> **loadMemory**: `object`

Load memory tool

#### memory.loadMemory.description

> **description**: `string` = `'Loads memory for the current user based on a query'`

#### memory.loadMemory.execute()

> **execute**: (`query`) => `Promise`\<`any`\>

##### Parameters

###### query

`string`

##### Returns

`Promise`\<`any`\>

#### memory.loadMemory.name

> **name**: `string` = `'load_memory'`

#### memory.preloadMemory

> **preloadMemory**: `object`

Preload memory tool

#### memory.preloadMemory.description

> **description**: `string` = `'Preloads memory for the current user\'s query'`

#### memory.preloadMemory.execute()

> **execute**: () => `Promise`\<`any`\>

##### Returns

`Promise`\<`any`\>

#### memory.preloadMemory.name

> **name**: `string` = `'preload_memory'`

### vertex

> **vertex**: `object`

Vertex AI tools

#### vertex.searchWithDataStore

> **searchWithDataStore**: `object`

Vertex AI Search with Data Store

#### vertex.searchWithDataStore.description

> **description**: `string` = `'Uses Vertex AI Search with a data store to retrieve information'`

#### vertex.searchWithDataStore.execute()

> **execute**: (`dataStoreId`) => `Promise`\<`any`\>

##### Parameters

###### dataStoreId

`string`

##### Returns

`Promise`\<`any`\>

#### vertex.searchWithDataStore.name

> **name**: `string` = `'vertex_ai_search_datastore'`

#### vertex.searchWithEngine

> **searchWithEngine**: `object`

Vertex AI Search with Engine

#### vertex.searchWithEngine.description

> **description**: `string` = `'Uses Vertex AI Search with a search engine to retrieve information'`

#### vertex.searchWithEngine.execute()

> **execute**: (`searchEngineId`) => `Promise`\<`any`\>

##### Parameters

###### searchEngineId

`string`

##### Returns

`Promise`\<`any`\>

#### vertex.searchWithEngine.name

> **name**: `string` = `'vertex_ai_search_engine'`

### web

> **web**: `object`

Web-related tools

#### web.loadPage

> **loadPage**: `object`

Load web page tool

#### web.loadPage.description

> **description**: `string` = `'Fetches the content from a URL and returns the text content'`

#### web.loadPage.execute()

> **execute**: (`url`) => `Promise`\<`any`\>

##### Parameters

###### url

`string`

##### Returns

`Promise`\<`any`\>

#### web.loadPage.name

> **name**: `string` = `'load_web_page'`

#### web.search

> **search**: `object`

Web search tool

#### web.search.description

> **description**: `string` = `'Search the web for information'`

#### web.search.execute()

> **execute**: (`query`) => `Promise`\<`any`\>

##### Parameters

###### query

`string`

##### Returns

`Promise`\<`any`\>

#### web.search.name

> **name**: `string` = `'web_search'`
