[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [evaluation/AgentEvaluator](../README.md) / AgentEvaluator

# Class: AgentEvaluator

Defined in: [src/evaluation/AgentEvaluator.ts:86](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/AgentEvaluator.ts#L86)

An evaluator for Agents, mainly intended for helping with test cases

## Constructors

### Constructor

> **new AgentEvaluator**(): `AgentEvaluator`

#### Returns

`AgentEvaluator`

## Methods

### evaluate()

> `static` **evaluate**(`params`): `Promise`\<[`EvaluationResult`](../interfaces/EvaluationResult.md)[]\>

Defined in: [src/evaluation/AgentEvaluator.ts:114](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/AgentEvaluator.ts#L114)

Evaluates an Agent given eval data

#### Parameters

##### params

[`EvaluationParams`](../interfaces/EvaluationParams.md)

Evaluation parameters

#### Returns

`Promise`\<[`EvaluationResult`](../interfaces/EvaluationResult.md)[]\>

Array of evaluation results

***

### findConfigForTestFile()

> `static` **findConfigForTestFile**(`testFile`): [`EvaluationCriteria`](../interfaces/EvaluationCriteria.md)

Defined in: [src/evaluation/AgentEvaluator.ts:92](https://github.com/njraladdin/adk-typescript/blob/main/src/evaluation/AgentEvaluator.ts#L92)

Find the test_config.json file in the same folder as the test file

#### Parameters

##### testFile

`string`

Path to the test file

#### Returns

[`EvaluationCriteria`](../interfaces/EvaluationCriteria.md)

Evaluation criteria defined in the config or defaults
