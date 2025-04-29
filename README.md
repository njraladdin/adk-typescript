# Agent Development Kit (ADK) - TypeScript Port

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![r/agentdevelopmentkit](https://img.shields.io/badge/Reddit-r%2Fagentdevelopmentkit-FF4500?style=flat&logo=reddit&logoColor=white)](https://www.reddit.com/r/agentdevelopmentkit/)

<html>
    <h2 align="center">
      <img src="https://raw.githubusercontent.com/google/adk-python/main/assets/agent-development-kit.png" width="256"/>
    </h2>
    <h3 align="center">
      A TypeScript port of Google's ADK - an open-source, code-first toolkit for building, evaluating, and deploying sophisticated AI agents with flexibility and control.
    </h3>
    <h3 align="center">
      Original Python Project:
      <a href="https://github.com/google/adk-python">ADK-Python</a> &
      <a href="https://google.github.io/adk-docs/">Docs</a> &
      <a href="https://github.com/google/adk-samples">Samples</a>.
    </h3>
</html>

Agent Development Kit (ADK) is designed for developers seeking fine-grained
control and flexibility when building advanced AI agents that are tightly
integrated with services in Google Cloud. It allows you to define agent
behavior, orchestration, and tool use directly in code, enabling robust
debugging, versioning, and deployment anywhere – from your laptop to the cloud.

This repository is a TypeScript port of the original Python ADK project, bringing its powerful
capabilities to the TypeScript/JavaScript ecosystem.

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
  scale seamlessly with Vertex AI Agent Engine.


## 🚀 Installation

You can install the ADK TypeScript package using `npm`:

```bash
npm install adk-typescript
```

Or using `yarn`:

```bash
yarn add adk-typescript
```
# Global installation
npm install -g adk-typescript
adk-ts run examples/simple_agent
adk-ts web examples/simple_agent

# Local installation
npm install adk-typescript
npx adk-ts run examples/simple_agent
npx adk-ts web examples/simple_agent
## 📚 Documentation

Explore the original Python ADK documentation for general concepts and architecture:

* **[ADK Python Documentation](https://google.github.io/adk-docs)**

## 🏁 Feature Highlight

### Define a single agent:

```typescript
import { LlmAgent } from 'adk-typescript';
import { GoogleSearchTool } from 'adk-typescript/tools';

const rootAgent = new LlmAgent('search_assistant', {
  model: 'gemini-2.0-flash', // Or your preferred Gemini model
  instruction: "You are a helpful assistant. Answer user questions using Google Search when needed.",
  description: "An assistant that can search the web.",
  tools: [new GoogleSearchTool()]
});
```

### Define a multi-agent system:

Define a multi-agent system with coordinator agent, greeter agent, and task execution agent. Then ADK engine and the model will guide the agents works together to accomplish the task.

```typescript
import { LlmAgent } from 'adk-typescript';

// Define individual agents
const greeter = new LlmAgent('greeter', {
  model: 'gemini-2.0-flash',
  // other configurations
});

const taskExecutor = new LlmAgent('task_executor', {
  model: 'gemini-2.0-flash',
  // other configurations
});

// Create parent agent and assign children via sub_agents
const coordinator = new LlmAgent('coordinator', {
  model: 'gemini-2.0-flash',
  description: "I coordinate greetings and tasks.",
  subAgents: [ // Assign sub_agents here
    greeter,
    taskExecutor
  ]
});
```

### Development UI

A built-in development UI to help you test, evaluate, debug, and showcase your agent(s).

<img src="https://raw.githubusercontent.com/google/adk-python/main/assets/adk-web-dev-ui-function-call.png"/>

###  Evaluate Agents

```bash
npx adk-ts eval \
    examples/simple_agent \
    examples/simple_agent/simple_agent_eval_set_001.evalset.json
```

## Command Line Interface

ADK TypeScript provides a command-line interface similar to the original Python ADK, but uses `adk-ts` instead of `adk` to avoid conflicts with the Python version:

```bash
# Show available commands
adk-ts --help

# Run an agent
adk-ts run examples/simple_agent

# Start the web UI for agent development
adk-ts web examples/simple_agent

# Create a new agent project
adk-ts create my_new_agent

# Evaluate an agent
adk-ts eval examples/simple_agent examples/simple_agent/eval_set.json
```

When installing locally in a project, you can use npx:

```bash
npx adk-ts run examples/simple_agent
```

The CLI provides the same commands as the Python version but with the `adk-ts` prefix:

- `adk-ts run` - Run an agent in interactive mode
- `adk-ts web` - Start the web development interface
- `adk-ts create` - Create a new agent project
- `adk-ts eval` - Evaluate agent performance
- `adk-ts deploy` - Deploy an agent to cloud services

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug reports, feature requests, documentation improvements, or code contributions, please see our [**Contributing Guidelines**](./CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

This project is a TypeScript port of the [original Python ADK](https://github.com/google/adk-python) developed by Google. We are grateful to the original authors for creating such a powerful framework for agent development.

## Preview

This feature is subject to the "Pre-GA Offerings Terms" in the General Service Terms section of the [Service Specific Terms](https://cloud.google.com/terms/service-terms#1). Pre-GA features are available "as is" and might have limited support. For more information, see the [launch stage descriptions](https://cloud.google.com/products?hl=en#product-launch-stages).

---

*Happy Agent Building!*
