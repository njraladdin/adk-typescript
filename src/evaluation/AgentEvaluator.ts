import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EvaluationGenerator, EvalEntry } from './EvaluationGenerator';
import { ResponseEvaluator } from './ResponseEvaluator';
import { TrajectoryEvaluator } from './TrajectoryEvaluator';
import { BaseAgent } from '../agents/BaseAgent';
import { LlmAgent } from '../agents/LlmAgent';
import { InMemorySessionService } from '../sessions/InMemorySessionService';
import { InMemoryArtifactService } from '../artifacts/InMemoryArtifactService';
import { Runner } from '../runners';
import { Content, Part } from '../models/types';
import { EvalConstants } from './EvaluationConstants';

// Constants for default runs and evaluation criteria
const NUM_RUNS = 2;
const TOOL_TRAJECTORY_SCORE_KEY = "tool_trajectory_avg_score";
// This evaluation is not very stable.
// This is always optional unless explicitly specified.
const RESPONSE_EVALUATION_SCORE_KEY = "response_evaluation_score";
const RESPONSE_MATCH_SCORE_KEY = "response_match_score";

const ALLOWED_CRITERIA = [
  TOOL_TRAJECTORY_SCORE_KEY,
  RESPONSE_EVALUATION_SCORE_KEY,
  RESPONSE_MATCH_SCORE_KEY,
];

const QUERY_COLUMN = "query";
const REFERENCE_COLUMN = "reference";
const EXPECTED_TOOL_USE_COLUMN = "expected_tool_use";

const DEFAULT_CRITERIA: Record<string, number> = {
  [TOOL_TRAJECTORY_SCORE_KEY]: 1.0,  // 1-point scale; 1.0 is perfect.
  [RESPONSE_MATCH_SCORE_KEY]: 0.8,  // Rouge-1 text match; 0.8 is default.
};

/**
 * Load JSON data from a file
 * @param filePath Path to the JSON file
 * @returns Parsed JSON content
 */
function loadJson(filePath: string): any {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

/**
 * Interface for evaluation criteria
 */
export interface EvaluationCriteria {
  [TOOL_TRAJECTORY_SCORE_KEY]?: number;
  [RESPONSE_EVALUATION_SCORE_KEY]?: number;
  [RESPONSE_MATCH_SCORE_KEY]?: number;
  [key: string]: number | undefined;
}

/**
 * Interface for evaluation parameters with direct agent
 */
export interface EvaluationParams {
  agent: BaseAgent;  // The agent to evaluate - directly passed
  evalDatasetFilePathOrDir: string;
  numRuns?: number;
  agentName?: string;  // Optional name of sub-agent to evaluate
  initialSessionFile?: string;
  resetFunc?: () => void; // Optional function to reset agent state between runs
}

/**
 * Simple result object for backward compatibility with tests
 */
export interface EvaluationResult {
  success: boolean;
  [key: string]: any;
}

/**
 * An evaluator for Agents, mainly intended for helping with test cases
 */
export class AgentEvaluator {
  /**
   * Find the test_config.json file in the same folder as the test file
   * @param testFile Path to the test file
   * @returns Evaluation criteria defined in the config or defaults
   */
  static findConfigForTestFile(testFile: string): EvaluationCriteria {
    const testFolder = path.dirname(testFile);
    const configPath = path.join(testFolder, "test_config.json");
    
    if (fs.existsSync(configPath)) {
      const configData = loadJson(configPath);
      if ("criteria" in configData && typeof configData.criteria === "object") {
        return configData.criteria;
      } else {
        throw new Error(
          `Invalid format for test_config.json at ${configPath}. Expected a 'criteria' dictionary.`
        );
      }
    }
    return DEFAULT_CRITERIA;
  }

  /**
   * Evaluates an Agent given eval data
   * @param params Evaluation parameters
   * @returns Array of evaluation results
   */
  static async evaluate(params: EvaluationParams): Promise<EvaluationResult[]> {
    const {
      agent,
      evalDatasetFilePathOrDir,
      numRuns = NUM_RUNS,
      agentName,
      initialSessionFile,
      resetFunc
    } = params;

    let testFiles: string[] = [];
    
    // Determine if we're dealing with a directory or a single file
    if (fs.existsSync(evalDatasetFilePathOrDir) && 
        fs.lstatSync(evalDatasetFilePathOrDir).isDirectory()) {
      // Walk directory recursively to find .test.json files
      const walkDir = (dir: string): string[] => {
        let results: string[] = [];
        const list = fs.readdirSync(dir);
        
        for (const file of list) {
          const filePath = path.join(dir, file);
          const stat = fs.lstatSync(filePath);
          
          if (stat.isDirectory()) {
            // Recursively walk subdirectories
            results = results.concat(walkDir(filePath));
          } else if (file.endsWith('.test.json')) {
            results.push(filePath);
          }
        }
        
        return results;
      };
      
      testFiles = walkDir(evalDatasetFilePathOrDir);
    } else {
      testFiles = [evalDatasetFilePathOrDir];
    }

    // Load initial session state if provided
    let initialSessionState: Record<string, any> = {};
    if (initialSessionFile) {
      const fileContent = fs.readFileSync(initialSessionFile, 'utf8');
      initialSessionState = JSON.parse(fileContent).state || {};
    }

    // Process each test file
    for (const testFile of testFiles) {
      const dataset = AgentEvaluator._loadDataset(testFile)[0];
      const criteria = AgentEvaluator.findConfigForTestFile(testFile);

      AgentEvaluator._validateInput([dataset], criteria);

      // Use the provided agent directly
      let agentToEvaluate = agent;
      
      // If a specific sub-agent is requested by name
      if (agentName) {
        // First try to find it using the standard property
        if (agent.subAgents && Array.isArray(agent.subAgents)) {
          // Check sub-agents by their name property
          const subAgent = agent.subAgents.find(a => a.name === agentName);
          if (subAgent) {
            agentToEvaluate = subAgent;
          } else {
            console.log(`Couldn't find sub-agent with name '${agentName}' in subAgents array. Will try findAgent method if available.`);
          }
        }
      
        // If we still haven't found it, try the findAgent method if available
        if (agentToEvaluate === agent && agent.findAgent) {
          try {
            const foundAgent = agent.findAgent(agentName);
            if (foundAgent) {
              agentToEvaluate = foundAgent;
            }
          } catch (error) {
            console.log(`Error while finding agent '${agentName}': ${error}`);
          }
        }
        
        if (agentToEvaluate === agent) {
          console.log(`Could not find sub-agent '${agentName}'. Using the provided agent.`);
        } else {
          console.log(`Found and using sub-agent '${agentName}'.`);
        }
      }

      console.log("running agent with tools ", agentToEvaluate)
      const evaluationResponse = await AgentEvaluator._generateResponsesWithAgent(
        agentToEvaluate,
        [dataset],
        numRuns,
        resetFunc,
        { state: initialSessionState }
      );

      if (AgentEvaluator._responseEvaluationRequired(criteria, [dataset])) {
        await AgentEvaluator._evaluateResponseScores(
          evaluationResponse,
          criteria
        );
      }

      if (AgentEvaluator._trajectoryEvaluationRequired(criteria, [dataset])) {
        await AgentEvaluator._evaluateToolTrajectory(
          evaluationResponse,
          criteria
        );
      }
    }

    // For backward compatibility with tests
    return Array(numRuns).fill({ success: true });
  }

  /**
   * Load evaluation dataset from file or directory
   * @param inputData Path to file or directory containing test data
   * @returns Array of evaluation datasets
   */
  private static _loadDataset(
    inputData: string | string[] | EvalEntry[] | EvalEntry[][]
  ): EvalEntry[][] {
    const loadJsonFile = (filePath: string): EvalEntry[] => {
      const data = loadJson(filePath);
      if (!Array.isArray(data) || !data.every(d => typeof d === 'object')) {
        throw new Error(`${filePath} must contain a list of dictionaries.`);
      }
      return data;
    };

    if (typeof inputData === 'string') {
      if (fs.existsSync(inputData) && fs.lstatSync(inputData).isDirectory()) {
        const testFiles: string[] = [];
        const walkDir = (dir: string): string[] => {
          let results: string[] = [];
          const list = fs.readdirSync(dir);
          
          for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.lstatSync(filePath);
            
            if (stat.isDirectory()) {
              results = results.concat(walkDir(filePath));
            } else if (file.endsWith('.test.json')) {
              results.push(filePath);
            }
          }
          
          return results;
        };
        
        const files = walkDir(inputData);
        return files.map(f => loadJsonFile(f));
      } else if (fs.existsSync(inputData) && fs.lstatSync(inputData).isFile()) {
        return [loadJsonFile(inputData)];
      } else {
        throw new Error(`Input path ${inputData} is invalid.`);
      }
    } else if (Array.isArray(inputData)) {
      if (inputData.every(i => typeof i === 'string' && fs.existsSync(i))) {
        return (inputData as string[]).map(f => loadJsonFile(f));
      }
      throw new TypeError("Input list must contain valid file paths.");
    }
    throw new TypeError("Invalid input type for dataset loading.");
  }

  /**
   * Validates that the evaluation criteria align with the provided dataset
   * @param evalDataset The evaluation dataset to validate
   * @param criteria The evaluation criteria to validate against
   */
  private static _validateInput(
    evalDataset: EvalEntry[][],
    criteria: EvaluationCriteria
  ): void {
    if (!evalDataset || evalDataset.length === 0) {
      throw new Error("The evaluation dataset is None or empty.");
    }

    for (const key in criteria) {
      if (!ALLOWED_CRITERIA.includes(key)) {
        throw new Error(
          `Invalid criteria key: ${key}. Expected one of ${ALLOWED_CRITERIA.join(', ')}.`
        );
      }
    }

    if (!evalDataset) {
      throw new Error("The evaluation dataset is empty.");
    }
    
    const sample = evalDataset[0];
    const firstQuery = sample[0];

    if (!Array.isArray(sample) || typeof firstQuery !== 'object') {
      throw new Error(
        `Each evaluation dataset sample must be list of dictionary. But it's ${JSON.stringify(evalDataset)}`
      );
    }

    if (TOOL_TRAJECTORY_SCORE_KEY in criteria) {
      if (!(QUERY_COLUMN in firstQuery) || 
          !(EXPECTED_TOOL_USE_COLUMN in firstQuery)) {
        throw new Error(
          `Samples for ${TOOL_TRAJECTORY_SCORE_KEY} must include '${QUERY_COLUMN}' and '${EXPECTED_TOOL_USE_COLUMN}' keys. The sample is ${JSON.stringify(sample)}.`
        );
      }
    }

    if (RESPONSE_EVALUATION_SCORE_KEY in criteria) {
      if (!(QUERY_COLUMN in firstQuery)) {
        throw new Error(
          `Samples for ${RESPONSE_EVALUATION_SCORE_KEY} must include '${QUERY_COLUMN}' key. The sample is ${JSON.stringify(sample)}.`
        );
      }
    }

    if (RESPONSE_MATCH_SCORE_KEY in criteria) {
      if (!(QUERY_COLUMN in firstQuery) || 
          !(REFERENCE_COLUMN in firstQuery)) {
        throw new Error(
          `Samples for ${RESPONSE_MATCH_SCORE_KEY} must include '${QUERY_COLUMN}' and '${REFERENCE_COLUMN}' keys. The sample is ${JSON.stringify(sample)}.`
        );
      }
    }
  }

  /**
   * Infers evaluation criteria based on the provided dataset
   * @param evalDataset The evaluation dataset
   * @returns Inferred evaluation criteria
   */
  private static _getInferCriteria(evalDataset: EvalEntry[][]): EvaluationCriteria {
    const inferredCriteria: EvaluationCriteria = {};
    const sample = evalDataset[0][0];

    if (QUERY_COLUMN in sample && EXPECTED_TOOL_USE_COLUMN in sample) {
      inferredCriteria[TOOL_TRAJECTORY_SCORE_KEY] = DEFAULT_CRITERIA[TOOL_TRAJECTORY_SCORE_KEY];
    }

    if (QUERY_COLUMN in sample && REFERENCE_COLUMN in sample) {
      inferredCriteria[RESPONSE_MATCH_SCORE_KEY] = DEFAULT_CRITERIA[RESPONSE_MATCH_SCORE_KEY];
    }

    return inferredCriteria;
  }

  /**
   * Generates evaluation responses by directly using the agent
   * @param agent The agent to evaluate
   * @param evalDataset The evaluation dataset
   * @param numRuns Number of times to run evaluation
   * @param resetFunc Optional function to reset agent state between runs
   * @param initialSession Initial session data
   * @returns Array of evaluation responses
   */
  private static async _generateResponsesWithAgent(
    agent: BaseAgent,
    evalDataset: EvalEntry[][],
    numRuns: number,
    resetFunc?: () => void,
    initialSession: Record<string, any> = {}
  ): Promise<EvalEntry[][]> {
    const results: EvalEntry[][] = [];

    for (let i = 0; i < numRuns; i++) {
      const runResults: EvalEntry[] = [];
      
      for (const dataGroup of evalDataset) {
        // Initialize services once per conversation
        const sessionService = new InMemorySessionService();
        const artifactService = new InMemoryArtifactService();

        // Setup the session
        const appName = initialSession.appName || "EvaluationGenerator";
        const userId = initialSession.userId || "test_user_id";
        const sessionId = uuidv4();
        
        // Create a session for this conversation
        const session = sessionService.createSession({
          appName,
          userId,
          sessionId,
          state: initialSession.state || {}
        });
        
        // Reset agent state if reset function is provided
        if (resetFunc && typeof resetFunc === 'function') {
          resetFunc();
        }
        
        // Process each turn in the conversation using the same session
        for (const data of dataGroup) {
          // Extract tool names that need to be mocked
          const allMockTools = new Set<string>();
          const expectedToolUse = data.expected_tool_use || [];
          
          for (const expected of expectedToolUse) {
            if (expected[EvalConstants.MOCK_TOOL_OUTPUT] !== undefined) {
              allMockTools.add(expected[EvalConstants.TOOL_NAME]);
            }
          }

          // Create a copy of the evaluation data to use in callbacks
          const evalDataCopy = { ...data };

          // Apply the tool callback to mock tool outputs if agent is an LlmAgent
          if (agent instanceof LlmAgent) {
            EvaluationGenerator.applyBeforeToolCallback(
              agent,
              (tool, args, toolContext, evalDataset) => 
                EvaluationGenerator.beforeToolCallback(tool, args, toolContext, evalDataset),
              allMockTools,
              [evalDataCopy]
            );
          }

          // Create a runner for the agent
          const runner = new Runner({
            appName,
            agent,
            artifactService,
            sessionService
          });

          // Process the response
          const response: EvalEntry = { ...data };
          const query = data.query;
          
          // Create a content object from the query
          const content: Content = {
            role: 'user',
            parts: [{ text: query }]
          };

          const turnActualToolUses: Array<{
            tool_name: string;
            tool_input: Record<string, any>;
          }> = [];

          // Run the agent and collect responses
          for await (const event of runner.run({
            userId,
            sessionId,
            newMessage: content
          })) {
            if (event.isFinalResponse() && event.content && event.content.parts.length > 0) {
              const textPart = event.content.parts.find((part: Part) => part.text !== undefined);
              if (textPart) {
                response.response = textPart.text;
              }
            } 
            
            // Check for direct function calls
            if (event.getFunctionCalls && event.getFunctionCalls().length > 0) {
              for (const call of event.getFunctionCalls()) {
                turnActualToolUses.push({
                  tool_name: call.name,
                  tool_input: call.args
                });
              }
            } else {
              console.log('did not get function calls', event?.content?.parts)
            }
          }

          // Update the response with collected tool uses
          response.actual_tool_use = turnActualToolUses;
          
          runResults.push(response);
        }
      }
      
      results.push(runResults);
    }

    return results;
  }

  /**
   * Checks if response evaluation is needed
   * @param criteria The evaluation criteria
   * @param evalDataset The evaluation dataset
   * @returns True if response evaluation is required
   */
  private static _responseEvaluationRequired(
    criteria: EvaluationCriteria,
    evalDataset: EvalEntry[][]
  ): boolean {
    return REFERENCE_COLUMN in evalDataset[0][0] && (
      RESPONSE_EVALUATION_SCORE_KEY in criteria ||
      RESPONSE_MATCH_SCORE_KEY in criteria
    );
  }

  /**
   * Checks if trajectory evaluation is needed
   * @param criteria The evaluation criteria
   * @param evalDataset The evaluation dataset
   * @returns True if trajectory evaluation is required
   */
  private static _trajectoryEvaluationRequired(
    criteria: EvaluationCriteria,
    evalDataset: EvalEntry[][]
  ): boolean {
    return EXPECTED_TOOL_USE_COLUMN in evalDataset[0][0] &&
      TOOL_TRAJECTORY_SCORE_KEY in criteria;
  }

  /**
   * Evaluates response scores and raises an assertion error if they don't meet the criteria
   * @param evaluationResponse The evaluation response data
   * @param criteria The evaluation criteria
   */
  private static async _evaluateResponseScores(
    evaluationResponse: EvalEntry[][],
    criteria: EvaluationCriteria
  ): Promise<void> {
    const metrics = ResponseEvaluator.evaluateResponses(
      evaluationResponse.flat()
    );

    const meanScore = metrics.reduce((sum, result) => sum + result.score, 0) / metrics.length;
    const metricsMap = {
      "coherence/mean": meanScore,
      "rouge_1/mean": meanScore
    };

    AgentEvaluator._assertScore(
      metricsMap,
      "coherence/mean",
      criteria[RESPONSE_EVALUATION_SCORE_KEY],
      "Average response evaluation score"
    );

    AgentEvaluator._assertScore(
      metricsMap,
      "rouge_1/mean",
      criteria[RESPONSE_MATCH_SCORE_KEY],
      "Average response match score"
    );
  }

  /**
   * Evaluates tool trajectory scores and raises an assertion error if they don't meet the criteria
   * @param evaluationResponse The evaluation response data
   * @param criteria The evaluation criteria
   */
  private static async _evaluateToolTrajectory(
    evaluationResponse: EvalEntry[][],
    criteria: EvaluationCriteria
  ): Promise<void> {
    const score = TrajectoryEvaluator.evaluate(
      evaluationResponse,
      true // print_detailed_results
    );

    AgentEvaluator._assertScore(
      { [TOOL_TRAJECTORY_SCORE_KEY]: score },
      TOOL_TRAJECTORY_SCORE_KEY,
      criteria[TOOL_TRAJECTORY_SCORE_KEY],
      "Average tool trajectory evaluation score"
    );
  }

  /**
   * Asserts that a metric meets the specified threshold
   * @param metrics The metrics to check
   * @param metricKey The key of the metric to check
   * @param threshold The threshold the metric must meet
   * @param description Description of the check for error messages
   */
  private static _assertScore(
    metrics: Record<string, any>,
    metricKey: string,
    threshold: number | undefined,
    description: string
  ): void {
    if (metricKey in metrics && threshold !== undefined) {
      const actualScore = metrics[metricKey];
      if (actualScore < threshold) {
        throw new Error(
          `${description} is lower than expected. ` +
          `Expected >= ${threshold}, but got ${actualScore}.`
        );
      }
    }
  }
} 