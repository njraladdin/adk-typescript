 

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';

// Import evaluation modules (assume these exist in src/evaluation/)
import { EvaluationGenerator } from '../evaluation/EvaluationGenerator';
import { ResponseEvaluator } from '../evaluation/ResponseEvaluator';
import { TrajectoryEvaluator } from '../evaluation/TrajectoryEvaluator';

// Types for agent and session (assume these exist)
import type { LlmAgent } from '../agents/LlmAgent';

// --- Enums & Data Models ---
export enum EvalStatus {
  PASSED = 1,
  FAILED = 2,
  NOT_EVALUATED = 3,
}

export interface EvalMetric {
  metricName: string;
  threshold: number;
}

export interface EvalMetricResult {
  score?: number;
  evalStatus: EvalStatus;
}

export interface EvalResult {
  evalSetFile: string;
  evalId: string;
  finalEvalStatus: EvalStatus;
  evalMetricResults: Array<[EvalMetric, EvalMetricResult]>;
  sessionId: string;
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
export async function* runEvals({
  evalSetToEvals,
  rootAgent,
  resetFunc,
  evalMetrics,
  sessionService,
  artifactService,
  printDetailedResults = false,
}: {
  evalSetToEvals: Record<string, string[]>;
  rootAgent: LlmAgent;
  resetFunc?: any;
  evalMetrics: EvalMetric[];
  sessionService?: any;
  artifactService?: any;
  printDetailedResults?: boolean;
}): AsyncGenerator<EvalResult, void, unknown> {
  for (const [evalSetFile, evalsToRun] of Object.entries(evalSetToEvals)) {
    const evalItems = JSON.parse(fs.readFileSync(evalSetFile, 'utf-8'));
    if (!evalItems || evalItems.length === 0) {
      throw new Error(`No eval data found in eval set file: ${evalSetFile}`);
    }
    for (const evalItem of evalItems) {
      const evalName = evalItem['name'];
      const evalData = evalItem['data'];
      const initialSession = evalItem['initial_session'] || {};
      if (evalsToRun.length > 0 && !evalsToRun.includes(evalName)) {
        continue;
      }
      try {
        console.log(`Running Eval: ${evalSetFile}:${evalName}`);
        const sessionId = `${EVAL_SESSION_ID_PREFIX}${uuidv4()}`;
        const scrapeResult = await EvaluationGenerator._processQueryWithRootAgent(
          evalData,
          rootAgent,
          resetFunc,
          initialSession,
          sessionId,
          sessionService,
          artifactService
        );
        const evalMetricResults: Array<[EvalMetric, EvalMetricResult]> = [];
        for (const evalMetric of evalMetrics) {
          let evalMetricResult: EvalMetricResult | undefined = undefined;
          if (evalMetric.metricName === TOOL_TRAJECTORY_SCORE_KEY) {
            const trajectoryResults = TrajectoryEvaluator.evaluateTrajectories([scrapeResult]);
            const score = trajectoryResults[0][TOOL_TRAJECTORY_SCORE_KEY];
            evalMetricResult = getEvalMetricResult(evalMetric, score);
          } else if (evalMetric.metricName === RESPONSE_MATCH_SCORE_KEY) {
            const responseResults = ResponseEvaluator.evaluateResponses([scrapeResult]);
            const score = responseResults[0][RESPONSE_MATCH_SCORE_KEY];
            evalMetricResult = getEvalMetricResult(
              evalMetric,
              score['rouge_1/mean']
            );
          } else if (evalMetric.metricName === RESPONSE_EVALUATION_SCORE_KEY) {
            const responseResults = ResponseEvaluator.evaluateResponses([scrapeResult]);
            const score = responseResults[0][RESPONSE_EVALUATION_SCORE_KEY];
            evalMetricResult = getEvalMetricResult(
              evalMetric,
              score['coherence/mean']
            );
          } else {
            console.warn(`[33m${evalMetric.metricName} is not supported.[0m`);
            evalMetricResults.push([
              evalMetric,
              { score: undefined, evalStatus: EvalStatus.NOT_EVALUATED },
            ]);
            continue;
          }
          evalMetricResults.push([
            evalMetric,
            evalMetricResult!,
          ]);
          printEvalMetricResult(evalMetric, evalMetricResult!);
        }
        // Determine final eval status
        let finalEvalStatus = EvalStatus.NOT_EVALUATED;
        for (const [, result] of evalMetricResults) {
          if (result.evalStatus === EvalStatus.PASSED) {
            finalEvalStatus = EvalStatus.PASSED;
          } else if (result.evalStatus === EvalStatus.NOT_EVALUATED) {
            continue;
          } else if (result.evalStatus === EvalStatus.FAILED) {
            finalEvalStatus = EvalStatus.FAILED;
            break;
          } else {
            throw new Error('Unknown eval status.');
          }
        }
        yield {
          evalSetFile,
          evalId: evalName,
          finalEvalStatus,
          evalMetricResults,
          sessionId,
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
  return { score, evalStatus };
}

function printEvalMetricResult(evalMetric: EvalMetric, evalMetricResult: EvalMetricResult) {
  console.log(
    `Metric: ${evalMetric.metricName}\tStatus: ${EvalStatus[evalMetricResult.evalStatus]}\tScore: ${evalMetricResult.score}\tThreshold: ${evalMetric.threshold}`
  );
} 