[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/common/common](../README.md) / ApiParameter

# Class: ApiParameter

Defined in: [src/tools/openapi-tool/common/common.ts:101](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L101)

API Parameter

## Constructors

### Constructor

> **new ApiParameter**(`originalName`, `paramLocation`, `paramSchema`, `description`, `pyName`): `ApiParameter`

Defined in: [src/tools/openapi-tool/common/common.ts:113](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L113)

Create a new API parameter

#### Parameters

##### originalName

`string`

##### paramLocation

`string`

##### paramSchema

`string` | [`Schema`](../interfaces/Schema.md)

##### description

`string` = `''`

##### pyName

`string` = `''`

#### Returns

`ApiParameter`

## Methods

### toArgString()

> **toArgString**(): `string`

Defined in: [src/tools/openapi-tool/common/common.ts:147](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L147)

Convert parameter to an argument string for function call

#### Returns

`string`

***

### toDictProperty()

> **toDictProperty**(): `string`

Defined in: [src/tools/openapi-tool/common/common.ts:154](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L154)

Convert parameter to a dictionary property string

#### Returns

`string`

***

### toJSDocString()

> **toJSDocString**(): `string`

Defined in: [src/tools/openapi-tool/common/common.ts:161](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L161)

Convert parameter to JSDoc

#### Returns

`string`

***

### toString()

> **toString**(): `string`

Defined in: [src/tools/openapi-tool/common/common.ts:140](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L140)

Convert parameter to string

#### Returns

`string`

## Properties

### description

> **description**: `string`

Defined in: [src/tools/openapi-tool/common/common.ts:105](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L105)

***

### originalName

> **originalName**: `string`

Defined in: [src/tools/openapi-tool/common/common.ts:102](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L102)

***

### paramLocation

> **paramLocation**: `string`

Defined in: [src/tools/openapi-tool/common/common.ts:103](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L103)

***

### paramSchema

> **paramSchema**: [`Schema`](../interfaces/Schema.md)

Defined in: [src/tools/openapi-tool/common/common.ts:104](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L104)

***

### pyName

> **pyName**: `string`

Defined in: [src/tools/openapi-tool/common/common.ts:106](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L106)

***

### typeHint

> **typeHint**: `string`

Defined in: [src/tools/openapi-tool/common/common.ts:108](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L108)

***

### typeValue

> **typeValue**: `any`

Defined in: [src/tools/openapi-tool/common/common.ts:107](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L107)
