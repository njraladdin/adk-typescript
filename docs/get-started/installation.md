# Installing ADK TypeScript

This guide explains how to install the Agent Development Kit (ADK) for TypeScript and set up your development environment.

## Prerequisites

ADK TypeScript requires:
- Node.js (v18 or higher)
- npm (included with Node.js) or yarn

If you don't have Node.js installed, download and install it from [nodejs.org](https://nodejs.org/).

## Install the ADK CLI

Install the ADK TypeScript CLI globally:

```bash
# Using npm
npm install -g adk-typescript

# Or using yarn
yarn global add adk-typescript
```

After installation, verify that the CLI is correctly installed:

```bash
adk-ts --version
```

## Using the ADK Commands

With global installation, you can use ADK commands from any directory:

```bash
# Create a new agent project
adk-ts create my-weather-agent

# Run an agent
adk-ts run my-weather-agent

# Start the web UI
adk-ts web my-weather-agent
```

## The Agent Creation Process

When you run `adk-ts create my-agent`, the CLI automatically:

1. Creates a new project directory with the name you specified
2. Sets up a complete project structure with src/ folder
3. Generates a `package.json` with all necessary dependencies
   - This includes ADK TypeScript itself as a local dependency
   - You don't need to manually install ADK in the agent project
4. Configures TypeScript with an appropriate `tsconfig.json`
5. Creates a starter agent file with model configuration
6. Sets up a `.env` file for your API keys and cloud settings
7. Walks you through configuring your LLM backend



## Next Steps
*   Try creating your first agent with the [**TypeScript Quickstart**](./quickstart.md)
- Jump into the [**Quickstart**](./quickstart.md) to create your first agent
- Learn about [**ADK TypeScript Concepts**](../agents/index.md) to understand the core components
- Explore [**Sample Agents**](https://github.com/google/adk-samples) for inspiration (Note: samples may be Python-focused)