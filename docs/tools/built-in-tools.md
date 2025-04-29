# Built-in tools

These built-in tools provide ready-to-use functionality such as Google Search or
code executors that provide agents with common capabilities. For instance, an
agent that needs to retrieve information from the web can directly use the
**googleSearch** tool without any additional setup.

## How to Use

1. **Import:** Import the desired tool from the `adk-typescript` library.
2. **Configure:** Initialize the tool, providing required parameters if any.
3. **Register:** Add the initialized tool to the **tools** list of your Agent.

Once added to an agent, the agent can decide to use the tool based on the **user
prompt** and its **instructions**. The framework handles the execution of the
tool when the agent calls it.

## Available Built-in tools

### Google Search

The `googleSearch` tool allows the agent to perform web searches using Google
Search. It is compatible with Gemini 2 models, and you can add this tool to the
agent's tools list.

```typescript
import { 
  Agent, 
  googleSearch, 
  Runner, 
  InMemorySessionService 
} from 'adk-typescript';

// Create an agent with Google Search capability
const agent = new Agent({
  name: "search_agent",
  model: "gemini-2.0-flash",
  description: "I can search the web for information.",
  instruction: "Use googleSearch to find information when asked.",
  tools: [googleSearch] // Add the built-in Google Search tool
});

// Set up session service and runner
const sessionService = new InMemorySessionService();

async function main() {
  // Create a new session
  const session = await sessionService.createSession({ 
    appName: "search_example",
    userId: "user123" 
  });

  // Create runner
  const runner = new Runner({
    appName: "search_example",
    agent: agent,
    sessionService: sessionService
  });

  // Function to run a search query
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

  // Example search query
  await runQuery("What were the major technology announcements from Google I/O 2023?");
}

main().catch(console.error);
```

### Code Execution

The `builtInCodeExecution` tool enables the agent to execute code,
specifically when using Gemini 2 models. This allows the model to perform tasks
like calculations, data manipulation, or running small scripts.

```typescript
import { 
  Agent, 
  builtInCodeExecution, 
  Runner, 
  InMemorySessionService 
} from 'adk-typescript';

// Create an agent with Code Execution capability
const agent = new Agent({
  name: "code_executor_agent",
  model: "gemini-2.0-flash",
  description: "I can execute code to solve problems.",
  instruction: "Use code execution to perform calculations and data manipulation tasks.",
  tools: [builtInCodeExecution] // Add the built-in Code Execution tool
});

// Set up session service and runner
const sessionService = new InMemorySessionService();

async function main() {
  // Create a new session
  const session = await sessionService.createSession({ 
    appName: "code_execution_example",
    userId: "user123" 
  });

  // Create runner
  const runner = new Runner({
    appName: "code_execution_example",
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

  // Example queries that benefit from code execution
  await runQuery("Calculate the fibonacci sequence up to the 20th number.");
  await runQuery("What's the square root of 144 divided by the cube root of 27?");
}

main().catch(console.error);
```

### Vertex AI Search

The `vertexAiSearchTool` uses Google Cloud's Vertex AI Search, enabling the
agent to search across your private, configured data stores (e.g., internal
documents, company policies, knowledge bases). This built-in tool requires you
to provide the specific data store ID during configuration.

```typescript
import { 
  Agent, 
  vertexAiSearchTool, 
  Runner, 
  InMemorySessionService 
} from 'adk-typescript';

// Configure Vertex AI Search with your data store ID
const myVertexSearch = vertexAiSearchTool('YOUR_DATA_STORE_ID');

// Create an agent with Vertex AI Search capability
const agent = new Agent({
  name: "company_knowledge_agent",
  model: "gemini-2.0-flash",
  description: "I can search through company documents and policies.",
  instruction: "Use Vertex AI Search to find information in internal documents when asked.",
  tools: [myVertexSearch] // Add the configured Vertex AI Search tool
});

// Set up session service and runner
const sessionService = new InMemorySessionService();

async function main() {
  // Create a new session
  const session = await sessionService.createSession({ 
    appName: "vertex_search_example",
    userId: "user123" 
  });

  // Create runner
  const runner = new Runner({
    appName: "vertex_search_example",
    agent: agent,
    sessionService: sessionService
  });

  // Function to run a search query
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

  // Example internal knowledge query
  await runQuery("What is our company's policy on remote work?");
}

main().catch(console.error);
```

## Use Built-in tools with other tools

The following code sample demonstrates how to use multiple built-in tools or how
to use built-in tools with other tools by using multiple agents:

```typescript
import { 
  Agent, 
  AgentTool, 
  googleSearch, 
  builtInCodeExecution 
} from 'adk-typescript';

// Create a specialized search agent
const searchAgent = new Agent({
  model: 'gemini-2.0-flash',
  name: 'SearchAgent',
  instruction: `
    You're a specialist in Google Search
  `,
  tools: [googleSearch],
});

// Create a specialized coding agent
const codingAgent = new Agent({
  model: 'gemini-2.0-flash',
  name: 'CodeAgent',
  instruction: `
    You're a specialist in Code Execution
  `,
  tools: [builtInCodeExecution],
});

// Create a root agent that can delegate to the specialized agents
const rootAgent = new Agent({
  name: "RootAgent",
  model: "gemini-2.0-flash",
  description: "Root Agent",
  tools: [
    new AgentTool({ agent: searchAgent }), 
    new AgentTool({ agent: codingAgent })
  ],
});
```

### Limitations

!!! warning

    Currently, for each root agent or single agent, only one built-in tool is
    supported.

 For example, the following approach that uses two or more built-in tools within
 a root agent (or a single agent) is **not** currently supported:

```typescript
// NOT SUPPORTED
const rootAgent = new Agent({
  name: "RootAgent",
  model: "gemini-2.0-flash",
  description: "Root Agent",
  tools: [builtInCodeExecution, customFunction],
});
```

!!! warning

    Built-in tools cannot be used within a sub-agent.

For example, the following approach that uses built-in tools within sub-agents
is **not** currently supported:

```typescript
// NOT SUPPORTED
const searchAgent = new Agent({
  model: 'gemini-2.0-flash',
  name: 'SearchAgent',
  instruction: `
    You're a specialist in Google Search
  `,
  tools: [googleSearch],
});

const codingAgent = new Agent({
  model: 'gemini-2.0-flash',
  name: 'CodeAgent',
  instruction: `
    You're a specialist in Code Execution
  `,
  tools: [builtInCodeExecution],
});

const rootAgent = new Agent({
  name: "RootAgent",
  model: "gemini-2.0-flash",
  description: "Root Agent",
  subAgents: [
    searchAgent,
    codingAgent
  ],
});
```
