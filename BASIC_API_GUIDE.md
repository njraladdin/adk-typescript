# ADK TypeScript - Basic API Guide

## Overview

ADK (Agent Development Kit) TypeScript is a code-first framework for building AI agents. This guide explains the core concepts and basic API.

## Core Concepts

### 1. **Agents**
Agents are the main building blocks that process user requests using AI models. The primary agent type is `LlmAgent`.

### 2. **Tools**
Tools are functions that agents can call to perform actions (e.g., get weather data, search the web).

### 3. **Runners**
Runners manage agent execution, handling sessions, state, and the conversation flow.

## Basic Workflow

```
User Input → Runner → Agent → LLM Model → Tool Calls → Response → User
```

---

## 1. Creating an Agent

### Basic LlmAgent

```typescript
import { LlmAgent } from 'adk-typescript/agents';

const agent = new LlmAgent({
  name: 'my_agent',                    // Required: unique identifier
  model: 'gemini-2.0-flash',            // AI model to use
  description: 'A helpful assistant',   // Agent description
  instruction: 'You are a helpful AI assistant that...',  // System prompt
  tools: [],                            // Tools available to the agent
});
```

### Key Agent Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | **Required.** Unique agent identifier (alphanumeric + underscore) |
| `model` | `string \| BaseLlm` | AI model name (e.g., "gemini-2.0-flash") or model instance |
| `instruction` | `string \| InstructionProvider` | System instructions for the agent |
| `description` | `string` | Brief description of the agent's purpose |
| `tools` | `ToolUnion[]` | Array of tools the agent can use |
| `subAgents` | `BaseAgent[]` | Child agents for multi-agent systems |
| `outputSchema` | `any` | Schema for structured output validation |
| `planner` | `BasePlanner` | Custom planner for step-by-step execution |

---

## 2. Creating Tools

Tools extend agent capabilities by providing functions they can call.

### Method 1: FunctionTool with Explicit Declaration (Recommended)

```typescript
import { FunctionTool, ToolContext } from 'adk-typescript/tools';

// 1. Define the tool function
// IMPORTANT: Function receives params as an object
async function getWeather(
  params: Record<string, any>,
  context: ToolContext
): Promise<{ temperature: string; condition: string }> {
  const city = params.city;  // Extract parameters from params object

  // Your logic here
  return {
    temperature: '72°F',
    condition: 'Sunny'
  };
}

// 2. Create the tool with function declaration
const getWeatherTool = new FunctionTool({
  name: 'getWeather',
  description: 'Get current weather for a city',
  fn: getWeather,
  functionDeclaration: {
    name: 'getWeather',
    description: 'Get current weather for a city',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'Name of the city'
        }
      },
      required: ['city']
    }
  }
});
```

### Method 2: Direct Function (Auto-generated Declaration)

```typescript
// Simple function passed directly
const simpleFunction = new FunctionTool(
  async (params: Record<string, any>, context: ToolContext) => {
    const { query } = params;
    return { result: `Searched for: ${query}` };
  }
);
```

### Tool Function Signature

**All tool functions must follow this signature:**

```typescript
async function toolName(
  params: Record<string, any>,  // Input parameters as object
  context: ToolContext           // Execution context
): Promise<any>
```

### ToolContext

The `ToolContext` provides access to:
- `session`: Current session information
- `state`: Session state for storing data
- `artifactService`: For saving files/artifacts
- `memoryService`: For managing agent memory

---

## 3. Running Agents

### Option 1: Using the CLI Helper

The simplest way for interactive testing:

```typescript
import { runAgent } from 'adk-typescript';

export const rootAgent = new LlmAgent({
  name: 'my_agent',
  model: 'gemini-2.0-flash',
  instruction: 'You are a helpful assistant',
  tools: [getWeatherTool],
});

// Run interactively when file is executed
if (require.main === module) {
  runAgent(rootAgent).catch(console.error);
}
```

Then run:
```bash
npx ts-node agent.ts
# or
npx adk run .
```

### Option 2: Using Runner (Programmatic)

For more control and production use:

```typescript
import { Runner } from 'adk-typescript/runners';
import { InMemorySessionService } from 'adk-typescript/sessions';
import { InMemoryArtifactService } from 'adk-typescript/artifacts';
import { Content, Part } from 'adk-typescript/models';

// 1. Create services
const sessionService = new InMemorySessionService();
const artifactService = new InMemoryArtifactService();

// 2. Create a session
const session = await sessionService.createSession({
  appName: 'my-app',
  userId: 'user-123',
  state: {},  // Initial state
});

// 3. Create runner
const runner = new Runner({
  appName: 'my-app',
  agent: rootAgent,
  sessionService,
  artifactService,
});

// 4. Run the agent with a message
const userMessage: Content = {
  role: 'user',
  parts: [{ text: "What's the weather in New York?" } as Part]
};

for await (const event of runner.runAsync({
  userId: session.userId,
  sessionId: session.id,
  newMessage: userMessage,
})) {
  // Process events
  if (event.content && event.content.parts) {
    const text = event.content.parts
      .map(part => part.text || '')
      .join('');
    console.log(`[${event.author}]: ${text}`);
  }
}
```

---

## 4. Understanding Events

When you run an agent, it yields `Event` objects that represent the conversation flow:

```typescript
interface Event {
  id: string;              // Unique event ID
  author: string;          // Who generated this event (agent name or 'user')
  content?: Content;       // The message content
  partial: boolean;        // True for streaming partial responses
  invocationId: string;    // ID of the current invocation
  branch?: string;         // Agent hierarchy path
}
```

### Event Flow

1. **User message** → Added to session
2. **Agent response** → Model generates content
3. **Tool calls** → Agent invokes tools
4. **Tool responses** → Results returned to agent
5. **Final response** → Agent responds to user

---

## 5. Sessions and State

### Sessions

Sessions maintain conversation history and state:

```typescript
interface Session {
  id: string;              // Session ID
  userId: string;          // User ID
  appName: string;         // Application name
  events: Event[];         // Conversation history
  state: State;            // Session state
}
```

### State Management

Store and retrieve data across turns:

```typescript
async function myTool(params: Record<string, any>, context: ToolContext) {
  // Read from state
  const previousValue = context.state.get('key');

  // Write to state
  context.state.set('key', 'value');

  return { result: 'success' };
}
```

---

## 6. Multi-Agent Systems

Create hierarchical agent systems:

```typescript
// Create specialized sub-agents
const weatherAgent = new LlmAgent({
  name: 'weather_agent',
  model: 'gemini-2.0-flash',
  instruction: 'You provide weather information',
  tools: [getWeatherTool],
});

const timeAgent = new LlmAgent({
  name: 'time_agent',
  model: 'gemini-2.0-flash',
  instruction: 'You provide time information',
  tools: [getTimeTool],
});

// Create coordinator agent
const coordinator = new LlmAgent({
  name: 'coordinator',
  model: 'gemini-2.0-flash',
  instruction: 'Route questions to specialized agents',
  subAgents: [weatherAgent, timeAgent],  // Add sub-agents
});

// The coordinator can automatically transfer to sub-agents
```

---

## 7. Import Patterns

ADK TypeScript supports multiple import styles:

### Named Module Imports (Recommended)

```typescript
import { agents, tools, models } from 'adk-typescript';

const agent = new agents.LlmAgent({ ... });
const tool = new tools.FunctionTool({ ... });
```

### Direct Component Imports

```typescript
import { LlmAgent } from 'adk-typescript/agents';
import { FunctionTool, ToolContext } from 'adk-typescript/tools';
import { Runner } from 'adk-typescript/runners';
```

### Default Import

```typescript
import ADK from 'adk-typescript';

const agent = new ADK.agents.LlmAgent({ ... });
```

---

## 8. Complete Example

Here's a full working example:

```typescript
import { LlmAgent } from 'adk-typescript/agents';
import { FunctionTool, ToolContext } from 'adk-typescript/tools';
import { runAgent } from 'adk-typescript';

// Define tool function
async function getWeather(
  params: Record<string, any>,
  context: ToolContext
): Promise<{ status: string; report: string }> {
  const city = params.city;

  // Mock weather data
  const weatherData: Record<string, string> = {
    'new york': 'Sunny, 72°F',
    'london': 'Cloudy, 15°C',
    'tokyo': 'Rainy, 18°C',
  };

  const report = weatherData[city.toLowerCase()] || 'Unknown city';

  return {
    status: 'success',
    report: `Weather in ${city}: ${report}`
  };
}

// Create tool
const weatherTool = new FunctionTool({
  name: 'getWeather',
  description: 'Get current weather for a city',
  fn: getWeather,
  functionDeclaration: {
    name: 'getWeather',
    description: 'Get current weather for a city',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'Name of the city'
        }
      },
      required: ['city']
    }
  }
});

// Create agent
export const rootAgent = new LlmAgent({
  name: 'weather_assistant',
  model: 'gemini-2.0-flash',
  description: 'A weather information assistant',
  instruction: 'You help users get weather information. Use the getWeather tool when asked about weather.',
  tools: [weatherTool],
});

// Run agent
if (require.main === module) {
  runAgent(rootAgent).catch(console.error);
}
```

---

## 9. Key Concepts Summary

| Concept | Purpose | Example |
|---------|---------|---------|
| **LlmAgent** | AI agent that processes requests | `new LlmAgent({ name, model, tools })` |
| **FunctionTool** | Extends agent capabilities | `new FunctionTool({ fn, functionDeclaration })` |
| **Runner** | Manages agent execution | `runner.runAsync({ userId, sessionId, newMessage })` |
| **Session** | Maintains conversation history | Created by SessionService |
| **State** | Store data across turns | `context.state.get/set` |
| **Event** | Represents conversation messages | Yielded by `runAsync()` |

---

## 10. Next Steps

- **Explore Examples**: Check `/examples` directory for more patterns
- **Read Documentation**: Visit [https://njraladdin.github.io/adk-typescript](https://njraladdin.github.io/adk-typescript)
- **Use CLI Tools**:
  - `npx adk create` - Create new agent
  - `npx adk run` - Run agent interactively
  - `npx adk web` - Launch web UI
  - `npx adk eval` - Run evaluations

---

## Common Patterns

### Pattern 1: Stateful Tool

```typescript
async function counterTool(params: Record<string, any>, context: ToolContext) {
  const count = (context.state.get('count') || 0) + 1;
  context.state.set('count', count);
  return { count };
}
```

### Pattern 2: Dynamic Instructions

```typescript
const agent = new LlmAgent({
  name: 'dynamic_agent',
  model: 'gemini-2.0-flash',
  instruction: (context) => {
    const userName = context.state.get('userName') || 'User';
    return `You are helping ${userName}. Be friendly and helpful.`;
  },
  tools: [],
});
```

### Pattern 3: Error Handling in Tools

```typescript
async function apiTool(params: Record<string, any>, context: ToolContext) {
  try {
    const result = await fetch(params.url);
    return { success: true, data: await result.json() };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

---

This guide covers the fundamental API for building agents with ADK TypeScript. For advanced features like memory services, custom flows, planners, and deployment, refer to the full documentation.
