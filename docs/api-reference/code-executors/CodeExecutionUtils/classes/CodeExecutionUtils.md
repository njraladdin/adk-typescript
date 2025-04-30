[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [code-executors/CodeExecutionUtils](../README.md) / CodeExecutionUtils

# Class: CodeExecutionUtils

Defined in: [src/code-executors/CodeExecutionUtils.ts:82](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutionUtils.ts#L82)

Utility functions for code execution.

## Constructors

### Constructor

> **new CodeExecutionUtils**(): `CodeExecutionUtils`

#### Returns

`CodeExecutionUtils`

## Methods

### buildCodeExecutionResultPart()

> `static` **buildCodeExecutionResultPart**(`codeExecutionResult`): [`Part`](../../../models/types/interfaces/Part.md)

Defined in: [src/code-executors/CodeExecutionUtils.ts:189](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutionUtils.ts#L189)

Builds the code execution result part from the code execution result.

#### Parameters

##### codeExecutionResult

[`CodeExecutionResult`](../interfaces/CodeExecutionResult.md)

The code execution result.

#### Returns

[`Part`](../../../models/types/interfaces/Part.md)

The constructed code execution result part.

***

### buildExecutableCodePart()

> `static` **buildExecutableCodePart**(`code`): `ExecutableCodePart`

Defined in: [src/code-executors/CodeExecutionUtils.ts:174](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutionUtils.ts#L174)

Builds an executable code part with code string.

#### Parameters

##### code

`string`

The code string.

#### Returns

`ExecutableCodePart`

The constructed executable code part.

***

### convertCodeExecutionParts()

> `static` **convertCodeExecutionParts**(`content`, `codeBlockDelimiter`, `executionResultDelimiters`): `void`

Defined in: [src/code-executors/CodeExecutionUtils.ts:224](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutionUtils.ts#L224)

Converts the code execution parts to text parts in a Content.

#### Parameters

##### content

[`Content`](../../../models/types/interfaces/Content.md)

The mutable content to convert the code execution parts to text parts.

##### codeBlockDelimiter

\[`string`, `string`\]

The delimiter to format the code block.

##### executionResultDelimiters

\[`string`, `string`\]

The delimiter to format the code execution result.

#### Returns

`void`

***

### extractCodeAndTruncateContent()

> `static` **extractCodeAndTruncateContent**(`content`, `codeBlockDelimiters`): `undefined` \| `string`

Defined in: [src/code-executors/CodeExecutionUtils.ts:112](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutionUtils.ts#L112)

Extracts the first code block from the content and truncate everything after it.

#### Parameters

##### content

[`Content`](../../../models/types/interfaces/Content.md)

The mutable content to extract the code from.

##### codeBlockDelimiters

\[`string`, `string`\][]

The list of the enclosing delimiters to identify the code blocks.

#### Returns

`undefined` \| `string`

The first code block if found, otherwise undefined.

***

### getEncodedFileContent()

> `static` **getEncodedFileContent**(`data`): `string`

Defined in: [src/code-executors/CodeExecutionUtils.ts:89](https://github.com/njraladdin/adk-typescript/blob/main/src/code-executors/CodeExecutionUtils.ts#L89)

Gets the file content as a base64-encoded string.

#### Parameters

##### data

`Uint8Array`

The file content bytes.

#### Returns

`string`

The file content as a base64-encoded string.
