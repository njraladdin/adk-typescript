[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [events/EventActions](../README.md) / EventActions

# Class: EventActions

Defined in: [src/events/EventActions.ts:20](https://github.com/njraladdin/adk-typescript/blob/main/src/events/EventActions.ts#L20)

Represents the actions attached to an event.

## Constructors

### Constructor

> **new EventActions**(`params`): `EventActions`

Defined in: [src/events/EventActions.ts:56](https://github.com/njraladdin/adk-typescript/blob/main/src/events/EventActions.ts#L56)

#### Parameters

##### params

`Partial`\<`EventActions`\> = `{}`

#### Returns

`EventActions`

## Properties

### artifactDelta

> **artifactDelta**: `Record`\<`string`, `number`\> = `{}`

Defined in: [src/events/EventActions.ts:36](https://github.com/njraladdin/adk-typescript/blob/main/src/events/EventActions.ts#L36)

Indicates that the event is updating an artifact. key is the filename,
value is the version.

***

### escalate?

> `optional` **escalate**: `boolean`

Defined in: [src/events/EventActions.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/events/EventActions.ts#L46)

The agent is escalating to a higher level agent.

***

### requestedAuthConfigs

> **requestedAuthConfigs**: `Map`\<`string`, [`AuthConfig`](../../../auth/AuthConfig/interfaces/AuthConfig.md)\>

Defined in: [src/events/EventActions.ts:54](https://github.com/njraladdin/adk-typescript/blob/main/src/events/EventActions.ts#L54)

Will only be set by a tool response indicating tool request euc.
Map key is the function call id since one function call response (from model)
could correspond to multiple function calls.
Map value is the required auth config.

***

### skipSummarization?

> `optional` **skipSummarization**: `boolean`

Defined in: [src/events/EventActions.ts:25](https://github.com/njraladdin/adk-typescript/blob/main/src/events/EventActions.ts#L25)

If true, it won't call model to summarize function response.
Only used for function_response event.

***

### stateDelta

> **stateDelta**: `Record`\<`string`, `any`\> = `{}`

Defined in: [src/events/EventActions.ts:30](https://github.com/njraladdin/adk-typescript/blob/main/src/events/EventActions.ts#L30)

Indicates that the event is updating the state with the given delta.

***

### transferToAgent?

> `optional` **transferToAgent**: `string`

Defined in: [src/events/EventActions.ts:41](https://github.com/njraladdin/adk-typescript/blob/main/src/events/EventActions.ts#L41)

If set, the event transfers to the specified agent.
