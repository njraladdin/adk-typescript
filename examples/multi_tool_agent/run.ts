/**
 * Runner script for the multi_tool_agent
 * This uses the actual ADK framework to run the agent
 */
import { rootAgent } from './agent';
import { InMemoryRunner } from '../../src/runners';
import * as readline from 'readline';
import { Content, Part } from '../../src/models/types';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../../src/sessions/Session';
import { BaseAgent } from '../../src/agents/BaseAgent';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Debug flag for verbose logging
const DEBUG = true;

// Debug logger
function debugLog(...messages: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...messages);
  }
}

// Error logger with detailed information
function logError(prefix: string, error: any) {
  console.error(`\n${prefix}:`, error);
  if (error instanceof Error) {
    console.error(`Error name: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  } else {
    console.error(`Non-Error object thrown: ${JSON.stringify(error)}`);
  }
}
dotenv.config();

// Create an interface for reading user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Main function to run the agent with the ADK InMemoryRunner
 */
async function runAgent() {
  console.log("Weather and Time Agent initialized!");
  console.log(`Using model: ${typeof rootAgent.model === 'string' ? rootAgent.model : (rootAgent.model as any).model}`);
  console.log("Type your questions about weather or time in cities like New York, Paris, London, Tokyo, etc.");
  console.log("Type 'exit' to quit.");
  console.log('');

  // Create a proper ADK runner with our agent
  const runner = new InMemoryRunner(rootAgent, 'multi_tool_agent');
  debugLog('Runner created successfully');
  console.log(runner)

  // Generate a unique user ID for this session
  const userId = `user_${Math.random().toString(36).substring(2, 10)}`;
  debugLog(`Generated user ID: ${userId}`);
  
  // Create a session in the session service
  const sessionId = uuidv4();
  debugLog(`Generated session ID: ${sessionId}`);
  
  try {
    // Create a basic session
    debugLog('Creating session in session service...');
    const session = await runner.sessionService.createSession({
      appName: 'multi_tool_agent',
      userId: userId,
      sessionId: sessionId
    });
    
    debugLog('Session created:', session);
    
    console.log(`Session created with ID: ${sessionId}`);

    // Start the conversation loop
    const askQuestion = () => {
      rl.question("User: ", async (userInput) => {
        if (userInput.toLowerCase() === 'exit') {
          console.log("\nEnding session. Goodbye!");
          rl.close();
          return;
        }
        
        try {
          console.log('trying to create user message: ')
          console.log(userInput)
          // Create a user message content
          const userMessage: Content = {
            role: 'user',
            parts: [{ text: userInput } as Part]
          };


          
          // Validate the user message
          if (!userInput || userInput.trim() === '') {
            console.warn("\nWarning: Empty message detected. Please provide a valid question or command.");
            process.stdout.write("I need a question to help you. Please ask me about weather or time in a specific city.");
            console.log("\n");
            askQuestion(); // Ask again
            return;
          }
          
          console.log("\nProcessing your request through the LLM...");
          console.log(`User message: "${userInput}"`); // Echo user message in console for clarity
          debugLog('User message object:', JSON.stringify(userMessage));
          
          // Use the actual runner to process the message
          process.stdout.write("Agent: ");
          let fullResponse = "";
          let eventCount = 0;
          
          try {
            // Run the agent using the runner's built-in functionality
            debugLog('Starting agent run...');
            for await (const event of runner.run({
              userId,
              sessionId,
              newMessage: userMessage
            })) {
              eventCount++;
              
              // Debug event information
              debugLog(`\nEvent ${eventCount}:`);
              debugLog(`- Author: ${event.author}`);
              debugLog(`- Has content: ${!!event.content}`);
              debugLog(`- Partial: ${!!event.partial}`);
              
              // Check if the event has text content to display
              if (event.content && event.content.parts && event.content.parts.length > 0) {
                debugLog(`- Parts count: ${event.content.parts.length}`);
                
                for (let i = 0; i < event.content.parts.length; i++) {
                  const part = event.content.parts[i];
                  debugLog(`- Part ${i+1} type: ${part.text ? 'text' : part.functionCall ? 'functionCall' : part.functionResponse ? 'functionResponse' : 'unknown'}`);
                  
                  // Handle text output
                  if (part.text) {
                    process.stdout.write(part.text);
                    if (!event.partial) {
                      fullResponse += part.text;
                    }
                  }
                  
                  // Log function calls for debugging
                  if (part.functionCall) {
                    debugLog(`\n[DEBUG: Calling tool ${part.functionCall.name}]`);
                    debugLog(`[Args: ${JSON.stringify(part.functionCall.args)}]`);
                  }
                  
                  // Log function responses for debugging
                  if (part.functionResponse) {
                    debugLog(`\n[DEBUG: Tool ${part.functionResponse.name} responded]`);
                    debugLog(`[Response: ${JSON.stringify(part.functionResponse.response)}]`);
                  }
                }
              } else {
                debugLog(`- No content or parts in this event`);
              }
            }
            
            if (eventCount === 0) {
              console.log("\nNo response from the agent. Using fallback response.");
              process.stdout.write("I'm having trouble processing your request. Please try again with a question about weather or time in a city like New York, Paris, London, or Tokyo.");
            }
          } catch (runError) {
            logError("Error during agent execution", runError);
            
            // Provide a fallback response to the user
            console.log("\nI apologize, but I encountered an error while processing your request. Please try again with a question about the weather or time in a specific city.");
          }
          
          console.log("\n"); // Add newline after response
        } catch (error) {
          logError("Error in request processing", error);
          
          // Provide a fallback response
          console.log("\nI apologize, but I encountered a system error. Please try again later.");
        }
        
        // Continue the conversation
        askQuestion();
      });
    };
    
    // Start the conversation
    askQuestion();
  } catch (error) {
    logError("Error setting up the agent session", error);
    rl.close();
  }
}

// Run the agent
console.log("Starting agent with ADK framework...");
runAgent().catch(error => {
  logError("Fatal error running agent", error);
  rl.close();
}); 