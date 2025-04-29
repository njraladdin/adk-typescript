
# Building a Multi-Agent Weather Bot Tutorial (ADK TypeScript)

Welcome to this hands-on tutorial for building a sophisticated multi-agent system using the **ADK TypeScript** library. By following this tutorial, you'll create a Weather Bot system, starting simple and progressively adding more advanced ADK features.

## What You'll Build

This tutorial provides a step-by-step guide to building a Weather Bot that:

1.  Starts as a **single agent** that can look up weather information using a tool.
2.  Expands to become **multi-model**, working with different Large Language Models.
3.  Grows into a **team of agents** collaborating through delegation.
4.  Incorporates **shared memory** using session state to remember user preferences.
5.  Implements **safety guardrails** using callbacks for secure operations.

Along the way, you'll learn core ADK TypeScript concepts including tool definition (`FunctionTool`), multi-LLM flexibility (`LlmRegistry`, `LiteLlm`), agent delegation (`subAgents`), session state for memory (`ToolContext`, `outputKey`), and safety guardrails (`beforeModelCallback`, `beforeToolCallback`).

## Prerequisites

*   A solid understanding of TypeScript programming and Node.js environments.
*   Familiarity with how Large Language Models (LLMs) work.
*   Completion of the ADK TypeScript Quickstart tutorial is recommended.
*   API keys for Google AI (Gemini), and optionally OpenAI and Anthropic.

## Step 0: Setup and Installation

Before we begin building our Weather Bot, we need to set up our development environment with the necessary libraries and API keys.

### Install Required Libraries

```bash
# Install the core ADK TypeScript library (assuming package name)
# Replace 'adk-typescript' with the actual published package name if different
npm install adk-typescript

# Install dotenv for environment variable management
npm install dotenv @types/dotenv

# Optional: For making HTTP requests (e.g., real weather API)
npm install axios @types/axios

# Optional: For multi-model support via LiteLLM
# Check LiteLLM documentation for TypeScript compatibility and installation
npm install litellm @types/node # Example, verify actual package

# Optional: For specific model providers (if not using LiteLLM or for Vertex)
npm install @google/generative-ai # For Google AI Gemini models
# npm install openai
# npm install @anthropic-ai/sdk
```

### Environment Setup

Create a `.env` file in your project root with your API keys:

```env
# Required for Google AI / Gemini models via ADK's built-in support
GOOGLE_API_KEY=your_google_api_key

# Optional: Set these if you plan to use Vertex AI directly or for specific models
# GOOGLE_CLOUD_PROJECT=your_gcp_project_id
# GOOGLE_CLOUD_LOCATION=your_gcp_region
# Set this to '1' or 'true' to force using Vertex AI backend instead of Google AI
# GOOGLE_GENAI_USE_VERTEXAI=1

# Optional (Needed if using these providers via LiteLlm wrapper)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Create your project entry point

Create a file named `index.ts` (or your preferred entry point name) to serve as your project entry point:

```typescript
import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

// Import the ADK TypeScript core components using the assumed package name
import {
  LlmAgent as Agent, // Alias LlmAgent as Agent for convenience
  Runner,
  InMemoryRunner, // Use InMemoryRunner for simple local testing
  InMemorySessionService,
  Content,
  Part,
  FunctionTool, // Import FunctionTool for creating tools
  ToolContext, // Import ToolContext for stateful tools
  LlmRegistry, // Import LlmRegistry for Google models
  LlmRequest, // Needed for callbacks
  LlmResponse, // Needed for callbacks
  CallbackContext, // Needed for callbacks
  BaseTool, // Needed for callbacks
  Event, // Import Event for interacting with runner output
  LiteLlm, // Import LiteLlm for multi-model support
} from 'adk-typescript'; // Assuming 'adk-typescript' is the package name

// Define constants for model names
const MODEL_GEMINI_1_5_FLASH = "gemini-1.5-flash"; // Handled by LlmRegistry
const MODEL_GEMINI_1_5_PRO = "gemini-1.5-pro";   // Handled by LlmRegistry
const MODEL_GPT_4O = "openai/gpt-4o";           // Needs LiteLlm wrapper
const MODEL_CLAUDE_SONNET = "anthropic/claude-3.5-sonnet"; // Needs LiteLlm wrapper

console.log("✅ ADK TypeScript setup complete.");

// We'll add our agent code below this point

// --- Placeholder for functions/classes defined in later steps ---
// These are needed for type checking if running the whole file at once
declare function getWeather(params: { city: string }, context?: ToolContext): Promise<any>;
declare function sayHello(params: { name?: string }, context?: ToolContext): Promise<string>;
declare function sayGoodbye(params: {}, context?: ToolContext): Promise<string>;
declare function getWeatherStateful(params: { city: string }, toolContext: ToolContext): Promise<any>;
declare function block_keyword_guardrail(callback_context: CallbackContext, llm_request: LlmRequest): LlmResponse | null;
declare function block_paris_tool_guardrail(tool: BaseTool, args: Record<string, any>, tool_context: ToolContext): Record<string, any> | null;

// --- Placeholder Agents ---
let weatherAgent: Agent;
let greetingAgent: Agent | null = null;
let farewellAgent: Agent | null = null;
let rootAgent: Agent | null = null;
let rootAgentStateful: Agent | null = null;
let rootAgentModelGuardrail: Agent | null = null;
let rootAgentToolGuardrail: Agent | null = null;

// --- Placeholder Runners ---
let runner: InMemoryRunner;
let runnerGpt: InMemoryRunner | null = null;      // For GPT test
let runnerClaude: InMemoryRunner | null = null;    // For Claude test
let runnerRoot: InMemoryRunner | null = null;      // For team test
let runnerRootStateful: InMemoryRunner | null = null; // For state test
let runnerRootModelGuardrail: InMemoryRunner | null = null; // For model guardrail test
let runnerRootToolGuardrail: InMemoryRunner | null = null; // For tool guardrail test

// --- Placeholder Session Service ---
let sessionService: InMemorySessionService;
let sessionServiceStateful: InMemorySessionService;

// --- Placeholder Session IDs ---
const APP_NAME = "weather_tutorial_app";
let USER_ID = "user_1";
let SESSION_ID = "session_001";
let USER_ID_STATEFUL = "user_state_demo";
let SESSION_ID_STATEFUL = "session_state_demo_001";
```

## Step 1: Building a Basic Weather Lookup Agent

In this first step, we'll create a simple but functional weather lookup agent. It will use a custom-built tool to retrieve weather information for different cities and respond to user queries.

### **1\. Create the Weather Tool**

First, let's define a tool that simulates looking up weather information. We define an `async` function and wrap it with ADK's `FunctionTool`.

```typescript
// @title Define the Weather Tool
import { FunctionTool, ToolContext } from 'adk-typescript'; // Correct import

/**
 * Returns current weather information for a specified city
 *
 * @param params - Object containing the city name.
 * @param params.city - The name of the city to look up weather for.
 * @param context - The tool context (optional, not used here).
 * @returns A Promise resolving to an object with status and report/error message.
 */
async function getWeather(
  params: { city: string },
  context?: ToolContext // Optional ToolContext
): Promise<{ status: string; report?: string; error_message?: string }> {
  const city = params.city;
  console.log(`--- Tool: getWeather called for city: ${city} ---`);

  // Normalize city name for comparison (lowercase, trim spaces)
  const cityNormalized = city.toLowerCase().trim();

  // Mock weather database (in production, you'd call a real weather API)
  const mockWeatherDb: Record<string, { status: string; report: string }> = {
    "newyork": {status: "success", report: "The weather in New York is sunny with a temperature of 25°C."},
    "london": {status: "success", report: "It's cloudy in London with a temperature of 15°C."},
    "tokyo": {status: "success", report: "Tokyo is experiencing light rain and a temperature of 18°C."},
  };

  // Best Practice: Handle potential errors gracefully within the tool
  if (mockWeatherDb[cityNormalized]) {
    return mockWeatherDb[cityNormalized];
  } else {
    return {status: "error", error_message: `Sorry, I don't have weather information for '${city}'.`};
  }
}

// Wrap the function in an ADK FunctionTool
const getWeatherTool = new FunctionTool({
  name: "getWeather", // Function name for the LLM
  description: "Returns current weather information for a specified city",
  fn: getWeather, // Pass the async function
  // Define the schema for the LLM to understand parameters
  functionDeclaration: {
    name: "getWeather",
    description: "Returns current weather information for a specified city",
    parameters: {
      type: 'object', // Use JSON schema types
      properties: {
        city: {
          type: 'string',
          description: 'The name of the city to look up weather for (e.g., "New York", "London")'
        }
      },
      required: ['city'] // Specify required parameters
    }
  }
});

console.log("✅ Weather tool 'getWeatherTool' defined.");

// Example tool usage (optional self-test)
// getWeather({ city: "New York" }).then(console.log);
// getWeather({ city: "Paris" }).then(console.log);
```

---

### **2\. Define the Agent**

Now, let's create the `Agent` (`LlmAgent`). We use `LlmRegistry` to get the Gemini model instance.

```typescript
// @title Define the Weather Agent
import { LlmAgent as Agent, LlmRegistry } from 'adk-typescript'; // Correct imports

// Use one of the model constants defined earlier
const AGENT_MODEL_NAME_STEP1 = MODEL_GEMINI_1_5_FLASH; // Starting with a standard Gemini model

// Use LlmRegistry to get the model instance
const agentLlmStep1 = LlmRegistry.newLlm(AGENT_MODEL_NAME_STEP1);

weatherAgent = new Agent({ // Assign to the declared variable
  name: "weather_agent_v1",
  model: agentLlmStep1, // Pass the model instance
  description: "Provides weather information for specific cities.",
  instruction: "You are a helpful weather assistant. Your primary goal is to provide current weather reports. " +
               "When the user asks for the weather in a specific city, " +
               "you MUST use the 'getWeather' tool to find the information. " +
               "Analyze the tool's response: if the status is 'error', inform the user politely about the error message. " +
               "If the status is 'success', present the weather 'report' clearly and concisely to the user. " +
               "Only use the tool when a city is mentioned for a weather request.",
  tools: [getWeatherTool], // Pass the FunctionTool instance
});

console.log(`✅ Agent '${weatherAgent.name}' created using model '${AGENT_MODEL_NAME_STEP1}'.`);
```

---

### **3\. Setup Runner and Session Service**

We use `InMemoryRunner` which includes an `InMemorySessionService`.

```typescript
// @title Setup Runner and Session Service
import { InMemoryRunner, InMemorySessionService } from 'adk-typescript'; // Correct imports

// --- Session Management ---
// InMemorySessionService is managed internally by InMemoryRunner, but we can create one explicitly if needed.
// Let's stick with the simpler InMemoryRunner approach for this step.

// --- Runner ---
// Use InMemoryRunner, passing the agent and app name. It handles session service internally.
runner = new InMemoryRunner(weatherAgent, APP_NAME); // Assign to declared variable
console.log(`✅ Runner created for agent '${runner.agent.name}'. It will manage its own in-memory session service.`);

// We can still access the internally managed session service if needed:
sessionService = runner.sessionService as InMemorySessionService; // Cast for type safety

// Create the initial session using the runner's service
const initialSession = sessionService.createSession({
  appName: APP_NAME,
  userId: USER_ID,
  sessionId: SESSION_ID
});
console.log(`✅ Initial Session created via runner's service: App='${APP_NAME}', User='${USER_ID}', Session='${SESSION_ID}'`);
```

---

### **4\. Interact with the Agent**

Define the `async` helper function `callAgentAsync`. It uses the `Runner`'s `run` method which returns an `AsyncGenerator<Event>`.

```typescript
// @title Define Agent Interaction Function
import { Content, Part, Event, Runner, InMemoryRunner } from 'adk-typescript'; // Correct imports

async function callAgentAsync(
  query: string,
  theRunner: InMemoryRunner = runner, // Default to our initial runner, typed correctly
  userId: string = USER_ID,          // Default user
  sessionId: string = SESSION_ID     // Default session
): Promise<void> {
  console.log(`\n>>> User Query: ${query}`);

  // Prepare the user's message in ADK format
  const userMessage: Content = { // Use the Content interface directly
    role: 'user',
    parts: [{ text: query } as Part] // Cast to Part
  };

  let finalResponseText = "Agent did not produce a final response."; // Default

  try {
    // Ensure session exists before running (InMemoryRunner handles this implicitly,
    // but explicit check is good practice if using separate SessionService)
    let currentSession = await theRunner.sessionService.getSession({ appName: theRunner.appName, userId, sessionId });
    if (!currentSession) {
        console.log(`Session ${sessionId} not found for user ${userId} in app ${theRunner.appName}, creating...`);
        // Let InMemoryRunner handle session creation on first run if needed
    }

    // Key Concept: runner.run executes the agent logic and yields Events.
    const eventStream = theRunner.run({ // Use theRunner passed in
      userId: userId,
      sessionId: sessionId,
      newMessage: userMessage
    });

    for await (const event of eventStream) {
      // console.log(`  [Event] Author: ${event.author}, Final: ${event.isFinalResponse()}, Content:`, event.content?.parts[0]); // Debug log

      // Key Concept: isFinalResponse() marks the concluding message for the turn.
      if (event.isFinalResponse()) {
        if (event.content?.parts?.length > 0) {
          const textPart = event.content.parts.find(p => p.text);
          finalResponseText = textPart?.text || finalResponseText;
        } else if (event.actions?.escalate) {
          finalResponseText = `Agent escalated: ${event.errorMessage || 'No specific message.'}`;
        }
        break; // Stop processing events once the final response is found
      }
    }
  } catch (error) {
     console.error("Error during agent execution:", error);
     finalResponseText = `Error: ${error instanceof Error ? error.message : String(error)}`;
  }

  console.log(`<<< Agent Response: ${finalResponseText}`);
}
```

---

### **5\. Run the Conversation**

Test the agent with different queries.

```typescript
// @title Run the Initial Conversation

async function runConversationStep1(): Promise<void> {
  // Ensure the runner is defined
  if (!runner) {
    console.error("Runner is not defined. Cannot run conversation.");
    return;
  }
  console.log("\n--- Running Initial Conversation ---");
  await callAgentAsync("What is the weather like in London?");
  await callAgentAsync("How about Paris?"); // Expecting the tool's error message
  await callAgentAsync("Tell me the weather in New York");
}

// Execute the conversation
runConversationStep1().catch(console.error);
```

**Expected Output:** (Similar to the previous version)

```text
✅ Runner created for agent 'weather_agent_v1'. It will manage its own in-memory session service.
✅ Initial Session created via runner's service: App='weather_tutorial_app', User='user_1', Session='session_001'

--- Running Initial Conversation ---

>>> User Query: What is the weather like in London?
--- Tool: getWeather called for city: London ---
<<< Agent Response: It's cloudy in London with a temperature of 15°C.

>>> User Query: How about Paris?
--- Tool: getWeather called for city: Paris ---
<<< Agent Response: Sorry, I don't have weather information for 'Paris'.

>>> User Query: Tell me the weather in New York
--- Tool: getWeather called for city: New York ---
<<< Agent Response: The weather in New York is sunny with a temperature of 25°C.
```

---

You've successfully built the basic agent using the correct ADK TypeScript components (`LlmAgent`, `FunctionTool`, `InMemoryRunner`).

## Step 2: Going Multi-Model with LiteLLM

Now, let's use the `LiteLlm` wrapper to interact with models like GPT-4o and Claude Sonnet.

---

### **1\. Update Agent Interaction Function**

(No changes needed, already done in Step 1, Section 4).

---

### **2\. Add Support for LiteLLM**

Ensure the `LiteLlm` class is imported correctly:

```typescript
// Ensure this import is present from your setup (Step 0)
import { LiteLlm } from 'adk-typescript'; // Correct import path from index
```

---

### **3\. Create and Test Different Model-Based Agents**

Create agents using `LiteLlm` and test them with dedicated `InMemoryRunner` instances.

```typescript
// @title Define and Test GPT Agent via LiteLlm
import { LlmAgent as Agent, InMemoryRunner, LiteLlm } from 'adk-typescript'; // Correct imports

// Ensure 'getWeatherTool' FunctionTool instance from Step 1 is defined.
// Ensure 'callAgentAsync' is defined from earlier.

// --- Agent using GPT-4o via LiteLlm ---
weatherAgentGpt = null; // Reset from previous steps
runnerGpt = null;       // Reset runner

try {
  weatherAgentGpt = new Agent({
    name: "weather_agent_gpt",
    // Key change: Use LiteLlm wrapper with provider/model syntax
    model: new LiteLlm({ model: MODEL_GPT_4O }), // Assuming LiteLlm class takes { model: string }
    description: "Provides weather information (using GPT-4o).",
    instruction: "You are a helpful weather assistant powered by GPT-4o. " +
                "Use the 'getWeather' tool for city weather requests. " +
                "Clearly present successful reports or polite error messages based on the tool's output status.",
    tools: [getWeatherTool], // Re-use the FunctionTool instance
  });
  console.log(`✅ Agent '${weatherAgentGpt.name}' created using LiteLlm model '${MODEL_GPT_4O}'.`);

  // Define constants for identifying the interaction context
  const APP_NAME_GPT = "weather_tutorial_app_gpt";
  const USER_ID_GPT = "user_1_gpt";
  const SESSION_ID_GPT = "session_001_gpt";

  // Create an InMemoryRunner specific to this agent
  runnerGpt = new InMemoryRunner(weatherAgentGpt, APP_NAME_GPT);
  console.log(`✅ Runner created for agent '${runnerGpt.agent.name}'.`);

  // --- Test the GPT Agent ---
  console.log("\n--- Testing GPT Agent (LiteLlm) ---");
  await callAgentAsync("What's the weather in Tokyo?", runnerGpt, USER_ID_GPT, SESSION_ID_GPT);

} catch (e) {
  console.error(`❌ Could not create or run GPT agent '${MODEL_GPT_4O}'. Check API Key/LiteLLM setup. Error:`, e);
}

// @title Define and Test Claude Agent via LiteLlm

// --- Agent using Claude Sonnet via LiteLlm ---
weatherAgentClaude = null; // Reset
runnerClaude = null;       // Reset

try {
  weatherAgentClaude = new Agent({
    name: "weather_agent_claude",
    // Key change: Use LiteLlm wrapper
    model: new LiteLlm({ model: MODEL_CLAUDE_SONNET }),
    description: "Provides weather information (using Claude Sonnet).",
    instruction: "You are a helpful weather assistant powered by Claude Sonnet. " +
                "Use the 'getWeather' tool for city weather requests. " +
                "Analyze the tool's dictionary output ('status', 'report'/'error_message'). " +
                "Clearly present successful reports or polite error messages.",
    tools: [getWeatherTool], // Re-use the FunctionTool instance
  });
  console.log(`✅ Agent '${weatherAgentClaude.name}' created using LiteLlm model '${MODEL_CLAUDE_SONNET}'.`);

  // Define constants for identifying the interaction context
  const APP_NAME_CLAUDE = "weather_tutorial_app_claude";
  const USER_ID_CLAUDE = "user_1_claude";
  const SESSION_ID_CLAUDE = "session_001_claude";

  // Create an InMemoryRunner specific to this agent
  runnerClaude = new InMemoryRunner(weatherAgentClaude, APP_NAME_CLAUDE);
  console.log(`✅ Runner created for agent '${runnerClaude.agent.name}'.`);

  // --- Test the Claude Agent ---
  console.log("\n--- Testing Claude Agent (LiteLlm) ---");
  await callAgentAsync("Weather in London please.", runnerClaude, USER_ID_CLAUDE, SESSION_ID_CLAUDE);

} catch (e) {
  console.error(`❌ Could not create or run Claude agent '${MODEL_CLAUDE_SONNET}'. Check API Key/LiteLLM setup. Error:`, e);
}
```

You should see successful runs (if API keys are set) demonstrating multi-model capability.

## Step 3: Building a Team of Agents with Delegation

Let's create specialized agents for greetings and farewells and have our main weather agent delegate to them.

### **1\. Define Tools for Sub-Agents**

Define `async` functions and wrap them in `FunctionTool`.

```typescript
// @title Define Tools for Greeting and Farewell Agents
import { FunctionTool, ToolContext } from 'adk-typescript'; // Correct import

async function sayHello(
  params: { name?: string },
  context?: ToolContext
): Promise<string> {
  const name = params.name || "there";
  console.log(`--- Tool: sayHello called with name: ${name} ---`);
  return `Hello, ${name}!`;
}

const sayHelloTool = new FunctionTool({
  name: "sayHello",
  description: "Provides a friendly greeting to the user, optionally using their name.",
  fn: sayHello,
  functionDeclaration: {
    name: "sayHello",
    description: "Provides a friendly greeting to the user.",
    parameters: { type: 'object', properties: { name: { type: 'string', description: "Optional name to greet." } } }
  }
});

async function sayGoodbye(params: {}, context?: ToolContext): Promise<string> {
  console.log(`--- Tool: sayGoodbye called ---`);
  return "Goodbye! Have a great day.";
}

const sayGoodbyeTool = new FunctionTool({
  name: "sayGoodbye",
  description: "Provides a polite goodbye message.",
  fn: sayGoodbye,
  functionDeclaration: { name: "sayGoodbye", description: "Provides a polite goodbye message.", parameters: { type: 'object', properties: {} } }
});

console.log("✅ Greeting and Farewell tools defined.");
```

---

### **2\. Create Specialized Sub-Agents**

```typescript
// @title Define Greeting and Farewell Sub-Agents
import { LlmAgent as Agent, LlmRegistry } from 'adk-typescript'; // Correct imports

// --- Greeting Agent ---
greetingAgent = null; // Reset
try {
  const greetingModel = LlmRegistry.newLlm(MODEL_GEMINI_1_5_FLASH);
  greetingAgent = new Agent({
    model: greetingModel,
    name: "greeting_agent",
    instruction: "You are the Greeting Agent. Your ONLY task is to provide a friendly greeting using the 'sayHello' tool. Do nothing else.",
    description: "Handles simple greetings and hellos using the 'sayHello' tool.",
    tools: [sayHelloTool], // Use FunctionTool instance
  });
  console.log(`✅ Agent '${greetingAgent.name}' created.`);
} catch (e) { console.error(`❌ Error creating Greeting agent: ${e}`); }

// --- Farewell Agent ---
farewellAgent = null; // Reset
try {
  const farewellModel = LlmRegistry.newLlm(MODEL_GEMINI_1_5_FLASH);
  farewellAgent = new Agent({
    model: farewellModel,
    name: "farewell_agent",
    instruction: "You are the Farewell Agent. Your ONLY task is to provide a polite goodbye message using the 'sayGoodbye' tool. Do not perform any other actions.",
    description: "Handles simple farewells and goodbyes using the 'sayGoodbye' tool.",
    tools: [sayGoodbyeTool], // Use FunctionTool instance
  });
  console.log(`✅ Agent '${farewellAgent.name}' created.`);
} catch (e) { console.error(`❌ Error creating Farewell agent: ${e}`); }
```

---

### **3\. Define the Root Agent with Sub-Agents**

Configure the root agent with `subAgents`.

```typescript
// @title Define the Root Agent with Sub-Agents
import { LlmAgent as Agent, LlmRegistry } from 'adk-typescript'; // Correct imports

// Ensure sub-agents and getWeatherTool were created successfully.
rootAgent = null; // Reset

if (greetingAgent && farewellAgent && getWeatherTool) {
  const rootAgentModelName = MODEL_GEMINI_1_5_PRO;
  const rootLlm = LlmRegistry.newLlm(rootAgentModelName);

  rootAgent = new Agent({ // Assign to declared variable
    name: "weather_agent_v2_team",
    model: rootLlm,
    description: "The main coordinator agent. Handles weather requests and delegates greetings/farewells to specialists.",
    instruction: "You are the main Weather Agent coordinating a team. Your primary responsibility is to provide weather information. " +
                "Use the 'getWeather' tool ONLY for specific weather requests (e.g., 'weather in London'). " +
                "You have specialized sub-agents: " +
                "1. 'greeting_agent': Handles simple greetings like 'Hi', 'Hello'. Delegate to it for these. " +
                "2. 'farewell_agent': Handles simple farewells like 'Bye', 'See you'. Delegate to it for these. " +
                "Analyze the user's query. If it's a greeting, delegate to 'greeting_agent'. If it's a farewell, delegate to 'farewell_agent'. " +
                "If it's a weather request, handle it yourself using 'getWeather'. " +
                "For anything else, respond appropriately or state you cannot handle it.",
    tools: [getWeatherTool], // Root agent still needs the weather tool
    subAgents: [greetingAgent, farewellAgent] // Link sub-agents
  });

  console.log(`✅ Root Agent '${rootAgent.name}' created with sub-agents: ${rootAgent.subAgents?.map(sa => sa.name).join(', ')}`);

} else {
  console.log("❌ Cannot create root agent because prerequisites are missing.");
}
```

---

### **4\. Interact with the Agent Team**

Test delegation using a dedicated `InMemoryRunner`.

```typescript
// @title Interact with the Agent Team
import { InMemoryRunner } from 'adk-typescript'; // Correct import

// Ensure the root agent is defined.
// Ensure the callAgentAsync function is defined.

if (rootAgent) {
  async function runTeamConversation(): Promise<void> {
    console.log("\n--- Testing Agent Team Delegation ---");

    // Create a new Runner specifically for this team test
    const APP_NAME_TEAM = "weather_tutorial_agent_team";
    const USER_ID_TEAM = "user_1_agent_team";
    const SESSION_ID_TEAM = "session_001_agent_team";

    // Use InMemoryRunner for this isolated test
    runnerRoot = new InMemoryRunner(rootAgent, APP_NAME_TEAM); // Assign to declared variable
    console.log(`✅ Runner created for agent team leader '${rootAgent.name}'.`);

    // Create the initial session for the runner
    await runnerRoot.sessionService.createSession({ appName: APP_NAME_TEAM, userId: USER_ID_TEAM, sessionId: SESSION_ID_TEAM });
    console.log(`✅ Session created for team test: ${SESSION_ID_TEAM}`);

    // Interact via the root agent's runner
    await callAgentAsync("Hello there!", runnerRoot, USER_ID_TEAM, SESSION_ID_TEAM);
    await callAgentAsync("What is the weather in New York?", runnerRoot, USER_ID_TEAM, SESSION_ID_TEAM);
    await callAgentAsync("Thanks, bye!", runnerRoot, USER_ID_TEAM, SESSION_ID_TEAM);
  }

  // Execute the conversation
  runTeamConversation().catch(console.error);
} else {
  console.log("\n⚠️ Skipping agent team conversation as the root agent was not successfully defined.");
}
```

Confirm delegation by observing the tool logs.

## Step 4: Adding Memory and Personalization with Session State

Let's use `ToolContext` and `outputKey` to manage session state.

### **1\. Initialize New Session Service and State**

```typescript
// @title 1. Initialize New Session Service and State
import { InMemorySessionService, State } from 'adk-typescript'; // Correct imports

// Create a NEW session service instance for this state demonstration
sessionServiceStateful = new InMemorySessionService(); // Assign to declared variable
console.log("✅ New InMemorySessionService created for state demonstration.");

// Define NEW session/user IDs for this part of the tutorial
USER_ID_STATEFUL = "user_state_demo"; // Reset or ensure declaration
SESSION_ID_STATEFUL = "session_state_demo_001"; // Reset or ensure declaration

// Define initial state data
const initialStateStep4 = {
  user_preference_temperature_unit: "Celsius"
};

// Create the session, providing the initial state
const sessionStateful = sessionServiceStateful.createSession({
  appName: APP_NAME,
  userId: USER_ID_STATEFUL,
  sessionId: SESSION_ID_STATEFUL,
  state: initialStateStep4 // Pass the state object
});
console.log(`✅ Session '${SESSION_ID_STATEFUL}' created for user '${USER_ID_STATEFUL}'.`);

// Verify the initial state was set correctly
const retrievedSessionStep4 = sessionServiceStateful.getSession({
  appName: APP_NAME,
  userId: USER_ID_STATEFUL,
  sessionId: SESSION_ID_STATEFUL
});
console.log("\n--- Initial Session State ---");
if (retrievedSessionStep4) {
  console.log(retrievedSessionStep4.state); // Access state directly (InMemorySessionService returns plain object)
} else {
  console.log("Error: Could not retrieve session.");
}
```

---

### **2. Create State-Aware Weather Tool**

This tool uses `ToolContext` to read preferences and write data.

```typescript
// @title 2. Create State-Aware Weather Tool
import { FunctionTool, ToolContext } from 'adk-typescript'; // Correct imports

/**
 * Retrieves weather and formats temperature according to user preference.
 * Writes the checked city to state using toolContext.actions.
 */
async function getWeatherStateful(
  params: { city: string },
  toolContext: ToolContext // <<< Added ToolContext parameter
): Promise<{ status: string; report?: string; error_message?: string }> {
  const city = params.city;
  console.log(`--- Tool: getWeatherStateful called for ${city} ---`);

  // --- Read preference from state ---
  // Use toolContext.state.get() - it's a plain object here
  const preferredUnit = toolContext.state['user_preference_temperature_unit'] || "Celsius";
  console.log(`--- Tool: Reading state 'user_preference_temperature_unit': ${preferredUnit} ---`);

  const cityNormalized = city.toLowerCase().trim();

  // Mock weather data (Celsius)
  const mockWeatherDb: Record<string, { temp_c: number; condition: string }> = {
    "newyork": { temp_c: 25, condition: "sunny" },
    "london": { temp_c: 15, condition: "cloudy" },
    "tokyo": { temp_c: 18, condition: "light rain" },
  };

  if (mockWeatherDb[cityNormalized]) {
    const data = mockWeatherDb[cityNormalized];
    const temp_c = data.temp_c;
    const condition = data.condition;
    let tempValue: number;
    let tempUnit: string;

    if (preferredUnit === "Fahrenheit") {
      tempValue = (temp_c * 9/5) + 32; tempUnit = "°F";
    } else {
      tempValue = temp_c; tempUnit = "°C";
    }

    const report = `The weather in ${city} is ${condition} with a temperature of ${tempValue.toFixed(0)}${tempUnit}.`;
    const result = { status: "success", report: report };
    console.log(`--- Tool: Generated report in ${preferredUnit}. Result:`, result, "---");

    // --- Write back to state using ToolContext actions ---
    // stateDelta is the correct way for tools to signal state changes
    toolContext.actions.stateDelta['last_city_checked_stateful'] = city;
    console.log(`--- Tool: Updated state delta 'last_city_checked_stateful': ${city} ---`);

    return result;
  } else {
    const error_msg = `Sorry, I don't have weather information for '${city}'.`;
    console.log(`--- Tool: City '${city}' not found. ---`);
    return { status: "error", error_message: error_msg };
  }
}

// Wrap in FunctionTool
const getWeatherStatefulTool = new FunctionTool({
  name: "getWeatherStateful",
  description: "Returns current weather, formatting temperature based on user preference.",
  fn: getWeatherStateful,
  functionDeclaration: {
    name: "getWeatherStateful",
    description: "Returns current weather, formatting temperature based on user preference.",
    parameters: { type: 'object', properties: { city: { type: 'string', description: 'City name.' } }, required: ['city'] }
  }
});

console.log("✅ State-aware 'getWeatherStatefulTool' tool defined.");
```

---

### **3\. Redefine Sub-Agents and Update Root Agent**

Redefine sub-agents and the root agent, using `getWeatherStatefulTool` and `outputKey`.

```typescript
// @title 3. Redefine Sub-Agents and Update Root Agent with outputKey

import { LlmAgent as Agent, LlmRegistry, InMemoryRunner } from 'adk-typescript'; // Correct imports

// --- Redefine Greeting Agent ---
// (Ensure greetingAgent definition from Step 3 is available or redefine here)
if (!greetingAgent) { console.log("Redefining greetingAgent..."); /* Redefine here */ }

// --- Redefine Farewell Agent ---
// (Ensure farewellAgent definition from Step 3 is available or redefine here)
if (!farewellAgent) { console.log("Redefining farewellAgent..."); /* Redefine here */ }


// --- Define the Updated Root Agent ---
rootAgentStateful = null; // Reset
runnerRootStateful = null; // Reset runner

// Check prerequisites
if (greetingAgent && farewellAgent && getWeatherStatefulTool) {
  const rootAgentModelName = MODEL_GEMINI_1_5_PRO;
  const rootLlmStateful = LlmRegistry.newLlm(rootAgentModelName);

  rootAgentStateful = new Agent({ // Assign to declared variable
    name: "weather_agent_v4_stateful",
    model: rootLlmStateful,
    description: "Main agent: Provides state-aware weather, delegates, saves report.",
    instruction: "You are the main Weather Agent. Use 'getWeatherStateful'. " +
                "Delegate greetings to 'greeting_agent' and farewells to 'farewell_agent'.",
    tools: [getWeatherStatefulTool], // <<< Use the state-aware tool
    subAgents: [greetingAgent, farewellAgent],
    outputKey: "last_weather_report" // <<< Auto-save agent's final weather response
  });
  console.log(`✅ Root Agent '${rootAgentStateful.name}' created with stateful tool and outputKey.`);

  // --- Create Runner using the stateful session service from Section 1 ---
  if (sessionServiceStateful) {
    // Pass the agent and appName to InMemoryRunner
    // It uses its own internal session service, but we'll manage the specific session ID
    runnerRootStateful = new InMemoryRunner(rootAgentStateful, APP_NAME); // Assign runner
    console.log(`✅ Runner created for stateful root agent '${runnerRootStateful.agent.name}'.`);
  } else {
    console.log("❌ Cannot create runner. 'sessionServiceStateful' is missing.");
  }
} else {
  console.log("❌ Cannot create stateful root agent. Prerequisites missing.");
  // Log missing components...
}
```

---

### **4\. Interact and Test State Flow**

Test the stateful flow. Manually update the state in `sessionServiceStateful` between calls.

```typescript
// @title 4. Interact and Test State Flow

// Ensure runnerRootStateful, callAgentAsync, USER_ID_STATEFUL, SESSION_ID_STATEFUL, APP_NAME, sessionServiceStateful are defined

if (runnerRootStateful) {
  async function runStatefulConversation(): Promise<void> {
    console.log("\n--- Testing State: Temp Unit Conversion & outputKey ---");

    // 1. Check weather (Uses initial state: Celsius)
    console.log("--- Turn 1: Requesting weather in London (expect Celsius) ---");
    await callAgentAsync("What's the weather in London?",
                        runnerRootStateful,
                        USER_ID_STATEFUL,
                        SESSION_ID_STATEFUL
                       );

    // 2. Manually update state preference to Fahrenheit - DIRECTLY MODIFY SERVICE'S STATE
    console.log("\n--- Manually Updating State: Setting unit to Fahrenheit ---");
    try {
      // Get the session directly from the service to modify it
      const sessionToUpdate = sessionServiceStateful.getSession({
        appName: APP_NAME,
        userId: USER_ID_STATEFUL,
        sessionId: SESSION_ID_STATEFUL
      });

      if (sessionToUpdate) {
        // Update the state directly in the retrieved session object
        // Since it's InMemory, this modifies the stored object reference
        sessionToUpdate.state['user_preference_temperature_unit'] = "Fahrenheit";
        console.log(`--- Session state updated directly in sessionServiceStateful. ---`);
      } else {
        console.log(`--- Error: Could not retrieve session '${SESSION_ID_STATEFUL}' to update state. ---`);
      }
    } catch (e) {
      console.error(`--- Error updating session state: ${e} ---`);
    }

    // 3. Check weather again (Tool should now use Fahrenheit)
    console.log("\n--- Turn 2: Requesting weather in New York (expect Fahrenheit) ---");
    await callAgentAsync("Tell me the weather in New York.",
                        runnerRootStateful,
                        USER_ID_STATEFUL,
                        SESSION_ID_STATEFUL
                       );

    // 4. Test basic delegation (will overwrite outputKey)
    console.log("\n--- Turn 3: Sending a greeting ---");
    await callAgentAsync("Hi!",
                        runnerRootStateful,
                        USER_ID_STATEFUL,
                        SESSION_ID_STATEFUL
                       );
  }

  // Execute the conversation
  runStatefulConversation().then(async () => {
    // Inspect final session state after the conversation
    console.log("\n--- Inspecting Final Session State ---");
    const finalSession = sessionServiceStateful.getSession({
      appName: APP_NAME,
      userId: USER_ID_STATEFUL,
      sessionId: SESSION_ID_STATEFUL
    });

    if (finalSession) {
      console.log(`Final Preference: ${finalSession.state['user_preference_temperature_unit']}`);
      console.log(`Final Last Weather Report (from outputKey): ${finalSession.state['last_weather_report']}`);
      console.log(`Final Last City Checked (by tool): ${finalSession.state['last_city_checked_stateful']}`);
      // console.log(`Full State:`, finalSession.state); // Uncomment for full state view
    } else {
      console.log("\n❌ Error: Could not retrieve final session state.");
    }
  }).catch(console.error);

} else {
  console.log("\n⚠️ Skipping state test conversation. Stateful root agent runner ('runnerRootStateful') is not available.");
}
```

Check the output and final state to verify state reading, writing, and `outputKey` functionality.

## Step 5: Adding Safety - Input Guardrail with `beforeModelCallback`

Use `beforeModelCallback` to inspect/block requests before they hit the LLM.

### **1\. Define the Guardrail Callback Function**

```typescript
// @title 1. Define the before_model_callback Guardrail
import { LlmAgent as Agent, LlmRequest, LlmResponse, CallbackContext, Content, Part } from 'adk-typescript'; // Correct imports

/**
 * Checks the last user message for "BLOCK". If found, returns
 * a blocking LlmResponse, otherwise returns null.
 * @param callback_context Context for the callback.
 * @param llm_request The request intended for the LLM.
 * @returns An LlmResponse to block, or null to allow.
 */
function block_keyword_guardrail(
  callback_context: CallbackContext,
  llm_request: LlmRequest
): LlmResponse | null {
  console.log(`--- Callback: block_keyword_guardrail running for agent: ${callback_context.agentName} ---`);

  let last_user_message_text = "";
  if (llm_request.contents && llm_request.contents.length > 0) {
      const lastContent = llm_request.contents[llm_request.contents.length - 1];
      // Ensure it's the user's turn before checking
      if (lastContent.role === 'user' && lastContent.parts?.length > 0) {
          const textPart = lastContent.parts.find(p => p.text);
          last_user_message_text = textPart?.text || "";
      }
  }

  console.log(`--- Callback: Inspecting last user message: '${last_user_message_text.substring(0, 100)}...' ---`);

  const keyword_to_block = "BLOCK";
  if (last_user_message_text.toUpperCase().includes(keyword_to_block.toUpperCase())) {
    console.log(`--- Callback: Found '${keyword_to_block}'. Blocking LLM call! ---`);
    callback_context.state.set("guardrail_block_keyword_triggered", true); // Use state object's set method
    console.log(`--- Callback: Set state 'guardrail_block_keyword_triggered': true ---`);

    // Construct and return an LlmResponse to stop the flow
    return new LlmResponse({
      content: {
        role: 'model', // Simulating a model response
        parts: [{ text: `I cannot process this request because it contains the blocked keyword '${keyword_to_block}'` } as Part],
      }
    });
  } else {
    console.log(`--- Callback: Keyword not found. Allowing LLM call for ${callback_context.agentName}. ---`);
    return null; // Allow the request
  }
}

console.log("✅ block_keyword_guardrail function defined.");

```

---

### **2\. Update Root Agent to Use the Callback**

Redefine the root agent, adding `beforeModelCallback`. Ensure prerequisites are available.

```typescript
// @title 2. Update Root Agent with before_model_callback (Self-Contained)
import { LlmAgent as Agent, LlmRegistry, InMemoryRunner } from 'adk-typescript'; // Correct imports

// --- Ensure Prerequisites are Defined ---
// (greetingAgent, farewellAgent, getWeatherStatefulTool, block_keyword_guardrail)

// --- Redefine Sub-Agents (Ensures they exist in this context) ---
// ... Redefinitions for greetingAgent and farewellAgent if needed ...
if (!greetingAgent) { console.log("Redefining greetingAgent..."); /* Redefine here */ }
if (!farewellAgent) { console.log("Redefining farewellAgent..."); /* Redefine here */ }

// --- Define the Root Agent with the Callback ---
rootAgentModelGuardrail = null; // Reset
runnerRootModelGuardrail = null; // Reset

// Check all components before proceeding
if (greetingAgent && farewellAgent && getWeatherStatefulTool && block_keyword_guardrail) {

    const rootAgentModelName = MODEL_GEMINI_1_5_PRO;
    const rootLlmGuardrail = LlmRegistry.newLlm(rootAgentModelName);

    rootAgentModelGuardrail = new Agent({ // Assign to declared variable
        name: "weather_agent_v5_model_guardrail",
        model: rootLlmGuardrail,
        description: "Main agent: Handles weather, delegates, includes input guardrail.",
        instruction: "You are the main Weather Agent. Provide weather using 'getWeatherStateful'. "
                    + "Delegate greetings to 'greeting_agent' and farewells to 'farewell_agent'.",
        tools: [getWeatherStatefulTool],
        subAgents: [greetingAgent, farewellAgent],
        outputKey: "last_weather_report",
        beforeModelCallback: block_keyword_guardrail // <<< Assign the callback
    });
    console.log(`✅ Root Agent '${rootAgentModelGuardrail.name}' created with beforeModelCallback.`);

    // --- Create Runner, Using SAME Stateful Session Service ---
    if (sessionServiceStateful) {
        runnerRootModelGuardrail = new InMemoryRunner(rootAgentModelGuardrail, APP_NAME); // Assign runner
        console.log(`✅ Runner created for guardrail agent '${runnerRootModelGuardrail.agent.name}', using stateful session service.`);
    } else {
        console.log("❌ Cannot create runner. 'sessionServiceStateful' from Step 4 is missing.");
    }

} else {
    console.log("❌ Cannot create root agent with model guardrail. Prerequisites missing.");
}
```

---

### **3\. Interact to Test the Guardrail**

Test using the *same* stateful session (`SESSION_ID_STATEFUL`) and the new runner (`runnerRootModelGuardrail`).

```typescript
// @title 3. Interact to Test the Model Input Guardrail

// Ensure the runner for the guardrail agent is available
if (runnerRootModelGuardrail) {
  async function runGuardrailTestConversation(): Promise<void> {
    console.log("\n--- Testing Model Input Guardrail ---");

    // Helper to call the specific runner/session
    const interactionFunc = (query: string) => callAgentAsync(
        query,
        runnerRootModelGuardrail!, // Use non-null assertion
        USER_ID_STATEFUL,
        SESSION_ID_STATEFUL
    );

    // 1. Normal request (Callback allows, uses Fahrenheit state)
    await interactionFunc("What is the weather in London?");

    // 2. Request containing the blocked keyword
    await interactionFunc("BLOCK the request for weather in Tokyo");

    // 3. Normal greeting (Callback allows root, delegation happens)
    await interactionFunc("Hello again");
  }

  // Execute the conversation
  runGuardrailTestConversation().then(async () => {
      // Optional: Check state for the trigger flag
      const finalSession = sessionServiceStateful.getSession({
        appName: APP_NAME,
        userId: USER_ID_STATEFUL,
        sessionId: SESSION_ID_STATEFUL
      });
      if (finalSession) {
          console.log("\n--- Final Session State (After Guardrail Test) ---");
          console.log(`Guardrail Triggered Flag: ${finalSession.state['guardrail_block_keyword_triggered']}`); // Access state directly
          console.log(`Last Weather Report: ${finalSession.state['last_weather_report']}`);
          console.log(`Temperature Unit: ${finalSession.state['user_preference_temperature_unit']}`);
      } else {
          console.log("\n❌ Error: Could not retrieve final session state.");
      }
  }).catch(console.error);

} else {
  console.log("\n⚠️ Skipping model guardrail test. Runner ('runnerRootModelGuardrail') is not available.");
}
```

Observe how the "BLOCK" request is intercepted.

## Step 6: Adding Safety - Tool Argument Guardrail (`beforeToolCallback`)

Use `beforeToolCallback` to validate/block tool arguments *after* the LLM decides to use a tool but *before* execution.

**Key Concept: `beforeToolCallback`**

*   Executed *before* a tool function runs.
*   Receives `tool: BaseTool`, `args: Record<string, any>`, `toolContext: ToolContext`.
*   Returning `null` allows the tool to run (with potentially modified `args`).
*   Returning an `object` blocks the tool, and ADK uses the returned object as the tool's result.

**In this step, we will:**

1.  Define `block_paris_tool_guardrail` callback to block `getWeatherStateful` for "Paris".
2.  Update the root agent to use *both* `beforeModelCallback` and `beforeToolCallback`.
3.  Create a new runner using the *same* stateful session service.
4.  Test the tool guardrail.

---

### **1\. Define the Tool Guardrail Callback Function**

```typescript
// @title 1. Define the before_tool_callback Guardrail
import { BaseTool, ToolContext } from 'adk-typescript'; // Correct imports

/**
 * Checks if getWeatherStateful is called for Paris. If so, blocks execution.
 * @param tool The tool about to be called.
 * @param args The arguments provided by the LLM.
 * @param tool_context The context for the tool execution.
 * @returns An error object to block, or null to allow.
 */
function block_paris_tool_guardrail(
  tool: BaseTool,
  args: Record<string, any>,
  tool_context: ToolContext
): Record<string, any> | null { // Return type can be object or null
  console.log(`--- Callback: block_paris_tool_guardrail running for tool '${tool.name}' in agent '${tool_context.agentName}' ---`);
  console.log(`--- Callback: Inspecting args:`, args, "---");

  const target_tool_name = "getWeatherStateful"; // Match the stateful tool name
  const blocked_city = "paris";

  // Case-insensitive check for the city argument
  if (tool.name === target_tool_name && args.city && typeof args.city === 'string' && args.city.toLowerCase() === blocked_city) {
    console.log(`--- Callback: Detected blocked city '${args.city}'. Blocking tool execution! ---`);
    // Use state.set for direct modification in the callback context
    tool_context.state.set("guardrail_tool_block_triggered", true);
    console.log(`--- Callback: Set state 'guardrail_tool_block_triggered': true ---`);

    // Return a dictionary matching the tool's expected error output format
    return {
      status: "error",
      // Capitalize city name for the message
      error_message: `Policy restriction: Weather checks for '${args.city.charAt(0).toUpperCase() + args.city.slice(1)}' are currently disabled by a tool guardrail.`
    };
  } else {
    const cityArg = args.city || 'N/A'; // Handle case where city might be missing
    console.log(`--- Callback: City '${cityArg}' is allowed for tool '${tool.name}'. ---`);
    console.log(`--- Callback: Allowing tool '${tool.name}' to proceed. ---`);
    return null; // Allow the actual tool function to run
  }
}

console.log("✅ block_paris_tool_guardrail function defined.");
```

---

### **2\. Update Root Agent to Use Both Callbacks**

Redefine the root agent, adding `beforeToolCallback`. Ensure prerequisites are available.

```typescript
// @title 2. Update Root Agent with BOTH Callbacks (Self-Contained)
import { LlmAgent as Agent, LlmRegistry, InMemoryRunner } from 'adk-typescript'; // Correct imports

// --- Ensure Prerequisites are Defined ---
// (greetingAgent, farewellAgent, getWeatherStatefulTool,
//  block_keyword_guardrail, block_paris_tool_guardrail)

// --- Redefine Sub-Agents (If necessary) ---
if (!greetingAgent) { console.log("Redefining greetingAgent..."); /* Redefine */ }
if (!farewellAgent) { console.log("Redefining farewellAgent..."); /* Redefine */ }

// --- Define the Root Agent with Both Callbacks ---
rootAgentToolGuardrail = null; // Reset
runnerRootToolGuardrail = null; // Reset

// Check all components
if (greetingAgent && farewellAgent && getWeatherStatefulTool && block_keyword_guardrail && block_paris_tool_guardrail) {

    const rootAgentModelName = MODEL_GEMINI_1_5_PRO;
    const rootLlmToolGuardrail = LlmRegistry.newLlm(rootAgentModelName);

    rootAgentToolGuardrail = new Agent({ // Assign
        name: "weather_agent_v6_tool_guardrail", // New version
        model: rootLlmToolGuardrail,
        description: "Main agent: Handles weather, delegates, includes input AND tool guardrails.",
        instruction: "You are the main Weather Agent. Use 'getWeatherStateful'. "
                    + "Delegate greetings to 'greeting_agent' and farewells to 'farewell_agent'.",
        tools: [getWeatherStatefulTool],
        subAgents: [greetingAgent, farewellAgent],
        outputKey: "last_weather_report",
        beforeModelCallback: block_keyword_guardrail, // Keep model guardrail
        beforeToolCallback: block_paris_tool_guardrail // <<< Add tool guardrail
    });
    console.log(`✅ Root Agent '${rootAgentToolGuardrail.name}' created with BOTH callbacks.`);

    // --- Create Runner, Using SAME Stateful Session Service ---
    if (sessionServiceStateful) {
        runnerRootToolGuardrail = new InMemoryRunner(rootAgentToolGuardrail, APP_NAME); // Assign runner
        console.log(`✅ Runner created for tool guardrail agent '${runnerRootToolGuardrail.agent.name}', using stateful session service.`);
    } else {
        console.log("❌ Cannot create runner. 'sessionServiceStateful' is missing.");
    }

} else {
    console.log("❌ Cannot create root agent with tool guardrail. Prerequisites missing.");
}
```

---

### **3\. Interact to Test the Tool Guardrail**

Test using the *same* stateful session (`SESSION_ID_STATEFUL`) and the newest runner (`runnerRootToolGuardrail`).

```typescript
// @title 3. Interact to Test the Tool Argument Guardrail

// Ensure the runner for the tool guardrail agent is available
if (runnerRootToolGuardrail) {
  async function runToolGuardrailTest(): Promise<void> {
    console.log("\n--- Testing Tool Argument Guardrail ('Paris' blocked) ---");

    // Helper to call the specific runner/session
    const interactionFunc = (query: string) => callAgentAsync(
        query,
        runnerRootToolGuardrail!, // Use non-null assertion
        USER_ID_STATEFUL,
        SESSION_ID_STATEFUL
    );

    // 1. Allowed city (Should pass both callbacks, use Fahrenheit state)
    await interactionFunc("What's the weather in New York?");

    // 2. Blocked city (Passes model cb, blocked by tool cb)
    await interactionFunc("How about Paris?");

    // 3. Another allowed city (Should work normally again)
    await interactionFunc("Tell me the weather in London.");
  }

  // Execute the conversation
  runToolGuardrailTest().then(async () => {
      // Optional: Check state for the tool block trigger flag
      const finalSession = sessionServiceStateful.getSession({
        appName: APP_NAME,
        userId: USER_ID_STATEFUL,
        sessionId: SESSION_ID_STATEFUL
      });
      if (finalSession) {
          console.log("\n--- Final Session State (After Tool Guardrail Test) ---");
          console.log(`Tool Guardrail Triggered Flag: ${finalSession.state['guardrail_tool_block_triggered']}`); // Access state directly
          console.log(`Last Weather Report: ${finalSession.state['last_weather_report']}`); // Should be London weather
          console.log(`Temperature Unit: ${finalSession.state['user_preference_temperature_unit']}`); // Should be Fahrenheit
      } else {
          console.log("\n❌ Error: Could not retrieve final session state.");
      }
  }).catch(console.error);

} else {
  console.log("\n⚠️ Skipping tool guardrail test. Runner ('runnerRootToolGuardrail') is not available.");
}
```

Analyze the output to see the "Paris" request being blocked by the `beforeToolCallback`.

## Conclusion: Your Agent Team is Ready!

Congratulations! You've successfully built a multi-agent Weather Bot using ADK TypeScript, incorporating tools, multi-model support, delegation, stateful memory, and safety guardrails via callbacks.

**Key Takeaways:**

*   **Agents & Tools:** Use `LlmAgent` and `FunctionTool` for core logic.
*   **Runners & Session Services:** `InMemoryRunner` is great for local testing.
*   **Delegation:** `subAgents` and clear `description`s enable collaboration.
*   **Session State:** `ToolContext` and `outputKey` provide memory. Access state via `toolContext.state` object and update via `toolContext.actions.stateDelta`.
*   **Callbacks:** `beforeModelCallback` and `beforeToolCallback` are essential for safety and control.
*   **Flexibility:** `LlmRegistry` and `LiteLlm` allow easy LLM switching.

**Where to Go Next?**

*   Replace mock tools with real APIs (`axios`).
*   Implement more complex state management.
*   Explore `DatabaseSessionService` for persistence.
*   Build a real-time UI using the `apiServer` or `webServer` patterns.
*   Experiment with other ADK features like `ParallelAgent`, `LoopAgent`, planners, and different tools.

ADK TypeScript provides a robust framework for building powerful agentic systems. Happy building!

