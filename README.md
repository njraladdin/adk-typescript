# Agent Development Kit (ADK) for TypeScript

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Tests](https://github.com/njraladdin/adk-typescript/actions/workflows/test.yml/badge.svg)](https://github.com/njraladdin/adk-typescript/actions/workflows/test.yml)
[![r/agentdevelopmentkit](https://img.shields.io/badge/Reddit-r%2Fagentdevelopmentkit-FF4500?style=flat&logo=reddit&logoColor=white)](https://www.reddit.com/r/agentdevelopmentkit/)
[![npm monthly downloads](https://img.shields.io/npm/dm/adk-typescript.svg)](https://www.npmjs.com/package/adk-typescript)

<html>
    <h2 align="center">
      <img src="assets/agent-development-kit.png" width="256"/>
    </h2>
    <h3 align="center">
      An open-source, code-first TypeScript toolkit for building, evaluating, and deploying sophisticated AI agents with flexibility and control.
    </h3>
    <h3 align="center">
      Important Links:
      <a href="https://njraladdin.github.io/adk-typescript">Docs</a> 
    </h3>
</html>

**⚠️ Unofficial Port & Experimental Status:** This is an unofficial TypeScript port of the [Google ADK Python library](https://github.com/google/adk-python). It's currently in an experimental (alpha) stage, so some features and APIs may be unstable or contain bugs.

**Agent Development Kit (ADK)** for TypeScript is a flexible and modular framework for developing and deploying AI agents. While optimized for Gemini and the Google ecosystem, ADK is model-agnostic, deployment-agnostic, and is built for compatibility with other frameworks. ADK was designed to make agent development feel more like software development, to make it easier for developers to create, deploy, and orchestrate agentic architectures that range from simple tasks to complex workflows.


---

## ✨ Key Features

- **Rich Tool Ecosystem**: Utilize pre-built tools, custom functions,
  OpenAPI specs, or integrate existing tools to give agents diverse
  capabilities, all for tight integration with the Google ecosystem.

- **Code-First Development**: Define agent logic, tools, and orchestration
  directly in TypeScript for ultimate flexibility, testability, and versioning.

- **Modular Multi-Agent Systems**: Design scalable applications by composing
  multiple specialized agents into flexible hierarchies.

- **Deploy Anywhere**: Easily containerize and deploy agents on Cloud Run or
  scale with other cloud platforms.

- **Integrated Developer Tooling**: Develop and iterate locally with ease using the included CLI (`npx adk`) and Developer UI (`npx adk web`) for running agents, inspecting execution (`Event` stream), debugging, and visualizing agent graphs (`npx adk graph`).

- **Native Streaming Support**: Build real-time, interactive experiences with native support for bidirectional streaming (text, potentially audio/video) using `Runner.runLive` and `LiveRequestQueue`.

- **Built-in Agent Evaluation**: Assess agent performance systematically with the `evaluation` module (`AgentEvaluator`). Create multi-turn evaluation datasets (`.test.json` files) and run evaluations locally via the CLI (`npx adk eval`).

## 🚀 Installation

Install ADK TypeScript locally in your project:

```bash
# Navigate to your project directory
mkdir my-adk-project
cd my-adk-project

# Initialize npm project (creates package.json)
npm init -y

# Install ADK TypeScript and all dependencies
npm install adk-typescript dotenv typescript @types/node @types/dotenv
# or
# yarn add adk-typescript dotenv typescript @types/node @types/dotenv
```

After installation, use the ADK CLI commands with `npx`:

```bash
# Create a new agent
npx adk create my-new-agent

# Run your agent
npx adk run my-new-agent
```

This approach ensures that:
- All dependencies are tracked in your package.json
- Anyone cloning your project can install everything with a single command
- Your project will work consistently across development and production environments

See the [Installation Guide](./installation.md) for more details on setting up your environment.

## 🎯 Quick Start Example

Here's a simple weather agent to get you started:

```typescript
// agent.ts
import { LlmAgent } from 'adk-typescript/agents';
import { ToolContext } from 'adk-typescript/tools';
import { runAgent } from 'adk-typescript';

// Define a tool function with explicit parameters
async function getWeather(
  city: string,
  context: ToolContext
): Promise<{ temperature: string; condition: string }> {
  // Your weather API logic here
  return {
    temperature: '72°F',
    condition: 'Sunny'
  };
}

// Create your agent
export const rootAgent = new LlmAgent({
  name: 'weather_agent',
  model: 'gemini-2.0-flash',
  description: 'A helpful weather assistant',
  instruction: 'You help users get weather information. Use the getWeather tool when asked about weather.',
  tools: [getWeather], // Pass functions directly!
});

// Run programmatically (optional)
if (require.main === module) {
  runAgent(rootAgent).catch(console.error);
}
```

**Run your agent:**

```bash
# Via CLI (interactive chat)
npx adk run .

# Or run directly with Node/ts-node
npx ts-node agent.ts
```

## 📚 Documentation

Our TypeScript-specific documentation is available at **[https://njraladdin.github.io/adk-typescript/](https://njraladdin.github.io/adk-typescript/)**.

*Please be aware that the documentation is a work in progress and may not be perfectly accurate yet. For conceptual information, you may still refer to the [official Python ADK documentation](https://google.github.io/adk-docs), but be aware of implementation differences.*


## ⚙️ Using the CLI (`npx adk`)

The ADK TypeScript CLI provides commands to manage and run your agents:

**1. Create a New Agent Project:**

Generates a starter agent template with necessary files (`agent.ts`, `package.json`, `tsconfig.json`, `.env`).

```bash
npx adk create <your-agent-name>
# Example: npx adk create my_weather_agent
```
Follow the interactive prompts to configure the model and backend.

**2. Run an Agent Interactively (Terminal):**

Starts a command-line chat interface to interact with your agent.

```bash
# Navigate to the parent directory of your agent folder
npx adk run <your_agent_folder_name>
# Example: npx adk run my_weather_agent

# Or navigate into the agent folder and run:
cd my_weather_agent
npx adk run .
```

**3. Run the Development Web UI:**

Starts a local web server with a chat UI for testing and inspecting agent behavior.

```bash
# Navigate to the parent directory of your agent folder(s)
npx adk web <your_agent_folder_name>
# Example: npx adk web my_weather_agent

# Or run from inside the agent folder:
cd my_weather_agent
npx adk web .
```
Access the UI in your browser (usually `http://localhost:3000`).

**4. Run the API Server:**

Starts a local Express.js server exposing REST endpoints to interact with your agent(s) programmatically. Useful for integration testing.

```bash
# Navigate to the parent directory of your agent folder(s)
npx adk api_server --agent_dir <your_agent_folder_name_or_parent_dir>
# Example (serving one agent): npx adk api_server --agent_dir my_weather_agent
# Example (serving all agents in current dir): npx adk api_server --agent_dir .
```

**5. Evaluate an Agent:**

Runs evaluations based on predefined datasets (`.test.json` files).

```bash
npx adk eval <path_to_agent_folder> <path_to_eval_set.test.json>
# Example:
# npx adk eval ./my_weather_agent ./my_weather_agent/eval_data.test.json
```

**6. Generate Agent Graph:**

Creates a visual representation of your agent and its tools/sub-agents (requires Graphviz installed).

```bash
npx adk graph <path_to_agent_folder> --output graph.png
# Example: npx adk graph ./my_weather_agent --output weather_agent_graph.png
```

**7. Deploy to Cloud Run:**

Packages and deploys your agent to Google Cloud Run. 

```bash
npx adk deploy cloud_run <path_to_agent_folder> --project <your-gcp-project> --region <gcp-region> --service_name <your-service-name>
```

## 🤝 Contributing

We welcome contributions from the community! As this is a work-in-progress port, contributions are especially valuable. Whether it's bug reports, feature requests, documentation improvements, or code contributions, please see our [**Contributing Guidelines**](./CONTRIBUTING.md) (Link may need updating for TypeScript specifics) to get started.

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Preview

This software (ADK TypeScript Port) is currently **experimental (alpha)** and not an officially supported Google product. It is subject to the "Pre-GA Offerings Terms" in the General Service Terms section of the [Service Specific Terms](https://cloud.google.com/terms/service-terms#1). Pre-GA features are available "as is" and might have limited support. For more information, see the [launch stage descriptions](https://cloud.google.com/products?hl=en#product-launch-stages).

---

*Happy Agent Building with TypeScript!*