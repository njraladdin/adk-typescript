# Model Context Protocol Tools

This guide walks you through two ways of integrating Model Context Protocol (MCP) with ADK.

## What is Model Context Protocol (MCP)?

The Model Context Protocol (MCP) is an open standard designed to standardize how Large Language Models (LLMs) like Gemini and Claude communicate with external applications, data sources, and tools. Think of it as a universal connection mechanism that simplifies how LLMs obtain context, execute actions, and interact with various systems.

MCP follows a client-server architecture, defining how **data** (resources), **interactive templates** (prompts), and **actionable functions** (tools) are exposed by an **MCP server** and consumed by an **MCP client** (which could be an LLM host application or an AI agent).

This guide covers two primary integration patterns:

1. **Using Existing MCP Servers within ADK:** An ADK agent acts as an MCP client, leveraging tools provided by external MCP servers.  
2. **Exposing ADK Tools via an MCP Server:** Building an MCP server that wraps ADK tools, making them accessible to any MCP client.

## Prerequisites

Before you begin, ensure you have the following set up:

* **Set up ADK:** Follow the standard ADK [setup](../get-started/installation.md) instructions in the quickstart.  
* **Setup Node.js and npm:** MCP requires Node.js version 18 or higher.
* **Verify Installations:** Confirm the required tools are in your PATH:

```shell
# Both commands should print the path to the executables
which npm
which npx
```

## 1. **Using MCP servers with ADK agents (ADK as an MCP client)**

This section shows two examples of using MCP servers with ADK agents. This is the most common integration pattern. Your ADK agent needs to use functionality provided by an existing service that exposes itself as an MCP Server.

### `MCPToolset` class

The examples use the `MCPToolset` class in ADK which acts as the bridge to the MCP server. Your ADK agent uses `MCPToolset` to:

1. **Connect:** Establish a connection to an MCP server process. This can be a local server communicating over standard input/output (`StdioServerParameters`) or a remote server using Server-Sent Events (`SseServerParams`).  
2. **Discover:** Query the MCP server for its available tools (`list_tools` MCP method).  
3. **Adapt:** Convert the MCP tool schemas into ADK-compatible `BaseTool` instances.  
4. **Expose:** Present these adapted tools to the ADK `Agent`.  
5. **Proxy Calls:** When the `Agent` decides to use one of these tools, `MCPToolset` forwards the call (`call_tool` MCP method) to the MCP server and returns the result.  
6. **Manage Connection:** Handle the lifecycle of the connection to the MCP server process, often requiring explicit cleanup.

### Example 1: File System MCP Server

This example demonstrates connecting to a local MCP server that provides file system operations.

#### Step 1: Attach the MCP Server to your ADK agent via `MCPToolset`

Create `agent.ts` in `./adk_agent_samples/mcp_agent/` and use the following code snippet to define a function that initializes the `MCPToolset`.

* **Important:** Replace `"/path/to/your/folder"` with the **absolute path** to an actual folder on your system.

```typescript
// ./adk_agent_samples/mcp_agent/agent.ts
import { 
  Agent, 
  MCPToolset, 
  StdioServerParameters,
  SseServerParams,
  Runner, 
  InMemorySessionService,
  InMemoryArtifactService 
} from 'adk-typescript';

// --- Step 1: Import Tools from MCP Server ---
async function getToolsAsync() {
  /**
   * Gets tools from the File System MCP Server.
   */
  console.log("Attempting to connect to MCP Filesystem server...");
  
  const toolset = new MCPToolset({
    // Use StdioServerParameters for local process communication
    connectionParams: {
      command: 'npx', // Command to run the server
      args: [
        "-y",    // Arguments for the command
        "@modelcontextprotocol/server-filesystem",
        // TODO: IMPORTANT! Change the path below to an ABSOLUTE path on your system.
        "/path/to/your/folder"
      ],
    }
    // For remote servers, you would use SseServerParams instead:
    // connectionParams: new SseServerParams({
    //   url: "http://remote-server:port/path", 
    //   headers: {} 
    // })
  });
  
  const tools = await toolset.getTools();
  
  console.log("MCP Toolset created successfully.");
  // MCP requires maintaining a connection to the local MCP Server.
  // toolset manages the cleanup of this connection.
  return { tools, toolset };
}

// --- Step 2: Agent Definition ---
async function getAgentAsync() {
  /**
   * Creates an ADK Agent equipped with tools from the MCP Server.
   */
  const { tools, toolset } = await getToolsAsync();
  console.log(`Fetched ${tools.length} tools from MCP server.`);
  
  const rootAgent = new Agent({
    model: 'gemini-2.0-flash', // Adjust model name if needed based on availability
    name: 'filesystem_assistant',
    instruction: 'Help user interact with the local filesystem using available tools.',
    tools: toolset, // Provide the MCP toolset to the ADK agent
  });
  
  return { rootAgent, toolset };
}

// --- Step 3: Main Execution Logic ---
async function main() {
  const sessionService = new InMemorySessionService();
  // Artifact service might not be needed for this example
  const artifactsService = new InMemoryArtifactService();

  const session = await sessionService.createSession({
    appName: 'mcp_filesystem_app', 
    userId: 'user_fs'
  });

  // TODO: Change the query to be relevant to YOUR specified folder.
  // e.g., "list files in the 'documents' subfolder" or "read the file 'notes.txt'"
  const query = "list files in the tests folder";
  console.log(`User Query: '${query}'`);
  
  const content = {
    role: 'user', 
    parts: [{ text: query }]
  };

  const { rootAgent, toolset } = await getAgentAsync();

  const runner = new Runner({
    appName: 'mcp_filesystem_app',
    agent: rootAgent,
    artifactService: artifactsService, // Optional
    sessionService: sessionService,
  });

  console.log("Running agent...");
  
  try {
    // Use for...await to iterate through the async generator
    for await (const event of runner.runAsync({
      sessionId: session.id, 
      userId: session.userId, 
      newMessage: content
    })) {
      console.log(`Event received: ${JSON.stringify(event)}`);
    }
  } finally {
    // Crucial Cleanup: Ensure the MCP server process connection is closed.
    console.log("Closing MCP server connection...");
    await toolset.close();
    console.log("Cleanup complete.");
  }
}

// Run the main function
main().catch(error => {
  console.error(`An error occurred: ${error}`);
});
```

#### Step 2: Observe the result

Run the script:

```shell
cd ./adk_agent_samples
npx ts-node ./mcp_agent/agent.ts
```

The following shows the expected output for the connection attempt, the MCP server starting (via npx), the ADK agent events (including the FunctionCall to list_directory and the FunctionResponse), and the final agent text response based on the file listing. Ensure the exitStack.close() runs at the end.

```text
User Query: 'list files in the tests folder'
Attempting to connect to MCP Filesystem server...
# --> npx process starts here, potentially logging to stderr/stdout
Secure MCP Filesystem Server running on stdio
Allowed directories: [
  '/path/to/your/folder'
]
# <-- npx process output ends
MCP Toolset created successfully.
Fetched [N] tools from MCP server. # N = number of tools like list_directory, read_file etc.
Running agent...
Event received: {"content":{"parts":[{"functionCall":{"id":"...","args":{"path":"tests"},"name":"list_directory"}}],"role":"model"}}
Event received: {"content":{"parts":[{"functionResponse":{"id":"...","name":"list_directory","response":{"result":{"content":[{"text":"..."}]}}}}],"role":"user"}}
Event received: {"content":{"parts":[{"text":"..."}],"role":"model"}}
Closing MCP server connection...
Cleanup complete.
```

### Example 2: Google Maps MCP Server

This follows the same pattern but targets the Google Maps MCP server.

#### Step 1: Get API Key and Enable APIs

Follow the directions at [Use API keys](https://developers.google.com/maps/documentation/javascript/get-api-key#create-api-keys) to get a Google Maps API Key.

Enable Directions API and Routes API in your Google Cloud project. For instructions, see [Getting started with Google Maps Platform](https://developers.google.com/maps/get-started#enable-api-sdk) topic.

#### Step 2: Update getToolsAsync

Modify getToolsAsync in agent.ts to connect to the Maps server, passing your API key via the env parameter of StdioServerParameters.

```typescript
// agent.ts (modify getToolsAsync and other parts as needed)
import { 
  Agent, 
  MCPToolset, 
  StdioServerParameters,
  SseServerParams,
  Runner, 
  InMemorySessionService,
  InMemoryArtifactService 
} from 'adk-typescript';

async function getToolsAsync() {
  /** Gets tools from the Google Maps MCP Server. */
  // IMPORTANT: Replace with your actual key
  const googleMapsApiKey = "YOUR_API_KEY_FROM_STEP_1";
  if (googleMapsApiKey.includes("YOUR_API_KEY")) {
    throw new Error("Please replace 'YOUR_API_KEY_FROM_STEP_1' with your actual Google Maps API key.");
  }

  console.log("Attempting to connect to MCP Google Maps server...");
  const toolset = new MCPToolset({
    connectionParams: {
      command: 'npx',
      args: [
        "-y",
        "@modelcontextprotocol/server-google-maps",
      ],
      // Pass the API key as an environment variable to the npx process
      env: {
        "GOOGLE_MAPS_API_KEY": googleMapsApiKey
      }
    }
  });
  
  const tools = await toolset.getTools();
  
  console.log("MCP Toolset created successfully.");
  return { tools, toolset };
}

// --- Step 2: Agent Definition ---
async function getAgentAsync() {
  /** Creates an ADK Agent equipped with tools from the MCP Server. */
  const { tools, toolset } = await getToolsAsync();
  console.log(`Fetched ${tools.length} tools from MCP server.`);
  
  const rootAgent = new Agent({
    model: 'gemini-2.0-flash', // Adjust if needed
    name: 'maps_assistant',
    instruction: 'Help user with mapping and directions using available tools.',
    tools: toolset,
  });
  
  return { rootAgent, toolset };
}

// --- Step 3: Main Execution Logic (modify query) ---
async function main() {
  const sessionService = new InMemorySessionService();
  const artifactsService = new InMemoryArtifactService(); // Optional

  const session = await sessionService.createSession({
    appName: 'mcp_maps_app', 
    userId: 'user_maps'
  });

  // TODO: Use specific addresses for reliable results with this server
  const query = "What is the route from 1600 Amphitheatre Pkwy to 1165 Borregas Ave";
  console.log(`User Query: '${query}'`);
  
  const content = {
    role: 'user', 
    parts: [{ text: query }]
  };

  const { rootAgent, toolset } = await getAgentAsync();

  const runner = new Runner({
    appName: 'mcp_maps_app',
    agent: rootAgent,
    artifactService: artifactsService, // Optional
    sessionService: sessionService,
  });

  console.log("Running agent...");
  
  try {
    for await (const event of runner.runAsync({
      sessionId: session.id, 
      userId: session.userId, 
      newMessage: content
    })) {
      console.log(`Event received: ${JSON.stringify(event)}`);
    }
  } finally {
    console.log("Closing MCP server connection...");
    await toolset.close();
    console.log("Cleanup complete.");
  }
}

main().catch(error => {
  console.error(`An error occurred: ${error}`);
});
```

#### Step 3: Observe the Result

Run the script:

```shell
cd ./adk_agent_samples
npx ts-node ./mcp_agent/agent.ts
```

A successful run will show events indicating the agent called the relevant Google Maps tool (likely related to directions or routes) and a final response containing the directions. An example is shown below.

```text
User Query: 'What is the route from 1600 Amphitheatre Pkwy to 1165 Borregas Ave'
Attempting to connect to MCP Google Maps server...
# --> npx process starts...
MCP Toolset created successfully.
Fetched [N] tools from MCP server.
Running agent...
Event received: {"content":{"parts":[{"functionCall":{"name":"get_directions",...}}],"role":"model"}}
Event received: {"content":{"parts":[{"functionResponse":{"name":"get_directions",...}}],"role":"user"}}
Event received: {"content":{"parts":[{"text":"Head north toward Amphitheatre Pkwy..."}],"role":"model"}}
Closing MCP server connection...
Cleanup complete.
```

## 2. **Building an MCP server with ADK tools (MCP server exposing ADK)**

This pattern allows you to wrap ADK's tools and make them available to any standard MCP client application. The example in this section exposes the loadWebPage ADK tool through the MCP server.

### Summary of steps

You will create a standard TypeScript MCP server application using the model-context-protocol library. Within this server, you will:

1. Instantiate the ADK tool(s) you want to expose (e.g., FunctionTool with loadWebPage).  
2. Implement the MCP server's handlers to advertise the ADK tool(s), converting the ADK tool definition to the MCP schema using helper functions.  
3. Implement the server to receive requests from MCP clients, identify if the request targets your wrapped ADK tool, execute the ADK tool's method, and format the result into an MCP-compliant response.

### Prerequisites

Install the MCP server library:

```shell
npm install @model-context-protocol/server @model-context-protocol/client adk-typescript
```

### Step 1: Create the MCP Server Script

Create a new TypeScript file, e.g., `adk_mcp_server.ts`.

### Step 2: Implement the Server Logic

Add the following code, which sets up an MCP server exposing the ADK loadWebPage tool.

```typescript
// adk_mcp_server.ts
import * as dotenv from 'dotenv';
import { Server, NotificationOptions } from '@model-context-protocol/server';
import { 
  Tool as McpTool, 
  TextContent
} from '@model-context-protocol/client';
import { 
  FunctionTool, 
  loadWebPage 
} from 'adk-typescript';

// Load environment variables if needed
dotenv.config();

// Initialize and configure the MCP server
const app = new Server("adk-web-tool-mcp-server");

// Define ADK tools to expose
console.log("Initializing ADK loadWebPage tool...");
const adkWebTool = new FunctionTool({
  func: loadWebPage
});
console.log(`ADK tool '${adkWebTool.name}' initialized.`);

// Convert ADK tool schema to MCP tool format
function adkToolToMcpTool(adkTool: FunctionTool): McpTool {
  const declaration = adkTool.getDeclaration();
  
  return {
    name: declaration.name,
    description: declaration.description || '',
    inputSchema: declaration.parameters,
    // For simplicity, we won't define a specific output schema
    outputSchema: undefined
  };
}

// Handler for listTools MCP method
app.listTools(async () => {
  console.log("MCP Server: Received list_tools request.");
  const mcpToolSchema = adkToolToMcpTool(adkWebTool);
  console.log(`MCP Server: Advertising tool: ${mcpToolSchema.name}`);
  return [mcpToolSchema];
});

// Handler for callTool MCP method
app.callTool(async (request) => {
  const { name, arguments: args } = request;
  console.log(`MCP Server: Received call_tool request for '${name}' with args:`, args);

  // Check if the requested tool name matches our wrapped ADK tool
  if (name === adkWebTool.name) {
    try {
      // Execute the ADK tool - note we don't have a full ADK context here
      const adkResponse = await adkWebTool.execute(args, null);
      console.log(`MCP Server: ADK tool '${name}' executed successfully.`);
      
      // Format the ADK tool's response into MCP format
      const responseText = JSON.stringify(adkResponse, null, 2);
      return [{ 
        type: "text", 
        text: responseText 
      } as TextContent];
    } catch (e) {
      console.error(`MCP Server: Error executing ADK tool '${name}':`, e);
      const errorText = JSON.stringify({
        error: `Failed to execute tool '${name}': ${e.message}`
      });
      return [{ 
        type: "text", 
        text: errorText 
      } as TextContent];
    }
  } else {
    console.log(`MCP Server: Tool '${name}' not found.`);
    const errorText = JSON.stringify({
      error: `Tool '${name}' not implemented.`
    });
    return [{ 
      type: "text", 
      text: errorText 
    } as TextContent];
  }
});

// Start the server
async function startServer() {
  try {
    console.log("Starting MCP server over stdio...");
    await app.run();
    console.log("MCP Server run loop finished.");
  } catch (error) {
    console.error("MCP Server error:", error);
  }
}

// Run the server
startServer().catch(console.error);
```

### Step 3: Test your MCP Server with ADK

Create a client that connects to your MCP server. You'll create an ADK agent that uses your custom MCP server via the MCPToolset:

```typescript
// mcp_client.ts
import { 
  Agent, 
  MCPToolset, 
  StdioServerParameters,
  Runner, 
  InMemorySessionService 
} from 'adk-typescript';

async function main() {
  // Connect to our custom MCP server
  console.log("Connecting to custom ADK MCP Server...");
  
  const toolset = new MCPToolset({
    connectionParams: {
      command: 'node', // Or 'ts-node' depending on your setup
      args: [
        "./adk_mcp_server.js" // Path to your compiled server or use ts-node with .ts file
      ]
    }
  });
  
  const tools = await toolset.getTools();
  
  console.log(`Connected to MCP Server, discovered ${tools.length} tools`);
  
  // Create an agent with the MCP tools
  const agent = new Agent({
    name: "web_agent",
    model: "gemini-2.0-flash",
    instruction: "You can help users browse web pages by fetching their content.",
    tools: tools
  });
  
  // Setup session and runner
  const sessionService = new InMemorySessionService();
  const session = await sessionService.createSession({
    appName: "mcp_client_demo",
    userId: "test_user"
  });
  
  const runner = new Runner({
    appName: "mcp_client_demo",
    agent: agent,
    sessionService: sessionService
  });
  
  // Test with a query
  const query = "Can you fetch the content of the webpage https://example.com?";
  console.log(`User query: "${query}"`);
  
  try {
    // Run the agent
    for await (const event of runner.runAsync({
      sessionId: session.id,
      userId: session.userId,
      newMessage: {
        role: "user",
        parts: [{ text: query }]
      }
    })) {
      console.log(`Event: ${JSON.stringify(event)}`);
    }
  } finally {
    // Clean up
    console.log("Cleaning up MCP connection...");
    await exitStack.close();
  }
}

main().catch(console.error);
```

To run this test:

```shell
# Compile and run (or use ts-node)
npx tsc adk_mcp_server.ts
npx tsc mcp_client.ts
node mcp_client.js
```

## MCP with ADK Web UI

You can also define your agent with MCP tools, and then interact with your agent with the ADK Web UI. 

```typescript
// agent.ts
import { Agent, MCPToolset, StdioServerParameters } from 'adk-typescript';

export async function createAgent() {
  const { tools, exitStack } = await MCPToolset.fromServer({
    connectionParams: new StdioServerParameters({
      command: 'npx',
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        // Change to your directory
        "/path/to/your/folder"
      ]
    })
  });

  const agent = new Agent({
    model: 'gemini-2.0-flash',
    name: 'filesystem_assistant',
    instruction: 'Help user interact with the local filesystem using available tools.',
    tools: tools
  });

  // Store exitStack for cleanup
  // In a real application, you need to manage this resource carefully
  (global as any).mcpExitStack = exitStack;

  return agent;
}

// This function is used when the app is shutting down
export async function cleanupAgent() {
  const exitStack = (global as any).mcpExitStack;
  if (exitStack) {
    await exitStack.close();
    console.log("MCP connections closed");
  }
}

// For adk-typescript web UI, export an async function that returns the agent
export default createAgent;
```

Configure your web server to properly handle the lifecycle of the MCP connections, ensuring they're cleaned up when sessions end.

## Key considerations

When working with MCP and ADK, keep these points in mind:

* **Protocol vs. Library:** MCP is a protocol specification, defining communication rules. ADK is a framework for building agents. MCPToolset bridges these by implementing the client side of the MCP protocol within the ADK framework.

* **ADK Tools vs. MCP Tools:**

    * ADK Tools (BaseTool, FunctionTool, AgentTool, etc.) are objects designed for direct use within the ADK's Agent and Runner.  
    * MCP Tools are capabilities exposed by an MCP Server according to the protocol's schema. MCPToolset makes these look like ADK tools to an Agent.  
    * Langchain/CrewAI Tools are specific implementations within those libraries, often simple functions or classes, lacking the server/protocol structure of MCP. ADK offers wrappers (LangchainTool, CrewaiTool) for some interoperability.

* **Asynchronous nature:** Both ADK and the MCP libraries are heavily based on asynchronous programming. Tool implementations and server handlers should generally be async functions.

* **Stateful sessions (MCP):** MCP establishes stateful, persistent connections between a client and server instance. This differs from typical stateless REST APIs.

    * **Deployment:** This statefulness can pose challenges for scaling and deployment, especially for remote servers handling many users. The original MCP design often assumed client and server were co-located. Managing these persistent connections requires careful infrastructure considerations (e.g., load balancing, session affinity).  
    * **ADK MCPToolset:** Manages this connection lifecycle. The exitStack pattern shown in the examples is crucial for ensuring the connection (and potentially the server process) is properly terminated when the ADK agent finishes.

## Further Resources

* [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
* [MCP Specification](https://modelcontextprotocol.io/specification/)  
* [MCP Examples and SDKs](https://github.com/modelcontextprotocol/)