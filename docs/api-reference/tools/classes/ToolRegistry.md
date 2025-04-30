[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../README.md)

***

[ADK TypeScript API Reference](../../modules.md) / [tools](../README.md) / ToolRegistry

# Class: ToolRegistry

Defined in: [src/tools/index.ts:373](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/index.ts#L373)

Tool registry for managing custom tools

## Constructors

### Constructor

> **new ToolRegistry**(): `ToolRegistry`

#### Returns

`ToolRegistry`

## Methods

### get()

> **get**(`name`): `undefined` \| [`Tool`](../interfaces/Tool.md)

Defined in: [src/tools/index.ts:389](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/index.ts#L389)

Get a tool by name

#### Parameters

##### name

`string`

The name of the tool to retrieve

#### Returns

`undefined` \| [`Tool`](../interfaces/Tool.md)

The tool if found, undefined otherwise

***

### getAll()

> **getAll**(): [`Tool`](../interfaces/Tool.md)[]

Defined in: [src/tools/index.ts:397](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/index.ts#L397)

Get all registered tools

#### Returns

[`Tool`](../interfaces/Tool.md)[]

Array of all registered tools

***

### register()

> **register**(`tool`): `void`

Defined in: [src/tools/index.ts:380](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/index.ts#L380)

Register a new tool

#### Parameters

##### tool

[`Tool`](../interfaces/Tool.md)

The tool to register

#### Returns

`void`
