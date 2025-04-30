[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/openapi-tool/common/common](../README.md) / JsDocHelper

# Class: JsDocHelper

Defined in: [src/tools/openapi-tool/common/common.ts:224](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L224)

Helper class for generating JSDoc

## Constructors

### Constructor

> **new JsDocHelper**(): `JsDocHelper`

#### Returns

`JsDocHelper`

## Methods

### generateParamDoc()

> `static` **generateParamDoc**(`param`): `string`

Defined in: [src/tools/openapi-tool/common/common.ts:230](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L230)

Generate JSDoc for a parameter

#### Parameters

##### param

[`ApiParameter`](ApiParameter.md)

The API parameter

#### Returns

`string`

JSDoc string for the parameter

***

### generateReturnDoc()

> `static` **generateReturnDoc**(`responses`): `string`

Defined in: [src/tools/openapi-tool/common/common.ts:251](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/openapi-tool/common/common.ts#L251)

Generate JSDoc for return value

#### Parameters

##### responses

`Record`\<`string`, `any`\>

The OpenAPI responses object

#### Returns

`string`

JSDoc string for the return value
