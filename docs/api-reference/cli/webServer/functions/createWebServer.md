[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [cli/webServer](../README.md) / createWebServer

# Function: createWebServer()

> **createWebServer**(`params`): `object`

Defined in: [src/cli/webServer.ts:137](https://github.com/njraladdin/adk-typescript/blob/main/src/cli/webServer.ts#L137)

Creates a web server for agents

## Parameters

### params

Configuration parameters

#### agentDir

`string`

Directory containing agent modules

#### allowOrigins

`string`[]

Allowed origins for CORS

#### port

`number`

Port to run the server on

## Returns

`object`

Object containing Express app and HTTP server

### app

> **app**: `Express`

### server

> **server**: `Server`
