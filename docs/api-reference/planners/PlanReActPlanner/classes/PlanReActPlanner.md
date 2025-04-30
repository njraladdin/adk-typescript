[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [planners/PlanReActPlanner](../README.md) / PlanReActPlanner

# Class: PlanReActPlanner

Defined in: [src/planners/PlanReActPlanner.ts:34](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/PlanReActPlanner.ts#L34)

Plan-Re-Act planner that constrains the LLM response to generate a plan before any action/observation.

Note: this planner does not require the model to support built-in thinking
features or setting the thinking config.

## Extends

- [`BasePlanner`](../../BasePlanner/classes/BasePlanner.md)

## Constructors

### Constructor

> **new PlanReActPlanner**(): `PlanReActPlanner`

#### Returns

`PlanReActPlanner`

#### Inherited from

[`BasePlanner`](../../BasePlanner/classes/BasePlanner.md).[`constructor`](../../BasePlanner/classes/BasePlanner.md#constructor)

## Methods

### buildPlanningInstruction()

> **buildPlanningInstruction**(`readonlyContext`, `llmRequest`): `string`

Defined in: [src/planners/PlanReActPlanner.ts:38](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/PlanReActPlanner.ts#L38)

Builds the system instruction to be appended to the LLM request for planning.

#### Parameters

##### readonlyContext

[`ReadonlyContext`](../../../agents/ReadonlyContext/classes/ReadonlyContext.md)

The readonly context of the invocation.

##### llmRequest

[`LlmRequest`](../../../models/LlmRequest/classes/LlmRequest.md)

The LLM request. Readonly.

#### Returns

`string`

The planning system instruction, or undefined if no instruction is needed.

#### Overrides

[`BasePlanner`](../../BasePlanner/classes/BasePlanner.md).[`buildPlanningInstruction`](../../BasePlanner/classes/BasePlanner.md#buildplanninginstruction)

***

### processPlanningResponse()

> **processPlanningResponse**(`callbackContext`, `responseParts`): `undefined` \| [`Part`](../../../models/types/interfaces/Part.md)[]

Defined in: [src/planners/PlanReActPlanner.ts:48](https://github.com/njraladdin/adk-typescript/blob/main/src/planners/PlanReActPlanner.ts#L48)

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
