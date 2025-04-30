[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [planners/BasePlanner](../README.md) / BasePlanner

# Class: `abstract` BasePlanner

Defined in: [src/planners/BasePlanner.ts:26](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/BasePlanner.ts#L26)

Abstract base class for all planners.

The planner allows the agent to generate plans for the queries to guide its
action.

## Extended by

- [`BuiltInPlanner`](../../BuiltInPlanner/classes/BuiltInPlanner.md)
- [`PlanReActPlanner`](../../PlanReActPlanner/classes/PlanReActPlanner.md)

## Constructors

### Constructor

> **new BasePlanner**(): `BasePlanner`

#### Returns

`BasePlanner`

## Methods

### buildPlanningInstruction()

> `abstract` **buildPlanningInstruction**(`readonlyContext`, `llmRequest`): `undefined` \| `string`

Defined in: [src/planners/BasePlanner.ts:34](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/BasePlanner.ts#L34)

Builds the system instruction to be appended to the LLM request for planning.

#### Parameters

##### readonlyContext

[`ReadonlyContext`](../../../agents/ReadonlyContext/classes/ReadonlyContext.md)

The readonly context of the invocation.

##### llmRequest

[`LlmRequest`](../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request. Readonly.

#### Returns

`undefined` \| `string`

The planning system instruction, or undefined if no instruction is needed.

***

### processPlanningResponse()

> `abstract` **processPlanningResponse**(`callbackContext`, `responseParts`): `undefined` \| [`Part`](../../../models/types/interfaces/Part.md)[]

Defined in: [src/planners/BasePlanner.ts:46](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/BasePlanner.ts#L46)

Processes the LLM response for planning.

#### Parameters

##### callbackContext

[`CallbackContext`](../../../agents/CallbackContext/classes/CallbackContext.md)

The callback context of the invocation.

##### responseParts

[`Part`](../../../models/types/interfaces/Part.md)[]

The LLM response parts. Readonly.

#### Returns

`undefined` \| [`Part`](../../../models/types/interfaces/Part.md)[]

The processed response parts, or undefined if no processing is needed.
