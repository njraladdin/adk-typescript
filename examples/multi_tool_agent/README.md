# Multi-Tool Agent Example

This example demonstrates how to create a multi-tool agent using the TypeScript version of the Agent Development Kit (ADK). It follows the pattern of the Python example from [Google's ADK documentation](https://google.github.io/adk-docs/get-started/quickstart/), while adapting to the current state of the TypeScript implementation.

## Overview

The agent in this example can:

1. Provide the current weather in multiple cities
2. Provide the current time in multiple cities

## Project Structure

```
multi_tool_agent/
  ├── agent.ts       # The agent definition and tool implementations
  ├── run.ts         # Runner script to simulate ADK framework behavior
  ├── .env           # Environment configuration
  └── README.md      # This file
```

## How to Use

### Prerequisites

1. Make sure you have Node.js installed
2. Install project dependencies: 
   ```
   npm install
   ```

### Running the Agent

Run the agent with:

```bash
# Run with ts-node
npx ts-node examples/multi_tool_agent/run.ts
```

This starts an interactive session where you can ask questions about weather and time.

### Example Prompts to Try

- "What is the weather in New York?"
- "What is the current time in Paris?"
- "Tell me the weather in London."
- "What time is it in Tokyo?"

## Implementation Details

### Following the Python ADK Pattern

This implementation follows the same pattern as the Python ADK example:

1. **Define Tool Functions**: We define functions like `getWeather` and `getCurrentTime` that perform specific tasks
2. **Create Tool Wrappers**: We create `FunctionTool` instances that wrap these functions with proper schemas
3. **Create an Agent**: We create a `LlmAgent` instance with a Gemini model, an AutoFlow flow, and the tools
4. **Emulate a Runner**: The `run.ts` file emulates how the ADK Runner would process messages, call tools, and handle responses

### Simulating Framework Behavior

While the TypeScript ADK is still under development, our `run.ts` script simulates what the framework would do:

1. It analyzes user messages to determine intent (like an LLM would)
2. It makes decisions about which tools to call (like an LLM would)
3. It calls tool functions and processes their results
4. It formats natural language responses (like an LLM would)
5. It simulates streaming responses (like the Python ADK does)

This approach shows the architecture and flow of an ADK agent while working within the current limitations of the TypeScript implementation.

### Tools Implementation

The agent includes two main tools:

- `get_weather`: Provides weather information for cities like New York, Paris, London, and Tokyo
- `get_current_time`: Provides the current time in various cities using proper time zones

Both tools demonstrate:
- Clear documentation
- Parameter validation
- Structured response format
- Error handling

## Extending This Example

You can extend this example by:

1. Adding more cities to the supported list
2. Implementing real API calls to get actual weather data
3. Adding new tools for different functionalities
4. Enhancing the natural language processing in the runner

## Future Improvements

As the TypeScript ADK matures, this example can be gradually updated to use more of the built-in framework functionality, particularly:

1. Full session management
2. LLM integration for tool selection
3. Streaming responses directly from the LLM
4. Event-based message handling 