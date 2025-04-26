# Simple Agent Example

This is a basic example agent for the TypeScript port of Google's Agent Development Kit (ADK).

## Features

- Basic conversational capabilities
- A tool to tell the current time and timezone

## Setup

1. Navigate to this directory:
   ```bash
   cd examples/simple_agent
   ```

2. Edit the `.env` file and add your API key:
   ```
   GOOGLE_API_KEY=your_actual_api_key_here
   ```

## Running the Agent

You can run this agent using one of the following methods:

### Method 1: Using npm script

```bash
# From the project root
npm run adk:run -- examples/simple_agent
```

### Method 2: Using the CLI directly

```bash
# From the project root
npx ts-node src/cli/index.ts run examples/simple_agent
```

## Using the Input File

You can also run the agent with a predefined set of queries:

```bash
# Run with the sample input file
npm run adk:run -- examples/simple_agent --input_file examples/simple_agent/sample.input.json

# Or from the agent directory
cd examples/simple_agent
npm run adk:run -- . --input_file sample.input.json
```

## File Structure

The agent consists of these files:

- `agent.ts` - Contains the main agent definition with the time tool
- `index.ts` - **Required**: Exports the rootAgent from agent.ts
- `.env` - Environment variables (API keys, etc.)
- `sample.input.json` - Sample input queries

**Important**: The CLI looks specifically for the `rootAgent` export in the `index.ts` file, not in subdirectories.

## Sample Interactions

Here are some things you can ask the agent:

- "What time is it right now?"
- "Can you tell me the current time?"
- "What's my timezone?"

## How It Works

This example demonstrates:

1. Creating a simple LLM Agent
2. Registering a custom tool (get_current_time)
3. Using the ADK CLI to interact with the agent

The agent uses the [Gemini 1.5 Flash](https://ai.google.dev/gemini-api) model from Google AI, but you can modify it to use other models supported by the ADK. 