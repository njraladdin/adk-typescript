[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [planners/BuiltInPlanner](../README.md) / BuiltInPlanner

# Class: BuiltInPlanner

Defined in: [src/planners/BuiltInPlanner.ts:24](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/BuiltInPlanner.ts#L24)

The built-in planner that uses model's built-in thinking features.

## Extends

- [`BasePlanner`](../../BasePlanner/classes/BasePlanner.md)

## Constructors

### Constructor

> **new BuiltInPlanner**(`thinkingConfig`): `BuiltInPlanner`

Defined in: [src/planners/BuiltInPlanner.ts:37](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/BuiltInPlanner.ts#L37)

Initializes the built-in planner.

#### Parameters

##### thinkingConfig

[`ThinkingConfig`](../../../models/types/interfaces/ThinkingConfig.md)

Config for model built-in thinking features. An error
will be returned if this field is set for models that don't support thinking.

#### Returns

`BuiltInPlanner`

#### Overrides

[`BasePlanner`](../../BasePlanner/classes/BasePlanner.md).[`constructor`](../../BasePlanner/classes/BasePlanner.md#constructor)

## Methods

### applyThinkingConfig()

> **applyThinkingConfig**(`llmRequest`): `void`

Defined in: [src/planners/BuiltInPlanner.ts:47](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/BuiltInPlanner.ts#L47)

Applies the thinking config to the LLM request.

#### Parameters

##### llmRequest

[`LlmRequest`](../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request to apply the thinking config to.

#### Returns

`void`

***

### buildPlanningInstruction()

> **buildPlanningInstruction**(`readonlyContext`, `llmRequest`): `undefined` \| `string`

Defined in: [src/planners/BuiltInPlanner.ts:56](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/BuiltInPlanner.ts#L56)

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

#### Overrides

[`BasePlanner`](../../BasePlanner/classes/BasePlanner.md).[`buildPlanningInstruction`](../../BasePlanner/classes/BasePlanner.md#buildplanninginstruction)

***

### processPlanningResponse()

> **processPlanningResponse**(`callbackContext`, `responseParts`): `undefined` \| [`Part`](../../../models/types/interfaces/Part.md)[]

Defined in: [src/planners/BuiltInPlanner.ts:66](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/BuiltInPlanner.ts#L66)

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

#### Overrides

[`BasePlanner`](../../BasePlanner/classes/BasePlanner.md).[`processPlanningResponse`](../../BasePlanner/classes/BasePlanner.md#processplanningresponse)

## Properties

### thinkingConfig

> **thinkingConfig**: [`ThinkingConfig`](../../../models/types/interfaces/ThinkingConfig.md)

Defined in: [src/planners/BuiltInPlanner.ts:29](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/BuiltInPlanner.ts#L29)

Config for model built-in thinking features. An error will be returned if this
field is set for models that don't support thinking.
