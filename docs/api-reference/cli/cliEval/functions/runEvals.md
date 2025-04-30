[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [cli/cliEval](../README.md) / runEvals

# Function: runEvals()

> **runEvals**(`__namedParameters`): `AsyncGenerator`\<[`EvalResult`](../interfaces/EvalResult.md), `void`, `unknown`\>

Defined in: [src/cli/cliEval.ts:126](https://github.com/njraladdin/adk-typescript/blob/main/src/cli/cliEval.ts#L126)

## Parameters

### \_\_namedParameters

#### artifactService?

`any`

#### evalMetrics

[`EvalMetric`](../interfaces/EvalMetric.md)[]

#### evalSetToEvals

`Record`\<`string`, `string`[]\>

#### printDetailedResults?

`boolean` = `false`

#### resetFunc?

`any`

#### rootAgent

[`LlmAgent`](../../../agents/LlmAgent/classes/LlmAgent.md)

#### sessionService?

`any`

## Returns

`AsyncGenerator`\<[`EvalResult`](../interfaces/EvalResult.md), `void`, `unknown`\>
