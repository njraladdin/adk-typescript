/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EvalSetsManager } from './EvalSetsManager';
import { EvalSet, createEvalSet } from './EvalSet';
import { EvalCase, Invocation, IntermediateData, SessionInput, createInvocation, createIntermediateData, createSessionInput } from './EvalCase';
import { Content, Part, FunctionCall } from '../models/types';

const EVAL_SET_FILE_EXTENSION = '.evalset.json';

/**
 * Converts an invocation from old JSON format to new Pydantic Schema
 */
function convertInvocationToPydanticSchema(invocationInJsonFormat: any): Invocation {
  const query = invocationInJsonFormat.query;
  const reference = invocationInJsonFormat.reference;
  const expectedToolUse: FunctionCall[] = [];
  const expectedIntermediateAgentResponses: [string, Part[]][] = [];

  for (const oldToolUse of invocationInJsonFormat.expected_tool_use || []) {
    expectedToolUse.push({
      name: oldToolUse.tool_name,
      args: oldToolUse.tool_input
    });
  }

  for (const oldIntermediateResponse of invocationInJsonFormat.expected_intermediate_agent_responses || []) {
    expectedIntermediateAgentResponses.push([
      oldIntermediateResponse.author,
      [{ text: oldIntermediateResponse.text }]
    ]);
  }

  return createInvocation(
    uuidv4(),
    {
      parts: [{ text: query }],
      role: 'user'
    } as Content,
    {
      finalResponse: {
        parts: [{ text: reference }],
        role: 'model'
      } as Content,
      intermediateData: createIntermediateData({
        toolUses: expectedToolUse,
        intermediateResponses: expectedIntermediateAgentResponses
      }),
      creationTimestamp: Date.now() / 1000
    }
  );
}

/**
 * Converts an eval set from old JSON format to new Pydantic Schema
 */
export function convertEvalSetToPydanticSchema(evalSetId: string, evalSetInJsonFormat: any[]): EvalSet {
  const evalCases: EvalCase[] = [];
  
  for (const oldEvalCase of evalSetInJsonFormat) {
    const newInvocations: Invocation[] = [];

    for (const oldInvocation of oldEvalCase.data || []) {
      newInvocations.push(convertInvocationToPydanticSchema(oldInvocation));
    }

    const newEvalCase: EvalCase = {
      evalId: oldEvalCase.name,
      conversation: newInvocations,
      sessionInput: createSessionInput(
        oldEvalCase.initial_session?.app_name || '',
        oldEvalCase.initial_session?.user_id || '',
        {
          state: oldEvalCase.initial_session?.state || {}
        }
      ),
      creationTimestamp: Date.now() / 1000
    };
    evalCases.push(newEvalCase);
  }

  return createEvalSet(evalSetId, {
    name: evalSetId,
    evalCases: evalCases,
    creationTimestamp: Date.now() / 1000
  });
}

/**
 * An EvalSets manager that stores eval sets locally on disk.
 */
export class LocalEvalSetsManager extends EvalSetsManager {
  private agentDir: string;

  constructor(agentDir: string) {
    super();
    this.agentDir = agentDir;
  }

  /**
   * Returns an EvalSet identified by an app_name and eval_set_id.
   */
  getEvalSet(appName: string, evalSetId: string): EvalSet {
    // Load the eval set file data
    const evalSetFilePath = this.getEvalSetFilePath(appName, evalSetId);
    const fileContent = fs.readFileSync(evalSetFilePath, 'utf-8');
    
    try {
      // Try to parse as new format first
      const parsedContent = JSON.parse(fileContent);
      
      // Check if it's already in the new format (has evalSetId property)
      if (parsedContent.evalSetId) {
        return parsedContent as EvalSet;
      }
      
      // If it's an array, it's the old format
      if (Array.isArray(parsedContent)) {
        return convertEvalSetToPydanticSchema(evalSetId, parsedContent);
      }
      
      // If it has evalCases property, it's the new format
      if (parsedContent.evalCases) {
        return parsedContent as EvalSet;
      }
      
      // Fallback to old format conversion
      return convertEvalSetToPydanticSchema(evalSetId, parsedContent);
    } catch (error) {
      console.error('Error parsing eval set file:', error);
      throw new Error(`Failed to parse eval set file: ${evalSetFilePath}`);
    }
  }

  /**
   * Creates an empty EvalSet given the app_name and eval_set_id.
   */
  createEvalSet(appName: string, evalSetId: string): void {
    this.validateId('Eval Set Id', evalSetId);

    // Define the file path
    const newEvalSetPath = this.getEvalSetFilePath(appName, evalSetId);

    console.log(`Creating eval set file ${newEvalSetPath}`);

    if (!fs.existsSync(newEvalSetPath)) {
      // Write the JSON string to the file
      console.log("Eval set file doesn't exist, we will create a new one.");
      const newEvalSet = createEvalSet(evalSetId, {
        name: evalSetId,
        evalCases: [],
        creationTimestamp: Date.now() / 1000
      });
      this.writeEvalSet(newEvalSetPath, newEvalSet);
    }
  }

  /**
   * Returns a list of EvalSets that belong to the given app_name.
   */
  listEvalSets(appName: string): string[] {
    const evalSetFilePath = path.join(this.agentDir, appName);
    const evalSets: string[] = [];
    
    if (!fs.existsSync(evalSetFilePath)) {
      return evalSets;
    }
    
    const files = fs.readdirSync(evalSetFilePath);
    for (const file of files) {
      if (file.endsWith(EVAL_SET_FILE_EXTENSION)) {
        evalSets.push(
          path.basename(file).replace(EVAL_SET_FILE_EXTENSION, '')
        );
      }
    }

    return evalSets.sort();
  }

  /**
   * Adds the given EvalCase to an existing EvalSet identified by app_name and eval_set_id.
   */
  addEvalCase(appName: string, evalSetId: string, evalCase: EvalCase): void {
    const evalCaseId = evalCase.evalId;
    this.validateId('Eval Case Id', evalCaseId);

    const evalSet = this.getEvalSet(appName, evalSetId);

    if (evalSet.evalCases.some(x => x.evalId === evalCaseId)) {
      throw new Error(
        `Eval id \`${evalCaseId}\` already exists in \`${evalSetId}\` eval set.`
      );
    }

    evalSet.evalCases.push(evalCase);

    const evalSetFilePath = this.getEvalSetFilePath(appName, evalSetId);
    this.writeEvalSet(evalSetFilePath, evalSet);
  }

  private getEvalSetFilePath(appName: string, evalSetId: string): string {
    return path.join(
      this.agentDir,
      appName,
      evalSetId + EVAL_SET_FILE_EXTENSION
    );
  }

  private validateId(idName: string, idValue: string): void {
    const pattern = /^[a-zA-Z0-9_]+$/;
    if (!pattern.test(idValue)) {
      throw new Error(
        `Invalid ${idName}. ${idName} should have the ${pattern} format`
      );
    }
  }

  private writeEvalSet(evalSetPath: string, evalSet: EvalSet): void {
    fs.writeFileSync(evalSetPath, JSON.stringify(evalSet, null, 2));
  }
} 