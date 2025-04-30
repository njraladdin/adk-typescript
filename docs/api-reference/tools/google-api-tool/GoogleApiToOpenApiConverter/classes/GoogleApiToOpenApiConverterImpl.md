[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/google-api-tool/GoogleApiToOpenApiConverter](../README.md) / GoogleApiToOpenApiConverterImpl

# Class: GoogleApiToOpenApiConverterImpl

Defined in: [src/tools/google-api-tool/GoogleApiToOpenApiConverter.ts:56](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToOpenApiConverter.ts#L56)

Converts Google API Discovery documents to OpenAPI v3 format.
Implements the GoogleApiToOpenApiConverter interface.

## Implements

- [`GoogleApiToOpenApiConverter`](../../GoogleApiToolSet/interfaces/GoogleApiToOpenApiConverter.md)

## Constructors

### Constructor

> **new GoogleApiToOpenApiConverterImpl**(`apiName`, `apiVersion`): `GoogleApiToOpenApiConverterImpl`

Defined in: [src/tools/google-api-tool/GoogleApiToOpenApiConverter.ts:94](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToOpenApiConverter.ts#L94)

Initialize the converter with the API name and version.

#### Parameters

##### apiName

`string`

The name of the Google API (e.g., "calendar")

##### apiVersion

`string`

The version of the API (e.g., "v3")

#### Returns

`GoogleApiToOpenApiConverterImpl`

## Methods

### convert()

> **convert**(): `Promise`\<`any`\>

Defined in: [src/tools/google-api-tool/GoogleApiToOpenApiConverter.ts:154](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToOpenApiConverter.ts#L154)

Convert the Google API spec to OpenAPI v3 format.

#### Returns

`Promise`\<`any`\>

Object containing the converted OpenAPI v3 specification

#### Implementation of

[`GoogleApiToOpenApiConverter`](../../GoogleApiToolSet/interfaces/GoogleApiToOpenApiConverter.md).[`convert`](../../GoogleApiToolSet/interfaces/GoogleApiToOpenApiConverter.md#convert)

***

### fetchGoogleApiSpec()

> **fetchGoogleApiSpec**(): `Promise`\<`void`\>

Defined in: [src/tools/google-api-tool/GoogleApiToOpenApiConverter.ts:105](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToOpenApiConverter.ts#L105)

Fetches the Google API specification using discovery service.

Note: In a real implementation, this would use the googleapis library.
For this port, we'll create a placeholder that simulates fetching the API spec.

#### Returns

`Promise`\<`void`\>

***

### saveOpenApiSpec()

> **saveOpenApiSpec**(`outputPath`): `void`

Defined in: [src/tools/google-api-tool/GoogleApiToOpenApiConverter.ts:584](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/google-api-tool/GoogleApiToOpenApiConverter.ts#L584)

Save the OpenAPI specification to a file.

#### Parameters

##### outputPath

`string`

Path where the OpenAPI spec should be saved

#### Returns

`void`
