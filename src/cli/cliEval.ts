import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';

// Import evaluation modules
import { EvaluationGenerator } from '../evaluation/EvaluationGenerator';
import { ResponseEvaluator } from '../evaluation/ResponseEvaluator';
import { TrajectoryEvaluator } from '../evaluation/TrajectoryEvaluator';
import { EvaluationResult, PerInvocationResult } from '../evaluation/Evaluator';
import { EvalStatus } from '../evaluation/Evaluator';

// Re-export EvalStatus for external use
export { EvalStatus } from '../evaluation/Evaluator';
import { EvalCase, Invocation } from '../evaluation/EvalCase';
import { BaseSessionService } from '../sessions/BaseSessionService';
import { BaseArtifactService } from '../artifacts/BaseArtifactService';

// Types for agent and session
import type { LlmAgent } from '../agents/LlmAgent';
import { SessionInterface as Session } from '../sessions/types';

// --- Data Models ---

/**
 * A metric used to evaluate a particular aspect of an eval case.
 */
export interface EvalMetric {
  /** The name of the metric. */
  metricName: string;
  /** A threshold value. Each metric decides how to interpret this threshold. */
  threshold: number;
}

/**
 * The actual computed score/value of a particular EvalMetric.
 */
export interface EvalMetricResult extends EvalMetric {
  score?: number;
  evalStatus: EvalStatus;
}

/**
 * Eval metric results per invocation.
 */
export interface EvalMetricResultPerInvocation {
  /** The actual invocation, usually obtained by inferencing the agent. */
  actualInvocation: Invocation;
  /** The expected invocation, usually the reference or golden invocation. */
  expectedInvocation: Invocation;
  /** Eval results for each applicable metric. */
  evalMetricResults: EvalMetricResult[];
}

/**
 * Case-level evaluation results.
 */
export interface EvalCaseResult {
  /** @deprecated This field is deprecated, use evalSetId instead. */
  evalSetFile: string;
  /** The eval set id. */
  evalSetId: string;
  /** The eval case id. */
  evalId: string;
  /** Final eval status for this eval case. */
  finalEvalStatus: EvalStatus;
  /** @deprecated This field is deprecated, use overallEvalMetricResults instead. */
  evalMetricResults: Array<[EvalMetric, EvalMetricResult]>;
  /** Overall result for each metric for the entire eval case. */
  overallEvalMetricResults: EvalMetricResult[];
  /** Result for each metric on a per invocation basis. */
  evalMetricResultPerInvocation: EvalMetricResultPerInvocation[];
  /** Session id of the session generated as result of inferencing/scraping stage of the eval. */
  sessionId: string;
  /** Session generated as result of inferencing/scraping stage of the eval. */
  sessionDetails?: Session;
  /** User id used during inferencing/scraping stage of the eval. */
  userId?: string;
}

export interface EvalSetResult {
  evalSetResultId: string;
  evalSetResultName: string;
  evalSetId: string;
  evalCaseResults: EvalCaseResult[];
  creationTimestamp: number;
}

// --- Constants ---
export const MISSING_EVAL_DEPENDENCIES_MESSAGE =
  'Eval module is not installed, please install via `npm install @google-cloud/aiplatform` or the appropriate package.';
export const TOOL_TRAJECTORY_SCORE_KEY = 'tool_trajectory_avg_score';
export const RESPONSE_MATCH_SCORE_KEY = 'response_match_score';
export const RESPONSE_EVALUATION_SCORE_KEY = 'response_evaluation_score';
export const EVAL_SESSION_ID_PREFIX = '___eval___session___';
export const DEFAULT_CRITERIA: Record<string, number> = {
  [TOOL_TRAJECTORY_SCORE_KEY]: 1.0,
  [RESPONSE_MATCH_SCORE_KEY]: 0.8,
};

// --- Helper Functions ---
function importFromPath(moduleName: string, filePath: string): any {
  // Dynamic import using require
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(filePath);
  return mod;
}

function getAgentModule(agentModuleFilePath: string): any {
  const filePath = path.join(agentModuleFilePath, '__init__.js');
  return importFromPath('agent', filePath);
}

export function getEvaluationCriteriaOrDefault(evalConfigFilePath?: string): Record<string, number> {
  if (evalConfigFilePath) {
    const configData = JSON.parse(fs.readFileSync(evalConfigFilePath, 'utf-8'));
    if ('criteria' in configData && typeof configData['criteria'] === 'object') {
      return configData['criteria'];
    } else {
      throw new Error(
        `Invalid format for test_config.json at ${evalConfigFilePath}. Expected a 'criteria' dictionary.`
      );
    }
  } else {
    console.info('No config file supplied. Using default criteria.');
    return DEFAULT_CRITERIA;
  }
}

export function getRootAgent(agentModuleFilePath: string): LlmAgent {
  const agentModule = getAgentModule(agentModuleFilePath);
  return agentModule.agent.rootAgent;
}

export function tryGetResetFunc(agentModuleFilePath: string): any {
  const agentModule = getAgentModule(agentModuleFilePath);
  return agentModule.agent.resetData || undefined;
}

export function parseAndGetEvalsToRun(evalSetFilePaths: string[]): Record<string, string[]> {
  const evalSetToEvals: Record<string, string[]> = {};
  for (const inputEvalSet of evalSetFilePaths) {
    let evalSetFile: string;
    let evals: string[] = [];
    if (inputEvalSet.includes(':')) {
      const [file, evalsStr] = inputEvalSet.split(':');
      evalSetFile = file;
      evals = evalsStr.split(',');
    } else {
      evalSetFile = inputEvalSet;
    }
    if (!(evalSetFile in evalSetToEvals)) {
      evalSetToEvals[evalSetFile] = [];
    }
    evalSetToEvals[evalSetFile].push(...evals);
  }
  return evalSetToEvals;
}

// --- Main Evaluation Logic ---

/**
 * Returns a stream of EvalCaseResult for each eval case that was evaluated.
 */
export async function* runEvals(
  evalCasesByEvalSetId: Record<string, EvalCase[]>,
  rootAgent: LlmAgent,
  resetFunc?: any,
  evalMetrics: EvalMetric[] = [],
  sessionService?: BaseSessionService,
  artifactService?: BaseArtifactService
): AsyncGenerator<EvalCaseResult, void, unknown> {
  
  for (const [evalSetId, evalCases] of Object.entries(evalCasesByEvalSetId)) {
    for (const evalCase of evalCases) {
      const evalName = evalCase.evalId;
      const initialSession = evalCase.sessionInput;
      const userId = initialSession?.userId || 'test_user_id';

      try {
        console.log(`Running Eval: ${evalSetId}:${evalName}`);
        const sessionId = `${EVAL_SESSION_ID_PREFIX}${uuidv4()}`;

        const inferenceResult = await EvaluationGenerator._generateInferencesFromRootAgent(
          evalCase.conversation,
          rootAgent,
          resetFunc,
          initialSession,
          sessionId,
          sessionService,
          artifactService
        );

        // Initialize the per-invocation metric results to an empty list.
        // We will fill this as we evaluate each metric.
        const evalMetricResultPerInvocation: EvalMetricResultPerInvocation[] = [];
        for (let i = 0; i < inferenceResult.length && i < evalCase.conversation.length; i++) {
          const actual = inferenceResult[i];
          const expected = evalCase.conversation[i];
          evalMetricResultPerInvocation.push({
            actualInvocation: actual,
            expectedInvocation: expected,
            evalMetricResults: [],
          });
        }

        const overallEvalMetricResults: EvalMetricResult[] = [];

        for (const evalMetric of evalMetrics) {
          if (evalMetric.metricName === TOOL_TRAJECTORY_SCORE_KEY) {
            const trajectoryEvaluator = new TrajectoryEvaluator(evalMetric.threshold);
            const evaluationResult = trajectoryEvaluator.evaluateInvocations(
              inferenceResult,
              evalCase.conversation
            );
            
            overallEvalMetricResults.push({
              metricName: evalMetric.metricName,
              threshold: evalMetric.threshold,
              score: evaluationResult.overallScore,
              evalStatus: evaluationResult.overallEvalStatus,
            });

            for (let index = 0; index < evaluationResult.perInvocationResults.length; index++) {
              const perInvocationResult = evaluationResult.perInvocationResults[index];
              if (index < evalMetricResultPerInvocation.length) {
                evalMetricResultPerInvocation[index].evalMetricResults.push({
                  metricName: evalMetric.metricName,
                  threshold: evalMetric.threshold,
                  score: perInvocationResult.score,
                  evalStatus: perInvocationResult.evalStatus,
                });
              }
            }
          } else {
            console.warn(`${evalMetric.metricName} is not supported.`);
          }
        }

        let finalEvalStatus = EvalStatus.NOT_EVALUATED;
        // Go over all the eval statuses and mark the final eval status as
        // passed if all of them pass, otherwise mark the final eval status to failed.
        for (const overallEvalMetricResult of overallEvalMetricResults) {
          const overallEvalStatus = overallEvalMetricResult.evalStatus;
          if (overallEvalStatus === EvalStatus.PASSED) {
            finalEvalStatus = EvalStatus.PASSED;
          } else if (overallEvalStatus === EvalStatus.NOT_EVALUATED) {
            continue;
          } else if (overallEvalStatus === EvalStatus.FAILED) {
            finalEvalStatus = EvalStatus.FAILED;
            break;
          } else {
            throw new Error('Unknown eval status.');
          }
        }

        yield {
          evalSetFile: evalSetId,
          evalSetId: evalSetId,
          evalId: evalName,
          finalEvalStatus: finalEvalStatus,
          evalMetricResults: [],
          overallEvalMetricResults: overallEvalMetricResults,
          evalMetricResultPerInvocation: evalMetricResultPerInvocation,
          sessionId: sessionId,
          userId: userId,
        };

        if (finalEvalStatus === EvalStatus.PASSED) {
          console.log('Result: ✅ Passed\n');
        } else {
          console.log('Result: ❌ Failed\n');
        }

      } catch (e: any) {
        console.error(`Error: ${e}`);
      }
    }
  }
}

function getEvalMetricResult(evalMetric: EvalMetric, score: number): EvalMetricResult {
  const evalStatus = score >= evalMetric.threshold ? EvalStatus.PASSED : EvalStatus.FAILED;
  return { 
    metricName: evalMetric.metricName,
    threshold: evalMetric.threshold,
    score, 
    evalStatus 
  };
} 