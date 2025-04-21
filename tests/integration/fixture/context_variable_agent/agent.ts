

import { LlmAgent as Agent } from '../../../../src';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import { ToolContext } from '../../../../src/tools/toolContext';
import { PlanReActPlanner } from '../../../../src/planners';
import { AutoFlow } from '../../../../src/flows/llm_flows/AutoFlow';
import { FunctionTool } from '../../../../src/tools/FunctionTool';
import { LlmRegistry } from '../../../../src/models/LlmRegistry';

// Create a single instance of AutoFlow to be reused
const autoFlow = new AutoFlow();

// Create a model instance
const geminiModel = LlmRegistry.newLlm('gemini-1.5-flash');

/**
 * Simply ask to update these variables in the context
 */
function updateFc(
  data_one: string,
  data_two: string | number,
  data_three: string[],
  data_four: Array<string | number>,
  toolContext: ToolContext
): string {
  toolContext.actions.updateState('data_one', data_one);
  toolContext.actions.updateState('data_two', data_two);
  toolContext.actions.updateState('data_three', data_three);
  toolContext.actions.updateState('data_four', data_four);
  return 'The function `update_fc` executed successfully';
}

/**
 * Echo the context variable
 */
function echoInfo(customer_id: string): string {
  return customer_id;
}

/**
 * Build global instruction for agent
 */
function buildGlobalInstruction(invocationContext: InvocationContext): string {
  return `This is the gloabl agent instruction for invocation: ${invocationContext.invocationId}.`;
}

/**
 * Build sub agent instruction
 */
function buildSubAgentInstruction(): string {
  return 'This is the plain text sub agent instruction.';
}

// Create function tools
const echoInfoTool = new FunctionTool({
  name: 'echo_info',
  description: 'Echo the context variable',
  fn: async (params) => echoInfo(params.customer_id),
  functionDeclaration: {
    name: 'echo_info',
    description: 'Echo the context variable',
    parameters: {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          description: 'The customer ID to echo'
        }
      },
      required: ['customer_id']
    }
  }
});

const updateFcTool = new FunctionTool({
  name: 'update_fc',
  description: 'Update variables in the context',
  fn: async (params, context) => updateFc(
    params.data_one,
    params.data_two,
    params.data_three, 
    params.data_four,
    context
  ),
  functionDeclaration: {
    name: 'update_fc',
    description: 'Update variables in the context',
    parameters: {
      type: 'object',
      properties: {
        data_one: {
          type: 'string',
          description: 'First data to update'
        },
        data_two: {
          type: 'string',
          description: 'Second data to update'
        },
        data_three: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Third data to update'
        },
        data_four: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Fourth data to update'
        }
      },
      required: ['data_one', 'data_two', 'data_three', 'data_four']
    }
  }
});

/**
 * Context variable echo agent
 */
export const contextVariableEchoAgent = new Agent('context_variable_echo_agent', {
  llm: geminiModel,
  instruction: 'Use the echo_info tool to echo {customerId}, {customerInt}, {customerFloat}, and {customerJson}. Ask for it if you need to.',
  flow: autoFlow,
  tools: [echoInfoTool]
});

/**
 * Context variable with complicated format agent
 */
export const contextVariableWithComplicatedFormatAgent = new Agent('context_variable_echo_agent', {
  llm: geminiModel,
  instruction: 'Use the echo_info tool to echo { customerId }, {{customer_int  }, { non-identifier-float}}, {artifact.fileName}, {\'key1\': \'value1\'} and {{\'key2\': \'value2\'}}. Ask for it if you need to.',
  flow: autoFlow,
  tools: [echoInfoTool]
});

/**
 * Context variable with nl planner agent
 */
export const contextVariableWithNlPlannerAgent = new Agent('context_variable_with_nl_planner_agent', {
  llm: geminiModel,
  instruction: 'Use the echo_info tool to echo {customerId}. Ask for it if you need to.',
  flow: autoFlow,
  planner: new PlanReActPlanner(),
  tools: [echoInfoTool]
});

/**
 * Context variable with function instruction agent
 */
export const contextVariableWithFunctionInstructionAgent = new Agent('context_variable_with_function_instruction_agent', {
  llm: geminiModel,
  instruction: "This is the plain text sub agent instruction.",
  flow: autoFlow
});

/**
 * Context variable update agent
 */
export const contextVariableUpdateAgent = new Agent('context_variable_update_agent', {
  llm: geminiModel,
  instruction: 'Call tools',
  flow: autoFlow,
  tools: [updateFcTool]
});

/**
 * Root agent for context variable tests
 */
export const contextVariableRootAgent = new Agent('root_agent', {
  llm: geminiModel,
  description: 'The root agent.',
  flow: autoFlow,
  globalInstruction: buildGlobalInstruction,
  subAgents: [
    contextVariableWithNlPlannerAgent,
    contextVariableUpdateAgent
  ]
}); 