/**
 * TypeScript port of the Langchain WebResearch Agent example from the Python ADK library
 * 
 * This example demonstrates how to use the Langchain's WebResearch capabilities with ADK TypeScript.
 * It creates an agent that can search the web, process documents, and answer questions based on
 * information found online.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 * 
 * Required NPM packages:
 * - adk-typescript (for ADK functionality)
 * - @langchain/core (for LangChain integration)
 * - @langchain/community (for tools)
 * - @langchain/openai (for OpenAI integration)
 * - tavily (for Tavily API client)
 * - cheerio (for HTML parsing)
 */

import { 
  Agent, 
  Runner,
  Content, 
  InMemorySessionService,
  ThirdPartyTool
} from 'adk-typescript';

// LangChain imports
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { WebBrowser } from "@langchain/community/tools/webbrowser";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createRetrieverTool } from "@langchain/core/tools";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { PromptTemplate } from "@langchain/core/prompts";

// Constants for the app
const APP_NAME = "webresearch_app";
const USER_ID = "user1234";
const SESSION_ID = "1234";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// Ensure environment variables are set
if (!process.env.TAVILY_API_KEY) {
  console.warn("Warning: TAVILY_API_KEY environment variable not set.");
}
if (!process.env.OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY environment variable not set.");
}

async function createWebResearchLangchainAgent() {
  // Create model instance
  const model = new ChatOpenAI({
    modelName: "gpt-4-turbo",
    temperature: 0,
  });

  // Create search tool
  const searchTool = new TavilySearchResults({
    maxResults: 3,
    apiKey: process.env.TAVILY_API_KEY,
  });

  // Create web browser tool with minimal configuration
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
  });

  const webBrowser = new WebBrowser({
    model,
    textSplitter: splitter,
  });

  // Load agent prompt from LangChain hub
  const prompt = await pull<PromptTemplate>("langchain-ai/webreact-agent-prompt");

  // Create the tools array
  const tools = [searchTool, webBrowser];

  // Create the agent
  const agent = await createOpenAIFunctionsAgent({
    llm: model,
    tools,
    prompt,
  });

  // Create the agent executor
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    returnIntermediateSteps: true,
    // Configure maximum iterations to prevent infinite loops
    maxIterations: 5,
  });

  // Create a more structured answer with a summary
  const answerPrompt = PromptTemplate.fromTemplate(`
  You are an AI assistant providing helpful answers to human questions.
  
  Context information from web research is below:
  -----------------
  {context}
  -----------------
  
  Based on this information, provide a comprehensive answer to the question: {question}
  
  Your answer should be:
  1. Detailed and thorough, directly addressing the question
  2. Structured with proper formatting for readability
  3. Containing only facts from the research, no made-up information
  4. Cite the sources of information when possible
  `);

  const createSearchQuery = async (question: string) => {
    // You could enhance this with a more sophisticated search query generator if needed
    return question;
  };

  const generateAnswer = RunnableSequence.from([
    {
      // Input keys
      context: async ({ question }: { question: string }) => {
        // Generate search query based on question
        const searchQuery = await createSearchQuery(question);
        
        // Execute the agent to gather information
        const response = await agentExecutor.invoke({
          input: searchQuery,
        });
        
        // Extract the content from the agent's response
        // You may need to adjust this based on the actual response structure
        const docs = response.intermediateSteps
          .filter(step => step.action?.tool === "web-browser" && step.observation)
          .map(step => ({
            pageContent: step.observation,
            metadata: { source: step.action?.toolInput?.url || "unknown" }
          }));
        
        return formatDocumentsAsString(docs);
      },
      question: ({ question }: { question: string }) => question,
    },
    answerPrompt,
    model,
    new StringOutputParser(),
  ]);

  return generateAnswer;
}

// Create an ADK agent that wraps the LangChain agent
async function createWebResearchAgent() {
  const generateAnswer = await createWebResearchLangchainAgent();
  
  // Create a ThirdPartyTool wrapper for the Langchain agent
  const webResearchTool = new ThirdPartyTool({
    name: "WebResearch",
    description: "Perform web research to find answers to questions by searching the internet and browsing websites",
    tool: {
      invoke: async (input: string) => {
        try {
          const response = await generateAnswer.invoke({ question: input });
          return response;
        } catch (error) {
          console.error("Error in web research:", error);
          return "I encountered an error while performing web research. Please try again with a more specific question.";
        }
      }
    }
  });

  // Create the ADK agent with the web research tool
  const webResearchAgent = new Agent("webresearch_agent", {
    model: "gemini-2.0-flash", // You can also use OpenAI models here
    description: "Agent to answer questions using internet web research",
    instruction: `I'm a helpful assistant that can perform web research to find information. I'll search the internet and visit websites to find detailed answers to your questions.

You can ask me things like:
- What are the latest developments in quantum computing?
- How does the James Webb Space Telescope work?
- What is the current understanding of dark matter?
- What are the environmental impacts of electric vehicles?

I'll provide thorough, fact-based answers with references to where I found the information.`,
    tools: [webResearchTool]
  });

  return webResearchAgent;
}

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

// Main function to create agent and run it
async function main() {
  const webResearchAgent = await createWebResearchAgent();
  
  const runner = new Runner({
    agent: webResearchAgent, 
    appName: APP_NAME, 
    sessionService: sessionService
  });

  return { runner, webResearchAgent };
}

// Function to call the agent with a query
async function callAgent(runner: Runner, query: string): Promise<void> {
  // Create content for the request
  const content: Content = {
    role: 'user',
    parts: [{ text: query }]
  };

  // Run the agent and collect results
  try {
    const events = runner.run({
      userId: USER_ID, 
      sessionId: SESSION_ID, 
      newMessage: content
    });

    for await (const event of events) {
      if (event.isFinalResponse && event.content && event.content.parts && event.content.parts[0].text) {
        const finalResponse = event.content.parts[0].text;
        console.log("Agent Response: ", finalResponse);
      }
    }
  } catch (error) {
    console.error("Error running agent:", error);
  }
}

// Execute with a sample query when module is run directly
if (require.main === module) {
  (async () => {
    const { runner } = await main();
    await callAgent(runner, "What are the latest developments in quantum computing?");
  })();
}

// Export for external use
export async function runWebResearchDemo(query: string): Promise<void> {
  const { runner } = await main();
  await callAgent(runner, query);
}

export { createWebResearchAgent }; 