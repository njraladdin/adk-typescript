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

import { EvalConstants } from './EvaluationConstants';
import { EvalEntry } from './EvaluationGenerator';

/**
 * Interface for evaluation result
 */
export interface ResponseEvalResult {
  query: string;
  response: string;
  reference?: string;
  score: number;
  reason?: string;
  [key: string]: any;
}

/**
 * Interface for dataset entry used in evaluation
 */
interface EvalDatasetEntry {
  prompt: string;
  response: string;
  reference?: string;
  reference_trajectory?: any[];
  [key: string]: any;
}

/**
 * Interface for metrics
 */
interface MetricPromptTemplateExamples {
  Pointwise: {
    COHERENCE: string;
  };
}

/**
 * Mock implementation of MetricPromptTemplateExamples
 * In a real implementation, this would be imported from a Vertex AI package
 */
const MetricPromptTemplateExamples: MetricPromptTemplateExamples = {
  Pointwise: {
    COHERENCE: 'coherence'
  }
};

/**
 * Interface for evaluation task results
 */
interface EvaluationTaskResult {
  summary_metrics: Record<string, number>;
  metrics_table: any[];
}

/**
 * Interface for evaluation criteria
 */
export interface EvaluationCriteria {
  [key: string]: number | undefined;
}

/**
 * Runs response evaluation for agents
 */
export class ResponseEvaluator {
  /**
   * Evaluates a list of agent responses against references.
   * @param evalData Array of evaluation entries
   * @returns Array of evaluation results
   */
  static evaluateResponses(evalData: EvalEntry[]): ResponseEvalResult[] {
    return evalData.map(entry => {
      const query = entry[EvalConstants.QUERY] ?? '';
      const response = entry[EvalConstants.RESPONSE] ?? '';
      const reference = entry[EvalConstants.REFERENCE];
      
      // Simple exact match scoring - in a real implementation,
      // this would use more sophisticated metrics like ROUGE
      const score = response && reference && 
        ResponseEvaluator.calculateSimilarity(response, reference) || 0;
      
      const reason = score > 0.8 ? 'High similarity' : 
                    score > 0.5 ? 'Moderate similarity' : 'Low similarity';
      
      return { query, response, reference, score, reason };
    });
  }

  /**
   * Calculate similarity between two text strings
   * @param text1 First text
   * @param text2 Second text
   * @returns Similarity score between 0 and 1
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    // Simple implementation - in a real context, you would use
    // a sophisticated text similarity algorithm like ROUGE-1
    // This is just a placeholder that checks for rough similarity
    const normalize = (text: string): string[] => {
      return text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 0);
    };
    
    const words1 = normalize(text1);
    const words2 = normalize(text2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    const unionLength = new Set([...words1, ...words2]).size;
    
    // Calculate Jaccard similarity
    return commonWords.length / unionLength;
  }

  /**
   * Returns the value of requested evaluation metrics.
   * @param rawEvalDataset The dataset that will be evaluated
   * @param evaluationCriteria The evaluation criteria to use
   * @param printDetailedResults Whether to print detailed results
   * @returns Summary metrics
   */
  static async evaluate(
    rawEvalDataset: EvalEntry[][],
    evaluationCriteria: EvaluationCriteria,
    printDetailedResults: boolean = false
  ): Promise<Record<string, number>> {
    if (!rawEvalDataset || rawEvalDataset.length === 0) {
      throw new Error("The evaluation dataset is empty.");
    }

    const metrics = ResponseEvaluator._getMetrics(
      rawEvalDataset,
      Object.keys(evaluationCriteria)
    );

    // Flatten dataset for processing
    const flattenedQueries = rawEvalDataset.flat();
    
    // Convert to the format expected by the evaluation system
    const evalDataset = flattenedQueries.map(item => ({
      prompt: item.query,
      response: item.response || '',
      reference: item.reference,
      reference_trajectory: item.expected_tool_use
    }));

    // Perform evaluation
    const evalResult = await ResponseEvaluator._performEval(
      evalDataset,
      metrics
    );

    if (printDetailedResults) {
      ResponseEvaluator._printResults(evalResult);
    }
    
    return evalResult.summary_metrics;
  }

  /**
   * Determines which metrics to use based on dataset and criteria
   * @param rawEvalDataset The evaluation dataset
   * @param criteria The criteria to evaluate
   * @returns List of metrics to use
   */
  private static _getMetrics(
    rawEvalDataset: EvalEntry[][],
    criteria: string[]
  ): string[] {
    const metrics: string[] = [];
    const firstEntry = rawEvalDataset[0][0];
    
    if (
      criteria.includes("response_evaluation_score") &&
      "query" in firstEntry &&
      "expected_tool_use" in firstEntry
    ) {
      metrics.push(MetricPromptTemplateExamples.Pointwise.COHERENCE);
    }
    
    if (
      criteria.includes("response_match_score") &&
      "reference" in firstEntry
    ) {
      metrics.push("rouge_1");
    }
    
    return metrics;
  }

  /**
   * Performs evaluation on the dataset using specified metrics
   * @param dataset The evaluation dataset
   * @param metrics The metrics to evaluate
   * @returns Evaluation results
   */
  private static async _performEval(
    dataset: EvalDatasetEntry[],
    metrics: string[]
  ): Promise<EvaluationTaskResult> {
    // This is a simplified mock implementation
    // In a real implementation, this would call an external service
    // like Vertex AI Evaluation
    
    const summaryMetrics: Record<string, number> = {};
    const metricsTable: any[] = [];
    
    // Calculate values for each metric
    if (metrics.includes('coherence')) {
      // Simulate coherence scoring
      const coherenceScores = dataset.map((entry, index) => {
        // Simple coherence score based on response length and structure
        // In a real implementation, this would use an LLM or more sophisticated metrics
        const response = entry.response || '';
        const score = Math.min(0.5 + response.length / 200, 1.0);
        return {
          index,
          score,
          metric: 'coherence'
        };
      });
      
      // Calculate mean score
      const meanCoherence = coherenceScores.reduce((sum, entry) => sum + entry.score, 0) / 
                          (coherenceScores.length || 1);
      
      summaryMetrics['coherence/mean'] = meanCoherence;
      metricsTable.push(...coherenceScores);
    }
    
    if (metrics.includes('rouge_1')) {
      // Calculate ROUGE-1 scores for each entry
      const rougeScores = dataset.map((entry, index) => {
        const response = entry.response || '';
        const reference = entry.reference || '';
        const score = response && reference ? 
                     ResponseEvaluator.calculateSimilarity(response, reference) : 0;
        
        return {
          index,
          score,
          metric: 'rouge_1'
        };
      });
      
      // Calculate mean score
      const meanRouge = rougeScores.reduce((sum, entry) => sum + entry.score, 0) / 
                       (rougeScores.length || 1);
      
      summaryMetrics['rouge_1/mean'] = meanRouge;
      metricsTable.push(...rougeScores);
    }
    
    return {
      summary_metrics: summaryMetrics,
      metrics_table: metricsTable
    };
  }

  /**
   * Prints evaluation results to the console
   * @param evalResult Evaluation results
   */
  private static _printResults(evalResult: EvaluationTaskResult): void {
    console.log("Evaluation Summary Metrics:", evalResult.summary_metrics);
    console.table(evalResult.metrics_table);
  }
} 