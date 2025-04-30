[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/apihub-tool/clients/APIHubClient](../README.md) / APIHubClient

# Class: APIHubClient

Defined in: [src/tools/apihub-tool/clients/APIHubClient.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/APIHubClient.ts#L20)

Client for interacting with the API Hub service

## Implements

- [`BaseAPIHubClient`](../interfaces/BaseAPIHubClient.md)

## Constructors

### Constructor

> **new APIHubClient**(`params`): `APIHubClient`

Defined in: [src/tools/apihub-tool/clients/APIHubClient.ts:36](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/APIHubClient.ts#L36)

Initializes the APIHubClient.

You must set either accessToken or serviceAccountJson. This
credential is used for sending request to API Hub API.

#### Parameters

##### params

Configuration parameters

###### accessToken?

`string`

Google Access token. Generate with gcloud cli `gcloud auth print-access-token`. Useful for local testing.

###### serviceAccountJson?

`string`

The service account configuration as a JSON string. Required if not using default service credential.

#### Returns

`APIHubClient`

## Methods

### getApi()

> **getApi**(`apiResourceName`): `Promise`\<`any`\>

Defined in: [src/tools/apihub-tool/clients/APIHubClient.ts:120](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/APIHubClient.ts#L120)

Get API detail by API name.

#### Parameters

##### apiResourceName

`string`

Resource name of this API, like projects/xxx/locations/us-central1/apis/apiname

#### Returns

`Promise`\<`any`\>

An API and details

***

### getApiVersion()

> **getApiVersion**(`apiVersionName`): `Promise`\<`any`\>

Defined in: [src/tools/apihub-tool/clients/APIHubClient.ts:140](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/APIHubClient.ts#L140)

Gets details of a specific API version.

#### Parameters

##### apiVersionName

`string`

The resource name of the API version.

#### Returns

`Promise`\<`any`\>

The API version details

***

### getSpecContent()

> **getSpecContent**(`path`): `Promise`\<`string`\>

Defined in: [src/tools/apihub-tool/clients/APIHubClient.ts:60](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/APIHubClient.ts#L60)

From a given path, get the first spec available in the API Hub.

- If path includes /apis/apiname, get the first spec of that API
- If path includes /apis/apiname/versions/versionname, get the first spec of that API Version
- If path includes /apis/apiname/versions/versionname/specs/specname, return that spec

Path can be resource name (projects/xxx/locations/us-central1/apis/apiname),
and URL from the UI (https://console.cloud.google.com/apigee/api-hub/apis/apiname?project=xxx)

#### Parameters

##### path

`string`

The path to the API, API Version, or API Spec.

#### Returns

`Promise`\<`string`\>

The content of the first spec available in the API Hub.

#### Implementation of

[`BaseAPIHubClient`](../interfaces/BaseAPIHubClient.md).[`getSpecContent`](../interfaces/BaseAPIHubClient.md#getspeccontent)

***

### listApis()

> **listApis**(`project`, `location`): `Promise`\<`any`[]\>

Defined in: [src/tools/apihub-tool/clients/APIHubClient.ts:100](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/APIHubClient.ts#L100)

Lists all APIs in the specified project and location.

#### Parameters

##### project

`string`

The Google Cloud project name.

##### location

`string`

The location of the API Hub resources (e.g., 'us-central1').

#### Returns

`Promise`\<`any`[]\>

A list of API objects, or an empty list if an error occurs.
