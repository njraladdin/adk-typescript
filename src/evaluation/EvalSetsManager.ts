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

/**
 * An interface to manage Eval Sets.
 */
export abstract class EvalSetsManager {
  /**
   * Returns an EvalSet identified by an app_name and eval_set_id.
   */
  abstract getEvalSet(appName: string, evalSetId: string): any;

  /**
   * Creates an empty EvalSet given the app_name and eval_set_id.
   */
  abstract createEvalSet(appName: string, evalSetId: string): void;

  /**
   * Returns a list of EvalSets that belong to the given app_name.
   */
  abstract listEvalSets(appName: string): string[];

  /**
   * Adds the given EvalCase to an existing EvalSet identified by app_name and eval_set_id.
   */
  abstract addEvalCase(appName: string, evalSetId: string, evalCase: any): void;
} 