# Installing ADK TypeScript

This guide explains how to install the Agent Development Kit (ADK) for TypeScript and set up your development environment.

## Prerequisites

ADK TypeScript requires:
- Node.js (v18 or higher)
- npm (included with Node.js) or yarn

If you don't have Node.js installed, download and install it from [nodejs.org](https://nodejs.org/).

## Installation

Install ADK TypeScript locally in your project and use `npx` to run commands. This ensures consistent versions across development and production environments.

```bash
# Create your project directory
mkdir my-adk-project
cd my-adk-project

# Create your first agent (this will set up everything automatically)
npx adk create my-weather-agent
```

The `npx adk create` command will automatically:
- Initialize your project with `package.json` and `tsconfig.json` (if not already present)
- Install all necessary dependencies including ADK TypeScript
- Set up the project structure
- Create your agent with sample code
- Walk you through configuring your LLM backend

## Using the ADK Commands

Use `npx adk` to run all commands:

```bash
# Create a new agent project
npx adk create my-weather-agent

# Run an agent in terminal
npx adk run my-weather-agent

# Start the web UI
npx adk web my-weather-agent

# Run the API server
npx adk api_server --agent_dir my-weather-agent

# Evaluate an agent
npx adk eval my-weather-agent eval_data.test.json

# Generate agent graph
npx adk graph my-weather-agent --output graph.png
```

## Project Structure

When you create an agent with `npx adk create`, it generates an efficient, scalable project structure:

```console
my-adk-project/               # Your parent project folder
├── my-weather-agent/         # Your agent's code folder
│   ├── agent.ts              # Agent definition
│   └── .env                  # API keys for this agent
├── package.json              # SHARED Node.js project manifest
├── tsconfig.json             # SHARED TypeScript configuration
└── dist/                     # (Created after build) Compiled output
```

This structure allows multiple agents to share dependencies while keeping their code and configuration separate.

## Building and Running

After creating your agent, you need to build and run it:

```bash
# Install dependencies (only needed once, or if you add more agents)
npm install

# Build your TypeScript code
npm run build

# Run your agent
npx adk run my-weather-agent
# or start the web UI
npx adk web my-weather-agent
```

## Next Steps

- Jump into the [**Quickstart**](./quickstart.md) to create your first agent
- Learn about [**ADK TypeScript Concepts**](../agents/index.md) to understand the core components
- Explore the [**Tutorial**](./tutorial.md) for building multi-agent systems