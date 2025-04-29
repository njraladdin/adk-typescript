# Third Party Tools

ADK is designed to be **highly extensible, allowing you to seamlessly integrate tools from other AI Agent frameworks** like CrewAI and LangChain. This interoperability is crucial because it allows for faster development time and allows you to reuse existing tools.

## 1. Using LangChain Tools

ADK provides the `LangchainTool` wrapper to integrate tools from the LangChain ecosystem into your agents.

### Example: Web Search using LangChain's Tavily tool

[Tavily](https://tavily.com/) provides a search API that returns answers derived from real-time search results, intended for use by applications like AI agents.

1. Follow [ADK installation and setup](../get-started/installation.md) guide.

2. **Install Dependencies:** Ensure you have the necessary LangChain packages installed. For example, to use the Tavily search tool, install its specific dependencies:

    ```bash
    npm install adk-typescript langchain @langchain/community tavily-js
    ```

3. Obtain a [Tavily](https://tavily.com/) API KEY and set it as an environment variable.

    ```bash
    # For Node.js
    process.env.TAVILY_API_KEY = "<REPLACE_WITH_API_KEY>";
    
    # Or set it before running your application
    export TAVILY_API_KEY=<REPLACE_WITH_API_KEY>
    ```

4. **Import:** Import the `LangchainTool` wrapper from ADK and the specific `LangChain` tool you wish to use (e.g, `TavilySearchResults`).

    ```typescript
    import { LangchainTool } from 'adk-typescript';
    import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
    ```

5. **Instantiate & Wrap:** Create an instance of your LangChain tool and pass it to the `LangchainTool` constructor.

    ```typescript
    // Instantiate the LangChain tool
    const tavilyToolInstance = new TavilySearchResults({
      maxResults: 5,
      searchDepth: "advanced",
      includeAnswer: true,
      includeRawContent: true,
      includeImages: true,
    });

    // Wrap it with LangchainTool for ADK
    const adkTavilyTool = new LangchainTool({
      tool: tavilyToolInstance
    });
    ```

6. **Add to Agent:** Include the wrapped `LangchainTool` instance in your agent's `tools` list during definition.

    ```typescript
    import { Agent } from 'adk-typescript';

    // Define the ADK agent, including the wrapped tool
    const myAgent = new Agent({
      name: "langchain_tool_agent",
      model: "gemini-2.0-flash",
      description: "Agent to answer questions using TavilySearch.",
      instruction: "I can answer your questions by searching the internet. Just ask me anything!",
      tools: [adkTavilyTool] // Add the wrapped tool here
    });
    ```

### Full Example: Tavily Search

Here's the full code combining the steps above to create and run an agent using the LangChain Tavily search tool.

```typescript
// Import necessary modules
import { Agent, LangchainTool, Runner, InMemorySessionService } from 'adk-typescript';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';

// Set your API key
// In a real application, use environment variables or secure configuration
process.env.TAVILY_API_KEY = "your-tavily-api-key";

async function main() {
  // Instantiate the Tavily search tool from LangChain
  const tavilyTool = new TavilySearchResults({
    maxResults: 5,
    searchDepth: "advanced",
    includeAnswer: true,
    includeRawContent: true,
    includeImages: true,
  });

  // Wrap it with LangchainTool for ADK
  const adkTavilyTool = new LangchainTool({
    tool: tavilyTool
  });

  // Create an agent with the tool
  const agent = new Agent({
    name: "search_agent",
    model: "gemini-2.0-flash",
    description: "Agent to answer questions using Tavily web search.",
    instruction: "I can answer your questions by searching the internet. Just ask me anything!",
    tools: [adkTavilyTool]
  });

  // Set up session service and runner
  const sessionService = new InMemorySessionService();
  const session = await sessionService.createSession({
    appName: "tavily_search_demo",
    userId: "user123"
  });

  const runner = new Runner({
    appName: "tavily_search_demo",
    agent: agent,
    sessionService: sessionService
  });

  // Function to run a query
  async function runQuery(query: string) {
    console.log(`\nUser Query: ${query}\n`);
    
    // Create a content object for the query
    const content = {
      role: "user",
      parts: [{ text: query }]
    };

    // Run the agent
    for await (const event of runner.runAsync({
      sessionId: session.id,
      userId: "user123",
      newMessage: content
    })) {
      if (event.content) {
        console.log("Agent Response:", event.content.parts[0]?.text || "No text response");
      }
    }
  }

  // Run a sample query
  await runQuery("What are the latest developments in quantum computing?");
}

// Run the main function
main().catch(error => console.error("Error:", error));
```

## 2. Using CrewAI tools

ADK provides the `CrewaiTool` wrapper to integrate tools from the CrewAI library.

### Example: Web Search using CrewAI's Serper API

[Serper API](https://serper.dev/) provides access to Google Search results programmatically. It allows applications, like AI agents, to perform real-time Google searches (including news, images, etc.) and get structured data back without needing to scrape web pages directly.

1. Follow [ADK installation and setup](../get-started/installation.md) guide.

2. **Install Dependencies:** Install the necessary CrewAI tools package. For example, to use the SerperDevTool:

    ```bash
    npm install adk-typescript crewai-tools
    ```

3. Obtain a [Serper API KEY](https://serper.dev/) and set it as an environment variable.

    ```typescript
    // In your application
    process.env.SERPER_API_KEY = "<REPLACE_WITH_API_KEY>";
    
    // Or set it before running your application
    // export SERPER_API_KEY=<REPLACE_WITH_API_KEY>
    ```

4. **Import:** Import `CrewaiTool` from ADK and the desired CrewAI tool (e.g, `SerperDevTool`).

    ```typescript
    import { CrewaiTool } from 'adk-typescript';
    import { SerperDevTool } from 'crewai-tools';
    ```

5. **Instantiate & Wrap:** Create an instance of the CrewAI tool. Pass it to the `CrewaiTool` constructor. **Crucially, you must provide a name and description** to the ADK wrapper, as these are used by ADK's underlying model to understand when to use the tool.

    ```typescript
    // Instantiate the CrewAI tool
    const serperToolInstance = new SerperDevTool({
      nResults: 10,
      saveFile: false,
      searchType: "news",
    });

    // Wrap it with CrewaiTool for ADK, providing name and description
    const adkSerperTool = new CrewaiTool({
      name: "InternetNewsSearch",
      description: "Searches the internet specifically for recent news articles using Serper.",
      tool: serperToolInstance
    });
    ```

6. **Add to Agent:** Include the wrapped `CrewaiTool` instance in your agent's `tools` list.

    ```typescript
    import { Agent } from 'adk-typescript';
 
    // Define the ADK agent
    const myAgent = new Agent({
      name: "crewai_search_agent",
      model: "gemini-2.0-flash",
      description: "Agent to find recent news using the Serper search tool.",
      instruction: "I can find the latest news for you. What topic are you interested in?",
      tools: [adkSerperTool] // Add the wrapped tool here
    });
    ```

### Full Example: Serper API

Here's the full code combining the steps above to create and run an agent using the CrewAI Serper API search tool.

```typescript
// Import necessary modules
import { Agent, CrewaiTool, Runner, InMemorySessionService } from 'adk-typescript';
import { SerperDevTool } from 'crewai-tools';

// Set your API key
// In a real application, use environment variables or secure configuration
process.env.SERPER_API_KEY = "your-serper-api-key";

async function main() {
  // Instantiate the SerperDev tool from CrewAI
  const serperTool = new SerperDevTool({
    nResults: 10,
    saveFile: false,
    searchType: "news",
  });

  // Wrap it with CrewaiTool for ADK
  const adkSerperTool = new CrewaiTool({
    name: "InternetNewsSearch",
    description: "Searches the internet specifically for recent news articles using Serper.",
    tool: serperTool
  });

  // Create an agent with the tool
  const agent = new Agent({
    name: "news_search_agent",
    model: "gemini-2.0-flash",
    description: "Agent to find recent news using the Serper search tool.",
    instruction: "I can find the latest news for you. What topic are you interested in?",
    tools: [adkSerperTool]
  });

  // Set up session service and runner
  const sessionService = new InMemorySessionService();
  const session = await sessionService.createSession({
    appName: "serper_news_demo",
    userId: "user123"
  });

  const runner = new Runner({
    appName: "serper_news_demo",
    agent: agent,
    sessionService: sessionService
  });

  // Function to run a query
  async function runQuery(query: string) {
    console.log(`\nUser Query: ${query}\n`);
    
    // Create a content object for the query
    const content = {
      role: "user",
      parts: [{ text: query }]
    };

    // Run the agent
    for await (const event of runner.runAsync({
      sessionId: session.id,
      userId: "user123",
      newMessage: content
    })) {
      if (event.content) {
        console.log("Agent Response:", event.content.parts[0]?.text || "No text response");
      }
    }
  }

  // Run a sample query
  await runQuery("What's happening with climate change initiatives?");
}

// Run the main function
main().catch(error => console.error("Error:", error));
```
