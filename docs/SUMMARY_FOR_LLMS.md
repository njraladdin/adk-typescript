
# Agent Development Kit (ADK) for TypeScript

## High-Level Summary

The Agent Development Kit (ADK) for TypeScript is an open-source, code-first toolkit designed for developers building, evaluating, and deploying sophisticated AI agents using TypeScript/Node.js, with a strong focus on integration with Google Cloud services and Gemini models. It emphasizes flexibility and fine-grained control over agent behavior, orchestration, and tool usage directly within TypeScript code.

**Key Features:**

*   **Rich Tool Ecosystem:** Supports built-in tools (Google Search, Code Execution, Vertex AI Search), custom TypeScript functions, OpenAPI spec integration, third-party libraries (LangChain.js, CrewAI - *if JS/TS versions exist and wrappers are provided*), Google Cloud integrations (API Hub, Application Integration, MCP Toolbox for DBs), MCP standard tools, and using other agents as tools. Includes robust authentication handling.
*   **Code-First Development:** Define agent logic, workflows, and state management directly in TypeScript, enabling testability, versioning, and debugging using standard Node.js tools.
*   **Flexible Orchestration:** Build multi-agent systems using predefined workflow agents (`SequentialAgent`, `ParallelAgent`, `LoopAgent`) for structured processes or leverage `LlmAgent` for dynamic, LLM-driven routing and decision-making. Custom agents (`BaseAgent`) allow for arbitrary logic.
*   **Context & State Management:** Provides mechanisms for managing conversational context (`Session`), short-term state (`State` with session/user/app/temp scopes), long-term memory (`MemoryService`), and binary data (`ArtifactService`).
*   **Callbacks for Control:** Offers hooks (`before/afterAgentCallback`, `before/afterModelCallback`, `before/afterToolCallback`) to observe, customize, or intercept agent execution flow for logging, validation, guardrails, caching, and more.
*   **Deployment Ready:** Facilitates deployment to various environments, including local testing, Google Cloud Run, and the scalable Vertex AI Agent Engine.
*   **Evaluation Framework:** Includes tools and patterns for evaluating agent performance based on trajectory (tool usage) and final response quality against predefined test cases (`.test.json`, `.evalset.json`).
*   **Responsible AI:** Provides guidance and mechanisms (guardrails, callbacks, identity management) for building safer and more secure agents.

The documentation covers getting started guides (installation, quickstarts, tutorial), core concepts (agents, tools, sessions, context, runtime, events), advanced topics (multi-agent systems, callbacks, custom agents, memory, artifacts, authentication), deployment strategies, evaluation methods, and responsible AI practices. Code examples and snippets illustrate key functionalities in TypeScript.

## Table of Contents

*(This section remains largely the same, just ensure the links point to the correct files/sections in your TS docs)*
- [Overview & Core Concepts](#overview--core-concepts)
- [Installation & Setup](#installation--setup)
- [Agents](#agents)
  - [BaseAgent](#baseagent)
  - [LlmAgent (`Agent`)](#llmagent-agent)
  - [Workflow Agents](#workflow-agents)
    - [SequentialAgent](#sequentialagent)
    - [ParallelAgent](#parallelagent)
    - [LoopAgent](#loopagent)
  - [Custom Agents](#custom-agents)
  - [Multi-Agent Systems](#multi-agent-systems)
  - [Models](#models)
- [Tools](#tools)
  - [Tool Concepts](#tool-concepts)
  - [ToolContext](#toolcontext)
  - [Function Tools](#function-tools)
  - [Built-in Tools](#built-in-tools)
  - [OpenAPI Tools](#openapi-tools)
  - [Third-Party Tools (LangChain.js, CrewAI)](#third-party-tools-langchainjs-crewai)
  - [Google Cloud Tools](#google-cloud-tools)
  - [MCP Tools](#mcp-tools)
  - [Authentication](#authentication)
- [Sessions, State & Memory](#sessions-state--memory)
  - [Session](#session)
  - [SessionService](#sessionservice)
  - [State](#state)
  - [Memory & MemoryService](#memory--memoryservice)
- [Artifacts](#artifacts)
  - [Artifact Concepts](#artifact-concepts)
  - [ArtifactService](#artifactservice)
  - [Context Methods](#context-methods)
- [Context Objects](#context-objects)
  - [InvocationContext](#invocationcontext)
  - [ReadonlyContext](#readonlycontext)
  - [CallbackContext](#callbackcontext)
  - [ToolContext (Recap)](#toolcontext-recap)
- [Callbacks](#callbacks)
  - [Callback Mechanism](#callback-mechanism)
  - [Agent Lifecycle Callbacks](#agent-lifecycle-callbacks)
  - [LLM Interaction Callbacks](#llm-interaction-callbacks)
  - [Tool Execution Callbacks](#tool-execution-callbacks)
  - [Callback Patterns & Best Practices](#callback-patterns--best-practices)
- [Runtime & Events](#runtime--events)
  - [Event Loop](#event-loop)
  - [Event Object](#event-object)
  - [Runtime Components](#runtime-components)
  - [Key Behaviors (State Timing, Streaming, Async)](#key-behaviors-state-timing-streaming-async)
- [Evaluation](#evaluation)
  - [Concepts](#concepts)
  - [Methods (`adk-ts web`, `jest`/`vitest`, `adk-ts eval`)](#methods-adk-ts-web-jestvitest-adk-ts-eval)
  - [Criteria](#criteria)
- [Deployment](#deployment)
  - [Vertex AI Agent Engine](#vertex-ai-agent-engine)
  - [Cloud Run (`adk-ts deploy`, `gcloud`)](#cloud-run-adk-ts-deploy-gcloud)
- [Safety & Security](#safety--security)
- [Development Tools (CLI)](#development-tools-cli)
- [Contributing](#contributing)

## Overview & Core Concepts

*   **ADK (Agent Development Kit) for TypeScript:** Open-source TypeScript toolkit for building, evaluating, and deploying AI agents, integrated with Google Cloud and Gemini.
*   **Code-First:** Define agent logic, tools, and orchestration in TypeScript/Node.js.
*   **Key Primitives:** Agent, Tool, Callback, Session, State, Memory, Artifact, Event, Runner, Model.
*   **Focus:** Flexibility, control, Google ecosystem integration, leveraging the TypeScript ecosystem.
*   **Capabilities:** Multi-Agent Systems, Rich Tooling, Flexible Orchestration, Streaming, Evaluation, Deployment, Responsible AI features.

*(See: Your `README.md`, relevant intro docs)*

## Installation & Setup

1.  **Prerequisites:** Node.js (check required version), npm or yarn.
2.  **Install ADK:**
    ```bash
    npm install adk-typescript # Or your package name
    # or
    yarn add adk-typescript # Or your package name
    ```
3.  **Install Peer Dependencies** (if any listed in `package.json`).
4.  **Model Setup (API Keys / ADC):**
    *   **Environment Variables:** Use a `.env` file (install `dotenv`: `npm install dotenv`) or set environment variables directly.
    *   **Google AI Studio:** Set `GOOGLE_API_KEY`. Set `GOOGLE_GENAI_USE_VERTEXAI=0`.
    *   **Vertex AI:** Authenticate (`gcloud auth application-default login`), set `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`. Set `GOOGLE_GENAI_USE_VERTEXAI=1`.
    *   **LiteLLM (OpenAI, Anthropic, etc.):** Set provider-specific keys (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).

*(See: Your installation/setup docs, model configuration docs)*

## Agents

The fundamental execution units. All inherit from `BaseAgent`.

*(See: `docs/agents/index.md`)*

### BaseAgent

*   The foundation class for all agents (`src/agents/BaseAgent.ts`).
*   Requires `name` (string).
*   Can have `parentAgent` and `subAgents` array (`BaseAgent[]`) to define hierarchy.
*   Requires implementation of `runAsyncImpl` and `runLiveImpl` (async generators yielding `Event`).

*(See: `docs/agents/custom-agents.md`)*

### LlmAgent (`Agent`)

*   Uses an LLM for reasoning, generation, and tool/transfer decisions (`src/agents/LlmAgent.ts`).
*   **Key Parameters (in constructor options object):**
    *   `name` (string): Unique agent identifier.
    *   `model` (string | `BaseLlm`): LLM identifier (e.g., `"gemini-2.0-flash"`) or a wrapper instance (e.g., `new LiteLlm({model: "openai/gpt-4o"})`). See `src/models`.
    *   `instruction` (string | `(ctx: ReadonlyContext) => string`): Guides the LLM's behavior, goals, persona, tool usage.
    *   `description` (string, Optional): Summary for delegation/discovery.
    *   `tools` (`Array<BaseTool | Function>`): Tools available to the agent. Plain functions are automatically wrapped.
    *   `subAgents` (`BaseAgent[]`, Optional): Child agents for hierarchy/delegation.
    *   `outputKey` (string, Optional): Session state key to automatically save the agent's final text/structured response.
    *   `outputSchema` (JSONSchema definition or class constructor, Optional): Enforces JSON output matching the schema. **Disables tool use and transfer.**
    *   `inputSchema` (JSONSchema definition or class constructor, Optional): Requires input to match the schema.
    *   `generateContentConfig` (`GenerateContentConfig` interface, Optional): Controls LLM generation parameters (temp, max tokens, safety).
    *   `includeContents` ('default' | 'none', Optional, Default: `'default'`): `'none'` excludes conversation history from LLM context.
    *   Callbacks (`beforeAgentCallback`, etc.): Functions matching specific signatures (`src/agents/BaseAgent.ts`, `src/agents/LlmAgent.ts`).
*   **Behavior:** Non-deterministic, LLM-driven.

*(See: `docs/agents/llm-agents.md`)*

### Workflow Agents

*   Orchestrate sub-agent execution based on predefined logic (no LLM for flow control).
*   Deterministic execution patterns.

*(See: `docs/agents/workflow-agents/index.md`)*

#### SequentialAgent

*   Executes `subAgents` one after another in the array order (`src/agents/SequentialAgent.ts`).
*   Passes the same `InvocationContext` sequentially (state is shared).
*   Use Case: Pipelines, ordered tasks.

*(See: `docs/agents/workflow-agents/sequential-agents.md`, `docs/examples/typescript/snippets/agents/workflow-agents/sequential-agent-code-development.ts`)*

#### ParallelAgent

*   Executes `subAgents` concurrently (`src/agents/ParallelAgent.ts`). Event order is not guaranteed.
*   Assigns distinct `branch` identifiers in context.
*   Sub-agents access the *same shared* `session.state` (requires careful key management).
*   Use Case: Independent tasks to reduce latency (e.g., parallel API calls).

*(See: `docs/agents/workflow-agents/parallel-agents.md`, `docs/examples/typescript/snippets/agents/workflow-agents/parallel-agent-web-research.ts`)*

#### LoopAgent

*   Executes `subAgents` sequentially in a loop (`src/agents/LoopAgent.ts`).
*   **Parameters:**
    *   `maxIterations` (number, Optional): Maximum number of loop cycles.
    *   `subAgents` (`BaseAgent[]`): Agents to run in each iteration (added via `addSubAgent` or constructor).
*   **Termination:** Stops after `maxIterations` or when a sub-agent yields an `Event` with `actions.escalate=true`.
*   Passes the same `InvocationContext` (state persists across iterations).
*   Use Case: Iterative refinement, polling, processes repeating until a condition is met.

*(See: `docs/agents/workflow-agents/loop-agents.md`, `docs/examples/typescript/snippets/agents/workflow-agents/loop-agent-doc-improv-agent.ts`)*

### Custom Agents

*   Inherit directly from `BaseAgent` (`src/agents/BaseAgent.ts`).
*   Implement custom orchestration logic in `protected async *runAsyncImpl(ctx: InvocationContext)` and `protected async *runLiveImpl(ctx: InvocationContext)`.
*   Call sub-agents using `yield* this.subAgentInstance.invoke(ctx)`.
*   Use `ctx.session.state` for data passing and control flow.
*   Register sub-agents via constructor or `addSubAgent()`.
*   Use Case: Complex conditional logic, unique workflows, deep external integrations within the control flow.

*(See: `docs/agents/custom-agents.md`, `docs/examples/typescript/snippets/agents/custom-agent/storyflow-agent.ts`)*

### Multi-Agent Systems

*   Compose agents into hierarchies (`parentAgent`, `subAgents`).
*   **Communication/Coordination:**
    *   **Shared State (`session.state`):** Passive data exchange (e.g., via `outputKey`).
    *   **LLM Delegation (Transfer):** `LlmAgent` uses LLM to call `transfer_to_agent(agentName='...')` based on instructions/descriptions. Handled by `AutoFlow`.
    *   **Explicit Invocation (`AgentTool`):** Wrap an agent in `AgentTool` and add to parent's `tools` list. Parent LLM calls it like a function.
*   **Patterns:** Coordinator/Dispatcher, Sequential Pipeline, Parallel Fan-Out/Gather, Hierarchical Decomposition, Generator-Critic, Iterative Refinement, Human-in-the-Loop (via custom tools).

*(See: `docs/agents/multi-agents.md`)*

### Models

*   ADK supports various LLMs.
*   **Google Gemini:** Direct string IDs (`gemini-2.0-flash`, etc.). Set up via Google AI (`GOOGLE_API_KEY`) or Vertex AI (`GOOGLE_CLOUD_PROJECT`, `GOOGLE_GENAI_USE_VERTEXAI=1`). Uses `src/models/GoogleLlm.ts`.
*   **LiteLLM Integration (`LiteLlm` wrapper):**
    *   Install `litellm` (`npm install litellm`). Set provider API keys (e.g., `OPENAI_API_KEY`).
    *   Use `new LlmAgent({model: new LiteLlm({model: "openai/gpt-4o"}), ...})`
    *   Supports OpenAI, Anthropic (non-Vertex), Cohere, Ollama (local), etc. See `src/models/LiteLlm.ts`.
*   **Vertex AI Endpoints:**
    *   Use full resource string (`projects/.../endpoints/...`) as `model`.
    *   Requires Vertex AI setup (`GOOGLE_GENAI_USE_VERTEXAI=1`).
    *   Works for Model Garden deployments and fine-tuned models (likely uses `GoogleLlm` or a custom Vertex endpoint wrapper).
*   **Third-Party on Vertex (e.g., Claude):**
    *   Requires Vertex AI setup.
    *   Install provider library (e.g., `@anthropic-ai/vertex-sdk`).
    *   **Register** the model class with ADK: `LlmRegistry.register(Claude)`. See `src/models/AnthropicLlm.ts`.
    *   Use direct model string (e.g., `"claude-3-sonnet@20240229"`) in `LlmAgent`.

*(See: `docs/agents/models.md`, `src/models/`)*

## Tools

Capabilities provided to agents beyond core LLM functions.

*(See: `docs/tools/index.md`)*

### Tool Concepts

*   Action-oriented code components (functions, classes).
*   Extend agent abilities (API calls, search, code execution, DB query, RAG).
*   Used by `LlmAgent` via function calling based on instructions and tool descriptions/schemas.

### ToolContext

*   Special object injected into tool functions/callbacks if declared: `function myTool(params: Record<string, any>, toolContext: ToolContext)`.
*   Inherits from `CallbackContext`.
*   **Key Capabilities:**
    *   `state`: Read/write session state (`State` object).
    *   `actions`: Modify `EventActions` (e.g., `skipSummarization=true`, `transferToAgent`, `escalate`).
    *   `functionCallId`: ID of the LLM's request to call this tool.
    *   `agentName`, `invocationId`.
    *   `requestCredential(authConfig)`: Initiate auth flow.
    *   `getAuthResponse(authConfig)`: Retrieve credentials after auth flow.
    *   `listArtifacts()`: List available session artifacts.
    *   `loadArtifact(filename, version?)`: Load artifact content.
    *   `saveArtifact(filename, artifact)`: Save artifact content.
    *   `searchMemory(query)`: Query the long-term `MemoryService`.

*(See: `docs/tools/index.md#tool-context`, `docs/context/index.md`, `src/tools/ToolContext.ts`)*

### Function Tools

*   Wrap custom TypeScript functions or methods.
*   **`FunctionTool`:** (`src/tools/FunctionTool.ts`) Standard synchronous/asynchronous functions (`async (params, context) => ...`).
    *   Function **name**, **description**, and **`functionDeclaration`** (JSON schema for parameters) are critical for LLM usage.
    *   Use simple, JSON-serializable types for args/return. `ToolContext` is automatically injected if present in signature.
    *   Keep tools focused; decompose complex tasks.
*   **`LongRunningFunctionTool`:** (`src/tools/LongRunningTool.ts`) Wraps a function that *returns* a final result but indicates long-running status (used for tasks like `getUserChoice`). ADK handles progress updates differently than Python's generator approach.
*   **`AgentTool`:** (`src/tools/AgentTool.ts`) Treats another agent instance as a callable tool.
    *   Parent LLM calls it like a function.
    *   `AgentTool` creates a sub-session, runs the target agent, captures the final response, and returns it.
    *   `skipSummarization` (boolean): Option to bypass LLM summarization of the sub-agent's result.

*(See: `docs/tools/function-tools.md`, Example Snippets in `docs/examples/typescript/snippets/tools/function-tools/`)*

### Built-in Tools

*   Ready-to-use tools provided by ADK. Require specific models (often Gemini).
*   `googleSearch` (`src/tools/GoogleSearchTool.ts`): Performs Google web search.
*   `builtInCodeExecution` (`src/tools/BuiltInCodeExecutionTool.ts`): Executes Python code sandboxed (via Gemini API).
*   `VertexAiSearchTool` (`src/tools/VertexAISearchTool.ts`): Searches a specific Vertex AI Search data store or engine.
*   **Limitations (Current):** Similar to Python, generally one built-in per root/single agent. Use delegation for sub-agents.

*(See: `docs/tools/built-in-tools.md`, Example Snippets)*

### OpenAPI Tools

*   **`OpenAPIToolset`:** (`src/tools/openapi-tool/openapi-spec-parser/OpenAPIToolset.ts`) Automatically generates `RestApiTool` instances from an OpenAPI v3 spec (JSON/YAML string or object).
*   **`RestApiTool`:** (`src/tools/openapi-tool/openapi-spec-parser/RestApiTool.ts`) Represents a single API operation (e.g., GET /users). Handles request construction (using `axios`), execution, and response.
*   **Usage:**
    1.  Instantiate `new OpenAPIToolset({ specStr: ..., specStrType: ..., authScheme: ..., authCredential: ...})`.
    2.  Get tools: `const apiTools = toolset.getTools()`.
    3.  Add `apiTools` to `new LlmAgent({ tools: [...] })`.
*   Handles parameters (path, query, header, cookie), request bodies, and authentication schemes defined in the spec.

*(See: `docs/tools/openapi-tools.md`, `src/tools/openapi-tool/`)*

### Third-Party Tools (LangChain.js, CrewAI)

*   Wrappers to integrate tools from other frameworks.
*   **`LangchainTool`:** (`src/tools/LangchainTool.ts`) Wraps a LangChain.js tool (requires `@langchain/core`, etc.).
*   **`CrewaiTool`:** (`src/tools/CrewaiTool.ts`) Wraps a CrewAI tool (requires `crewai-tools` JS/TS library if available). Provide `name` and `description`.
*   **Usage:** Instantiate provider tool, wrap with ADK tool, add wrapped tool to `LlmAgent`.

*(See: `docs/tools/third-party-tools.md`, Example Snippets)*

### Google Cloud Tools

*   Integrations with Google Cloud services.
*   **`ApiHubToolset`:** (`src/tools/apihub-tool/APIHubToolset.ts`) Creates tools from APIs documented in Apigee API Hub. Requires GCP auth and API Hub resource name. Can configure API auth.
*   **`ApplicationIntegrationToolset`:** (`src/tools/application-integration-tool/ApplicationIntegrationToolset.ts`) Creates tools from Application Integration workflows or Connectors. Requires GCP project/location, integration/connection details, and GCP auth.
*   **MCP Toolbox for Databases:** Uses `ToolboxTool` (`src/tools/ToolboxTool.ts`) to connect to a deployed MCP Toolbox server. Requires MCP client library (`@modelcontextprotocol/sdk`). `const toolbox = new ToolboxTool("https://server-url")`, `const tools = await toolbox.getToolset(...)`.

*(See: `docs/tools/google-cloud-tools.md`, `docs/tools/mcp-tools.md`)*

### MCP Tools

*   Model Context Protocol (MCP) integration.
*   **Using MCP Servers in ADK:**
    *   `MCPToolset.fromServer({ connectionParams: ... })`: Connects ADK agent to an external MCP server. (`src/tools/mcp-tool/MCPToolset.ts`)
    *   `connectionParams`: `StdioServerParameters` for local servers, or `SseServerParams` for remote.
    *   Returns `Promise<[MCPTool[], AsyncExitStack]>`. Tools are added to `LlmAgent`.
    *   **Crucial:** Call `await exitStack.aclose()` for cleanup.
*   **Exposing ADK Tools via MCP:** (Requires building a separate MCP server in Node.js/TypeScript)
    *   Install `@modelcontextprotocol/server`.
    *   Use `adkToMcpToolType(adkTool)` in `listTools` handler. (`src/tools/mcp-tool/ConversionUtils.ts`)
    *   Call `adkTool.execute(...)` in `callTool` handler.

*(See: `docs/tools/mcp-tools.md`, `src/tools/mcp-tool/`)*

### Authentication

*   Handles secure access for tools calling external APIs.
*   **Core Concepts:**
    *   `AuthScheme`: *How* API expects credentials (e.g., `APIKey`, `HTTPBearer`, `OAuth2`, `OpenIdConnectWithConfig` interfaces/classes). See `src/tools/openapi-tool/auth/AuthHelpers.ts`. Defined by OpenAPI spec or specific classes.
    *   `AuthCredential`: *Initial* info to start auth (e.g., Client ID/Secret, API key value). `authType` indicates flow (e.g., `AuthCredentialTypes.API_KEY`, `AuthCredentialTypes.OAUTH2`). See `src/auth/AuthCredential.ts`.
*   **Configuration:** Passed during `OpenAPIToolset`, `APIHubToolset`, etc. initialization, or via specific methods like `GoogleApiToolSet.configureAuth(...)`.
*   **Interactive Flow (OAuth/OIDC):**
    1.  Tool call fails -> ADK yields `adk_request_credential` function call event.
    2.  Client app extracts `AuthConfig` (`src/auth/AuthConfig.ts`) from event args.
    3.  Client app redirects user to `auth_uri` (appending `redirect_uri`).
    4.  User logs in, authorizes. IDP redirects back with `code`.
    5.  Client app captures callback URL, updates `AuthConfig`.
    6.  Client app sends `AuthConfig` back via `FunctionResponse` for `adk_request_credential`.
    7.  ADK performs token exchange (via `AuthHandler`), stores tokens, retries tool call.
*   **Custom `FunctionTool` Auth:**
    1.  Check `toolContext.state` for cached credentials.
    2.  If no valid creds, check `toolContext.getAuthResponse()` for results from client flow.
    3.  If still no creds, call `toolContext.requestCredential(new AuthConfig(...))` to start flow. Return pending status.
    4.  ADK handles token exchange.
    5.  On retry, `getAuthResponse()` provides creds. Cache in state.
    6.  Make API call.
    7.  Return result.
*   **Security:** Use secure secret management for production. Consider encrypting state if using persistent DBs.

*(See: `docs/tools/authentication.md`, `docs/examples/typescript/snippets/tools/auth/`, `src/auth/`)*

## Sessions, State & Memory

Manage conversational context.

*(See: `docs/sessions/index.md`)*

### Session

*   Represents a single, ongoing conversation thread (`src/sessions/Session.ts`).
*   Container for `events` (history) and `state` (current context data).
*   Identified by `id`, `appName`, `userId`.
*   Managed by `SessionService`.

*(See: `docs/sessions/session.md`)*

### SessionService

*   Manages `Session` object lifecycle (`src/sessions/BaseSessionService.ts`).
*   Responsible for persisting session data.
*   **Implementations:**
    *   `InMemorySessionService`: (`src/sessions/InMemorySessionService.ts`) Non-persistent.
    *   `DatabaseSessionService`: (`src/sessions/DatabaseSessionService.ts`) Persistent using TypeORM (`npm install typeorm reflect-metadata sqlite3 # or other driver`). Requires DB URL.
    *   `VertexAiSessionService`: (`src/sessions/VertexAiSessionService.ts`) Persistent using Vertex AI Agent Engine backend (`npm install @google-cloud/vertexai`). Requires GCP setup, `appName` is Reasoning Engine ID.

*(See: `docs/sessions/session.md`)*

### State

*   Class (`src/sessions/State.ts`) holding temporary data for the *current* conversation. Accessible via `session.state`.
*   Keys are strings, values must be JSON-serializable.
*   **Prefixes (Define Scope):** (`src/sessions/State.ts`)
    *   **(None):** Session-specific.
    *   `user:`: User-specific across sessions (requires persistent service).
    *   `app:`: App-specific across users/sessions (requires persistent service).
    *   `temp:`: Temporary for current invocation turn (never persisted).
*   **Updates:**
    *   **Recommended:** Via `appendEvent` flow using:
        *   `new LlmAgent({ outputKey: "state_key" })`: Saves final agent response.
        *   `new Event({ actions: new EventActions({ stateDelta: {...} }) })`: Manually specify changes.
    *   **Discouraged:** Direct modification (`retrievedSession.state.set('key', value)`) bypasses history/persistence. Use context objects (`toolContext.state`, `callbackContext.state`) within tools/callbacks.

*(See: `docs/sessions/state.md`)*

### Memory & MemoryService

*   Manages long-term, searchable knowledge (`src/memory/BaseMemoryService.ts`).
*   **Responsibilities:**
    *   `addSessionToMemory(session)`: Ingest session info.
    *   `searchMemory(appName, userId, query)`: Search the store.
*   **Implementations:**
    *   `InMemoryMemoryService`: (`src/memory/InMemoryMemoryService.ts`) Non-persistent keyword search.
    *   `VertexAiRagMemoryService`: (`src/memory/VertexAiRagMemoryService.ts`) Persistent semantic search via Vertex AI RAG Corpus (`npm install @google-cloud/vertexai`). Requires GCP setup, Corpus ID.
*   **Usage:** Agents use tools (e.g., `loadMemoryTool`) that call `memoryService.searchMemory`.

*(See: `docs/sessions/memory.md`)*

## Artifacts

Manage named, versioned binary data (files).

*(See: `docs/artifacts/index.md`)*

### Artifact Concepts

*   Represents binary data (e.g., image, PDF) identified by a `filename` string.
*   Stored/retrieved via `ArtifactService`.
*   Data represented as `Part` interface (usually `inlineData` with `data: string` (base64) and `mimeType: string`). See `src/models/types.ts`.
*   Automatically versioned on save.
*   **Namespacing:** `"report.pdf"` (session-scoped), `"user:profile.png"` (user-scoped).

### ArtifactService

*   Manages artifact storage (`src/artifacts/BaseArtifactService.ts`). Configured on the `Runner`.
*   **Implementations:**
    *   `InMemoryArtifactService`: (`src/artifacts/InMemoryArtifactService.ts`) Non-persistent.
    *   `GcsArtifactService`: (`src/artifacts/GcsArtifactService.ts`) Persistent via GCS (`npm install @google-cloud/storage`). Requires bucket name/permissions.

### Context Methods

*   Available on `CallbackContext` and `ToolContext`. Require `ArtifactService`.
*   `saveArtifact(filename: string, artifact: Part): Promise<number> | number`: Saves data, returns version. Records action in `event.actions.artifactDelta`.
*   `loadArtifact(filename: string, version?: number): Promise<Part | undefined> | Part | undefined`: Retrieves artifact. Loads latest if `version` is undefined.
*   `listArtifacts(): Promise<string[]> | string[]` (`ToolContext` only): Lists available artifact filenames.

*(See: `docs/artifacts/index.md`)*

## Context Objects

Bundles of information available during execution.

*(See: `docs/context/index.md`)*

### InvocationContext

*   Most comprehensive context (`src/agents/InvocationContext.ts`). Passed to agent `_runAsyncImpl`/`_runLiveImpl`.
*   Contains: `session` (with `state`, `events`), `agent`, `invocationId`, `userContent`, configured services (`sessionService`, `artifactService`, `memoryService`), `endInvocation` flag.

### ReadonlyContext

*   Base class (`src/agents/ReadonlyContext.ts`), provides read-only view. Used in instruction providers.
*   Contains: `invocationId`, `agentName`, read-only `state`.

### CallbackContext

*   Used in agent/model callbacks (`src/agents/CallbackContext.ts`).
*   Adds to `ReadonlyContext`: Mutable `state` property, `saveArtifact`, `loadArtifact` methods, `userContent`.

### ToolContext (Recap)

*   Used in tool functions/callbacks (`src/tools/ToolContext.ts`).
*   Inherits from `CallbackContext`.
*   Adds: `requestCredential`, `getAuthResponse`, `listArtifacts`, `searchMemory`, `functionCallId`, direct `actions` access.

## Callbacks

Functions to hook into agent lifecycle points. Registered on `Agent` initialization.

*(See: `docs/callbacks/index.md`)*

### Callback Mechanism

*   Framework calls registered functions at specific points.
*   Receive context objects (`CallbackContext` or `ToolContext`).
*   **Control Flow:**
    *   `return undefined`: Allows default behavior.
    *   `return <Specific Object>`: **Overrides** default behavior / **skips** next step.
        *   `beforeAgentCallback` -> `Content`: Skips agent run.
        *   `beforeModelCallback` -> `LlmResponse`: Skips LLM call.
        *   `beforeToolCallback` -> `Record<string, any>`: Skips tool execution.
        *   `afterAgentCallback` -> `Content`: Replaces agent result.
        *   `afterModelCallback` -> `LlmResponse`: Replaces LLM response.
        *   `afterToolCallback` -> `Record<string, any>`: Replaces tool result.

### Agent Lifecycle Callbacks

*   Apply to any `BaseAgent`. (`src/agents/BaseAgent.ts`)
*   `beforeAgentCallback?: (ctx: CallbackContext) => Content | undefined`: Before `runAsyncImpl`. Return `Content` to skip.
*   `afterAgentCallback?: (ctx: CallbackContext) => Content | undefined`: After `runAsyncImpl`. Return `Content` to replace.

*(See: `docs/callbacks/types-of-callbacks.md`)*

### LLM Interaction Callbacks

*   Specific to `LlmAgent`. (`src/agents/LlmAgent.ts`)
*   `beforeModelCallback?: (ctx: CallbackContext, req: LlmRequest) => LlmResponse | undefined`: Before LLM call. Return `LlmResponse` to skip. Can modify `req`.
*   `afterModelCallback?: (ctx: CallbackContext, res: LlmResponse) => LlmResponse | undefined`: After LLM response. Return `LlmResponse` to replace.

*(See: `docs/callbacks/types-of-callbacks.md`, Example Snippets)*

### Tool Execution Callbacks

*   Specific to `LlmAgent` when calling tools. (`src/agents/LlmAgent.ts`)
*   `beforeToolCallback?: (tool: BaseTool, args: Record<string, any>, ctx: ToolContext) => Promise<Record<string, any> | undefined> | Record<string, any> | undefined`: Before tool `execute`. Return `Record` to skip. Can modify `args`.
*   `afterToolCallback?: (tool: BaseTool, args: Record<string, any>, ctx: ToolContext, res: Record<string, any>) => Promise<Record<string, any> | undefined> | Record<string, any> | undefined`: After tool `execute`. Return `Record` to replace `res`.

*(See: `docs/callbacks/types-of-callbacks.md`, Example Snippets)*

### Callback Patterns & Best Practices

*   **Patterns:** Guardrails, State Management, Logging, Caching, Request/Response Modification, Conditional Skipping, Tool Actions (Auth, Skip Summarization), Artifact Handling.
*   **Best Practices:** Keep focused, mind performance (avoid blocking I/O in sync callbacks if possible), handle errors, manage state carefully, test thoroughly, use clear names/docs, use correct context type.

*(See: `docs/callbacks/design-patterns-and-best-practices.md`)*

## Runtime & Events

The execution engine and communication mechanism.

*(See: `docs/runtime/index.md`)*

### Event Loop

*   Core operational pattern: `Runner` orchestrates, `Execution Logic` (Agents, Tools, Callbacks) yields `Event` objects via async generators.
*   **Cycle:**
    1.  Runner starts Agent (`agent.invoke(ctx)`).
    2.  Agent logic runs, `yield`s `Event`, pauses.
    3.  Runner receives Event, processes `actions` (commits state/artifact changes via Services), yields event upstream.
    4.  Agent logic resumes, sees committed state. Repeats.

### Event Object

*   (`src/events/Event.ts`) Immutable record of an occurrence.
*   Contains: `author` ('user' or agent name), `content` (`Content` interface), `actions` (`EventActions` payload), `invocationId`, `id`, `timestamp`, `partial` flag, etc.
*   `event.actions`: Carries `stateDelta`, `artifactDelta`, `transferToAgent`, `escalate`, `skipSummarization`, etc.
*   `event.isFinalResponse()`: Helper to identify user-facing final output for a turn.

*(See: `docs/events/index.md`)*

### Runtime Components

*   `Runner`: (`src/runners.ts`) Orchestrates the Event Loop.
*   Execution Logic: Agents, Tools, Callbacks yielding Events.
*   `Event`: Communication unit.
*   `Services`: Persistence layers (`SessionService`, `ArtifactService`, `MemoryService`).
*   `Session`: (`src/sessions/Session.ts`) Container for conversation state/events.
*   `InvocationContext`: (`src/agents/InvocationContext.ts`) Context for one user-query-to-final-response cycle.

### Key Behaviors (State Timing, Streaming, Async)

*   **State Commitment:** Changes (`stateDelta`) are committed by `SessionService` *after* the event carrying them is yielded and processed by the Runner.
*   **Dirty Reads:** Code *within* the same invocation step might see local, uncommitted state changes.
*   **Streaming (`partial=true`):** Events marked `partial` are yielded upstream immediately but their `actions` are processed only when the final (non-partial) event arrives.
*   **Async Primary:** Runtime is built on Node.js `async/await` and Promises.

*(See: `docs/runtime/index.md`)*

## Evaluation

Assessing agent performance.

*(See: `docs/evaluate/index.md`)*

### Concepts

*   Evaluates **Trajectory** (tool usage) and **Final Response**.
*   Uses datasets (`.test.json`, `.evalset.json`).
*   **Test Files:** Simpler, single session. Fields: `query`, `expected_tool_use`, `expected_intermediate_agent_responses`, `reference`.
*   **Evalsets:** Multiple sessions ("evals"), multi-turn support. Fields per turn same as test files, plus `name` and `initial_session`.

### Methods (`adk-ts web`, `jest`/`vitest`, `adk-ts eval`)

*   **`adk-ts web`:** Interactive evaluation via "Eval" tab in the dev UI.
*   **`jest`/`vitest`:** Programmatic evaluation using `AgentEvaluator.evaluate({ agent: ..., evalDatasetFilePathOrDir: ...})`. Good for CI/CD. Requires a testing framework setup.
*   **`adk-ts eval <AGENT_DIR_PATH> <EVAL_SET_FILE(S)>`:** CLI command to run evaluations.

### Criteria

*   Specified in `test_config.json` (optional).
*   `tool_trajectory_avg_score` (number, default 1.0): Tool usage accuracy.
*   `response_match_score` (number, default 0.8): ROUGE score vs. `reference`.

## Deployment

Moving agents to scalable environments.

*(See: `docs/deploy/index.md`)*

### Vertex AI Agent Engine

*   Fully managed, auto-scaling Google Cloud service.
*   **Steps:** (Requires `@google-cloud/vertexai` or equivalent TS library)
    1.  Initialize Vertex AI SDK.
    2.  Wrap agent: `const app = new reasoningEngines.AdkApp({ agent: rootAgent, ... });` (Conceptual - Adapt based on actual TS SDK).
    3.  Deploy: `const remoteApp = await agentEngines.create({ agentEngine: rootAgent, requirements: [...] });`.
    4.  **Grant Permissions:** Assign `roles/aiplatform.user`.
    5.  Interact: `remoteApp.createSession()`, `remoteApp.streamQuery()`.
    6.  Cleanup: `remoteApp.delete()`.

*(See: `docs/deploy/agent-engine.md`)*

### Cloud Run (`adk-ts deploy`, `gcloud`)

*   Deploy as a container on Google Cloud's serverless platform.
*   **Method 1: `adk-ts deploy cloud_run` CLI:**
    *   `adk-ts deploy cloud_run --project <...> --region <...> [options] <AGENT_DIR_PATH>`
    *   Handles `Dockerfile` creation (Node.js base, copy code, `npm install`, set user, CMD `node dist/src/cli/index.js api_server`) and deployment.
*   **Method 2: `gcloud run deploy` (Manual):**
    1.  Create `Dockerfile` (Node.js base, copy `package.json`, `npm install`, copy code, expose port, CMD).
    2.  Create `server.ts` (or similar) using `Express` or `Fastify` and integrate with ADK's `createApiServer` or `createWebServer`.
    3.  Build and push container image.
    4.  Run `gcloud run deploy <service_name> --image <...> --region <...> --project <...> [flags]`.
*   **Testing:** Use deployed UI or `curl` against API endpoints (`/list-apps`, `/apps/.../sessions/...`, `/run`, `/run_sse`). Use `gcloud auth print-identity-token`.

*(See: `docs/deploy/cloud-run.md`, `docs/get-started/testing.md`)*

## Safety & Security

Building trustworthy agents.

*   **Risks:** Misalignment, harmful content, unsafe actions, prompt injection.
*   **Mitigation Strategies:**
    *   **Identity/Authorization:** Configure tools with appropriate auth schemes/credentials.
    *   **Guardrails:** In-tool checks, Gemini safety settings, Callbacks (`beforeModelCallback`, `beforeToolCallback`), LLM-as-filter pattern.
    *   **Sandboxed Code Execution:** Use `builtInCodeExecution` or custom sandboxing.
    *   **Evaluation & Tracing:** Assess safety; use tracing.
    *   **Network Controls:** VPC Service Controls.
    *   **UI Escaping:** Prevent XSS.

*(See: `docs/guides/responsible-agents.md`)*

## Development Tools (CLI)

*   `adk-ts web [AGENTS_DIR]`: Starts local Express server with Dev UI (Socket.IO). Options: `--port`, `--session_db_url`, `--log_level`, `--allow_origins`.
*   `adk-ts run <AGENT_DIR>`: Runs interactive CLI session. Option: `--save_session`.
*   `adk-ts eval <AGENT_DIR_PATH> <EVAL_SET_FILE(S)>`: Runs evaluations. Options: `--config_file_path`, `--print_detailed_results`.
*   `adk-ts api_server [AGENTS_DIR]`: Starts local Express server (API only).
*   `adk-ts deploy cloud_run <AGENT_DIR>`: Deploys agent to Cloud Run.
*   `adk-ts create <APP_NAME>`: Creates a new agent project structure.

*(See: `docs/get-started/local-dev.md`)*

## Contributing

*   Requires signing Google CLA.
*   Follows Google Open Source Community Guidelines.
*   Use GitHub Discussions/Issues for questions/bugs.
*   Submit PRs to the relevant repository. Code reviews required.
*   Contributions licensed under Apache 2.0.

*(See: `docs/contributing-guide.md`)*

