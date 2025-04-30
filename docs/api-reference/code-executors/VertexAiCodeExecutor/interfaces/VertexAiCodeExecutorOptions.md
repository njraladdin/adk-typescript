[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [code-executors/VertexAiCodeExecutor](../README.md) / VertexAiCodeExecutorOptions

# Interface: VertexAiCodeExecutorOptions

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:123](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L123)

Options for initializing a VertexAiCodeExecutor

## Properties

### codeBlockDelimiters?

> `optional` **codeBlockDelimiters**: \[`string`, `string`\][]

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:142](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L142)

***

### errorRetryAttempts?

> `optional` **errorRetryAttempts**: `number`

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:141](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L141)

***

### executionResultDelimiters?

> `optional` **executionResultDelimiters**: \[`string`, `string`\]

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:143](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L143)

***

### extensionClient?

> `optional` **extensionClient**: `ExtensionFactory`

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:134](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L134)

The Vertex AI extension client to use

***

### optimizeDataFile?

> `optional` **optimizeDataFile**: `boolean`

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:140](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L140)

***

### resourceName?

> `optional` **resourceName**: `string`

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:129](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L129)

If set, load the existing resource name of the code interpreter extension
instead of creating a new one.
Format: projects/123/locations/us-central1/extensions/456

***

### stateful?

> `optional` **stateful**: `boolean`

Defined in: [src/code-executors/VertexAiCodeExecutor.ts:139](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/VertexAiCodeExecutor.ts#L139)

Other BaseCodeExecutor options
