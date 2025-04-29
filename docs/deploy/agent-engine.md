# Deploy to Vertex AI Agent Engine

[Agent Engine](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview)
is a fully managed Google Cloud service enabling developers to deploy, manage,
and scale AI agents in production. Agent Engine handles the infrastructure to
scale agents in production so you can focus on creating intelligent and
impactful applications.

```typescript
import { AgentEngine } from '@google-cloud/vertexai';

// Create and deploy your agent to Agent Engine
const remoteApp = await AgentEngine.create({
  agent: rootAgent,
  dependencies: [
    "@google-cloud/vertexai",
    "adk-typescript"
  ]
});
```

## Install Vertex AI SDK

Agent Engine is part of the Vertex AI SDK for Node.js. For more information, you can review the [Agent Engine quickstart documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/quickstart).

### Install the Vertex AI SDK

```shell
npm install @google-cloud/vertexai
# You'll also need the ADK TypeScript package
npm install adk-typescript
```

!!!info
    Make sure you have Node.js version 18.0.0 or higher installed.

### Initialization

```typescript
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = "your-project-id";
const LOCATION = "us-central1";

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});
```

For `LOCATION`, you can check out the list of [supported regions in Agent Engine](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview#supported-regions).

### Create your agent

You can create a simple agent with TypeScript that has two tools (for getting weather and retrieving time in a specified city):

```typescript
import { Agent, FunctionTool } from 'adk-typescript';

// Define tool functions
function getWeather(params: { city: string }): object {
  const { city } = params;
  // This is a mock implementation
  return {
    status: "success",
    report: `The weather in ${city} is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).`
  };
}

function getTime(params: { city: string }): object {
  const { city } = params;
  // This is a mock implementation
  return {
    status: "success",
    time: `The current time in ${city} is 3:45 PM.`
  };
}

// Create tools
const weatherTool = new FunctionTool({
  name: "get_weather",
  description: "Get the current weather for a specific city",
  func: getWeather
});

const timeTool = new FunctionTool({
  name: "get_time",
  description: "Get the current time for a specific city",
  func: getTime
});

// Create the agent
const rootAgent = new Agent({
  name: "multi_tool_agent",
  model: "gemini-2.0-flash",
  description: "An agent that can get weather and time information for cities",
  tools: [weatherTool, timeTool],
  instruction: "You can help users get weather and time information for different cities."
});
```

### Prepare your agent for Agent Engine

Use the Agent Engine SDK to wrap your agent to make it deployable to Agent Engine:

```typescript
import { AgentEngineApp } from '@google-cloud/vertexai';

const app = new AgentEngineApp({
  agent: rootAgent,
  enableTracing: true,
});
```

### Try your agent locally

You can try it locally before deploying to Agent Engine.

#### Create session (local)

```typescript
const session = await app.createSession({ userId: "u_123" });
console.log(session);
```

Expected output for `createSession` (local):

```console
{
  id: 'c6a33dae-26ef-410c-9135-b434a528291f',
  appName: 'default-app-name',
  userId: 'u_123',
  state: {},
  events: [],
  lastUpdateTime: 1743440392.8689594
}
```

#### List sessions (local)

```typescript
const sessions = await app.listSessions({ userId: "u_123" });
console.log(sessions);
```

Expected output for `listSessions` (local):

```console
{
  sessionIds: ['c6a33dae-26ef-410c-9135-b434a528291f']
}
```

#### Get a specific session (local)

```typescript
const retrievedSession = await app.getSession({
  userId: "u_123",
  sessionId: session.id
});
console.log(retrievedSession);
```

Expected output for `getSession` (local):

```console
{
  id: 'c6a33dae-26ef-410c-9135-b434a528291f',
  appName: 'default-app-name',
  userId: 'u_123',
  state: {},
  events: [],
  lastUpdateTime: 1743681991.95696
}
```

#### Send queries to your agent (local)

```typescript
// Using async iterator with for-await-of
const events = app.streamQuery({
  userId: "u_123",
  sessionId: session.id,
  message: "whats the weather in new york"
});

for await (const event of events) {
  console.log(event);
}
```

Expected output for `streamQuery` (local):

```console
{parts: [{functionCall: {id: 'af-a33fedb0-29e6-4d0c-9eb3-00c402969395', args: {city: 'new york'}, name: 'get_weather'}}], role: 'model'}
{parts: [{functionResponse: {id: 'af-a33fedb0-29e6-4d0c-9eb3-00c402969395', name: 'get_weather', response: {status: 'success', report: 'The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).'}}}], role: 'user'}
{parts: [{text: 'The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).'}], role: 'model'}
```

### Deploy your agent to Agent Engine

```typescript
import { AgentEngine } from '@google-cloud/vertexai';

const remoteApp = await AgentEngine.create({
  agent: rootAgent,
  dependencies: [
    "@google-cloud/vertexai",
    "adk-typescript"
  ]
});
```

This step may take several minutes to finish.

## Grant the deployed agent permissions

Before proceeding to query your agent on Agent Engine, your deployed agent must first be granted additional permissions before it can use managed sessions. Managed sessions are a built-in component of Agent Engine that enables agents to keep track of the state of a conversation. Without granting the deploy agent the permissions below, you may see errors when querying your deployed agent.

You can follow the instructions in [Set up your service agent permissions](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/set-up#service-agent) to grant the following permissions via the [IAM admin page](https://console.cloud.google.com/iam-admin/iam):

*  Vertex AI User (`roles/aiplatform.user`) to your `service-PROJECT_NUMBER@gcp-sa-aiplatform-re.iam.gserviceaccount.com` service account

### Try your agent on Agent Engine

#### Create session (remote)

```typescript
const remoteSession = await remoteApp.createSession({ userId: "u_456" });
console.log(remoteSession);
```

Expected output for `createSession` (remote):

```console
{
  events: [],
  userId: 'u_456',
  state: {},
  id: '7543472750996750336',
  appName: '7917477678498709504',
  lastUpdateTime: 1743683353.030133
}
```

`id` is the session ID, and `appName` is the resource ID of the deployed agent on Agent Engine.

#### List sessions (remote)

```typescript
const remoteSessions = await remoteApp.listSessions({ userId: "u_456" });
console.log(remoteSessions);
```

#### Get a specific session (remote)

```typescript
const retrievedRemoteSession = await remoteApp.getSession({
  userId: "u_456", 
  sessionId: remoteSession.id
});
console.log(retrievedRemoteSession);
```

!!!note
    While using your agent locally, session ID is stored in `session.id` property, when using your agent remotely on Agent Engine, it's accessed the same way with `remoteSession.id`.

#### Send queries to your agent (remote)

```typescript
// Using async iterator with for-await-of
const remoteEvents = remoteApp.streamQuery({
  userId: "u_456",
  sessionId: remoteSession.id,
  message: "whats the weather in new york"
});

for await (const event of remoteEvents) {
  console.log(event);
}
```

Expected output for `streamQuery` (remote):

```console
{parts: [{functionCall: {id: 'af-f1906423-a531-4ecf-a1ef-723b05e85321', args: {city: 'new york'}, name: 'get_weather'}}], role: 'model'}
{parts: [{functionResponse: {id: 'af-f1906423-a531-4ecf-a1ef-723b05e85321', name: 'get_weather', response: {status: 'success', report: 'The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).'}}}], role: 'user'}
{parts: [{text: 'The weather in New York is sunny with a temperature of 25 degrees Celsius (41 degrees Fahrenheit).'}], role: 'model'}
```

## Clean up

After you've finished, it's a good practice to clean up your cloud resources.
You can delete the deployed Agent Engine instance to avoid any unexpected
charges on your Google Cloud account.

```typescript
await remoteApp.delete({ force: true });
```

The `force: true` option will also delete any child resources that were generated from the deployed agent, such as sessions.
