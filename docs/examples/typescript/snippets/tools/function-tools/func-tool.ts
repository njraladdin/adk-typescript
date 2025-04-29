/**
 * TypeScript port of the Function Tool example from the Python ADK library
 * 
 * This example demonstrates how to use a function as a tool for an agent.
 * Note: The original example used yfinance which is a Python package for stock data.
 * In this TypeScript port, we'll simulate the stock data function instead.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  Agent, 
  Runner,
  Content,
  InMemorySessionService,
  FunctionTool
} from 'adk-typescript';

// Constants for the app
const APP_NAME = "stock_app";
const USER_ID = "1234";
const SESSION_ID = "session1234";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

/**
 * Retrieves the current stock price for a given symbol.
 * This is a simulated version of the Python yfinance function.
 * 
 * @param symbol The stock symbol (e.g., "AAPL", "GOOG").
 * @returns The current stock price, or null if an error occurs.
 */
function getStockPrice(symbol: string): number | null {
  try {
    // Simulated stock prices
    const stockPrices: Record<string, number> = {
      "AAPL": 187.32,
      "GOOG": 141.18,
      "MSFT": 378.85,
      "AMZN": 175.47,
      "META": 471.05,
      "TSLA": 177.86,
      "NVDA": 824.98
    };

    // In a real implementation, this would make an API call
    // to a financial data provider or use a library like yfinance
    const price = stockPrices[symbol.toUpperCase()];
    
    if (price !== undefined) {
      console.log(`Retrieved stock price for ${symbol}: $${price}`);
      return price;
    } else {
      console.log(`Could not find stock price for ${symbol}`);
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving stock price for ${symbol}:`, error);
    return null;
  }
}

// Create the agent with the function tool
const stockPriceAgent = new Agent("stock_agent", {
  model: "gemini-2.0-flash",
  instruction: `You are an agent who retrieves stock prices. If a ticker symbol is provided, fetch the current price. If only a company name is given, first perform a Google search to find the correct ticker symbol before retrieving the stock price. If the provided ticker symbol is invalid or data cannot be retrieved, inform the user that the stock price could not be found.`,
  description: `This agent specializes in retrieving real-time stock prices. Given a stock ticker symbol (e.g., AAPL, GOOG, MSFT) or the stock name, use the tools and reliable data sources to provide the most up-to-date price.`,
  tools: [getStockPrice] // Add the function directly - it will be wrapped as a FunctionTool
});

// Create Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
  appName: APP_NAME, 
  userId: USER_ID, 
  sessionId: SESSION_ID
});

const runner = new Runner({
  agent: stockPriceAgent, 
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
        if (event.isFinalResponse && event.content && event.content.parts && event.content.parts[0].text) {
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
callAgent("stock price of GOOG");

// Export for external use
export const agent = stockPriceAgent;
export function runStockPriceDemo(query: string): void {
  callAgent(query);
} 