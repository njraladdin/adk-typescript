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

import { BaseLlm } from './BaseLlm';

/**
 * Type for LLM constructor classes that have the supportedModels static method
 */
type LlmConstructor = {
  new (model: string): BaseLlm;
  supportedModels(): string[];
};

/**
 * Registry for LLMs.
 * Key is the regex that matches the model name.
 * Value is the constructor class that implements the model.
 */
const llmRegistryDict: Map<string, LlmConstructor> = new Map();

/**
 * Registry for LLMs.
 */
export class LlmRegistry {
  /**
   * Creates a new LLM instance.
   * @param model The model name.
   * @returns The LLM instance.
   */
  static newLlm(model: string): BaseLlm {
    return new (LlmRegistry.resolve(model))(model);
  }

  /**
   * Registers a new LLM class.
   * @param modelNameRegex The regex that matches the model name.
   * @param llmClass The constructor class that implements the model.
   */
  private static _register(
    modelNameRegex: string,
    llmClass: LlmConstructor
  ): void {
    if (llmRegistryDict.has(modelNameRegex)) {
      const existingClass = llmRegistryDict.get(modelNameRegex);
      console.info(
        `Updating LLM class for ${modelNameRegex} from ${existingClass?.name || 'unknown'} to ${llmClass.name}`
      );
    }

    llmRegistryDict.set(modelNameRegex, llmClass);
  }

  /**
   * Registers a new LLM class.
   * @param llmClass The constructor class that implements the model.
   */
  static register(llmClass: LlmConstructor): void {
    for (const regex of llmClass.supportedModels()) {
      LlmRegistry._register(regex, llmClass);
    }
  }

  /**
   * Simple LRU cache implementation
   */
  private static resolveCache: Map<string, LlmConstructor> = new Map();
  private static readonly MAX_CACHE_SIZE = 32;

  /**
   * Resolves the model to a BaseLlm constructor.
   * @param model The model name.
   * @returns The BaseLlm constructor.
   * @throws Error if the model is not found.
   */
  static resolve(model: string): LlmConstructor {
    // Check cache first
    const cachedConstructor = LlmRegistry.resolveCache.get(model);
    if (cachedConstructor) {
      return cachedConstructor;
    }

    // Search for matching regex
    for (const [regex, llmClass] of llmRegistryDict.entries()) {
      if (new RegExp(regex).test(model)) {
        // Add to cache
        if (LlmRegistry.resolveCache.size >= LlmRegistry.MAX_CACHE_SIZE) {
          // Remove oldest entry if cache is full
          const firstKey = LlmRegistry.resolveCache.keys().next().value;
          if (firstKey) {
            LlmRegistry.resolveCache.delete(firstKey);
          }
        }
        LlmRegistry.resolveCache.set(model, llmClass);
        return llmClass;
      }
    }

    throw new Error(`Model ${model} not found.`);
  }
} 