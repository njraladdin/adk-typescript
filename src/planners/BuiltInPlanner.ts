 

import { Part, ThinkingConfig } from '../models/types';
import { ReadonlyContext } from '../agents/ReadonlyContext';
import { CallbackContext } from '../agents/CallbackContext';
import { LlmRequest } from '../models/LlmRequest';
import { BasePlanner } from './BasePlanner';

/**
 * The built-in planner that uses model's built-in thinking features.
 */
export class BuiltInPlanner extends BasePlanner {
  /**
   * Config for model built-in thinking features. An error will be returned if this
   * field is set for models that don't support thinking.
   */
  thinkingConfig: ThinkingConfig;

  /**
   * Initializes the built-in planner.
   * 
   * @param thinkingConfig Config for model built-in thinking features. An error
   * will be returned if this field is set for models that don't support thinking.
   */
  constructor(thinkingConfig: ThinkingConfig) {
    super();
    this.thinkingConfig = thinkingConfig;
  }

  /**
   * Applies the thinking config to the LLM request.
   * 
   * @param llmRequest The LLM request to apply the thinking config to.
   */
  applyThinkingConfig(llmRequest: LlmRequest): void {
    if (this.thinkingConfig) {
      llmRequest.config.thinkingConfig = this.thinkingConfig;
    }
  }

  /**
   * @inheritdoc
   */
  buildPlanningInstruction(
    readonlyContext: ReadonlyContext,
    llmRequest: LlmRequest
  ): string | undefined {
    return undefined;
  }

  /**
   * @inheritdoc
   */
  processPlanningResponse(
    callbackContext: CallbackContext,
    responseParts: Part[]
  ): Part[] | undefined {
    return undefined;
  }
} 