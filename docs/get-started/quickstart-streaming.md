# ADK TypeScript Streaming Quickstart {#adk-typescript-streaming-quickstart}

This quickstart guides you through creating a simple agent and using ADK TypeScript Streaming to enable voice and video communication with it that is low-latency and bidirectional. You'll learn how to install ADK TypeScript, set up a basic "Google Search" agent, and run the agent with Streaming using the `npx adk web` tool.

This quickstart assumes a local development environment with Node.js (v18+ recommended), npm, and terminal access in Windows, Mac, or Linux environments.

## Supported models for voice/video streaming {#supported-models}

In order to use voice/video streaming in ADK TypeScript, you will need to use Gemini models that support the necessary APIs for bidirectional streaming. You can find the **model ID(s)** that support these capabilities in the documentation:

- [Google AI Studio: Gemini API Models](https://ai.google.dev/gemini-api/docs/models#model-variations) (Look for models supporting streaming/multimodal features)
- [Vertex AI: Gemini API Models](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#gemini_models) (Look for models supporting streaming/multimodal features)

## 1. Create Your Streaming Agent Project {#1.-setup-installation-typescript}

**Environment Setup:**

*   Ensure you have Node.js (version 18 or higher recommended) and npm installed.

**Create Project:**

```bash
# Create your project directory
mkdir adk-streaming
cd adk-streaming

# Create your first agent (this will set up everything automatically)
npx adk create google_search_agent
```

The `npx adk create` command will automatically:
- Initialize your project with `package.json` and `tsconfig.json`
- Install all necessary dependencies including ADK TypeScript
- Set up the project structure
- Create your agent with sample code
- Walk you through configuring your LLM backend

> **Note:** The command-line tool uses the prefix `npx adk` when running commands locally.

## 2. Update Agent for Google Search {#2.-project-structure-typescript}

### Project structure

After running `npx adk create`, your project will have this structure:

```console
adk-streaming/                # Your project folder  
├── google_search_agent/      # Your agent's code folder
│   ├── agent.ts              # Agent definition
│   └── .env                  # API keys for this agent
├── package.json              # SHARED Node.js project manifest
├── tsconfig.json             # SHARED TypeScript configuration
└── dist/                     # (Created after build) Compiled output
```

### Update the agent for Google Search

Replace the generated `google_search_agent/agent.ts` with the following code optimized for streaming and Google Search:

```typescript
// google_search_agent/agent.ts
import { LlmAgent as Agent } from 'adk-typescript/agents';
import { LlmRegistry } from 'adk-typescript/models';
import { googleSearch } from 'adk-typescript/tools';

// Get the model instance using LlmRegistry
const geminiModel = LlmRegistry.newLlm(
   "gemini-1.5-flash" // Or another compatible model 
   // Note: Ensure the model chosen supports the Google Search tool and streaming.
);

export const rootAgent = new Agent({
   // A unique name for the agent.
   name: "basic_search_agent",
   // The Large Language Model (LLM) instance the agent will use.
   model: geminiModel,
   // A short description of the agent's purpose.
   description: "Agent to answer questions using Google Search.",
   // Instructions to set the agent's behavior.
   instruction: "You are an expert researcher. You always stick to the facts provided by the search tool.",
   // Add google_search tool to perform grounding with Google search.
   tools: [googleSearch]
});
```

**Note:** To enable both text and audio/video input, the model must support bidirectional streaming. Verify these capabilities by referring to the official Google AI / Vertex AI documentation for your chosen model.

`agent.ts` is where your agent's logic is defined. You must export a `rootAgent` for the ADK tools to find it.

Notice how easily you integrated grounding with Google Search. The `Agent` class and the imported `googleSearch` tool handle the complex interactions with the LLM and grounding with the search API.

## 3. Set up the model {#3.-set-up-the-platform-typescript}

Your agent needs credentials to securely call the LLM service. The `npx adk create` command prompted you for these and saved them to a `.env` file located inside your agent's folder (`google_search_agent/.env`).

You can edit this file at any time to update your configuration:

=== "Gemini - Google AI Studio"

    1.  Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).
    2.  This content will be in your `google_search_agent/.env` file:

        ```env
        # Use Google AI backend (value 0 or false)
        GOOGLE_GENAI_USE_VERTEXAI=0
        # Your API Key
        GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_API_KEY_HERE
        ```

=== "Gemini - Google Cloud Vertex AI"

    1.  You need an existing [Google Cloud](https://cloud.google.com/?e=48754805&hl=en) account and a project.
        *   Set up a [Google Cloud project](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-gcp).
        *   Set up the [gcloud CLI](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-local).
        *   Authenticate to Google Cloud for Application Default Credentials (ADC): `gcloud auth application-default login`.
        *   [Enable the Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com).
    2.  This content will be in your `google_search_agent/.env` file:

        ```env
        # Use Vertex AI backend (value 1 or true)
        GOOGLE_GENAI_USE_VERTEXAI=1
        # Your Project ID
        GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
        # Your Project Location (e.g., us-central1)
        GOOGLE_CLOUD_LOCATION=us-central1
        # GOOGLE_API_KEY is NOT needed when using Vertex AI with ADC
        ```

## 4. Build and Run Your Streaming Agent {#4.-try-it-adk-web-typescript}

### Build Your Agent

First, **build** your TypeScript code:

```bash
# Install dependencies (only needed once)
npm install

# Build your TypeScript code
npm run build
```

### Test with ADK Web UI

Now, it's time to try the agent using the built-in development UI:

```bash
# Run the Dev UI
npx adk web google_search_agent
```

This launches the web UI with your streaming-enabled agent.

**Step 1:** Open the URL provided (typically `http://localhost:3000`) **directly in your browser**.

**Step 2:** Select `google_search_agent` from the available agents.

!!!note "Troubleshooting"

    If you do not see "google_search_agent" in the dropdown menu, ensure you ran `npx adk web google_search_agent` from the **correct directory** (your project root `adk-streaming/`) where your agent folder is located.

### Try with text

Try the following prompts by typing them in the UI:

* What is the weather in New York?
* What is the time in New York?
* What is the weather in Paris?
* What is the time in Paris?

The agent will use the Google Search tool to get the latest information to answer these questions.

### Try with voice and video

If the UI shows a microphone button, click it to enable voice input and ask a question aloud. You should hear the answer streamed back.

If the UI shows a camera button, click it to enable video input. Ask questions like "What do you see?". The agent should describe the video feed (requires a model with vision capabilities).

### Stop the tool

Stop the `adk web` server by pressing `Ctrl-C` in the console where it's running.

### Note on ADK TypeScript Streaming

The `runLive` method in the `Runner` and the `LiveRequestQueue` class provide the foundation for streaming interactions in ADK TypeScript. Unlike the Python SDK's distinct `bidiGenerateContent`, the TypeScript version integrates live capabilities into the standard `Runner.runLive` flow, often relying on the agent's underlying `invoke` method switching to its `runLiveImpl`. Tools can interact with the live stream if designed to do so (e.g., using `ToolContext` potentially with custom stream handling, although this isn't explicitly shown in the provided codebase).

## 5. Building a Custom Streaming App (Optional) {#5.-build-custom-app-typescript}

In the previous section, we have checked that our basic search agent works with the ADK TypeScript Streaming using the `adk web` tool. In this section, we will learn how to build your own web application capable of the streaming communication using [Express.js](https://expressjs.com/) and [Socket.IO](https://socket.io/).

Add `static` directory and `server.ts` file to your project root, as in the following structure:

```console
adk-streaming/                # Project folder
├── server.ts                 # Express.js web app
├── static/                   # Static content folder
│   └── index.html            # The web client page
├── google_search_agent/      # Agent folder
│   ├── agent.ts              # Agent definition
│   └── .env                  # API keys and environment variables 
├── package.json              # Node.js package file
├── tsconfig.json             # TypeScript configuration
└── dist/                     # (Created after build) Compiled output
```

**server.ts**

First, install the additional dependencies we'll need:

```bash
npm install express socket.io
npm install @types/express --save-dev
```

Copy-paste the following code block to the server.ts file.

```typescript
// server.ts
import express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables from the agent's .env file
dotenv.config({ path: './google_search_agent/.env' });

// Import from specific modules
import { Runner } from 'adk-typescript/runners';
import { Content, Part } from 'adk-typescript/models';
import { RunConfig } from 'adk-typescript/agents/run_config';
import { InMemorySessionService } from 'adk-typescript/sessions';
import { LiveRequestQueue } from 'adk-typescript/agents';

import { rootAgent } from './google_search_agent/agent';

//
// ADK Streaming
//

const APP_NAME = "ADK Streaming example";
const sessionService = new InMemorySessionService();

function startAgentSession(sessionId: string) {
  // Create a Session
  const session = sessionService.createSession({
    appName: APP_NAME,
    userId: sessionId,
    sessionId: sessionId,
  });

  // Create a Runner
  const runner = new Runner({
    appName: APP_NAME,
    agent: rootAgent,
    sessionService: sessionService,
  });

  // Set response modality = TEXT
  const runConfig = new RunConfig({ responseModalities: ["TEXT"] });

  // Create a LiveRequestQueue for this session
  const liveRequestQueue = new LiveRequestQueue();

  // Start agent session
  const liveEvents = runner.runLive({
    userId: 'user_123',
    sessionId: session.id,
    liveRequestQueue: liveRequestQueue,
    runConfig: runConfig,
  });
  
  return { liveEvents, liveRequestQueue };
}

async function agentToClientMessaging(socket: any, liveEvents: AsyncIterable<any>) {
  try {
    for await (const event of liveEvents) {
      // turn_complete
      if (event.turnComplete) {
        socket.emit('message', JSON.stringify({ turn_complete: true }));
        console.log("[TURN COMPLETE]");
      }

      if (event.interrupted) {
        socket.emit('message', JSON.stringify({ interrupted: true }));
        console.log("[INTERRUPTED]");
      }

      // Read the Content and its first Part
      const part = (
        event.content && event.content.parts && event.content.parts[0]
      );
      if (!part || !event.partial) {
        continue;
      }

      // Get the text
      const text = event.content && event.content.parts && event.content.parts[0].text;
      if (!text) {
        continue;
      }

      // Send the text to the client
      socket.emit('message', JSON.stringify({ message: text }));
      console.log(`[AGENT TO CLIENT]: ${text}`);
    }
  } catch (error) {
    console.error("Error in agent to client messaging:", error);
  }
}

async function clientToAgentMessaging(socket: any, liveRequestQueue: LiveRequestQueue) {
  socket.on('message', (message: string) => {
    const content: Content = {
      role: "user",
      parts: [{ text: message } as Part]
    };
    liveRequestQueue.sendContent(content);
    console.log(`[CLIENT TO AGENT]: ${message}`);
  });
}

//
// Express web app
//

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const STATIC_DIR = path.join(__dirname, 'static');
app.use('/static', express.static(STATIC_DIR));

app.get("/", (_req, res) => {
  return res.sendFile(path.join(STATIC_DIR, "index.html"));
});

io.on('connection', (socket) => {
  const sessionId = `session_${Date.now()}`;
  console.log(`Client #${sessionId} connected`);
  
  // Start agent session
  const { liveEvents, liveRequestQueue } = startAgentSession(sessionId);
  
  // Start tasks
  agentToClientMessaging(socket, liveEvents);
  clientToAgentMessaging(socket, liveRequestQueue);
  
  socket.on('disconnect', () => {
    console.log(`Client #${sessionId} disconnected`);
    liveRequestQueue.sendClose();
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

This code creates a real-time chat application using ADK TypeScript and Express.js with Socket.IO. It sets up a WebSocket endpoint where clients can connect and interact with a Google Search Agent.

Key functionalities:

* Loads environment variables from the agent's `.env` file
* Uses ADK TypeScript to manage agent sessions and run the `google_search_agent`
* `startAgentSession` initializes an agent session with a live request queue for real-time communication
* `agentToClientMessaging` asynchronously streams the agent's responses to the client
* `clientToAgentMessaging` handles user inputs from the client to the agent
* Express.js serves a static frontend and handles WebSocket connections

**index.html**

Create the `static` directory and add the web client frontend by copying this HTML to `static/index.html`:

```bash
# Create static directory
mkdir static
```

```html
<!doctype html>
<html>
  <head>
    <title>ADK TypeScript Streaming Test</title>
    <script src="/socket.io/socket.io.js"></script>
  </head>

  <body>
    <h1>ADK TypeScript Streaming Test</h1>
    <div
      id="messages"
      style="height: 300px; overflow-y: auto; border: 1px solid black"></div>
    <br />

    <form id="messageForm">
      <label for="message">Message:</label>
      <input type="text" id="message" name="message" />
      <button type="submit" id="sendButton" disabled>Send</button>
    </form>
  </body>

  <script>
    // Connect the server with a WebSocket connection
    const socket = io();

    // Get DOM elements
    const messageForm = document.getElementById("messageForm");
    const messageInput = document.getElementById("message");
    const messagesDiv = document.getElementById("messages");
    let currentMessageId = null;

    // Socket.IO handlers
    socket.on('connect', function () {
      console.log("Socket.IO connection opened.");
      document.getElementById("sendButton").disabled = false;
      document.getElementById("messages").textContent = "Connection opened";
    });

    socket.on('message', function (eventData) {
      // Parse the incoming message
      const packet = JSON.parse(eventData);
      console.log(packet);

      // Check if the turn is complete
      // if turn complete, reset current message
      if (packet.turn_complete && packet.turn_complete == true) {
        currentMessageId = null;
        return;
      }

      // add a new message for a new turn
      if (currentMessageId == null && packet.message) {
        currentMessageId = Math.random().toString(36).substring(7);
        const message = document.createElement("p");
        message.id = currentMessageId;
        // Append the message element to the messagesDiv
        messagesDiv.appendChild(message);
      }

      // Add message text to the existing message element
      if (packet.message) {
        const message = document.getElementById(currentMessageId);
        message.textContent += packet.message;

        // Scroll down to the bottom of the messagesDiv
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    });

    // When the connection is closed, try reconnecting
    socket.on('disconnect', function () {
      console.log("Socket.IO connection closed.");
      document.getElementById("sendButton").disabled = true;
      document.getElementById("messages").textContent = "Connection closed";
    });

    socket.on('error', function (e) {
      console.log("Socket.IO error: ", e);
    });

    // Add submit handler to the form
    messageForm.onsubmit = function (e) {
      e.preventDefault();
      const message = messageInput.value;
      if (message) {
        const p = document.createElement("p");
        p.textContent = "> " + message;
        messagesDiv.appendChild(p);
        socket.emit('message', message);
        messageInput.value = "";
      }
      return false;
    };
  </script>
</html>
```

This HTML file sets up a basic webpage with:

* A form (`messageForm`) with an input field for typing messages and a "Send" button.
* JavaScript that:
  * Connects to the Socket.IO server.
  * Enables the "Send" button upon successful connection.
  * Appends received messages from the server to the `messages` div, handling streaming responses and turn completion.
  * Sends the text entered in the input field to the Socket.IO server when the form is submitted.

## 6\. Interact with Your Streaming app {#6.-interact-with-your-streaming-app-typescript}

1\. **Navigate to the Correct Directory:**

   Make sure you are in your project root directory (`adk-streaming/`)

2\. **Build and Start the Express Server**: Run the following commands to build and start the server:

```console
# Build the TypeScript files
npm run build

# Run the server
node dist/server.js
```

3\. **Access the UI:** Once the UI server starts, the terminal will display a local URL (e.g., [http://localhost:8080](http://localhost:8080)). Click this link to open the UI in your browser.

Try asking a question `What is Gemini?`. The agent will use Google Search to respond to your queries. You would notice that the UI shows the agent's response as streaming text. You can also send messages to the agent at any time, even while the agent is still responding. This demonstrates the bidirectional communication capability of ADK TypeScript Streaming.

Benefits over conventional synchronous web apps:

* Real-time two-way communication: Seamless interaction.
* More responsive and engaging: No need to wait for full responses or constant refreshing. Feels like a live conversation.
* Can be extended to multimodal apps with audio, image and video streaming support.

Congratulations! You've successfully created and interacted with your first Streaming agent using ADK TypeScript!

## 🛣️ Next steps

*   **Add Multimodal Capabilities:** Modify the agent, server, and client to handle sending/receiving audio or video data using `LiveRequestQueue.sendBlob` and appropriate browser APIs (e.g., `MediaRecorder`, `getUserMedia`). Remember to use an LLM that supports multimodal input.
*   **Explore Other Tools:** Integrate different ADK tools (like `FunctionTool`) into your streaming agent.
*   **Implement State:** Add session state management using `ToolContext` or `outputKey` as shown in the [Multi-Agent Weather Bot Tutorial](./tutorial.md).
*   **Error Handling:** Enhance the error handling on both the server and client sides.