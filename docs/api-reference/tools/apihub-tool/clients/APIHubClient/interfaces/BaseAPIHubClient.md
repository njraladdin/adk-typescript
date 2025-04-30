[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../../../README.md)

***

[ADK TypeScript API Reference](../../../../../modules.md) / [tools/apihub-tool/clients/APIHubClient](../README.md) / BaseAPIHubClient

# Interface: BaseAPIHubClient

Defined in: [src/tools/apihub-tool/clients/APIHubClient.ts:8](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/APIHubClient.ts#L8)

Base interface for API Hub clients

## Methods

### getSpecContent()

> **getSpecContent**(`resourceName`): `Promise`\<`string`\>

Defined in: [src/tools/apihub-tool/clients/APIHubClient.ts:14](https://github.com/njraladdin/adk-typescript/blob/main/src/tools/apihub-tool/clients/APIHubClient.ts#L14)

From a given resource name, get the spec in the API Hub.

#### Parameters

##### resourceName

`string`

The resource name

#### Returns

`Promise`\<`string`\>

The spec content as a string
