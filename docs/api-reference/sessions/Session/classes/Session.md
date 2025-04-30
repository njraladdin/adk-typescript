[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [sessions/Session](../README.md) / Session

# Class: Session

Defined in: [src/sessions/Session.ts:34](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L34)

Represents a session for managing agents and their state.

## Constructors

### Constructor

> **new Session**(`options`): `Session`

Defined in: [src/sessions/Session.ts:64](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L64)

Creates a new session.

#### Parameters

##### options

[`SessionOptions`](../interfaces/SessionOptions.md) = `{}`

Options for the session

#### Returns

`Session`

## Methods

### addAgent()

> **addAgent**(`agent`): `void`

Defined in: [src/sessions/Session.ts:80](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L80)

Adds an agent to the session.

#### Parameters

##### agent

[`BaseAgent`](../../../agents/BaseAgent/classes/BaseAgent.md)

The agent to add

#### Returns

`void`

***

### addConversationHistory()

> **addConversationHistory**(`content`): `void`

Defined in: [src/sessions/Session.ts:99](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L99)

Adds content to the conversation history.

#### Parameters

##### content

[`Content`](../../../models/types/interfaces/Content.md)

The content to add

#### Returns

`void`

***

### addEvent()

> **addEvent**(`event`): `void`

Defined in: [src/sessions/Session.ts:117](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L117)

Adds an event to the session.

#### Parameters

##### event

[`Event`](../../../events/Event/classes/Event.md)

The event to add

#### Returns

`void`

***

### getAgent()

> **getAgent**(`name`): `undefined` \| [`BaseAgent`](../../../agents/BaseAgent/classes/BaseAgent.md)

Defined in: [src/sessions/Session.ts:90](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L90)

Gets an agent from the session.

#### Parameters

##### name

`string`

The name of the agent

#### Returns

`undefined` \| [`BaseAgent`](../../../agents/BaseAgent/classes/BaseAgent.md)

The agent, or undefined if not found

***

### getConversationHistory()

> **getConversationHistory**(): [`Content`](../../../models/types/interfaces/Content.md)[]

Defined in: [src/sessions/Session.ts:108](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L108)

Gets the conversation history.

#### Returns

[`Content`](../../../models/types/interfaces/Content.md)[]

The conversation history

## Properties

### agents

> **agents**: `Map`\<`string`, [`BaseAgent`](../../../agents/BaseAgent/classes/BaseAgent.md)\>

Defined in: [src/sessions/Session.ts:45](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L45)

The agents in the session - directly accessible as public property

***

### appName

> **appName**: `string`

Defined in: [src/sessions/Session.ts:39](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L39)

The app name that owns the session

***

### events

> **events**: [`Event`](../../../events/Event/classes/Event.md)[] = `[]`

Defined in: [src/sessions/Session.ts:48](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L48)

The events of the session

***

### id

> **id**: `string`

Defined in: [src/sessions/Session.ts:36](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L36)

The ID of the session

***

### lastUpdateTime

> **lastUpdateTime**: `number` = `0`

Defined in: [src/sessions/Session.ts:57](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L57)

The last update time of the session

***

### state

> **state**: [`State`](../../State/classes/State.md)

Defined in: [src/sessions/Session.ts:54](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L54)

The state of the session

***

### userId

> **userId**: `string`

Defined in: [src/sessions/Session.ts:42](https://github.com/njraladdin/adk-typescript/blob/main/src/sessions/Session.ts#L42)

The user ID that owns the session
