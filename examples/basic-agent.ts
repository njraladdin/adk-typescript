/**
 * Basic example of using the ADK TypeScript library
 * 
 * This example demonstrates how to create a simple agent that can perform a task.
 */

import { Agent, Memory, Tools, Logger } from '../src';

// Initialize a logger
const logger = new Logger('ExampleApp');
logger.info('Starting basic agent example');

// Create memory for the agent
const memory = new Memory();

// Add some initial knowledge to the memory
memory.add({ type: 'knowledge', content: 'TypeScript is a superset of JavaScript' });
memory.add({ type: 'knowledge', content: 'TypeScript adds static typing to JavaScript' });

// Configure the agent
const agent = new Agent({
  llm: 'gpt-4', // or any other supported LLM
  memory: memory,
  tools: [
    Tools.web.search,
    Tools.file.read,
    Tools.file.write
  ],
  verbose: true // Enable verbose logging
});

// Main function to run the example
async function runExample() {
  try {
    logger.info('Executing agent task');
    
    // Run the agent with a specific task
    const result = await agent.run(
      'Find more information about TypeScript and write a summary to a file'
    );
    
    // Display the result
    logger.info('Agent completed task');
    console.log('Result:', result);
    
  } catch (error) {
    logger.error(`An error occurred: ${error}`);
  }
}

// Run the example
runExample().then(() => {
  logger.info('Example completed');
}); 