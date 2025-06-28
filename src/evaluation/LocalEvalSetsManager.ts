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
import { EvalSetsManager } from './EvalSetsManager';

const EVAL_SET_FILE_EXTENSION = '.evalset.json';

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
  getEvalSet(appName: string, evalSetId: string): any {
    // Load the eval set file data
    const evalSetFilePath = this.getEvalSetFilePath(appName, evalSetId);
    const fileContent = fs.readFileSync(evalSetFilePath, 'utf-8');
    return JSON.parse(fileContent); // Load JSON into a list
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
      const emptyContent = JSON.stringify([], null, 2);
      fs.writeFileSync(newEvalSetPath, emptyContent);
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
  addEvalCase(appName: string, evalSetId: string, evalCase: any): void {
    const evalCaseId = evalCase.name;
    this.validateId('Eval Case Id', evalCaseId);

    // Load the eval set file data
    const evalSetFilePath = this.getEvalSetFilePath(appName, evalSetId);
    const fileContent = fs.readFileSync(evalSetFilePath, 'utf-8');
    const evalSetData = JSON.parse(fileContent); // Load JSON into a list

    if (evalSetData.some((x: any) => x.name === evalCaseId)) {
      throw new Error(
        `Eval id \`${evalCaseId}\` already exists in \`${evalSetId}\` eval set.`
      );
    }

    evalSetData.push(evalCase);
    // Serialize the test data to JSON and write to the eval set file.
    fs.writeFileSync(evalSetFilePath, JSON.stringify(evalSetData, null, 2));
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
} 