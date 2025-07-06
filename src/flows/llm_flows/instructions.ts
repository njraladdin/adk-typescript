/**
 * Module for creating LLM request processors that provide standard instructions.
 */
import { InvocationContext } from '../../agents/InvocationContext';
import { ReadonlyContext } from '../../agents/ReadonlyContext';
import { LlmAgent } from '../../agents/LlmAgent';
import { Event } from '../../events/Event';
import { LlmRequest } from '../../models/LlmRequest';
import { StatePrefix } from '../../sessions/State';
import { BaseLlmRequestProcessor } from './BaseLlmProcessor';
import { ArtifactParams } from '../../artifacts/BaseArtifactService';

/**
 * Handles instructions and global instructions for LLM flow.
 */
class InstructionsLlmRequestProcessor implements BaseLlmRequestProcessor {
  /**
   * Runs the processor asynchronously.
   * 
   * @param invocationContext The invocation context
   * @param llmRequest The LLM request to process
   * @returns An async generator yielding events
   */
  async *runAsync(
    invocationContext: InvocationContext,
    llmRequest: LlmRequest
  ): AsyncGenerator<Event, void, unknown> {
    const agent = invocationContext.agent;
    
    // Only process if the agent is an LlmAgent
    if (!(agent instanceof LlmAgent)) {
      return;
    }

    const rootAgent = agent.rootAgent;

    // Append global instructions if set.
    if (rootAgent instanceof LlmAgent && rootAgent.globalInstruction) {
      const [rawSi, bypassStateInjection] =
        await rootAgent.canonicalGlobalInstruction(
          new ReadonlyContext(invocationContext)
        );
      let si = rawSi;
      if (!bypassStateInjection) {
        si = await populateValues(rawSi, invocationContext);
      }
      llmRequest.appendInstructions([si]);
    }

    // Append agent instructions if set.
    if (agent.instruction) {
      console.log(`[InstructionsLlmRequestProcessor] About to call canonicalInstruction for agent: ${agent.name}`);
      console.log(`[InstructionsLlmRequestProcessor] Session state before creating ReadonlyContext - test_value:`, invocationContext.session.state.get('test_value'));
      
      const readonlyContext = new ReadonlyContext(invocationContext);
      console.log(`[InstructionsLlmRequestProcessor] ReadonlyContext created - test_value:`, readonlyContext.state.get('test_value'));
      
      const [rawSi, bypassStateInjection] = await agent.canonicalInstruction(
        readonlyContext
      );
      
      console.log(`[InstructionsLlmRequestProcessor] canonicalInstruction returned, rawSi length: ${rawSi.length}`);
      console.log(`[InstructionsLlmRequestProcessor] Instruction content preview: ${rawSi.substring(0, 200)}...`);
      
      let si = rawSi;
      if (!bypassStateInjection) {
        si = await populateValues(rawSi, invocationContext);
      }
      llmRequest.appendInstructions([si]);
    }

    // Maintain async generator contract
    if (Math.random() < 0) {
      yield {} as Event;
    }
  }
}

/**
 * The main instructions request processor instance.
 */
export const requestProcessor = new InstructionsLlmRequestProcessor();

/**
 * Populates values in the instruction template, e.g. state, artifact, etc.
 * 
 * @param instructionTemplate The instruction template
 * @param context The invocation context
 * @returns The populated instruction
 */
async function populateValues(
  instructionTemplate: string,
  context: InvocationContext
): Promise<string> {
  const replacer = async (match: string): Promise<string> => {
    let varName = match.slice(1, -1).trim();
    let optional = false;

    if (varName.endsWith('?')) {
      optional = true;
      varName = varName.slice(0, -1);
    }

    if (varName.startsWith('artifact.')) {
      varName = varName.substring('artifact.'.length);
      if (!context.artifactService) {
        throw new Error('Artifact service is not initialized.');
      }
      try {
        const artifactParams: ArtifactParams = {
          appName: context.session.appName,
          userId: context.session.userId,
          sessionId: context.session.id,
          filename: varName,
        };
        const artifactPromise = context.artifactService.loadArtifact(
          artifactParams
        );
        const artifact = await Promise.resolve(artifactPromise);

        if (!artifact) {
          throw new Error(`Artifact ${varName} not found.`);
        }
        return String(artifact);
      } catch (error) {
        if (optional) return '';
        throw error;
      }
    } else {
      if (!isValidStateName(varName)) {
        return match;
      }

      if (context.session.state.has(varName)) {
        return String(context.session.state.get(varName));
      } else {
        if (optional) {
          return '';
        } else {
          throw new Error(`Context variable not found: \`${varName}\`.`);
        }
      }
    }
  };

  const regex = /{+[^{}]*}+/g;
  const matches = [...instructionTemplate.matchAll(regex)];
  let result = '';
  let lastIndex = 0;

  for (const match of matches) {
    result += instructionTemplate.substring(lastIndex, match.index);
    const replacement = await replacer(match[0]);
    result += replacement;
    lastIndex = (match.index ?? 0) + match[0].length;
  }
  result += instructionTemplate.substring(lastIndex);
  
  return result;
}

/**
 * Checks if the variable name is a valid state name.
 * 
 * Valid state is either:
 *   - Valid identifier
 *   - <Valid prefix>:<Valid identifier>
 * All the others will just return as they are.
 * 
 * @param varName The variable name to check
 * @returns True if the variable name is a valid state name, false otherwise
 */
function isValidStateName(varName: string): boolean {
  const parts = varName.split(':');
  
  if (parts.length === 1) {
    return isValidIdentifier(varName);
  }

  if (parts.length === 2) {
    const prefixes = [StatePrefix.APP_PREFIX, StatePrefix.USER_PREFIX, StatePrefix.TEMP_PREFIX];
    if (prefixes.includes(parts[0] + ':')) {
      return isValidIdentifier(parts[1]);
    }
  }
  
  return false;
}

/**
 * Checks if the string is a valid JavaScript identifier.
 * 
 * @param str The string to check
 * @returns True if the string is a valid identifier, false otherwise
 */
function isValidIdentifier(str: string): boolean {
  if (!str || str.length === 0) return false;
  if (!isNaN(parseInt(str[0], 10))) return false;
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

/**
 * Creates a LLM request processor that adds instructions to the request.
 * 
 * @param instructionText The instruction text to add
 * @returns A LLM request processor that adds the instruction
 */
export function makeInstructionsRequestProcessor(instructionText: string): BaseLlmRequestProcessor {
  class SimpleInstructionsRequestProcessor implements BaseLlmRequestProcessor {
    /**
     * Runs the processor asynchronously.
     * 
     * @param invocationContext The invocation context
     * @param llmRequest The LLM request to process
     * @returns An async generator yielding events
     */
    async *runAsync(
      invocationContext: InvocationContext,
      llmRequest: LlmRequest
    ): AsyncGenerator<Event, void, unknown> {
      llmRequest.appendInstructions([instructionText]);
      
      // Maintain async generator contract
      if (Math.random() < 0) {
        yield {} as Event;
      }
    }
  }
  
  return new SimpleInstructionsRequestProcessor();
}

/**
 * A request processor that instructs the LLM to be brief in its responses.
 */
export const briefRequestProcessor = makeInstructionsRequestProcessor(
  'Be brief and concise in your answers. Prefer short responses over long ones.'
);

/**
 * A request processor that instructs the LLM to be extremely brief and focused.
 */
export const extremelyBriefRequestProcessor = makeInstructionsRequestProcessor(
  'Be extremely brief in your answers. Your responses should be just a few sentences at most.'
);

/**
 * A request processor that instructs the LLM to provide detailed explanations.
 */
export const detailedRequestProcessor = makeInstructionsRequestProcessor(
  'Provide detailed and comprehensive explanations. Include relevant context and examples when appropriate.'
);

/**
 * A request processor that instructs the LLM to respond in a straightforward way.
 */
export const straightForwardRequestProcessor = makeInstructionsRequestProcessor(
  'Respond directly and with factual information. Avoid overexplaining or excess preamble.'
);

/**
 * A request processor that instructs the LLM to respond in an efficient manner.
 */
export const efficientRequestProcessor = makeInstructionsRequestProcessor(
  'Respond with efficiency and focus. Don\'t repeat the question, and organize your response to highlight the most important points first.'
);

/**
 * A request processor that instructs the LLM to provide clear step-by-step explanations.
 */
export const stepByStepRequestProcessor = makeInstructionsRequestProcessor(
  'Structure your response as clear, sequential steps when providing explanations or instructions. Number each step.'
);

/**
 * A request processor that instructs the LLM to be helpful, harmless, and honest.
 */
export const safetyRequestProcessor = makeInstructionsRequestProcessor(
  'Be helpful, harmless, and honest in your responses. Avoid responses that could be harmful, illegal, unethical, deceptive, or promote misinformation.'
);