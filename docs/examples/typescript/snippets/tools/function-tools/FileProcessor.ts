import { LlmAgent as Agent } from 'adk-typescript/agents';
import { runners } from 'adk-typescript';
import { Content } from 'adk-typescript/types';
import { InMemorySessionService } from 'adk-typescript/sessions';
import { LongRunningFunctionTool, ToolContext } from 'adk-typescript/tools';

// Constants for the app
const APP_NAME = "file_processor";
const USER_ID = "1234";
const SESSION_ID = "session1234";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// 1. Define the generator function
async function* processLargeFile(
  params: Record<string, any>, 
  context: ToolContext
): AsyncGenerator<Record<string, string>, Record<string, string>, void> {
  /**
   * Simulates processing a large file, yielding progress updates.
   * 
   * @param params.filePath Path to the file being processed.
   * @returns A final status dictionary.
   */
  const filePath = params.filePath as string;
  const totalSteps = 5;

  // This object will be sent in the first FunctionResponse
  yield { status: "pending", message: `Starting processing for ${filePath}...` };

  for (let i = 0; i < totalSteps; i++) {
    // Simulate work for one step
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const progress = (i + 1) / totalSteps;
    // Each yielded object is sent in a subsequent FunctionResponse
    yield {
      status: "pending",
      progress: `${Math.floor(progress * 100)}%`,
      estimated_completion_time: `~${totalSteps - (i + 1)} seconds remaining`
    };
  }

  // This returned object will be sent in the final FunctionResponse
  return { status: "completed", result: `Successfully processed file: ${filePath}` };
}

// 2. Wrap the function with LongRunningFunctionTool
const longRunningTool = new LongRunningFunctionTool({
  name: 'process_large_file',
  description: 'Processes a large file and provides progress updates.',
  fn: processLargeFile,
  functionDeclaration: {
    name: 'process_large_file',
    description: 'Processes a large file and provides progress updates.',
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'The path to the file to process.',
        },
      },
      required: ['filePath'],
    },
  },
});

// 3. Use the tool in an Agent
const fileProcessorAgent = new Agent({
  name: "file_processor_agent",
  // Use a model compatible with function calling
  model: "gemini-2.0-flash",
  instruction: `You are an agent that processes large files. When the user provides a file path, use the 'process_large_file' tool. Keep the user informed about the progress based on the tool's updates (which arrive as function responses). Only provide the final result when the tool indicates completion in its final function response.`,
  tools: [longRunningTool]
});

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new runners.Runner({
  agent: fileProcessorAgent, 
  appName: APP_NAME, 
  sessionService: sessionService
});

// Agent Interaction function
function callAgent(query: string): void {
  // Create content for the request
  const content: Content = {
    role: 'user',
    parts: [{ text: query }]
  };

  // Run the agent and collect results
  (async () => {
    try {
      const events = runner.run({
        userId: USER_ID, 
        sessionId: SESSION_ID, 
        newMessage: content
      });

      for await (const event of events) {
        if (event.isFinalResponse() && event.content && event.content.parts && event.content.parts[0].text) {
          const finalResponse = event.content.parts[0].text;
          console.log("Agent Response: ", finalResponse);
        }
      }
    } catch (error) {
      console.error("Error running agent:", error);
    }
  })();
}

// Execute with a sample query
callAgent("Please process the file at /path/to/example.txt");

// Export for external use
export const agent = fileProcessorAgent;
export function runFileProcessorDemo(filePath: string): void {
  callAgent(`Please process the file at ${filePath}`);
} 