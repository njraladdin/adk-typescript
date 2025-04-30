[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [evaluation/TrajectoryEvaluator](../README.md) / TrajectoryEvaluator

# Class: TrajectoryEvaluator

Defined in: [src/evaluation/TrajectoryEvaluator.ts:57](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L57)

Evaluates tool use trajectories for accuracy

## Constructors

### Constructor

> **new TrajectoryEvaluator**(): `TrajectoryEvaluator`

#### Returns

`TrajectoryEvaluator`

## Methods

### areToolsEqual()

> `static` **areToolsEqual**(`listA`, `listB`): `boolean`

Defined in: [src/evaluation/TrajectoryEvaluator.ts:163](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L163)

Check if two tool use lists are equal

#### Parameters

##### listA

`any`[]

First list of tools

##### listB

`any`[]

Second list of tools

#### Returns

`boolean`

True if the lists are equal, false otherwise

***

### evaluate()

> `static` **evaluate**(`evalDataset`, `printDetailedResults`): `number`

Defined in: [src/evaluation/TrajectoryEvaluator.ts:72](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L72)

Evaluates the mean tool use accuracy of the eval dataset.

Tool use accuracy is calculated by comparing the expected and actual tool
use trajectories. An exact match scores a 1, 0 otherwise. The final number
is an average of these individual scores.

Value range: [0, 1], where 0 means none of the tool use entries aligned,
and 1 would mean all of them aligned. Higher value is good.

#### Parameters

##### evalDataset

[`EvalEntry`](../../EvaluationGenerator/interfaces/EvalEntry.md)[][]

The dataset that will be evaluated

##### printDetailedResults

`boolean` = `false`

Prints detailed results on the console (default: false)

#### Returns

`number`

The mean tool use accuracy of the eval dataset

***

### ~~evaluateTrajectories()~~

> `static` **evaluateTrajectories**(`evalData`): [`TrajectoryEvalResult`](../interfaces/TrajectoryEvalResult.md)[]

Defined in: [src/evaluation/TrajectoryEvaluator.ts:230](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/TrajectoryEvaluator.ts#L230)

Evaluates a list of agent trajectories (tool use) against expected tool use.

#### Parameters

##### evalData

[`EvalEntry`](../../EvaluationGenerator/interfaces/EvalEntry.md)[]

Array of evaluation entries

#### Returns

[`TrajectoryEvalResult`](../interfaces/TrajectoryEvalResult.md)[]

Array of trajectory evaluation results

#### Deprecated

Use evaluate() instead for more comprehensive evaluation
