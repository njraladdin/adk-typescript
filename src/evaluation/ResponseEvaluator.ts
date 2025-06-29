import { EvalConstants } from './EvaluationConstants';
import { EvalEntry } from './EvaluationGenerator';
import { Evaluator, EvalStatus, EvaluationResult, PerInvocationResult } from './Evaluator';
import { Invocation, IntermediateData } from './EvalCase';
import { Content, FunctionCall } from '../models/types';

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
export class ResponseEvaluator extends Evaluator {
  private threshold: number;
  private metricName: string;

  constructor(threshold: number, metricName: string) {
    super();
    if (metricName === 'response_evaluation_score') {
      this.metricName = MetricPromptTemplateExamples.Pointwise.COHERENCE;
    } else if (metricName === 'response_match_score') {
      this.metricName = 'rouge_1';
    } else {
      throw new Error(`\`${metricName}\` is not supported.`);
    }
    this.threshold = threshold;
  }

  /**
   * Returns EvaluationResult after performing evaluations using actual and expected invocations.
   */
  evaluateInvocations(
    actualInvocations: Invocation[],
    expectedInvocations: Invocation[]
  ): EvaluationResult {
    let totalScore = 0.0;
    let numInvocations = 0;
    const perInvocationResults: PerInvocationResult[] = [];

    for (let i = 0; i < Math.min(actualInvocations.length, expectedInvocations.length); i++) {
      const actual = actualInvocations[i];
      const expected = expectedInvocations[i];

      const prompt = this.getText(expected.userContent);
      const reference = this.getText(expected.finalResponse);
      const response = this.getText(actual.finalResponse);
      const actualToolUse = this.getToolUseTrajectory(actual.intermediateData);
      const referenceTrajectory = this.getToolUseTrajectory(expected.intermediateData);

      const evalCase = {
        prompt,
        reference,
        response,
        actual_tool_use: actualToolUse,
        reference_trajectory: referenceTrajectory,
      };

      // Use synchronous version for the new implementation
      const evalCaseResult = ResponseEvaluator._performEvalSync(
        [evalCase],
        [this.metricName]
      );
      const score = this.getScore(evalCaseResult);

      perInvocationResults.push({
        actualInvocation: actual,
        expectedInvocation: expected,
        score,
        evalStatus: this.getEvalStatus(score),
      });

      totalScore += score;
      numInvocations += 1;
    }

    if (perInvocationResults.length > 0) {
      const overallScore = totalScore / numInvocations;
      return {
        overallScore,
        overallEvalStatus: this.getEvalStatus(overallScore),
        perInvocationResults,
      };
    }

    return {
      overallScore: undefined,
      overallEvalStatus: EvalStatus.NOT_EVALUATED,
      perInvocationResults: [],
    };
  }

  private getText(content?: Content): string {
    if (content && content.parts) {
      return content.parts
        .filter(p => p.text)
        .map(p => p.text)
        .join('\n');
    }
    return '';
  }

  private getToolUseTrajectory(intermediateData?: IntermediateData): Array<{ tool_name: string; tool_input: Record<string, any> }> {
    const toolUseTrajectory: Array<{ tool_name: string; tool_input: Record<string, any> }> = [];
    if (!intermediateData) {
      return toolUseTrajectory;
    }

    for (const functionCall of intermediateData.toolUses) {
      toolUseTrajectory.push({
        tool_name: functionCall.name,
        tool_input: functionCall.args || {},
      });
    }

    return toolUseTrajectory;
  }

  private getScore(evalResult: EvaluationTaskResult): number {
    return evalResult.summary_metrics[`${this.metricName}/mean`] || 0;
  }

  private getEvalStatus(score: number): EvalStatus {
    return score >= this.threshold ? EvalStatus.PASSED : EvalStatus.FAILED;
  }

  /**
   * Evaluates a list of agent responses against references.
   * @deprecated This method has been deprecated and will be removed soon. Please use evaluateInvocations instead.
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
   * @deprecated This method has been deprecated and will be removed soon. Please use evaluateInvocations instead.
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
   * Performs evaluation on the dataset using specified metrics (synchronous version)
   * @param dataset The evaluation dataset
   * @param metrics The metrics to evaluate
   * @returns Evaluation results
   */
  private static _performEvalSync(
    dataset: EvalDatasetEntry[],
    metrics: string[]
  ): EvaluationTaskResult {
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
   * Performs evaluation on the dataset using specified metrics
   * @param dataset The evaluation dataset
   * @param metrics The metrics to evaluate
   * @returns Evaluation results
   */
  private static async _performEval(
    dataset: EvalDatasetEntry[],
    metrics: string[]
  ): Promise<EvaluationTaskResult> {
    return ResponseEvaluator._performEvalSync(dataset, metrics);
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