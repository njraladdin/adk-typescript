[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/mcp-tool/MCPTool](../README.md) / MCPTool

# Class: MCPTool

Defined in: [src/tools/mcp-tool/MCPTool.ts:14](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPTool.ts#L14)

Turns a MCP Tool into a Vertex Agent Framework Tool.

Internally, the tool initializes from a MCP Tool, and uses the MCP Session to
call the tool.

## Extends

- [`BaseTool`](../../../BaseTool/classes/BaseTool.md)

## Accessors

### \_apiVariant

#### Get Signature

> **get** `protected` **\_apiVariant**(): `string`

Defined in: [src/tools/BaseTool.ts:171](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L171)

Get the API variant (Vertex AI or Google AI)

##### Returns

`string`

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`_apiVariant`](../../../BaseTool/classes/BaseTool.md#_apivariant)

## Constructors

### Constructor

> **new MCPTool**(`options`): `MCPTool`

Defined in: [src/tools/mcp-tool/MCPTool.ts:36](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPTool.ts#L36)

Initializes a MCPTool.

This tool wraps a MCP Tool interface and an active MCP Session. It invokes
the MCP Tool through executing the tool from remote MCP Session.

#### Parameters

##### options

Configuration options for the MCPTool

###### authCredential?

[`AuthCredential`](../../../../auth/AuthCredential/interfaces/AuthCredential.md)

Optional authentication credential to use

###### authScheme?

[`AuthScheme`](../../../../auth/AuthSchemes/interfaces/AuthScheme.md)

Optional authentication scheme to use

###### mcpSession

[`ClientSession`](../../MCPSessionManager/type-aliases/ClientSession.md)

The MCP session to use to call the tool

###### mcpSessionManager

[`MCPSessionManager`](../../MCPSessionManager/classes/MCPSessionManager.md)

The session manager to reinitialize sessions if needed

###### mcpTool

\{[`key`: `string`]: `unknown`; \}

The MCP tool to wrap

#### Returns

`MCPTool`

#### Throws

Error If mcpTool or mcpSession is null/undefined

#### Overrides

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`constructor`](../../../BaseTool/classes/BaseTool.md#constructor)

## Methods

### \_getDeclaration()

> `protected` **\_getDeclaration**(): `null` \| [`FunctionDeclaration`](../../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/mcp-tool/MCPTool.ts:81](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPTool.ts#L81)

Get the function declaration for the tool

#### Returns

`null` \| [`FunctionDeclaration`](../../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration object

#### Overrides

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`_getDeclaration`](../../../BaseTool/classes/BaseTool.md#_getdeclaration)

***

### execute()

> **execute**(`args`, `toolContext`): `Promise`\<`any`\>

Defined in: [src/tools/mcp-tool/MCPTool.ts:100](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/mcp-tool/MCPTool.ts#L100)

Execute the tool asynchronously

#### Parameters

##### args

`any`

Arguments to pass to the tool

##### toolContext

[`ToolContext`](../../../ToolContext/classes/ToolContext.md)

The tool context

#### Returns

`Promise`\<`any`\>

The result of executing the tool

#### Overrides

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`execute`](../../../BaseTool/classes/BaseTool.md#execute)

***

### getDeclaration()

> **getDeclaration**(): `null` \| [`FunctionDeclaration`](../../../BaseTool/interfaces/FunctionDeclaration.md)

Defined in: [src/tools/BaseTool.ts:77](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L77)

Get the declaration for this tool

#### Returns

`null` \| [`FunctionDeclaration`](../../../BaseTool/interfaces/FunctionDeclaration.md)

The function declaration for this tool

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`getDeclaration`](../../../BaseTool/classes/BaseTool.md#getdeclaration)

***

### getParameters()

> **getParameters**(): `any`

Defined in: [src/tools/BaseTool.ts:85](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L85)

Get the parameters for this tool

#### Returns

`any`

The parameters for this tool

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`getParameters`](../../../BaseTool/classes/BaseTool.md#getparameters)

***

### processLlmRequest()

#### Call Signature

> **processLlmRequest**(`params`): `Promise`\<`void`\>

Defined in: [src/tools/BaseTool.ts:111](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L111)

Process the LLM request for this tool

This is used to modify the LLM request before it's sent out,
typically to add this tool to the LLM's available tools.

##### Parameters

###### params

Parameters for processing

###### llmRequest

`any`

The outgoing LLM request to modify

###### toolContext

[`ToolContext`](../../../ToolContext/classes/ToolContext.md)

Context information for the tool

##### Returns

`Promise`\<`void`\>

##### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`processLlmRequest`](../../../BaseTool/classes/BaseTool.md#processllmrequest)

#### Call Signature

> **processLlmRequest**(`params`): `Promise`\<`void`\>

Defined in: [src/flows/llm\_flows/BaseLlmFlow.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/flows/llm_flows/BaseLlmFlow.ts#L45)

##### Parameters

###### params

###### llmRequest

`any`

###### toolContext

[`ToolContext`](../../../ToolContext/classes/ToolContext.md)

##### Returns

`Promise`\<`void`\>

##### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`processLlmRequest`](../../../BaseTool/classes/BaseTool.md#processllmrequest)

## Properties

### description

> `readonly` **description**: `string`

Defined in: [src/tools/BaseTool.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L46)

The description of the tool

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`description`](../../../BaseTool/classes/BaseTool.md#description)

***

### isLongRunning

> `readonly` **isLongRunning**: `boolean`

Defined in: [src/tools/BaseTool.ts:51](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L51)

Whether the tool is a long-running operation

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`isLongRunning`](../../../BaseTool/classes/BaseTool.md#islongrunning)

***

### name

> `readonly` **name**: `string`

Defined in: [src/tools/BaseTool.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/BaseTool.ts#L41)

The name of the tool

#### Inherited from

[`BaseTool`](../../../BaseTool/classes/BaseTool.md).[`name`](../../../BaseTool/classes/BaseTool.md#name)
