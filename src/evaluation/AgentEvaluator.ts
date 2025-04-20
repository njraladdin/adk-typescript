// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { ResponseEvaluator, ResponseEvalResult } from './response_evaluator';
import { TrajectoryEvaluator, TrajectoryEvalResult } from './trajectory_evaluator';
import { EvalEntry } from './EvaluationGenerator';

// TypeScript interface for agent-level evaluation result
export interface AgentEvalResult {
  responseResults: ResponseEvalResult[];
  trajectoryResults: TrajectoryEvalResult[];
  overallScore: number;
  [key: string]: any;
}

export interface EvaluationParams {
  agentModulePath: string;
  evalDatasetFilePathOrDir: string;
  numRuns: number;
  initialSessionFile?: string;
  agentName?: string;
}

export interface EvaluationResult {
  success: boolean;
  // Add other properties as needed
}

export class AgentEvaluator {
  /**
   * Evaluates agent performance at a high level, combining response and trajectory evaluation.
   * @param evalData Array of evaluation entries
   * @returns Agent-level evaluation result
   */
  static evaluateAgent(evalData: EvalEntry[]): AgentEvalResult {
    const responseResults = ResponseEvaluator.evaluateResponses(evalData);
    const trajectoryResults = TrajectoryEvaluator.evaluateTrajectories(evalData);
    // Simple overall score: average of all scores
    const allScores = [
      ...responseResults.map((r: ResponseEvalResult) => r.score),
      ...trajectoryResults.map((t: TrajectoryEvalResult) => t.score)
    ];
    const overallScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
    return {
      responseResults,
      trajectoryResults,
      overallScore
    };
  }

  /**
   * Evaluates an agent against a test dataset
   * @param params Evaluation parameters
   * @returns Array of evaluation results
   */
  static async evaluate(params: EvaluationParams): Promise<EvaluationResult[]> {
    // Implementation will go here
    // This is a placeholder implementation
    return Array(params.numRuns).fill({ success: true });
  }
} 