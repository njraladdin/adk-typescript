[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../README.md)

***

[ADK TypeScript API Reference](../../../../modules.md) / [tools/apihub-tool/APIHubToolset](../README.md) / APIHubToolset

# Class: APIHubToolset

Defined in: [src/tools/apihub-tool/APIHubToolset.ts:39](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/APIHubToolset.ts#L39)

APIHubToolset generates tools from a given API Hub resource.

Examples:

```typescript
const apihubToolset = new APIHubToolset({
  apihubResourceName: "projects/test-project/locations/us-central1/apis/test-api",
  serviceAccountJson: "...",
});

// Get all available tools
const agent = new LlmAgent({ tools: apihubToolset.getTools() });

// Get a specific tool
const agent = new LlmAgent({
  tools: [
    ...
    apihubToolset.getTool('my_tool'),
  ]
});
```

**apihubResourceName** is the resource name from API Hub. It must include
API name, and can optionally include API version and spec name.
- If apihubResourceName includes a spec resource name, the content of that
  spec will be used for generating the tools.
- If apihubResourceName includes only an api or a version name, the
  first spec of the first version of that API will be used.

## Constructors

### Constructor

> **new APIHubToolset**(`params`): `APIHubToolset`

Defined in: [src/tools/apihub-tool/APIHubToolset.ts:82](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/APIHubToolset.ts#L82)

Initializes the APIHubToolset with the given parameters.

Examples:
```typescript
const apihubToolset = new APIHubToolset({
  apihubResourceName: "projects/test-project/locations/us-central1/apis/test-api",
  serviceAccountJson: "...",
});

// Get all available tools
const agent = new LlmAgent({ tools: apihubToolset.getTools() });

// Get a specific tool
const agent = new LlmAgent({
  tools: [
    ...
    apihubToolset.getTool('my_tool'),
  ]
});
```

#### Parameters

##### params

Configuration parameters

###### accessToken?

`string`

Google Access token. Generate with gcloud cli `gcloud auth print-access-token`. Used for fetching API Specs from API Hub.

###### apihubClient?

[`APIHubClient`](../../clients/APIHubClient/classes/APIHubClient.md)

Optional custom API Hub client.

###### apihubResourceName

`string`

The resource name of the API in API Hub. Example: `projects/test-project/locations/us-central1/apis/test-api`.

###### authCredential?

[`AuthCredential`](../../../openapi-tool/auth/AuthTypes/interfaces/AuthCredential.md)

Auth credential that applies to all the tool in the toolset.

###### authScheme?

[`AuthScheme`](../../../openapi-tool/auth/AuthTypes/interfaces/AuthScheme.md)

Auth scheme that applies to all the tool in the toolset.

###### description?

`string`

Description of the toolset. Optional.

###### lazyLoadSpec?

`boolean`

If true, the spec will be loaded lazily when needed. Otherwise, the spec will be loaded immediately and the tools will be generated during initialization.

###### name?

`string`

Name of the toolset. Optional.

###### serviceAccountJson?

`string`

The service account config as a json string. Required if not using default service credential. Used for creating the API Hub client and fetching API Specs from API Hub.

#### Returns

`APIHubToolset`

## Methods

### getTool()

> **getTool**(`name`): `undefined` \| [`RestApiTool`](../../../openapi-tool/openapi_spec_parser/RestApiTool/classes/RestApiTool.md)

Defined in: [src/tools/apihub-tool/APIHubToolset.ts:120](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/APIHubToolset.ts#L120)

Retrieves a specific tool by its name.

Example:
```typescript
const apihubTool = apihubToolset.getTool('my_tool');
```

#### Parameters

##### name

`string`

The name of the tool to retrieve.

#### Returns

`undefined` \| [`RestApiTool`](../../../openapi-tool/openapi_spec_parser/RestApiTool/classes/RestApiTool.md)

The tool with the given name, or undefined if no such tool exists.

***

### getTools()

> **getTools**(): [`RestApiTool`](../../../openapi-tool/openapi_spec_parser/RestApiTool/classes/RestApiTool.md)[]

Defined in: [src/tools/apihub-tool/APIHubToolset.ts:133](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/APIHubToolset.ts#L133)

Retrieves all available tools.

#### Returns

[`RestApiTool`](../../../openapi-tool/openapi_spec_parser/RestApiTool/classes/RestApiTool.md)[]

A list of all available RestApiTool objects.
