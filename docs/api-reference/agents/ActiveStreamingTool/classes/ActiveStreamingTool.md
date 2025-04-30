[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [agents/ActiveStreamingTool](../README.md) / ActiveStreamingTool

# Class: ActiveStreamingTool

Defined in: [src/agents/ActiveStreamingTool.ts:18](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ActiveStreamingTool.ts#L18)

Represents an active streaming tool that is running.

## Constructors

### Constructor

> **new ActiveStreamingTool**(`name`, `args`, `id`): `ActiveStreamingTool`

Defined in: [src/agents/ActiveStreamingTool.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ActiveStreamingTool.ts#L41)

Creates a new instance of ActiveStreamingTool.

#### Parameters

##### name

`string`

Function name

##### args

`Record`\<`string`, `any`\>

Function arguments

##### id

`string`

Function ID

#### Returns

`ActiveStreamingTool`

## Methods

### complete()

> **complete**(`result`): `void`

Defined in: [src/agents/ActiveStreamingTool.ts:52](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ActiveStreamingTool.ts#L52)

Marks the streaming tool as completed.

#### Parameters

##### result

`any`

The result of the function.

#### Returns

`void`

## Properties

### args

> **args**: `Record`\<`string`, `any`\>

Defined in: [src/agents/ActiveStreamingTool.ts:23](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ActiveStreamingTool.ts#L23)

Function arguments

***

### id

> **id**: `string`

Defined in: [src/agents/ActiveStreamingTool.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ActiveStreamingTool.ts#L26)

Function ID

***

### isCompleted

> **isCompleted**: `boolean` = `false`

Defined in: [src/agents/ActiveStreamingTool.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ActiveStreamingTool.ts#L29)

Whether the function has completed

***

### name

> **name**: `string`

Defined in: [src/agents/ActiveStreamingTool.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ActiveStreamingTool.ts#L20)

Function name

***

### result?

> `optional` **result**: `any`

Defined in: [src/agents/ActiveStreamingTool.ts:32](https://github.com/njraladdin/adk-typescript/blob/main/src/agents/ActiveStreamingTool.ts#L32)

The result of the function, if completed
