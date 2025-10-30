import { Part, ThinkingConfig, GenerateContentConfig } from '../models/types';
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
    console.log('[BuiltInPlanner] Initialized with thinking config:', JSON.stringify(thinkingConfig, null, 2));
  }

  /**
   * Applies the thinking config to the LLM request.
   *
   * @param llmRequest The LLM request to apply the thinking config to.
   */
  applyThinkingConfig(llmRequest: LlmRequest): void {
    console.log('[BuiltInPlanner] applyThinkingConfig called');
    console.log('[BuiltInPlanner] Has thinking config:', !!this.thinkingConfig);

    if (this.thinkingConfig) {
      // Initialize config if it doesn't exist
      if (!llmRequest.config) {
        console.log('[BuiltInPlanner] Initializing new config object');
        // Only include required properties (tools array) and use type assertion
        llmRequest.config = { tools: [] } as GenerateContentConfig;
      }

      llmRequest.config.thinkingConfig = this.thinkingConfig;
      console.log('[BuiltInPlanner] Applied thinking config to LLM request');
      console.log('[BuiltInPlanner] Request config:', JSON.stringify({
        hasThinkingConfig: !!llmRequest.config.thinkingConfig,
        thinkingConfig: llmRequest.config.thinkingConfig
      }, null, 2));
    } else {
      console.log('[BuiltInPlanner] No thinking config to apply');
    }
  }

  /**
   * @inheritdoc
   */
  buildPlanningInstruction(
    readonlyContext: ReadonlyContext,
    llmRequest: LlmRequest
  ): string | undefined {
    console.log('[BuiltInPlanner] buildPlanningInstruction called');
    console.log('[BuiltInPlanner] Using built-in model thinking, no additional instruction needed');
    return undefined;
  }

  /**
   * @inheritdoc
   */
  processPlanningResponse(
    callbackContext: CallbackContext,
    responseParts: Part[]
  ): Part[] | undefined {
    console.log('[BuiltInPlanner] processPlanningResponse called');
    console.log('[BuiltInPlanner] Response parts count:', responseParts.length);

    // Log if there are any thought parts
    const thoughtParts = responseParts.filter(part => part.thought);
    if (thoughtParts.length > 0) {
      console.log('[BuiltInPlanner] Found', thoughtParts.length, 'thought part(s)');
      thoughtParts.forEach((part, index) => {
        console.log(`[BuiltInPlanner] Thought ${index + 1}:`, part.text?.substring(0, 100) + '...');
      });
    }

    // Log part types
    const partTypes = responseParts.map(part => {
      if (part.text) return 'text';
      if (part.functionCall) return 'functionCall';
      if (part.functionResponse) return 'functionResponse';
      if (part.thought) return 'thought';
      return 'unknown';
    });
    console.log('[BuiltInPlanner] Part types:', partTypes);

    console.log('[BuiltInPlanner] No response processing needed, returning undefined');
    return undefined;
  }
} 