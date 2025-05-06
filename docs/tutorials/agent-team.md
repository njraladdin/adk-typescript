# Build Your First Intelligent Agent Team: A Progressive Weather Bot with ADK

<!-- Optional outer container for overall padding/spacing -->
<div style="padding: 10px 0;">

  <!-- Line 1: Open in Colab -->
  <!-- This div ensures the link takes up its own line and adds space below -->
  </div>

  <!-- Line 2: Share Links -->
  <!-- This div acts as a flex container for the "Share to" text and icons -->
  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
    <!-- Share Text -->
    <span style="font-weight: bold;">Share to:</span>

    <!-- Social Media Links -->
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A//github/google/adk-docs/blob/main/examples/typescript/tutorial/agent_team/adk_tutorial_ts.ipynb" target="_blank" title="Share on LinkedIn">
      <img width="20px" src="https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg" alt="LinkedIn logo" style="vertical-align: middle;">
    </a>
    <a href="https://bsky.app/intent/compose?text=https%3A//github/google/adk-docs/blob/main/examples/typescript/tutorial/agent_team/adk_tutorial_ts.ipynb" target="_blank" title="Share on Bluesky">
      <img width="20px" src="https://upload.wikimedia.org/wikipedia/commons/7/7a/Bluesky_Logo.svg" alt="Bluesky logo" style="vertical-align: middle;">
    </a>
    <a href="https://twitter.com/intent/tweet?url=https%3A//github/google/adk-docs/blob/main/examples/typescript/tutorial/agent_team/adk_tutorial_ts.ipynb" target="_blank" title="Share on X (Twitter)">
      <img width="20px" src="https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg" alt="X logo" style="vertical-align: middle;">
    </a>
    <a href="https://reddit.com/submit?url=https%3A//github/google/adk-docs/blob/main/examples/typescript/tutorial/agent_team/adk_tutorial_ts.ipynb" target="_blank" title="Share on Reddit">
      <img width="20px" src="https://redditinc.com/hubfs/Reddit%20Inc/Brand/Reddit_Logo.png" alt="Reddit logo" style="vertical-align: middle;">
    </a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A//github/google/adk-docs/blob/main/examples/typescript/tutorial/agent_team/adk_tutorial_ts.ipynb" target="_blank" title="Share on Facebook">
      <img width="20px" src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook logo" style="vertical-align: middle;">
    </a>
  </div>

</div>

This tutorial extends from the [Quickstart example](https://njraladdin.github.io/adk-typescript/get-started/quickstart/) for [Agent Development Kit](https://njraladdin.github.io/adk-typescript/get-started/). Now, you're ready to dive deeper and construct a more sophisticated, **multi-agent system**.

We'll embark on building a **Weather Bot agent team**, progressively layering advanced features onto a simple foundation. Starting with a single agent that can look up weather, we will incrementally add capabilities like:

*   Leveraging different AI models (Gemini, GPT, Claude).
*   Designing specialized sub-agents for distinct tasks (like greetings and farewells).
*   Enabling intelligent delegation between agents.
*   Giving agents memory using persistent session state.
*   Implementing crucial safety guardrails using callbacks.

**Why a Weather Bot Team?**

This use case, while seemingly simple, provides a practical and relatable canvas to explore core ADK concepts essential for building complex, real-world agentic applications. You'll learn how to structure interactions, manage state, ensure safety, and orchestrate multiple AI "brains" working together.

**What is ADK Again?**

As a reminder, ADK is a TypeScript framework designed to streamline the development of applications powered by Large Language Models (LLMs). It offers robust building blocks for creating agents that can reason, plan, utilize tools, interact dynamically with users, and collaborate effectively within a team.

**In this advanced tutorial, you will master:**

*   ✅ **Tool Definition & Usage:** Crafting TypeScript functions (`tools`) that grant agents specific abilities (like fetching data) and instructing agents on how to use them effectively.
*   ✅ **Multi-LLM Flexibility:** Configuring agents to utilize various leading LLMs (Gemini, GPT-4o, Claude Sonnet) via LlmRegistry integration, allowing you to choose the best model for each task.
*   ✅ **Agent Delegation & Collaboration:** Designing specialized sub-agents and enabling automatic routing (`auto flow`) of user requests to the most appropriate agent within a team.
*   ✅ **Session State for Memory:** Utilizing `Session` and `ToolContext` to enable agents to remember information across conversational turns, leading to more contextual interactions.
*   ✅ **Safety Guardrails with Callbacks:** Implementing `beforeModelCallback` and `beforeToolCallback` to inspect, modify, or block requests/tool usage based on predefined rules, enhancing application safety and control.


---

**Note on Execution Environment:**

This tutorial is structured for Node.js environments. Please keep the following in mind:

*   **Asynchronous Code in TypeScript vs Python:** Unlike Python which requires the `asyncio` library for asynchronous operations, TypeScript has native support for async/await patterns as part of the language. In the TypeScript version of ADK:
    * No need to import `asyncio` - this was only required in the Python version
    * Use `async`/`await` directly for asynchronous functions 
    * Use `for await (const event of generator)` syntax for async generators instead of Python's `async for event in generator`
    * Functions return `Promise<T>` instead of Python's coroutines
    * Methods are marked with `async *` for async generator methods instead of Python's `async def` with `yield`

*   **Manual Runner/Session Setup:** The steps involve explicitly creating `InMemoryRunner` and session instances. This approach is shown because it gives you fine-grained control over the agent's execution lifecycle, session management, and state persistence.


**Ready to build your agent team? Let's dive in!**


```typescript
// Step 0: Setup and Installation
// Install ADK using npm

// In your project directory, run:
// npm install adk-typescript

console.log("Installation complete.");
```


```typescript
// Import necessary libraries
import { LlmAgent } from 'adk-typescript';
import { LlmRegistry } from 'adk-typescript/models';
import { InMemorySessionService } from 'adk-typescript/sessions';
import { Runner, InMemoryRunner } from 'adk-typescript';
import { Content, Part } from 'adk-typescript/models/types';

console.log("Libraries imported.");
```


```typescript
// Configure API Keys (Replace with your actual keys!)

// --- IMPORTANT: Replace placeholders with your real API keys ---
// Configure your .env file or set environment variables directly

// Gemini API Key (Get from Google AI Studio: https://aistudio.google.com/app/apikey)
process.env.GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"; // <--- REPLACE

// [Optional]
// OpenAI API Key (Get from OpenAI Platform: https://platform.openai.com/api-keys)
process.env.OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY'; // <--- REPLACE

// [Optional]
// Anthropic API Key (Get from Anthropic Console: https://console.anthropic.com/settings/keys)
process.env.ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY'; // <--- REPLACE

// --- Verify Keys (Optional Check) ---
console.log("API Keys Set:");
console.log(`Google API Key set: ${process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'YOUR_GOOGLE_API_KEY' ? 'Yes' : 'No (REPLACE PLACEHOLDER!)'}`);
console.log(`OpenAI API Key set: ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY' ? 'Yes' : 'No (REPLACE PLACEHOLDER!)'}`);
console.log(`Anthropic API Key set: ${process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'YOUR_ANTHROPIC_API_KEY' ? 'Yes' : 'No (REPLACE PLACEHOLDER!)'}`);

// --- Define Model Constants for easier use ---

const MODEL_GEMINI_2_0_FLASH = "gemini-2.0-flash";

// Note: Specific model names might change. Refer to LlmRegistry documentation.
const MODEL_GPT_4O = "openai/gpt-4o";
const MODEL_CLAUDE_SONNET = "anthropic/claude-3-sonnet-20240229";

console.log("\nEnvironment configured.");
```

---

## Step 1: Your First Agent \- Basic Weather Lookup

Let's begin by building the fundamental component of our Weather Bot: a single agent capable of performing a specific task – looking up weather information. This involves creating two core pieces:

1. **A Tool:** A TypeScript function that equips the agent with the *ability* to fetch weather data.  
2. **An Agent:** The AI "brain" that understands the user's request, knows it has a weather tool, and decides when and how to use it.

---

**1\. Define the Tool (`get_weather`)**

In ADK, **Tools** are the building blocks that give agents concrete capabilities beyond just text generation. They are typically regular TypeScript functions that perform specific actions, like calling an API, querying a database, or performing calculations.

Our first tool will provide a *mock* weather report. This allows us to focus on the agent structure without needing external API keys yet. Later, you could easily swap this mock function with one that calls a real weather service.

**Key Concept: Docstrings are Crucial\!** The agent's LLM relies heavily on the function's **docstring** to understand:

* *What* the tool does.  
* *When* to use it.  
* *What arguments* it requires (`city: string`).  
* *What information* it returns.

**Best Practice:** Write clear, descriptive, and accurate docstrings for your tools. This is essential for the LLM to use the tool correctly.


```typescript
// @title Define the get_weather Tool
async function get_weather(
    params: Record<string, any>,
    context?: ToolContext
): Promise<any> {
    const city = params.city;
    console.log(`--- Tool: get_weather called for city: ${city} ---`); // Log tool execution
    const cityNormalized = city.toLowerCase().replace(" ", ""); // Basic normalization
    
    // Mock weather data
    const mock_weather_db: Record<string, any> = {
        "newyork": { status: "success", report: "The weather in New York is sunny with a temperature of 25°C." },
        "london": { status: "success", report: "It's cloudy in London with a temperature of 15°C." },
        "tokyo": { status: "success", report: "Tokyo is experiencing light rain and a temperature of 18°C." },
    };
    
    if (mock_weather_db[cityNormalized]) {
        return mock_weather_db[cityNormalized];
    } else {
        return { 
            status: "error", 
            error_message: `Sorry, I don't have weather information for '${city}'` 
        };
    }
}

// Create a FunctionTool wrapper for our weather function
const weatherTool = new FunctionTool({
    name: 'get_weather',
    description: 'Gets the current weather for a specific location.',
    fn: get_weather,
    functionDeclaration: {
        name: 'get_weather',
        description: 'Gets the current weather for a specific location.',
        parameters: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: 'The city, address, or general location to get weather for.',
                },
            },
            required: ['city'],
        },
    },
});

// Example tool usage (optional test) - this would be different in real code
get_weather({ city: "New York" }, undefined).then(console.log);
get_weather({ city: "Paris" }, undefined).then(console.log);
```

---

**2\. Define the Agent (`weather_agent`)**

Now, let's create the **Agent** itself. An `Agent` in ADK orchestrates the interaction between the user, the LLM, and the available tools.

We configure it with several key parameters:

* `name`: A unique identifier for this agent (e.g., "weather_agent_v1").  
* `model`: Specifies which LLM to use (e.g., `MODEL_GEMINI_2_0_FLASH`). We'll start with a specific Gemini model.  
* `description`: A concise summary of the agent's overall purpose. This becomes crucial later when other agents need to decide whether to delegate tasks to *this* agent.  
* `instruction`: Detailed guidance for the LLM on how to behave, its persona, its goals, and specifically *how and when* to utilize its assigned `tools`.  
* `tools`: A list containing the actual TypeScript tool functions the agent is allowed to use (e.g., `[get_weather]`).

**Best Practice:** Provide clear and specific `instruction` prompts. The more detailed the instructions, the better the LLM can understand its role and how to use its tools effectively. Be explicit about error handling if needed.

**Best Practice:** Choose descriptive `name` and `description` values. These are used internally by ADK and are vital for features like automatic delegation (covered later).


```typescript
// @title Define the Weather Agent
// Use one of the model constants defined earlier
const AGENT_MODEL = MODEL_GEMINI_2_0_FLASH; // Starting with Gemini

// Import FunctionTool to wrap our function
import { FunctionTool } from 'adk-typescript/tools';

// Create a FunctionTool wrapper for our weather function
const weatherTool = new FunctionTool({
    name: 'get_weather',
    description: 'Gets the current weather for a specific location.',
    fn: get_weather,
    functionDeclaration: {
        name: 'get_weather',
        description: 'Gets the current weather for a specific location.',
        parameters: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: 'The city, address, or general location to get weather for.',
                },
            },
            required: ['city'],
        },
    },
});

const weather_agent = new LlmAgent({
    name: "weather_agent_v1",
    model: AGENT_MODEL, // Can be a string for Gemini or an LlmRegistry object
    description: "Provides weather information for specific cities.",
    instruction: "You are a helpful weather assistant. "
               + "When the user asks for the weather in a specific city, "
               + "use the 'get_weather' tool to find the information. "
               + "If the tool returns an error, inform the user politely. "
               + "If the tool is successful, present the weather report clearly.",
    tools: [weatherTool], // Pass the FunctionTool wrapper
});

console.log(`Agent '${weather_agent.name}' created using model '${AGENT_MODEL}'`);
```

---

**3\. Setup Runner and Session Service**

To manage conversations and execute the agent, we need two more components:

* `Session`: Responsible for managing conversation history and state for different users and sessions. The `InMemorySessionService` is a simple implementation that stores everything in memory, suitable for testing and simple applications. It keeps track of the messages exchanged. We'll explore state persistence more in Step 4\.  
* `Runner`: The engine that orchestrates the interaction flow. It takes user input, routes it to the appropriate agent, manages calls to the LLM and tools based on the agent's logic, handles session updates via the `Session`, and yields events representing the progress of the interaction.


```typescript
// @title Setup Session Service and Runner

// --- Session Management ---
// Key Concept: Session stores conversation history & state.
// InMemorySessionService is simple, non-persistent storage for this tutorial.
const session_service = new InMemorySessionService();

// Define constants for identifying the interaction context
const APP_NAME = "weather_tutorial_app";
const USER_ID = "user_1";
const SESSION_ID = "session_001"; // Using a fixed ID for simplicity

// Create the specific session where the conversation will happen
const session = session_service.createSession(
    APP_NAME,
    USER_ID,
    SESSION_ID
);
console.log(`Session created: App='${APP_NAME}', User='${USER_ID}', Session='${SESSION_ID}'`);

// --- Runner ---
// Key Concept: Runner orchestrates the agent execution loop.
const runner = new InMemoryRunner({
    agent: weather_agent, // The agent we want to run
    app_name: APP_NAME,   // Associates runs with our app
    session_service: session_service // Uses our session manager
});
console.log(`Runner created for agent '${runner.agent.name}'`);
```

---

**4\. Interact with the Agent**

We need a way to send messages to our agent and receive its responses. Since LLM calls and tool executions can take time, ADK's `Runner` operates asynchronously.

We'll define an `async` helper function (`call_agent_async`) that:

1. Takes a user query string.  
2. Packages it into the ADK `Content` format.  
3. Calls `runner.runAsync`, providing the user/session context and the new message.  
4. Iterates through the **Events** yielded by the runner. Events represent steps in the agent's execution (e.g., tool call requested, tool result received, intermediate LLM thought, final response).  
5. Identifies and prints the **final response** event using `event.isFinalResponse()`.

**Why `async`?** Interactions with LLMs and potentially tools (like external APIs) are I/O-bound operations. Using TypeScript's async/await pattern allows the program to handle these operations efficiently without blocking execution.


```typescript
// @title Define Agent Interaction Function

import { LlmAgent } from 'adk-typescript';
import { Content, Part } from 'adk-typescript/models/types'; // For creating message Content/Parts

async function call_agent_async(query: string, runner: Runner, user_id: string, session_id: string): Promise<any> {
  console.log(`\n>>> User Query: ${query}`);

  // Prepare the user's message in ADK format
  const content = new Content({ 
    role: 'user', 
    parts: [new Part({ text: query })]
  });

  let final_response_text = "Agent did not produce a final response."; // Default

  // Key Concept: runAsync executes the agent logic and yields Events.
  // We iterate through events to find the final answer.
  for await (const event of runner.runAsync({
    userId: user_id,
    sessionId: session_id,
    content: content
  })) {
    // You can uncomment the line below to see *all* events during execution
    // console.log(`  [Event] Author: ${event.author}, Type: ${event.constructor.name}, Final: ${event.isFinalResponse()}, Content: ${event.content}`);

    // Key Concept: isFinalResponse() marks the concluding message for the turn.
    if (event.isFinalResponse()) {
      if (event.content && event.content.parts) {
         // Assuming text response in the first part
         final_response_text = event.content.parts[0].text;
      } else if (event.actions && event.actions.escalate) { // Handle potential errors/escalations
         final_response_text = `Agent escalated: ${event.errorMessage || 'No specific message.'}`;
      }
      // Add more checks here if needed (e.g., specific error codes)
      break; // Stop processing events once the final response is found
    }
  }

  console.log(`<<< Agent Response: ${final_response_text}`);
  return final_response_text;
}
```

---

**5\. Run the Conversation**

Finally, let's test our setup by sending a few queries to the agent. We wrap our `async` calls in a main `async` function and run it using `await`.

Watch the output:

* See the user queries.  
* Notice the `--- Tool: get_weather called... ---` logs when the agent uses the tool.  
* Observe the agent's final responses, including how it handles the case where weather data isn't available (for Paris).


```typescript
// @title Run the Initial Conversation

// We need an async function to await our interaction helper
async function run_conversation() {
    await call_agent_async("What is the weather like in London?",
                                       runner,
                                       USER_ID,
                                       SESSION_ID);

    await call_agent_async("How about Paris?",
                                       runner,
                                       USER_ID,
                                       SESSION_ID); // Expecting the tool's error message

    await call_agent_async("Tell me the weather in New York",
                                       runner,
                                       USER_ID,
                                       SESSION_ID);
}

// Execute the conversation using then/catch as this is TypeScript
run_conversation().then(result => {
    console.log(result);
}).catch(error => {
    console.error(`An error occurred: ${error}`);
});

// --- OR ---

// Uncomment the following lines if running as a standard Node.js script (.ts file):
// if (require.main === module) {
//     run_conversation().then(() => {
//         console.log("Conversation completed");
//     }).catch(error => {
//         console.error(`An error occurred: ${error}`);
//     });
// }
```

---

Congratulations\! You've successfully built and interacted with your first ADK agent. It understands the user's request, uses a tool to find information, and responds appropriately based on the tool's result.

In the next step, we'll explore how to easily switch the underlying Language Model powering this agent.

## Step 2: Going Multi-Model with LiteLLM [Optional]

In Step 1, we built a functional Weather Agent powered by a specific Gemini model. While effective, real-world applications often benefit from the flexibility to use *different* Large Language Models (LLMs). Why?

*   **Performance:** Some models excel at specific tasks (e.g., coding, reasoning, creative writing).
*   **Cost:** Different models have varying price points.
*   **Capabilities:** Models offer diverse features, context window sizes, and fine-tuning options.
*   **Availability/Redundancy:** Having alternatives ensures your application remains functional even if one provider experiences issues.

ADK makes switching between models seamless through its integration with the [**LiteLLM**](https://github.com/BerriAI/litellm) library. LiteLLM acts as a consistent interface to over 100 different LLMs.

**In this step, we will:**

1.  Learn how to configure an ADK `Agent` to use models from providers like OpenAI (GPT) and Anthropic (Claude) using the `LiteLlm` wrapper.
2.  Define, configure (with their own sessions and runners), and immediately test instances of our Weather Agent, each backed by a different LLM.
3.  Interact with these different agents to observe potential variations in their responses, even when using the same underlying tool.

---

**1\. Import `LiteLlm`**

We imported this during the initial setup (Step 0), but it's the key component for multi-model support:


```typescript
// @title 1. Import LiteLlm
import { LiteLlm } from 'adk-typescript/models';
```

**2\. Define and Test Multi-Model Agents**

Instead of passing only a model name string (which defaults to Google's Gemini models), we wrap the desired model identifier string within the `LiteLlm` class.

*   **Key Concept: `LiteLlm` Wrapper:** The `LiteLlm(model="provider/model_name")` syntax tells ADK to route requests for this agent through the LiteLLM library to the specified model provider.

Make sure you have configured the necessary API keys for OpenAI and Anthropic in Step 0. We'll use the `call_agent_async` function (defined earlier, which now accepts `runner`, `user_id`, and `session_id`) to interact with each agent immediately after its setup.

Each block below will:
*   Define the agent using a specific LiteLLM model (`MODEL_GPT_4O` or `MODEL_CLAUDE_SONNET`).
*   Create a *new, separate* `InMemorySessionService` and session specifically for that agent's test run. This keeps the conversation histories isolated for this demonstration.
*   Create a `Runner` configured for the specific agent and its session service.
*   Immediately call `call_agent_async` to send a query and test the agent.

**Best Practice:** Use constants for model names (like `MODEL_GPT_4O`, `MODEL_CLAUDE_SONNET` defined in Step 0) to avoid typos and make code easier to manage.

**Error Handling:** We wrap the agent definitions in `try...catch` blocks. This prevents the entire code cell from failing if an API key for a specific provider is missing or invalid, allowing the tutorial to proceed with the models that *are* configured.

First, let's create and test the agent using OpenAI's GPT-4o.


```typescript
// @title Define and Test GPT Agent

// Make sure 'get_weather' function from Step 1 is defined in your environment.
// Make sure 'call_agent_async' is defined from earlier.

// --- Agent using GPT-4o ---
let weather_agent_gpt: LlmAgent | null = null; // Initialize to null
let runner_gpt: InMemoryRunner | null = null;      // Initialize runner to null

try {
    weather_agent_gpt = new LlmAgent({
        name: "weather_agent_gpt",
        // Key change: Wrap the LiteLLM model identifier
        model: new LiteLlm({ model: MODEL_GPT_4O }),
        description: "Provides weather information (using GPT-4o).",
        instruction: "You are a helpful weather assistant powered by GPT-4o. "
                   + "Use the 'get_weather' tool for city weather requests. "
                   + "Clearly present successful reports or polite error messages based on the tool's output status.",
        tools: [weatherTool], // Use the same FunctionTool
    });
    console.log(`Agent '${weather_agent_gpt.name}' created using model '${MODEL_GPT_4O}'`);

    // InMemorySessionService is simple, non-persistent storage for this tutorial.
    const session_service_gpt = new InMemorySessionService(); // Create a dedicated service

    // Define constants for identifying the interaction context
    const APP_NAME_GPT = "weather_tutorial_app_gpt"; // Unique app name for this test
    const USER_ID_GPT = "user_1_gpt";
    const SESSION_ID_GPT = "session_001_gpt"; // Using a fixed ID for simplicity

    // Create the specific session where the conversation will happen
    const session_gpt = session_service_gpt.createSession({
        appName: APP_NAME_GPT,
        userId: USER_ID_GPT,
        sessionId: SESSION_ID_GPT
    });
    console.log(`Session created: App='${APP_NAME_GPT}', User='${USER_ID_GPT}', Session='${SESSION_ID_GPT}'`);

    // Create a runner specific to this agent and its session service
    runner_gpt = new Runner({
        agent: weather_agent_gpt,
        appName: APP_NAME_GPT,       // Use the specific app name
        sessionService: session_service_gpt // Use the specific session service
    });
    console.log(`Runner created for agent '${runner_gpt.agent.name}'`);

    // --- Test the GPT Agent ---
    console.log("\n--- Testing GPT Agent ---");
    // Call the agent with the appropriate runner and session info
    call_agent_async("What's the weather in Tokyo?", runner_gpt, USER_ID_GPT, SESSION_ID_GPT).then(result => {
        console.log(result);
    }).catch(error => {
        console.error(`An error occurred: ${error}`);
    });

} catch (error) {
    console.error(`❌ Could not create or run GPT agent '${MODEL_GPT_4O}'. Check API Key and model name. Error: ${error}`);
}

```

Next, we'll do the same for Anthropic's Claude Sonnet.


```typescript
// @title Define and Test Claude Agent

// Make sure 'get_weather' function from Step 1 is defined in your environment.
// Make sure 'call_agent_async' is defined from earlier.

// --- Agent using Claude Sonnet ---
let weather_agent_claude: LlmAgent | null = null; // Initialize to null
let runner_claude: InMemoryRunner | null = null;      // Initialize runner to null

try {
    weather_agent_claude = new LlmAgent({
        name: "weather_agent_claude",
        // Key change: Wrap the LiteLLM model identifier
        model: new LiteLlm({ model: MODEL_CLAUDE_SONNET }),
        description: "Provides weather information (using Claude Sonnet).",
        instruction: "You are a helpful weather assistant powered by Claude Sonnet. "
                    "Use the 'get_weather' tool for city weather requests. "
                    "Analyze the tool's dictionary output ('status', 'report'/'error_message'). "
                    "Clearly present successful reports or polite error messages.",
        tools: [weatherTool], // Use the same FunctionTool
    });
    console.log(`Agent '${weather_agent_claude.name}' created using model '${MODEL_CLAUDE_SONNET}'`);

    // InMemorySessionService is simple, non-persistent storage for this tutorial.
    const session_service_claude = new InMemorySessionService(); // Create a dedicated service

    // Define constants for identifying the interaction context
    const APP_NAME_CLAUDE = "weather_tutorial_app_claude"; // Unique app name
    const USER_ID_CLAUDE = "user_1_claude";
    const SESSION_ID_CLAUDE = "session_001_claude"; // Using a fixed ID for simplicity

    // Create the specific session where the conversation will happen
    const session_claude = session_service_claude.createSession({
        appName: APP_NAME_CLAUDE,
        userId: USER_ID_CLAUDE,
        sessionId: SESSION_ID_CLAUDE
    });
    console.log(`Session created: App='${APP_NAME_CLAUDE}', User='${USER_ID_CLAUDE}', Session='${SESSION_ID_CLAUDE}'`);

    // Create a runner specific to this agent and its session service
    runner_claude = new Runner({
        agent: weather_agent_claude,
        appName: APP_NAME_CLAUDE,       // Use the specific app name
        sessionService: session_service_claude // Use the specific session service
    });
    console.log(`Runner created for agent '${runner_claude.agent.name}'`);

    // --- Test the Claude Agent ---
    console.log("\n--- Testing Claude Agent ---");
    // Call the agent with the appropriate runner and session info
    call_agent_async("Weather in London please.", runner_claude, USER_ID_CLAUDE, SESSION_ID_CLAUDE).then(result => {
        console.log(result);
    }).catch(error => {
        console.error(`An error occurred: ${error}`);
    });

} catch (error) {
    console.error(`❌ Could not create or run Claude agent '${MODEL_CLAUDE_SONNET}'. Check API Key and model name. Error: ${error}`);
}
```

Observe the output carefully from both code blocks. You should see:

1.  Each agent (`weather_agent_gpt`, `weather_agent_claude`) is created successfully (if API keys are valid).
2.  A dedicated session and runner are set up for each.
3.  Each agent correctly identifies the need to use the `get_weather` tool when processing the query (you'll see the `--- Tool: get_weather called... ---` log).
4.  The *underlying tool logic* remains identical, always returning our mock data.
5.  However, the **final textual response** generated by each agent might differ slightly in phrasing, tone, or formatting. This is because the instruction prompt is interpreted and executed by different LLMs (GPT-4o vs. Claude Sonnet).

This step demonstrates the power and flexibility ADK + LiteLLM provide. You can easily experiment with and deploy agents using various LLMs while keeping your core application logic (tools, fundamental agent structure) consistent.

In the next step, we'll move beyond a single agent and build a small team where agents can delegate tasks to each other!

---

## Step 3: Building an Agent Team \- Delegation for Greetings & Farewells

In Steps 1 and 2, we built and experimented with a single agent focused solely on weather lookups. While effective for its specific task, real-world applications often involve handling a wider variety of user interactions. We *could* keep adding more tools and complex instructions to our single weather agent, but this can quickly become unmanageable and less efficient.

A more robust approach is to build an **Agent Team**. This involves:

1. Creating multiple, **specialized agents**, each designed for a specific capability (e.g., one for weather, one for greetings, one for calculations).  
2. Designating a **root agent** (or orchestrator) that receives the initial user request.  
3. Enabling the root agent to **delegate** the request to the most appropriate specialized sub-agent based on the user's intent.

**Why build an Agent Team?**

* **Modularity:** Easier to develop, test, and maintain individual agents.  
* **Specialization:** Each agent can be fine-tuned (instructions, model choice) for its specific task.  
* **Scalability:** Simpler to add new capabilities by adding new agents.  
* **Efficiency:** Allows using potentially simpler/cheaper models for simpler tasks (like greetings).

**In this step, we will:**

1. Define simple tools for handling greetings (`say_hello`) and farewells (`say_goodbye`).  
2. Create two new specialized sub-agents: `greeting_agent` and `farewell_agent`.  
3. Update our main weather agent (`weather_agent_v2`) to act as the **root agent**.  
4. Configure the root agent with its sub-agents, enabling **automatic delegation**.  
5. Test the delegation flow by sending different types of requests to the root agent.

---

**1\. Define Tools for Sub-Agents**

First, let's create the simple TypeScript functions that will serve as tools for our new specialist agents. Remember, clear docstrings are vital for the agents that will use them.


```typescript
// @title Define Tools for Greeting and Farewell Agents

// Greeting function with proper parameters structure
async function say_hello(
    params: Record<string, any>,
    context?: ToolContext
): Promise<string> {
    const name = params.name || "there"; // Default to "there" if not provided
    console.log(`--- Tool: say_hello called with name: ${name} ---`);
    return `Hello, ${name}!`;
}

// Farewell function with proper parameters structure
async function say_goodbye(
    params: Record<string, any>,
    context?: ToolContext
): Promise<string> {
    console.log(`--- Tool: say_goodbye called ---`);
    return "Goodbye! Have a great day.";
}

// Create FunctionTool wrappers
const helloTool = new FunctionTool({
    name: 'say_hello',
    description: 'Provides a simple greeting, optionally addressing the user by name.',
    fn: say_hello,
    functionDeclaration: {
        name: 'say_hello',
        description: 'Provides a simple greeting, optionally addressing the user by name.',
        parameters: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'The name of the person to greet. Defaults to "there" if not provided.'
                }
            },
            required: []
        }
    }
});

const goodbyeTool = new FunctionTool({
    name: 'say_goodbye',
    description: 'Provides a simple farewell message to conclude the conversation.',
    fn: say_goodbye,
    functionDeclaration: {
        name: 'say_goodbye',
        description: 'Provides a simple farewell message to conclude the conversation.',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        }
    }
});

console.log("Greeting and Farewell tools defined.");

// Example tool usage (optional test)
say_hello({ name: "Alice" }, undefined).then(console.log);
say_goodbye({}, undefined).then(console.log);
```

---

**2\. Define the Sub-Agents (Greeting & Farewell)**

Now, create the `Agent` instances for our specialists. Notice their highly focused `instruction` and, critically, their clear `description`. The `description` is the primary information the *root agent* uses to decide *when* to delegate to these sub-agents.

**Best Practice:** Sub-agent `description` fields should accurately and concisely summarize their specific capability. This is crucial for effective automatic delegation.

**Best Practice:** Sub-agent `instruction` fields should be tailored to their limited scope, telling them exactly what to do and *what not* to do (e.g., "Your *only* task is...").


```typescript
// @title Define Greeting and Farewell Sub-Agents

// --- Greeting Agent ---
let greeting_agent: LlmAgent | null = null;
try {
    greeting_agent = new LlmAgent({
        // Using a potentially different/cheaper model for a simple task
        model: MODEL_GEMINI_2_0_FLASH,
        // model: new LiteLlm({ model: MODEL_GPT_4O }), // If you would like to experiment with other models
        name: "greeting_agent",
        instruction: "You are the Greeting Agent. Your ONLY task is to provide a friendly greeting to the user. "
                   + "Use the 'say_hello' tool to generate the greeting. "
                   + "If the user provides their name, make sure to pass it to the tool. "
                   + "Do not engage in any other conversation or tasks.",
        description: "Handles simple greetings and hellos using the 'say_hello' tool.", // Crucial for delegation
        tools: [helloTool], // Use the FunctionTool wrapper
    });
    console.log(`✅ Agent '${greeting_agent.name}' created using model '${greeting_agent.model}'`);
} catch (error) {
    console.error(`❌ Could not create Greeting agent. Check API Key (${greeting_agent?.model}). Error: ${error}`);
}

// --- Farewell Agent ---
let farewell_agent: LlmAgent | null = null;
try {
    farewell_agent = new LlmAgent({
        // Can use the same or a different model
        model: MODEL_GEMINI_2_0_FLASH,
        // model: new LiteLlm({ model: MODEL_GPT_4O }), // If you would like to experiment with other models
        name: "farewell_agent",
        instruction: "You are the Farewell Agent. Your ONLY task is to provide a polite goodbye message. "
                   + "Use the 'say_goodbye' tool when the user indicates they are leaving or ending the conversation "
                   + "(e.g., using words like 'bye', 'goodbye', 'thanks bye', 'see you'). "
                   + "Do not perform any other actions.",
        description: "Handles simple farewells and goodbyes using the 'say_goodbye' tool.", // Crucial for delegation
        tools: [goodbyeTool], // Use the FunctionTool wrapper
    });
    console.log(`✅ Agent '${farewell_agent.name}' created using model '${farewell_agent.model}'`);
} catch (error) {
    console.error(`❌ Could not create Farewell agent. Check API Key (${farewell_agent?.model}). Error: ${error}`);
}
```

---

**3\. Define the Root Agent (Weather Agent v2) with Sub-Agents**

Now, we upgrade our `weather_agent`. The key changes are:

* Adding the `sub_agents` parameter: We pass a list containing the `greeting_agent` and `farewell_agent` instances we just created.  
* Updating the `instruction`: We explicitly tell the root agent *about* its sub-agents and *when* it should delegate tasks to them.

**Key Concept: Automatic Delegation (Auto Flow)** By providing the `sub_agents` list, ADK enables automatic delegation. When the root agent receives a user query, its LLM considers not only its own instructions and tools but also the `description` of each sub-agent. If the LLM determines that a query aligns better with a sub-agent's described capability (e.g., "Handles simple greetings"), it will automatically generate a special internal action to *transfer control* to that sub-agent for that turn. The sub-agent then processes the query using its own model, instructions, and tools.

**Best Practice:** Ensure the root agent's instructions clearly guide its delegation decisions. Mention the sub-agents by name and describe the conditions under which delegation should occur.


```typescript
// @title Define the Root Agent with Sub-Agents

// Ensure sub-agents were created successfully before defining the root agent.
// Also ensure the original 'get_weather' tool is defined.
let root_agent: LlmAgent | null = null;
let runner_root: InMemoryRunner | null = null; // Initialize runner

if (greeting_agent && farewell_agent && 'get_weather' in globalThis) {
    // Let's use a capable Gemini model for the root agent to handle orchestration
    const root_agent_model = MODEL_GEMINI_2_0_FLASH;

    const weather_agent_team = new LlmAgent({
        name: "weather_agent_v2", // Give it a new version name
        model: root_agent_model,
        description: "The main coordinator agent. Handles weather requests and delegates greetings/farewells to specialists.",
        instruction: "You are the main Weather Agent coordinating a team. Your primary responsibility is to provide weather information. "
                    "Use the 'get_weather' tool ONLY for specific weather requests (e.g., 'weather in London'). "
                    "You have specialized sub-agents: "
                    "1. 'greeting_agent': Handles simple greetings like 'Hi', 'Hello'. Delegate to it for these. "
                    "2. 'farewell_agent': Handles simple farewells like 'Bye', 'See you'. Delegate to it for these. "
                    "Analyze the user's query. If it's a greeting, delegate to 'greeting_agent'. If it's a farewell, delegate to 'farewell_agent'. "
                    "If it's a weather request, handle it yourself using 'get_weather'. "
                    "For anything else, respond appropriately or state you cannot handle it.",
        tools: [weatherTool], // Root agent still needs the weather tool for its core task
        // Key change: Link the sub-agents here!
        sub_agents: [greeting_agent, farewell_agent]
    });
    console.log(`✅ Root Agent '${weather_agent_team.name}' created using model '${root_agent_model}' with sub-agents: [${weather_agent_team.sub_agents.map(sa => sa.name).join(', ')}]`);

} else {
    console.error("❌ Cannot create root agent because one or more sub-agents failed to initialize or 'get_weather' tool is missing.");
    if (!greeting_agent) console.error(" - Greeting Agent is missing.");
    if (!farewell_agent) console.error(" - Farewell Agent is missing.");
    if (!'get_weather' in globalThis) console.error(" - get_weather function is missing.");
}

```

---

**4\. Interact with the Agent Team**

Now that we've defined our root agent (`weather_agent_team` - *Note: Ensure this variable name matches the one defined in the previous code block, likely `# @title Define the Root Agent with Sub-Agents`, which might have named it `root_agent`*) with its specialized sub-agents, let's test the delegation mechanism.

The following code block will:

1.  Define an `async` function `run_team_conversation`.
2.  Inside this function, create a *new, dedicated* `InMemorySessionService` and a specific session (`session_001_agent_team`) just for this test run. This isolates the conversation history for testing the team dynamics.
3.  Create a `Runner` (`runner_agent_team`) configured to use our `weather_agent_team` (the root agent) and the dedicated session service.
4.  Use our updated `call_agent_async` function to send different types of queries (greeting, weather request, farewell) to the `runner_agent_team`. We explicitly pass the runner, user ID, and session ID for this specific test.
5.  Immediately execute the `run_team_conversation` function.

We expect the following flow:

1.  The "Hello there!" query goes to `runner_agent_team`.
2.  The root agent (`weather_agent_team`) receives it and, based on its instructions and the `greeting_agent`'s description, delegates the task.
3.  `greeting_agent` handles the query, calls its `say_hello` tool, and generates the response.
4.  The "What is the weather in New York?" query is *not* delegated and is handled directly by the root agent using its `get_weather` tool.
5.  The "Thanks, bye!" query is delegated to the `farewell_agent`, which uses its `say_goodbye` tool.




```typescript
// @title Interact with the Agent Team

// Ensure the root agent (e.g., 'weather_agent_team' or 'root_agent' from the previous cell) is defined.
// Ensure the call_agent_async function is defined.

// Check if the root agent variable exists before defining the conversation function
let root_agent_var_name = 'root_agent'; // Default name from Step 3 guide
if ('weather_agent_team' in globalThis) { // Check if user used this name instead
    root_agent_var_name = 'weather_agent_team';
} else if (!('root_agent' in globalThis)) {
    console.warn("⚠️ Root agent ('root_agent' or 'weather_agent_team') not found. Cannot define run_team_conversation.");
    // Assign a dummy value to prevent NameError later if the code block runs anyway
    root_agent = null; // Or set a flag to prevent execution
}

// Only define and run if the root agent exists
if (root_agent_var_name in globalThis && globalThis[root_agent_var_name]) {
    // Define the main async function for the conversation logic.
    // The 'await' keywords INSIDE this function are necessary for async operations.
    async function run_team_conversation() {
        console.log("\n--- Testing Agent Team Delegation ---");
        const session_service = new InMemorySessionService();
        const APP_NAME = "weather_tutorial_agent_team";
        const USER_ID = "user_1_agent_team";
        const SESSION_ID = "session_001_agent_team";
        const session = session_service.createSession(
            APP_NAME,
            USER_ID,
            SESSION_ID
        );
        console.log(`Session created: App='${APP_NAME}', User='${USER_ID}', Session='${SESSION_ID}'`);

        const actual_root_agent = globalThis[root_agent_var_name];
        const runner_agent_team = new InMemoryRunner({
            agent: actual_root_agent,
            app_name: APP_NAME,
            session_service: session_service // Uses our session manager
        });
        console.log(`Runner created for agent '${actual_root_agent.name}'`);

        // --- Interactions using await (correct within async function) ---
        await call_agent_async("Hello there!", runner_agent_team, USER_ID, SESSION_ID);
        await call_agent_async("What is the weather in New York?", runner_agent_team, USER_ID, SESSION_ID);
        await call_agent_async("Thanks, bye!", runner_agent_team, USER_ID, SESSION_ID);
    }

    // --- Execute the `run_team_conversation` async function ---
    // Choose ONE of the methods below based on your environment.
    // Note: This may require API keys for the models used!

    // METHOD 1: Direct Promise handling (Default for Node.js/TypeScript)
    console.log("Executing run_team_conversation using Promise...");
    run_team_conversation().then(() => {
        console.log("Team conversation completed successfully");
    }).catch(error => {
        console.error(`An error occurred: ${error}`);
    });

    // METHOD 2: For Standard Node.js Scripts (.ts)
    // If running this code as a standard Node.js script from your terminal
    // To use this method:
    // 1. Comment out the Promise-based execution above
    // 2. Uncomment the following block:
    /**
    if (require.main === module) {
        console.log("Executing run_team_conversation as main module...");
        run_team_conversation().then(() => {
            console.log("Team conversation completed successfully");
        }).catch(error => {
            console.error(`An error occurred: ${error}`);
        });
    }
    */
}
```

---

Look closely at the output logs, especially the `--- Tool: ... called ---` messages. You should observe:

*   For "Hello there!", the `say_hello` tool was called (indicating `greeting_agent` handled it).
*   For "What is the weather in New York?", the `get_weather` tool was called (indicating the root agent handled it).
*   For "Thanks, bye!", the `say_goodbye` tool was called (indicating `farewell_agent` handled it).

This confirms successful **automatic delegation**! The root agent, guided by its instructions and the `description`s of its `sub_agents`, correctly routed user requests to the appropriate specialist agent within the team.

You've now structured your application with multiple collaborating agents. This modular design is fundamental for building more complex and capable agent systems. In the next step, we'll give our agents the ability to remember information across turns using session state.

## Step 4: Adding Memory and Personalization with Session State

So far, our agent team can handle different tasks through delegation, but each interaction starts fresh – the agents have no memory of past conversations or user preferences within a session. To create more sophisticated and context-aware experiences, agents need **memory**. ADK provides this through **Session State**.

**What is Session State?**

* It's a TypeScript dictionary (`session.state`) tied to a specific user session (identified by `APP_NAME`, `USER_ID`, `SESSION_ID`).  
* It persists information *across multiple conversational turns* within that session.  
* Agents and Tools can read from and write to this state, allowing them to remember details, adapt behavior, and personalize responses.

**How Agents Interact with State:**

1. **`ToolContext` (Primary Method):** Tools can accept a `ToolContext` object (automatically provided by ADK if declared as the last argument). This object gives direct access to the session state via `tool_context.state`, allowing tools to read preferences or save results *during* execution.  
2. **`output_key` (Auto-Save Agent Response):** An `Agent` can be configured with an `output_key="your_key"`. ADK will then automatically save the agent's final textual response for a turn into `session.state["your_key"]`.

**In this step, we will enhance our Weather Bot team by:**

1. Using a **new** `InMemorySessionService` to demonstrate state in isolation.  
2. Initializing session state with a user preference for `temperature_unit`.  
3. Creating a state-aware version of the weather tool (`get_weather_stateful`) that reads this preference via `ToolContext` and adjusts its output format (Celsius/Fahrenheit).  
4. Updating the root agent to use this stateful tool and configuring it with an `output_key` to automatically save its final weather report to the session state.  
5. Running a conversation to observe how the initial state affects the tool, how manual state changes alter subsequent behavior, and how `output_key` persists the agent's response.

---

**1\. Initialize New Session Service and State**

To clearly demonstrate state management without interference from prior steps, we'll instantiate a new `InMemorySessionService`. We'll also create a session with an initial state defining the user's preferred temperature unit.


```typescript
// @title 1. Initialize New Session Service and State

// Import necessary session components
import { InMemorySessionService } from 'adk-typescript/sessions';

// Create a NEW session service instance for this state demonstration
const session_service_stateful = new InMemorySessionService();
console.log("✅ New InMemorySessionService created for state demonstration.");

// Define a NEW session ID for this part of the tutorial
const SESSION_ID_STATEFUL = "session_state_demo_001";
const USER_ID_STATEFUL = "user_state_demo";

// Define initial state data - user prefers Celsius initially
const initial_state = {
    "user_preference_temperature_unit": "Celsius"
};

// Create the session, providing the initial state
const session_stateful = session_service_stateful.createSession({
    appName: APP_NAME, // Use the consistent app name
    userId: USER_ID_STATEFUL,
    sessionId: SESSION_ID_STATEFUL,
    state: initial_state // Initialize state during creation
});
console.log(`✅ Session '${SESSION_ID_STATEFUL}' created for user '${USER_ID_STATEFUL}'`);

// Verify the initial state was set correctly
session_service_stateful.getSession({
    appName: APP_NAME,
    userId: USER_ID_STATEFUL,
    sessionId: SESSION_ID_STATEFUL
}).then(retrieved_session => {
    console.log("\n--- Initial Session State ---");
    if (retrieved_session) {
        console.log(retrieved_session.state);
    } else {
        console.error("Error: Could not retrieve session.");
    }
});
```

---

**2\. Create State-Aware Weather Tool (`get_weather_stateful`)**

Now, we create a new version of the weather tool. Its key feature is accepting `tool_context: ToolContext` which allows it to access `tool_context.state`. It will read the `user_preference_temperature_unit` and format the temperature accordingly.


* **Key Concept: `ToolContext`** This object is the bridge allowing your tool logic to interact with the session's context, including reading and writing state variables. ADK injects it automatically if defined as the last parameter of your tool function.


* **Best Practice:** When reading from state, use `dictionary.get('key', default_value)` to handle cases where the key might not exist yet, ensuring your tool doesn't crash.


```typescript
// Define stateful weather tool
import { ToolContext } from 'adk-typescript/tools';

async function get_weather_stateful(
    params: Record<string, any>,
    toolContext: ToolContext
): Promise<any> {
    const city = params.city;
    console.log(`--- Tool: get_weather_stateful called for ${city} ---`);

    // --- Read preference from state ---
    const preferred_unit = toolContext.state.get("user_preference_temperature_unit", "Celsius"); // Default to Celsius
    console.log(`--- Tool: Reading state 'user_preference_temperature_unit': ${preferred_unit} ---`);

    const cityNormalized = city.toLowerCase().replace(" ", "");

    // Mock weather data (always stored in Celsius internally)
    const mock_weather_db: Record<string, any> = {
        "newyork": { temp_c: 25, condition: "sunny" },
        "london": { temp_c: 15, condition: "cloudy" },
        "tokyo": { temp_c: 18, condition: "light rain" },
    };

    if (mock_weather_db[cityNormalized]) {
        const data = mock_weather_db[cityNormalized];
        const temp_c = data.temp_c;
        const condition = data.condition;

        // Format temperature based on state preference
        let temp_value: number;
        let temp_unit: string;
        if (preferred_unit === "Fahrenheit") {
            temp_value = (temp_c * 9/5) + 32; // Calculate Fahrenheit
            temp_unit = "°F";
        } else { // Default to Celsius
            temp_value = temp_c;
            temp_unit = "°C";
        }

        const report = `The weather in ${city.charAt(0).toUpperCase() + city.slice(1)} is ${condition} with a temperature of ${temp_value.toFixed(0)}${temp_unit}.`;
        const result = { status: "success", report: report };
        console.log(`--- Tool: Generated report in ${preferred_unit}. Result: ${JSON.stringify(result)} ---`);

        // Example of writing back to state (optional for this tool)
        toolContext.state["last_city_checked_stateful"] = city;
        console.log(`--- Tool: Updated state 'last_city_checked_stateful': ${city} ---`);

        return result;
    } else {
        // Handle city not found
        const error_msg = `Sorry, I don't have weather information for '${city}'`;
        console.log(`--- Tool: City '${city}' not found. ---`);
        return { status: "error", error_message: error_msg };
    }
}

// Create a FunctionTool wrapper for the stateful weather function
const weatherStatefulTool = new FunctionTool({
    name: 'get_weather_stateful',
    description: 'Gets the current weather for a specific location, using unit preferences from state.',
    fn: get_weather_stateful,
    functionDeclaration: {
        name: 'get_weather_stateful',
        description: 'Gets the current weather for a specific location, using unit preferences from state.',
        parameters: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: 'The city, address, or general location to get weather for.',
                }
            },
            required: ['city']
        }
    }
});

// We would use this tool in our agent like this:
// const agent = new LlmAgent({
//     ...
//     tools: [weatherStatefulTool],
//     ...
// });
```

---

**3\. Redefine Sub-Agents and Update Root Agent**

To ensure this step is self-contained and builds correctly, we first redefine the `greeting_agent` and `farewell_agent` exactly as they were in Step 3\. Then, we define our new root agent (`weather_agent_v4_stateful`):

* It uses the new `get_weather_stateful` tool.  
* It includes the greeting and farewell sub-agents for delegation.  
* **Crucially**, it sets `output_key="last_weather_report"` which automatically saves its final weather response to the session state.


```typescript
// @title 3. Redefine Sub-Agents and Update Root Agent with output_key

// Ensure necessary imports: Agent, LiteLlm, Runner
import { LlmAgent } from 'adk-typescript';
import { LiteLlm } from 'adk-typescript/models';
import { InMemoryRunner } from 'adk-typescript';
// Ensure tools 'say_hello', 'say_goodbye' are defined (from Step 3)
// Ensure model constants MODEL_GPT_4O, MODEL_GEMINI_2_0_FLASH etc. are defined

// --- Redefine Greeting Agent (from Step 3) ---
let greeting_agent: LlmAgent | null = null;
try {
    greeting_agent = new LlmAgent({
        model: MODEL_GEMINI_2_0_FLASH,
        name: "greeting_agent",
        instruction: "You are the Greeting Agent. Your ONLY task is to provide a friendly greeting using the 'say_hello' tool. Do nothing else.",
        description: "Handles simple greetings and hellos using the 'say_hello' tool.",
        tools: [say_hello], // Use the FunctionTool wrapper
    });
    console.log(`✅ Agent '${greeting_agent.name}' redefined.`);
} catch (error) {
    console.error(`❌ Could not redefine Greeting agent. Error: ${error}`);
}

// --- Redefine Farewell Agent (from Step 3) ---
let farewell_agent: LlmAgent | null = null;
try {
    farewell_agent = new LlmAgent({
        model: MODEL_GEMINI_2_0_FLASH,
        name: "farewell_agent",
        instruction: "You are the Farewell Agent. Your ONLY task is to provide a polite goodbye message using the 'say_goodbye' tool. Do not perform any other actions.",
        description: "Handles simple farewells and goodbyes using the 'say_goodbye' tool.",
        tools: [say_goodbye], // Use the FunctionTool wrapper
    });
    console.log(`✅ Agent '${farewell_agent.name}' redefined.`);
} catch (error) {
    console.error(`❌ Could not redefine Farewell agent. Error: ${error}`);
}

// --- Define the Updated Root Agent ---
let root_agent_stateful: LlmAgent | null = null;
let runner_root_stateful: InMemoryRunner | null = null; // Initialize runner

// Check prerequisites before creating the root agent
if (greeting_agent && farewell_agent && 'get_weather_stateful' in globalThis) {

    const root_agent_model = MODEL_GEMINI_2_0_FLASH; // Choose orchestration model

    root_agent_stateful = new LlmAgent({
        name: "weather_agent_v4_stateful", // New version name
        model: root_agent_model,
        description: "Main agent: Provides weather (state-aware unit), delegates greetings/farewells, saves report to state.",
        instruction: "You are the main Weather Agent. Your job is to provide weather using 'get_weather_stateful'. "
                    "The tool will format the temperature based on user preference stored in state. "
                    "Delegate simple greetings to 'greeting_agent' and farewells to 'farewell_agent'. "
                    "Handle only weather requests, greetings, and farewells.",
        tools: [get_weather_stateful], // Use the state-aware tool
        sub_agents: [greeting_agent, farewell_agent], // Include sub-agents
        output_key: "last_weather_report" // <<< Auto-save agent's final weather response
    });
    console.log(`✅ Root Agent '${root_agent_stateful.name}' created using stateful tool and output_key.`);

    // --- Create Runner for this Root Agent & NEW Session Service ---
    runner_root_stateful = new InMemoryRunner({
        agent: root_agent_stateful,
        app_name: APP_NAME,
        session_service: session_service_stateful // Use the NEW stateful session service
    });
    console.log(`✅ Runner created for stateful root agent '${runner_root_stateful.agent.name}' using stateful session service.`);

} else {
    console.error("❌ Cannot create stateful root agent. Prerequisites missing.");
    if (!greeting_agent) console.error(" - greeting_agent definition missing.");
    if (!farewell_agent) console.error(" - farewell_agent definition missing.");
    if (!'get_weather_stateful' in globalThis) console.error(" - get_weather_stateful tool missing.");
}

```

---

**4\. Interact and Test State Flow**

Now, let's execute a conversation designed to test the state interactions using the `runner_root_stateful` (associated with our stateful agent and the `session_service_stateful`). We'll use the `call_agent_async` function defined earlier, ensuring we pass the correct runner, user ID (`USER_ID_STATEFUL`), and session ID (`SESSION_ID_STATEFUL`).

The conversation flow will be:

1.  **Check weather (London):** The `get_weather_stateful` tool should read the initial "Celsius" preference from the session state initialized in Section 1. The root agent's final response (the weather report in Celsius) should get saved to `state['last_weather_report']` via the `output_key` configuration.
2.  **Manually update state:** We will *directly modify* the state stored within the `InMemorySessionService` instance (`session_service_stateful`).
    *   **Why direct modification?** The `session_service.getSession()` method returns a *copy* of the session. Modifying that copy wouldn't affect the state used in subsequent agent runs. For this testing scenario with `InMemorySessionService`, we access the internal `sessions` dictionary to change the *actual* stored state value for `user_preference_temperature_unit` to "Fahrenheit". *Note: In real applications, state changes are typically triggered by tools or agent logic returning `EventActions(state_delta=...)`, not direct manual updates.*
3.  **Check weather again (New York):** The `get_weather_stateful` tool should now read the updated "Fahrenheit" preference from the state and convert the temperature accordingly. The root agent's *new* response (weather in Fahrenheit) will overwrite the previous value in `state['last_weather_report']` due to the `output_key`.
4.  **Greet the agent:** Verify that delegation to the `greeting_agent` still works correctly alongside the stateful operations. This interaction will become the *last* response saved by `output_key` in this specific sequence.
5.  **Inspect final state:** After the conversation, we retrieve the session one last time (getting a copy) and print its state to confirm the `user_preference_temperature_unit` is indeed "Fahrenheit", observe the final value saved by `output_key` (which will be the greeting in this run), and see the `last_city_checked_stateful` value written by the tool.



```typescript
// @title 4. Interact to Test State Flow and output_key

// Ensure the stateful runner (runner_root_stateful) is available from the previous cell
// Ensure call_agent_async, USER_ID_STATEFUL, SESSION_ID_STATEFUL, APP_NAME are defined

if ('runner_root_stateful' in globalThis && runner_root_stateful) {
    // Define the main async function for the stateful conversation logic.
    async function run_stateful_conversation() {
        console.log("\n--- Testing State: Temp Unit Conversion & output_key ---");

        // 1. Check weather (Uses initial state: Celsius)
        console.log("--- Turn 1: Requesting weather in London (expect Celsius) ---");
        await call_agent_async("What's the weather in London?", runner_root_stateful, USER_ID_STATEFUL, SESSION_ID_STATEFUL);

        // 2. Manually update state preference to Fahrenheit - DIRECTLY MODIFY STORAGE
        console.log("\n--- Manually Updating State: Setting unit to Fahrenheit ---");
        try {
            // Access the internal storage directly - THIS IS SPECIFIC TO InMemorySessionService for testing
            // NOTE: In production with persistent services (Database, VertexAI), you would
            // typically update state via agent actions or specific service APIs if available,
            // not by direct manipulation of internal storage.
            const stored_session = session_service_stateful.sessions[APP_NAME][USER_ID_STATEFUL][SESSION_ID_STATEFUL];
            stored_session.state["user_preference_temperature_unit"] = "Fahrenheit";
            // Optional: You might want to update the timestamp as well if any logic depends on it
            // stored_session.last_update_time = Date.now();
            console.log(`--- Stored session state updated. Current 'user_preference_temperature_unit': ${stored_session.state.get('user_preference_temperature_unit', 'Not Set')}`); // Added .get for safety
        } catch (error) {
            console.error(`--- Error: Could not retrieve session '${SESSION_ID_STATEFUL}' from internal storage for user '${USER_ID_STATEFUL}' in app '${APP_NAME}' to update state. Check IDs and if session was created. ---`);
        }

        // 3. Check weather again (Tool should now use Fahrenheit)
        // This will also update 'last_weather_report' via output_key
        console.log("\n--- Turn 2: Requesting weather in New York (expect Fahrenheit) ---");
        await call_agent_async("Tell me the weather in New York.", runner_root_stateful, USER_ID_STATEFUL, SESSION_ID_STATEFUL);

        // 4. Test basic delegation (should still work)
        // This will update 'last_weather_report' again, overwriting the NY weather report
        console.log("\n--- Turn 3: Sending a greeting ---");
        await call_agent_async("Hi!", runner_root_stateful, USER_ID_STATEFUL, SESSION_ID_STATEFUL);
    }

    // --- Execute the `run_stateful_conversation` async function ---
    // Choose ONE of the methods below based on your environment.

    // METHOD 1: Direct Promise handling (Default for Node.js/TypeScript)
    console.log("Executing run_stateful_conversation using Promise...");
    run_stateful_conversation().then(() => {
        console.log("Stateful conversation completed successfully");
    }).catch(error => {
        console.error(`An error occurred: ${error}`);
    });

    // METHOD 2: For Standard Node.js Scripts (.ts)
    // If running this code as a standard Node.js script from your terminal
    // To use this method:
    // 1. Comment out the Promise-based execution above
    // 2. Uncomment the following block:
    /**
    if (require.main === module) {
        console.log("Executing run_stateful_conversation as main module...");
        run_stateful_conversation().then(() => {
            console.log("Stateful conversation completed successfully");
        }).catch(error => {
            console.error(`An error occurred: ${error}`);
        });
    }
    */

    // --- Inspect final session state after the conversation ---
    // This block runs after either execution method completes.
    console.log("\n--- Inspecting Final Session State ---");
    session_service_stateful.getSession(APP_NAME, USER_ID_STATEFUL, SESSION_ID_STATEFUL).then(final_session => {
        // Use .get() for safer access to potentially missing keys
        console.log(`Final Preference: ${final_session.state.get('user_preference_temperature_unit', 'Not Set')}`);
        console.log(`Final Last Weather Report (from output_key): ${final_session.state.get('last_weather_report', 'Not Set')}`);
        console.log(`Final Last City Checked (by tool): ${final_session.state.get('last_city_checked_stateful', 'Not Set')}`);
        // Print full state for detailed view
        // console.log(`Full State Dict: ${JSON.stringify(final_session.state)}`); // Use as_dict() for clarity
    }).catch(error => {
        console.error(`\n❌ Error: Could not retrieve final session state. Error: ${error}`);
    });

} else {
    console.warn("\n⚠️ Skipping state test conversation. Stateful root agent runner ('runner_root_stateful') is not available.");
}
```

---

By reviewing the conversation flow and the final session state printout, you can confirm:

*   **State Read:** The weather tool (`get_weather_stateful`) correctly read `user_preference_temperature_unit` from state, initially using "Celsius" for London.
*   **State Update:** The direct modification successfully changed the stored preference to "Fahrenheit".
*   **State Read (Updated):** The tool subsequently read "Fahrenheit" when asked for New York's weather and performed the conversion.
*   **Tool State Write:** The tool successfully wrote the `last_city_checked_stateful` ("New York" after the second weather check) into the state via `tool_context.state`.
*   **Delegation:** The delegation to the `greeting_agent` for "Hi!" functioned correctly even after state modifications.
*   **`output_key`:** The `output_key="last_weather_report"` successfully saved the root agent's *final* response for *each turn* where the root agent was the one ultimately responding. In this sequence, the last response was the greeting ("Hello, there!"), so that overwrote the weather report in the state key.
*   **Final State:** The final check confirms the preference persisted as "Fahrenheit".

You've now successfully integrated session state to personalize agent behavior using `ToolContext`, manually manipulated state for testing `InMemorySessionService`, and observed how `output_key` provides a simple mechanism for saving the agent's last response to state. This foundational understanding of state management is key as we proceed to implement safety guardrails using callbacks in the next steps.

---

## Step 5: Adding Safety \- Input Guardrail with `beforeModelCallback`

Our agent team is becoming more capable, remembering preferences and using tools effectively. However, in real-world scenarios, we often need safety mechanisms to control the agent's behavior *before* potentially problematic requests even reach the core Large Language Model (LLM).

ADK provides **Callbacks** – functions that allow you to hook into specific points in the agent's execution lifecycle. The `beforeModelCallback` is particularly useful for input safety.

**What is `beforeModelCallback`?**

* It's a TypeScript function you define that ADK executes *just before* an agent sends its compiled request (including conversation history, instructions, and the latest user message) to the underlying LLM.  
* **Purpose:** Inspect the request, modify it if necessary, or block it entirely based on predefined rules.

**Common Use Cases:**

* **Input Validation/Filtering:** Check if user input meets criteria or contains disallowed content (like PII or keywords).  
* **Guardrails:** Prevent harmful, off-topic, or policy-violating requests from being processed by the LLM.  
* **Dynamic Prompt Modification:** Add timely information (e.g., from session state) to the LLM request context just before sending.

**How it Works:**

1. Define a function accepting `callback_context: CallbackContext` and `llm_request: LlmRequest`.  
   * `callback_context`: Provides access to agent info, session state (`callback_context.state`), etc.  
   * `llm_request`: Contains the full payload intended for the LLM (`contents`, `config`).  
2. Inside the function:  
   * **Inspect:** Examine `llm_request.contents` (especially the last user message).  
   * **Modify (Use Caution):** You *can* change parts of `llm_request`.  
   * **Block (Guardrail):** Return an `LlmResponse` object. ADK will send this response back immediately, *skipping* the LLM call for that turn.  
   * **Allow:** Return `None`. ADK proceeds to call the LLM with the (potentially modified) request.

**In this step, we will:**

1. Define a `beforeModelCallback` function (`block_keyword_guardrail`) that checks the user's input for a specific keyword ("BLOCK").  
2. Update our stateful root agent (`weather_agent_v4_stateful` from Step 4\) to use this callback.  
3. Create a new runner associated with this updated agent but using the *same stateful session service* to maintain state continuity.  
4. Test the guardrail by sending both normal and keyword-containing requests.

---

**1\. Define the Guardrail Callback Function**

This function will inspect the last user message within the `llm_request` content. If it finds "BLOCK" (case-insensitive), it constructs and returns an `LlmResponse` to block the flow; otherwise, it returns `None`.  


```typescript
// @title 1. Define the beforeModelCallback Guardrail

// Ensure necessary imports are available
import { CallbackContext } from 'adk-typescript/agents';
import { LlmRequest } from 'adk-typescript/models';
import { LlmResponse } from 'adk-typescript/models';
import { Content, Part } from 'adk-typescript/models/types'; // For creating response content
import { Optional } from 'typescript';

function block_keyword_guardrail(
    callbackContext: CallbackContext, 
    llmRequest: LlmRequest
): LlmResponse | undefined {
    /**
     * Inspects the latest user message for 'BLOCK'. If found, blocks the LLM call
     * and returns a predefined LlmResponse. Otherwise, returns undefined to proceed.
     */
    const agentName = callbackContext.agentName; // Get the name of the agent whose model call is being intercepted
    console.log(`--- Callback: block_keyword_guardrail running for agent: ${agentName} ---`);

    // Extract the text from the latest user message in the request history
    let lastUserMessageText = "";
    if (llmRequest.contents) {
        // Find the most recent message with role 'user'
        for (let i = llmRequest.contents.length - 1; i >= 0; i--) {
            const content = llmRequest.contents[i];
            if (content.role === 'user' && content.parts && content.parts.length > 0) {
                // Assuming text is in the first part for simplicity
                if (content.parts[0].text) {
                    lastUserMessageText = content.parts[0].text;
                    break; // Found the last user message text
                }
            }
        }
    }

    console.log(`--- Callback: Inspecting last user message: '${lastUserMessageText.slice(0, 100)}...' ---`); // Log first 100 chars

    // --- Guardrail Logic ---
    const keywordToBlock = "BLOCK";
    if (lastUserMessageText.toUpperCase().includes(keywordToBlock)) { // Case-insensitive check
        console.log(`--- Callback: Found '${keywordToBlock}'. Blocking LLM call! ---`);
        // Optionally, set a flag in state to record the block event
        callbackContext.state["guardrail_block_keyword_triggered"] = true;
        console.log(`--- Callback: Set state 'guardrail_block_keyword_triggered': true ---`);

        // Construct and return an LlmResponse to stop the flow and send this back instead
        return new LlmResponse({
            content: new Content({
                role: "model", // Mimic a response from the agent's perspective
                parts: [new Part({ 
                    text: `I cannot process this request because it contains the blocked keyword '${keywordToBlock}'.` 
                })],
            })
            // Note: You could also set an errorMessage field here if needed
        });
    } else {
        // Keyword not found, allow the request to proceed to the LLM
        console.log(`--- Callback: Keyword not found. Allowing LLM call for ${agentName}. ---`);
        return undefined; // Returning undefined signals ADK to continue normally
    }
}

console.log("✅ block_keyword_guardrail function defined.");

```

---

**2\. Update Root Agent to Use the Callback**

We redefine the root agent, adding the `beforeModelCallback` parameter and pointing it to our new guardrail function. We'll give it a new version name for clarity.

*Important:* We need to redefine the sub-agents (`greeting_agent`, `farewell_agent`) and the stateful tool (`get_weather_stateful`) within this context if they are not already available from previous steps, ensuring the root agent definition has access to all its components.


```typescript
// @title 2. Update Root Agent with beforeModelCallback


// --- Redefine Sub-Agents (Ensures they exist in this context) ---
let greeting_agent: LlmAgent | null = null;
try {
    // Use a defined model constant
    greeting_agent = new LlmAgent({
        model: MODEL_GEMINI_2_0_FLASH,
        name: "greeting_agent", // Keep original name for consistency
        instruction: "You are the Greeting Agent. Your ONLY task is to provide a friendly greeting using the 'say_hello' tool. Do nothing else.",
        description: "Handles simple greetings and hellos using the 'say_hello' tool.",
        tools: [say_hello], // Use the FunctionTool wrapper
    });
    console.log(`✅ Sub-Agent '${greeting_agent.name}' redefined.`);
} catch (error) {
    console.error(`❌ Could not redefine Greeting agent. Check Model/API Key (${greeting_agent?.model}). Error: ${error}`);
}

farewell_agent = null;
try {
    // Use a defined model constant
    farewell_agent = new LlmAgent({
        model: MODEL_GEMINI_2_0_FLASH,
        name: "farewell_agent", // Keep original name
        instruction: "You are the Farewell Agent. Your ONLY task is to provide a polite goodbye message using the 'say_goodbye' tool. Do not perform any other actions.",
        description: "Handles simple farewells and goodbyes using the 'say_goodbye' tool.",
        tools: [say_goodbye], // Use the FunctionTool wrapper
    });
    console.log(`✅ Sub-Agent '${farewell_agent.name}' redefined.`);
} catch (error) {
    console.error(`❌ Could not redefine Farewell agent. Check Model/API Key (${farewell_agent?.model}). Error: ${error}`);
}


// --- Define the Root Agent with the Callback ---
let root_agent_model_guardrail: LlmAgent | null = null;
let runner_root_model_guardrail: InMemoryRunner | null = null;

// Check all components before proceeding
if (greeting_agent && farewell_agent && 'get_weather_stateful' in globalThis && 'block_keyword_guardrail' in globalThis) {

    // Use a defined model constant
    const root_agent_model = MODEL_GEMINI_2_0_FLASH;

    root_agent_model_guardrail = new LlmAgent({
        name: "weather_agent_v5_model_guardrail", // New version name for clarity
        model: root_agent_model,
        description: "Main agent: Handles weather, delegates greetings/farewells, includes input keyword guardrail.",
        instruction: "You are the main Weather Agent. Provide weather using 'get_weather_stateful'. "
                    "Delegate simple greetings to 'greeting_agent' and farewells to 'farewell_agent'. "
                    "Handle only weather requests, greetings, and farewells.",
        tools: [weatherTool],
        sub_agents: [greeting_agent, farewell_agent], // Reference the redefined sub-agents
        output_key: "last_weather_report", // Keep output_key from Step 4
        beforeModelCallback: block_keyword_guardrail // <<< Assign the guardrail callback
    });
    console.log(`✅ Root Agent '${root_agent_model_guardrail.name}' created with beforeModelCallback.`);

    // --- Create Runner for this Agent, Using SAME Stateful Session Service ---
    // Ensure session_service_stateful exists from Step 4
    if ('session_service_stateful' in globalThis) {
        runner_root_model_guardrail = new InMemoryRunner({
            agent: root_agent_model_guardrail,
            app_name: APP_NAME, // Use consistent APP_NAME
            session_service: session_service_stateful // <<< Use the service from Step 4
        });
        console.log(`✅ Runner created for guardrail agent '${runner_root_model_guardrail.agent.name}', using stateful session service.`);
    } else {
        console.error("❌ Cannot create runner. 'session_service_stateful' from Step 4 is missing.");
    }

} else {
    console.error("❌ Cannot create root agent with model guardrail. One or more prerequisites are missing or failed initialization:");
    if (!greeting_agent) console.error("   - Greeting Agent");
    if (!farewell_agent) console.error("   - Farewell Agent");
    if (!'get_weather_stateful' in globalThis) console.error("   - 'get_weather_stateful' tool");
    if (!'block_keyword_guardrail' in globalThis) console.error("   - 'block_keyword_guardrail' callback");
}

```

---

**3\. Interact to Test the Guardrail**

Let's test the guardrail's behavior. We'll use the *same session* (`SESSION_ID_STATEFUL`) as in Step 4 to show that state persists across these changes.

1. Send a normal weather request (should pass the guardrail and execute).  
2. Send a request containing "BLOCK" (should be intercepted by the callback).  
3. Send a greeting (should pass the root agent's guardrail, be delegated, and execute normally).


```typescript
// @title 3. Interact to Test the Model Input Guardrail

// Ensure the runner for the guardrail agent is available
if ('runner_root_model_guardrail' in globalThis && runner_root_model_guardrail) {
    // Define the main async function for the guardrail test conversation.
    // The 'await' keywords INSIDE this function are necessary for async operations.
    async function run_guardrail_test_conversation() {
        console.log("\n--- Testing Model Input Guardrail ---");

        // Use the runner for the agent with the callback and the existing stateful session ID
        // Define a helper lambda for cleaner interaction calls
        const interaction_func = (query: string) => call_agent_async(query,
                                                                 runner_root_model_guardrail,
                                                                 USER_ID_STATEFUL, // Use existing user ID
                                                                 SESSION_ID_STATEFUL // Use existing session ID
                                                                );
        // 1. Normal request (Callback allows, should use Fahrenheit from previous state change)
        console.log("--- Turn 1: Requesting weather in London (expect allowed, Fahrenheit) ---");
        interaction_func("What is the weather in London?").then(result => {
            console.log(result);
        }).catch(error => {
            console.error(`An error occurred: ${error}`);
        });

        // 2. Request containing the blocked keyword (Callback intercepts)
        console.log("\n--- Turn 2: Requesting with blocked keyword (expect blocked) ---");
        interaction_func("BLOCK the request for weather in Tokyo").then(result => {
            console.log(result);
        }).catch(error => {
            console.error(`An error occurred: ${error}`);
        });

        // 3. Normal greeting (Callback allows root agent, delegation happens)
        console.log("\n--- Turn 3: Sending a greeting (expect allowed) ---");
        interaction_func("Hello again").then(result => {
            console.log(result);
        }).catch(error => {
            console.error(`An error occurred: ${error}`);
        });
    }

    // --- Execute the `run_guardrail_test_conversation` async function ---
    // Choose ONE of the methods below based on your environment.

    // METHOD 1: Direct Promise handling (Default for Node.js/TypeScript)
    console.log("Executing run_guardrail_test_conversation using Promise...");
    run_guardrail_test_conversation().then(() => {
        console.log("Guardrail test conversation completed successfully");
    }).catch(error => {
        console.error(`An error occurred: ${error}`);
    });

    // METHOD 2: For Standard Node.js Scripts (.ts)
    // If running this code as a standard Node.js script from your terminal
    // To use this method:
    // 1. Comment out the Promise-based execution above
    // 2. Uncomment the following block:
    /**
    if (require.main === module) {
        console.log("Executing run_guardrail_test_conversation as main module...");
        run_guardrail_test_conversation().then(() => {
            console.log("Guardrail test conversation completed successfully");
        }).catch(error => {
            console.error(`An error occurred: ${error}`);
        });
    }
    */

    // --- Inspect final session state after the conversation ---
    // This block runs after either execution method completes.
    // Optional: Check state for the trigger flag set by the callback
    console.log("\n--- Inspecting Final Session State (After Guardrail Test) ---");
    // Use the session service instance associated with this stateful session
    session_service_stateful.getSession({
        appName: APP_NAME, 
        userId: USER_ID_STATEFUL, 
        sessionId: SESSION_ID_STATEFUL
    }).then(finalSession => {
        // Use .get() for safer access
        console.log(`Guardrail Triggered Flag: ${finalSession.state.get('guardrail_block_keyword_triggered', 'Not Set (or False)')}`)
        console.log(`Last Weather Report: ${finalSession.state.get('last_weather_report', 'Not Set')}`); // Should be London weather if successful
        console.log(`Temperature Unit: ${finalSession.state.get('user_preference_temperature_unit', 'Not Set')}`); // Should be Fahrenheit
    }).catch(error => {
        console.error(`\n❌ Error: Could not retrieve final session state. Error: ${error}`);
    });

} else {
    console.warn("\n⚠️ Skipping model guardrail test. Runner ('runner_root_model_guardrail') is not available.");
}
```
---

Observe the execution flow:

1. **London Weather:** The callback runs for `weather_agent_v5_model_guardrail`, inspects the message, prints "Keyword not found. Allowing LLM call.", and returns `None`. The agent proceeds, calls the `get_weather_stateful` tool (which uses the "Fahrenheit" preference from Step 4's state change), and returns the weather. This response updates `last_weather_report` via `output_key`.  
2. **BLOCK Request:** The callback runs again for `weather_agent_v5_model_guardrail`, inspects the message, finds "BLOCK", prints "Blocking LLM call\!", sets the state flag, and returns the predefined `LlmResponse`. The agent's underlying LLM is *never called* for this turn. The user sees the callback's blocking message.  
3. **Hello Again:** The callback runs for `weather_agent_v5_model_guardrail`, allows the request. The root agent then delegates to `greeting_agent`. *Note: The `beforeModelCallback` defined on the root agent does NOT automatically apply to sub-agents.* The `greeting_agent` proceeds normally, calls its `say_hello` tool, and returns the greeting.

You have successfully implemented an input safety layer\! The `beforeModelCallback` provides a powerful mechanism to enforce rules and control agent behavior *before* expensive or potentially risky LLM calls are made. Next, we'll apply a similar concept to add guardrails around tool usage itself.

## Step 6: Adding Safety \- Tool Argument Guardrail (`beforeToolCallback`)

In Step 5, we added a guardrail to inspect and potentially block user input *before* it reached the LLM. Now, we'll add another layer of control *after* the LLM has decided to use a tool but *before* that tool actually executes. This is useful for validating the *arguments* the LLM wants to pass to the tool.

ADK provides the `beforeToolCallback` for this precise purpose.

**What is `beforeToolCallback`?**

* It's a TypeScript function executed just *before* a specific tool function runs, after the LLM has requested its use and decided on the arguments.  
* **Purpose:** Validate tool arguments, prevent tool execution based on specific inputs, modify arguments dynamically, or enforce resource usage policies.

**Common Use Cases:**

* **Argument Validation:** Check if arguments provided by the LLM are valid, within allowed ranges, or conform to expected formats.  
* **Resource Protection:** Prevent tools from being called with inputs that might be costly, access restricted data, or cause unwanted side effects (e.g., blocking API calls for certain parameters).  
* **Dynamic Argument Modification:** Adjust arguments based on session state or other contextual information before the tool runs.

**How it Works:**

1. Define a function accepting `tool: BaseTool`, `args: Record<string, any>`, and `tool_context: ToolContext`.  
   * `tool`: The tool object about to be called (inspect `tool.name`).  
   * `args`: The dictionary of arguments the LLM generated for the tool.  
   * `tool_context`: Provides access to session state (`tool_context.state`), agent info, etc.  
2. Inside the function:  
   * **Inspect:** Examine the `tool.name` and the `args` dictionary.  
   * **Modify:** Change values within the `args` dictionary *directly*. If you return `None`, the tool runs with these modified args.  
   * **Block/Override (Guardrail):** Return a **dictionary**. ADK treats this dictionary as the *result* of the tool call, completely *skipping* the execution of the original tool function. The dictionary should ideally match the expected return format of the tool it's blocking.  
   * **Allow:** Return `None`. ADK proceeds to execute the actual tool function with the (potentially modified) arguments.

**In this step, we will:**

1. Define a `beforeToolCallback` function (`block_paris_tool_guardrail`) that specifically checks if the `get_weather_stateful` tool is called with the city "Paris".  
2. If "Paris" is detected, the callback will block the tool and return a custom error dictionary.  
3. Update our root agent (`weather_agent_v6_tool_guardrail`) to include *both* the `beforeModelCallback` and this new `beforeToolCallback`.  
4. Create a new runner for this agent, using the same stateful session service.  
5. Test the flow by requesting weather for allowed cities and the blocked city ("Paris").

---

**1\. Define the Tool Guardrail Callback Function**

This function targets the `get_weather_stateful` tool. It checks the `city` argument. If it's "Paris", it returns an error dictionary that looks like the tool's own error response. Otherwise, it allows the tool to run by returning `None`.


```typescript
// @title 1. Define the beforeToolCallback Guardrail

// Ensure necessary imports are available
import { BaseTool } from 'adk-typescript/tools';
import { ToolContext } from 'adk-typescript/tools';
import { Optional } from 'typescript';

function block_paris_tool_guardrail(
    tool: BaseTool, 
    args: Record<string, any>, 
    toolContext: ToolContext
): Record<string, any> | undefined {
    /**
     * Checks if 'get_weather_stateful' is called for 'Paris'.
     * If so, blocks the tool execution and returns a specific error dictionary.
     * Otherwise, allows the tool call to proceed by returning undefined.
     */
    const toolName = tool.name;
    const agentName = toolContext.agentName; // Agent attempting the tool call
    console.log(`--- Callback: block_paris_tool_guardrail running for tool '${toolName}' in agent '${agentName}' ---`);
    console.log(`--- Callback: Inspecting args: ${JSON.stringify(args)} ---`);

    // --- Guardrail Logic ---
    const targetToolName = "get_weather_stateful"; // Match the function name used by FunctionTool
    const blockedCity = "paris";

    // Check if it's the correct tool and the city argument matches the blocked city
    if (toolName === targetToolName) {
        const cityArgument = args.city; // Get the 'city' argument
        if (cityArgument && typeof cityArgument === 'string' && cityArgument.toLowerCase() === blockedCity) {
            console.log(`--- Callback: Detected blocked city '${cityArgument}'. Blocking tool execution! ---`);
            // Optionally update state
            toolContext.state["guardrail_tool_block_triggered"] = true;
            console.log(`--- Callback: Set state 'guardrail_tool_block_triggered': true ---`);

            // Return a dictionary matching the tool's expected output format for errors
            // This dictionary becomes the tool's result, skipping the actual tool run.
            return {
                status: "error",
                error_message: `Policy restriction: Weather checks for '${cityArgument.charAt(0).toUpperCase() + cityArgument.slice(1)}' are currently disabled by a tool guardrail.`
            };
        } else {
            console.log(`--- Callback: City '${cityArgument}' is allowed for tool '${toolName}'. ---`);
        }
    } else {
        console.log(`--- Callback: Tool '${toolName}' is not the target tool. Allowing. ---`);
    }

    // If the checks above didn't return a dictionary, allow the tool to execute
    console.log(`--- Callback: Allowing tool '${toolName}' to proceed. ---`);
    return undefined; // Returning undefined allows the actual tool function to run
}

console.log("✅ block_paris_tool_guardrail function defined.");

```

---

**2\. Update Root Agent to Use Both Callbacks**

We redefine the root agent again (`weather_agent_v6_tool_guardrail`), this time adding the `beforeToolCallback` parameter alongside the `beforeModelCallback` from Step 5\.

*Self-Contained Execution Note:* Similar to Step 5, ensure all prerequisites (sub-agents, tools, `beforeModelCallback`) are defined or available in the execution context before defining this agent.


```typescript
// @title 2. Update Root Agent with BOTH Callbacks (Self-Contained)

// --- Ensure Prerequisites are Defined ---
// (Include or ensure execution of definitions for: Agent, LiteLlm, Runner, ToolContext,
//  MODEL constants, say_hello, say_goodbye, greeting_agent, farewell_agent,
//  get_weather_stateful, block_keyword_guardrail, block_paris_tool_guardrail)

// --- Redefine Sub-Agents (Ensures they exist in this context) ---
let greeting_agent: LlmAgent | null = null;
try {
    // Use a defined model constant
    greeting_agent = new LlmAgent({
        model: MODEL_GEMINI_2_0_FLASH,
        name: "greeting_agent", // Keep original name for consistency
        instruction: "You are the Greeting Agent. Your ONLY task is to provide a friendly greeting using the 'say_hello' tool. Do nothing else.",
        description: "Handles simple greetings and hellos using the 'say_hello' tool.",
        tools: [say_hello], // Use the FunctionTool wrapper
    });
    console.log(`✅ Sub-Agent '${greeting_agent.name}' redefined.`);
} catch (error) {
    console.error(`❌ Could not redefine Greeting agent. Check Model/API Key (${greeting_agent?.model}). Error: ${error}`);
}

farewell_agent = null;
try {
    // Use a defined model constant
    farewell_agent = new LlmAgent({
        model: MODEL_GEMINI_2_0_FLASH,
        name: "farewell_agent", // Keep original name
        instruction: "You are the Farewell Agent. Your ONLY task is to provide a polite goodbye message using the 'say_goodbye' tool. Do not perform any other actions.",
        description: "Handles simple farewells and goodbyes using the 'say_goodbye' tool.",
        tools: [say_goodbye], // Use the FunctionTool wrapper
    });
    console.log(`✅ Sub-Agent '${farewell_agent.name}' redefined.`);
} catch (error) {
    console.error(`❌ Could not redefine Farewell agent. Check Model/API Key (${farewell_agent?.model}). Error: ${error}`);
}

// --- Define the Root Agent with Both Callbacks ---
let rootAgentToolGuardrail: LlmAgent | null = null;
let runnerRootToolGuardrail: Runner | null = null;

if ('greeting_agent' in globalThis && greeting_agent &&
    'farewell_agent' in globalThis && farewell_agent &&
    'get_weather_stateful' in globalThis &&
    'block_keyword_guardrail' in globalThis &&
    'block_paris_tool_guardrail' in globalThis) {

    const rootAgentModel = MODEL_GEMINI_2_0_FLASH;

    // Create a FunctionTool wrapper for the stateful weather function
    const weatherStatefulTool = new FunctionTool({
        name: 'get_weather_stateful',
        description: 'Gets the current weather for a specific location, using unit preferences from state.',
        fn: get_weather_stateful,
        functionDeclaration: {
            name: 'get_weather_stateful',
            description: 'Gets the current weather for a specific location, using unit preferences from state.',
            parameters: {
                type: 'object',
                properties: {
                    city: {
                        type: 'string',
                        description: 'The city, address, or general location to get weather for.',
                    }
                },
                required: ['city']
            }
        }
    });

    root_agent_tool_guardrail = new LlmAgent({
        name: "weather_agent_v6_tool_guardrail", // New version name
        model: root_agent_model,
        description: "Main agent: Handles weather, delegates, includes input AND tool guardrails.",
        instruction: "You are the main Weather Agent. Provide weather using 'get_weather_stateful'. "
                   + "Delegate greetings to 'greeting_agent' and farewells to 'farewell_agent'. "
                   + "Handle only weather, greetings, and farewells.",
        tools: [weatherStatefulTool],
        subAgents: [greeting_agent, farewell_agent],
        outputKey: "last_weather_report",
        beforeModelCallback: block_keyword_guardrail, // Keep model guardrail
        beforeToolCallback: block_paris_tool_guardrail // Add tool guardrail
    });
    console.log(`✅ Root Agent '${root_agent_tool_guardrail.name}' created with BOTH callbacks.`);

    // --- Create Runner, Using SAME Stateful Session Service ---
    if ('session_service_stateful' in globalThis) {
        runner_root_tool_guardrail = new Runner({
            agent: root_agent_tool_guardrail,
            appName: APP_NAME, // Use consistent APP_NAME
            sessionService: session_service_stateful // Use the service from Step 4/5
        });
        console.log(`✅ Runner created for tool guardrail agent '${runner_root_tool_guardrail.agent.name}', using stateful session service.`);
    } else {
        console.error("❌ Cannot create runner. 'session_service_stateful' from Step 4/5 is missing.");
    }

} else {
    console.error("❌ Cannot create root agent with tool guardrail. Prerequisites missing.");
}

```

---

**3\. Interact to Test the Tool Guardrail**

Let's test the interaction flow, again using the same stateful session (`SESSION_ID_STATEFUL`) from the previous steps.

1. Request weather for "New York": Passes both callbacks, tool executes (using Fahrenheit preference from state).  
2. Request weather for "Paris": Passes `beforeModelCallback`. LLM decides to call `get_weather_stateful(city='Paris')`. `beforeToolCallback` intercepts, blocks the tool, and returns the error dictionary. Agent relays this error.  
3. Request weather for "London": Passes both callbacks, tool executes normally.


```typescript
// @title 3. Interact to Test the Tool Argument Guardrail

// Ensure the runner for the tool guardrail agent is available
if ('rootAgentToolGuardrail' in globalThis && runnerRootToolGuardrail) {
    // Define the main async function for the tool guardrail test conversation.
    // The 'await' keywords INSIDE this function are necessary for async operations.
    async function runToolGuardrailTest() {
        console.log("\n--- Testing Tool Argument Guardrail ('Paris' blocked) ---");

        // Use the runner for the agent with both callbacks and the existing stateful session
        // Define a helper lambda for cleaner interaction calls
        const interactionFunc = (query: string) => call_agent_async(query,
                                                                 runnerRootToolGuardrail,
                                                                 USER_ID_STATEFUL, // Use existing user ID
                                                                 SESSION_ID_STATEFUL // Use existing session ID
                                                                );
        // 1. Allowed city (Should pass both callbacks, use Fahrenheit state)
        console.log("--- Turn 1: Requesting weather in New York (expect allowed) ---");
        await interactionFunc("What's the weather in New York?");

        // 2. Blocked city (Should pass model callback, but be blocked by tool callback)
        console.log("\n--- Turn 2: Requesting weather in Paris (expect blocked by tool guardrail) ---");
        await interactionFunc("How about Paris?"); // Tool callback should intercept this

        // 3. Another allowed city (Should work normally again)
        console.log("\n--- Turn 3: Requesting weather in London (expect allowed) ---");
        await interactionFunc("Tell me the weather in London.");
    }

    // --- Execute the `runToolGuardrailTest` async function ---
    // Choose ONE of the methods below based on your environment.

    // METHOD 1: Direct Promise handling (Default for Node.js/TypeScript)
    console.log("Executing runToolGuardrailTest using Promise...");
    runToolGuardrailTest().then(() => {
        console.log("Tool guardrail test conversation completed successfully");
    }).catch(error => {
        console.error(`An error occurred: ${error}`);
    });

    // METHOD 2: For Standard Node.js Scripts (.ts)
    // If running this code as a standard Node.js script from your terminal
    // To use this method:
    // 1. Comment out the Promise-based execution above
    // 2. Uncomment the following block:
    /**
    if (require.main === module) {
        console.log("Executing runToolGuardrailTest as main module...");
        runToolGuardrailTest().then(() => {
            console.log("Tool guardrail test conversation completed successfully");
        }).catch(error => {
            console.error(`An error occurred: ${error}`);
        });
    }
    */

    // --- Inspect final session state after the conversation ---
    // This block runs after either execution method completes.
    // Optional: Check state for the tool block trigger flag
    console.log("\n--- Inspecting Final Session State (After Tool Guardrail Test) ---");
    // Use the session service instance associated with this stateful session
    session_service_stateful.getSession(APP_NAME, USER_ID_STATEFUL, SESSION_ID_STATEFUL).then(final_session => {
        // Use .get() for safer access
        console.log(`Tool Guardrail Triggered Flag: ${final_session.state.get('guardrail_tool_block_triggered', 'Not Set (or False)')}`)
        console.log(`Last Weather Report: ${final_session.state.get('last_weather_report', 'Not Set')}`); // Should be London weather if successful
        console.log(`Temperature Unit: ${final_session.state.get('user_preference_temperature_unit', 'Not Set')}`); // Should be Fahrenheit
        // console.log(`Full State Dict: ${JSON.stringify(final_session.state)}`); // For detailed view
    }).catch(error => {
        console.error(`\n❌ Error: Could not retrieve final session state. Error: ${error}`);
    });

} else {
    console.warn("\n⚠️ Skipping tool guardrail test. Runner ('runnerRootToolGuardrail') is not available.");
}
```

---

Analyze the output:

1. **New York:** The `beforeModelCallback` allows the request. The LLM requests `get_weather_stateful`. The `beforeToolCallback` runs, inspects the args (`{'city': 'New York'}`), sees it's not "Paris", prints "Allowing tool..." and returns `None`. The actual `get_weather_stateful` function executes, reads "Fahrenheit" from state, and returns the weather report. The agent relays this, and it gets saved via `output_key`.  
2. **Paris:** The `beforeModelCallback` allows the request. The LLM requests `get_weather_stateful(city='Paris')`. The `beforeToolCallback` runs, inspects the args, detects "Paris", prints "Blocking tool execution\!", sets the state flag, and returns the error dictionary `{'status': 'error', 'error_message': 'Policy restriction...'}`. The actual `get_weather_stateful` function is **never executed**. The agent receives the error dictionary *as if it were the tool's output* and formulates a response based on that error message.  
3. **London:** Behaves like New York, passing both callbacks and executing the tool successfully. The new London weather report overwrites the `last_weather_report` in the state.

You've now added a crucial safety layer controlling not just *what* reaches the LLM, but also *how* the agent's tools can be used based on the specific arguments generated by the LLM. Callbacks like `beforeModelCallback` and `beforeToolCallback` are essential for building robust, safe, and policy-compliant agent applications.



---


## Conclusion: Your Agent Team is Ready!

Congratulations! You've successfully journeyed from building a single, basic weather agent to constructing a sophisticated, multi-agent team using the Agent Development Kit (ADK).

**Let's recap what you've accomplished:**

*   You started with a **fundamental agent** equipped with a single tool (`get_weather`).
*   You explored ADK's **multi-model flexibility** using LiteLLM, running the same core logic with different LLMs like Gemini, GPT-4o, and Claude.
*   You embraced **modularity** by creating specialized sub-agents (`greeting_agent`, `farewell_agent`) and enabling **automatic delegation** from a root agent.
*   You gave your agents **memory** using **Session State**, allowing them to remember user preferences (`temperature_unit`) and past interactions (`output_key`).
*   You implemented crucial **safety guardrails** using both `beforeModelCallback` (blocking specific input keywords) and `beforeToolCallback` (blocking tool execution based on arguments like the city "Paris").

Through building this progressive Weather Bot team, you've gained hands-on experience with core ADK concepts essential for developing complex, intelligent applications.

**Key Takeaways:**

*   **Agents & Tools:** The fundamental building blocks for defining capabilities and reasoning. Clear instructions and docstrings are paramount.
*   **Runners & Session Services:** The engine and memory management system that orchestrate agent execution and maintain conversational context.
*   **Delegation:** Designing multi-agent teams allows for specialization, modularity, and better management of complex tasks. Agent `description` is key for auto-flow.
*   **Session State (`ToolContext`, `output_key`):** Essential for creating context-aware, personalized, and multi-turn conversational agents.
*   **Callbacks (`beforeModel`, `beforeTool`):** Powerful hooks for implementing safety, validation, policy enforcement, and dynamic modifications *before* critical operations (LLM calls or tool execution).
*   **Flexibility (`LiteLlm`):** ADK empowers you to choose the best LLM for the job, balancing performance, cost, and features.

**Where to Go Next?**

Your Weather Bot team is a great starting point. Here are some ideas to further explore ADK and enhance your application:

1.  **Real Weather API:** Replace the `mock_weather_db` in your `get_weather` tool with a call to a real weather API (like OpenWeatherMap, WeatherAPI).
2.  **More Complex State:** Store more user preferences (e.g., preferred location, notification settings) or conversation summaries in the session state.
3.  **Refine Delegation:** Experiment with different root agent instructions or sub-agent descriptions to fine-tune the delegation logic. Could you add a "forecast" agent?
4.  **Advanced Callbacks:**
    *   Use `afterModelCallback` to potentially reformat or sanitize the LLM's response *after* it's generated.
    *   Use `afterToolCallback` to process or log the results returned by a tool.
    *   Implement `beforeAgentCallback` or `afterAgentCallback` for agent-level entry/exit logic.
5.  **Error Handling:** Improve how the agent handles tool errors or unexpected API responses. Maybe add retry logic within a tool.
6.  **Persistent Session Storage:** Explore alternatives to `InMemorySessionService` for storing session state persistently (e.g., using databases like Firestore or Cloud SQL – requires custom implementation or future ADK integrations).
7.  **Streaming UI:** Integrate your agent team with a web framework (like FastAPI, as shown in the ADK Streaming Quickstart) to create a real-time chat interface.

The Agent Development Kit provides a robust foundation for building sophisticated LLM-powered applications. By mastering the concepts covered in this tutorial – tools, state, delegation, and callbacks – you are well-equipped to tackle increasingly complex agentic systems.

Happy building!

