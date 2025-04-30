[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/common/common](../README.md) / TypeHintHelper

# Class: TypeHintHelper

Defined in: [src/tools/openapi-tool/common/common.ts:169](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L169)

Helper class for generating type hints

## Constructors

### Constructor

> **new TypeHintHelper**(): `TypeHintHelper`

#### Returns

`TypeHintHelper`

## Methods

### getTypeInfo()

> `static` **getTypeInfo**(`schema`): `object`

Defined in: [src/tools/openapi-tool/common/common.ts:175](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L175)

Get the TypeScript type information for a schema

#### Parameters

##### schema

[`Schema`](../interfaces/Schema.md)

The OpenAPI schema

#### Returns

`object`

Object containing typeValue and typeHint

##### typeHint

> **typeHint**: `string`

##### typeValue

> **typeValue**: `any`
