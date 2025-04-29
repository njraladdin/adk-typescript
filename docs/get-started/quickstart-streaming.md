
# ADK TypeScript Streaming Quickstart {#adk-typescript-streaming-quickstart}

With this quickstart, you'll learn to create a simple agent and use ADK TypeScript Streaming to enable voice and video communication with it that is low-latency and bidirectional. We will install ADK TypeScript, set up a basic "Google Search" agent, try running the agent with Streaming using the `adk-ts web` tool, and then explain how to build a simple asynchronous web app using ADK TypeScript Streaming, Express.js, and Socket.IO.

**Note:** This guide assumes you have experience using a terminal and Node.js/npm in Windows, Mac, or Linux environments.

## Supported models for voice/video streaming {#supported-models}

In order to use voice/video streaming in ADK TypeScript, you will need to use Gemini models that support the necessary APIs for bidirectional streaming. You can find the **model ID(s)** that support these capabilities in the documentation:

*   [Google AI Studio: Gemini API Models](https://ai.google.dev/gemini-api/docs/models#model-variations) (Look for models supporting streaming/multimodal features)
*   [Vertex AI: Gemini API Models](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#gemini_models) (Look for models supporting streaming/multimodal features)

## 1. Setup Environment & Install ADK TypeScript {#1.-setup-installation-typescript}

**Environment:** Ensure you have Node.js (version 18 or higher recommended) and npm installed.

**Install ADK TypeScript:**

```bash
# Navigate to your project directory
# Install the ADK library (replace with actual package name if different)
npm install adk-typescript

# Install dotenv for environment variables
npm install dotenv @types/dotenv
```

## 2. Project Structure {#2.-project-structure-typescript}

Create the following folder structure for your project:

```console
adk-streaming/          # Project folder
└── app/                # Your application source folder
    ├── .env            # API keys and environment variables
    └── google_search_agent/ # Agent folder
        └── agent.ts    # Agent definition (e.g., src/agent.ts if using src layout)
    # (Optional: Add server.ts and static/index.html later for custom app)
    ├── package.json      # Project dependencies and scripts
    └── tsconfig.json     # TypeScript configuration
```

Initialize your npm project if you haven't already:

```bash
cd adk-streaming/app
npm init -y
# Now install dependencies as shown in step 1
```

Create `tsconfig.json`:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS", // Match common Node.js module system
    "outDir": "./dist",
    "rootDir": "./",     // Adjust if using a src directory
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true // Important for potential config files
  },
  "include": ["**/*.ts"], // Adjust if using a src directory (e.g., "src/**/*.ts")
  "exclude": ["node_modules", "dist"]
}
```

### agent.ts

Create the agent definition file (e.g., `google_search_agent/agent.ts` or `src/agent.ts`).

Copy-paste the following code block. For `model`, please double-check the model ID as described earlier in the [Models section](#supported-models).

```typescript
// google_search_agent/agent.ts (or src/agent.ts)
import { LlmAgent as Agent, LlmRegistry, googleSearch } from 'adk-typescript'; // Correct imports

// Get the model instance using LlmRegistry
const geminiModel = LlmRegistry.newLlm(
   "gemini-1.5-flash" // Or another compatible model like "gemini-1.5-pro"
   // Note: Ensure the model chosen supports the Google Search tool.
   // Check Google AI / Vertex AI documentation for model capabilities.
);

export const rootAgent = new Agent({
   // A unique name for the agent.
   name: "basic_search_agent",
   // The Large Language Model (LLM) instance the agent will use.
   model: geminiModel,
   // A short description of the agent's purpose.
   description: "Agent to answer questions using Google Search.",
   // Instructions to set the agent's behavior.
   instruction: "You are an expert researcher. You always stick to the facts provided by the search tool. Answer the user's question based *only* on the search results provided.",
   // Add the imported googleSearch tool to perform grounding.
   tools: [googleSearch]
});

// Optional: Export the agent as default for easier importing elsewhere if needed
// export default { rootAgent };
```

**Note:** To enable both text and audio/video input, the model must support bidirectional streaming and the relevant grounding/tool capabilities. Verify these capabilities by referring to the official Google AI / Vertex AI documentation for your chosen model. This quickstart uses `gemini-1.5-flash` which generally supports the Google Search tool.

`agent.ts` is where your agent's logic is defined. You must export a `rootAgent` for the ADK tools to find it.

Notice how easily you integrated grounding with Google Search. The `Agent` class and the imported `googleSearch` tool handle the complex interactions.

## 3\. Set up the platform {#3.-set-up-the-platform-typescript}

To run the agent, choose a platform (Google AI Studio or Google Cloud Vertex AI) and configure your `.env` file accordingly.

=== "Gemini - Google AI Studio"

    1.  Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).
    2.  Open the **`.env`** file (located inside `app/`) and add/modify the following lines:

        ```env title=".env"
        # Use Google AI backend (not Vertex AI)
        GOOGLE_GENAI_USE_VERTEXAI=0
        # Your API Key
        GOOGLE_API_KEY=PASTE_YOUR_ACTUAL_API_KEY_HERE
        ```

    3.  Replace `PASTE_YOUR_ACTUAL_API_KEY_HERE` with your actual API key.

=== "Gemini - Google Cloud Vertex AI"

    1.  You need an existing [Google Cloud](https://cloud.google.com/?e=48754805&hl=en) account and a project.
        *   Set up a [Google Cloud project](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-gcp).
        *   Set up the [gcloud CLI](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#setup-local).
        *   Authenticate to Google Cloud from the terminal by running `gcloud auth application-default login`.
        *   [Enable the Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com).
    2.  Open the **`.env`** file (located inside `app/`). Add/modify the following lines and update the project ID and location.

        ```env title=".env"
        # Use Vertex AI backend
        GOOGLE_GENAI_USE_VERTEXAI=1
        # Your Project ID
        GOOGLE_CLOUD_PROJECT=PASTE_YOUR_ACTUAL_PROJECT_ID
        # Your Project Location (e.g., us-central1)
        GOOGLE_CLOUD_LOCATION=us-central1
        # GOOGLE_API_KEY is NOT needed when using Vertex AI with application-default credentials
        ```

## 4. Try the agent with `adk-ts web` {#4.-try-it-adk-web-typescript}

Now, let's try the agent using the built-in development UI.

1.  **Build your code:** If you haven't already, compile your TypeScript code:
    ```bash
    cd app # Navigate to your app directory if not already there
    npm run build # Or your configured build script (e.g., tsc)
    ```
    *(This assumes you have a `build` script in your `package.json` like `"build": "tsc"`)*

2.  **Run the Dev UI:** Make sure you are in the `app` directory.
    ```bash
    # Command might be 'adk-ts web .' or node path depending on setup
    adk-ts web .
    # OR (if adk-ts is not in PATH or linked)
    # node ../node_modules/adk-typescript/dist/cli/index.js web .
    ```
    Specify `.` to indicate the current directory contains the agent structure (or provide the path to the `google_search_agent` directory if running from outside `app`).

3.  **Access the UI:** Open the URL provided (usually `http://localhost:3000` or similar) **directly in your browser**. Select `google_search_agent` (or the name of the directory containing `agent.ts`).

### Try with text

Try the following prompts by typing them in the UI's chat input:

*   What is the weather in New York?
*   What is the time in New York?
*   What is the weather in Paris?
*   What is the time in Paris?

The agent should use the `googleSearch` tool automatically (you might not see explicit tool logs unless you add detailed logging) to get the latest information to answer these questions.

### Try with voice and video

The ADK TypeScript `webServer` includes Socket.IO, enabling real-time features. The provided UI might support voice/video if configured:

*   **Voice:** If the UI shows a microphone button, click it to enable voice input and ask a question aloud. You should hear the answer streamed back.
*   **Video:** If the UI shows a camera button, click it to enable video input. Ask questions like "What do you see?". The agent should describe the video feed (requires a model with vision capabilities).

*(Note: Voice/video support depends heavily on the specific UI implementation served by `adk-ts web` and the chosen LLM's capabilities. The default UI included might have basic support.)*

### Stop the tool

Stop the `adk-ts web` server by pressing `Ctrl-C` in the console where it's running.

### Note on ADK TypeScript Streaming

The `runLive` method in the `Runner` and the `LiveRequestQueue` class provide the foundation for streaming interactions in ADK TypeScript. Unlike the Python SDK's distinct `bidiGenerateContent`, the TypeScript version integrates live capabilities into the standard `Runner.runLive` flow, often relying on the agent's underlying `invoke` method switching to its `runLiveImpl`. Tools can interact with the live stream if designed to do so (e.g., using `ToolContext` potentially with custom stream handling, although this isn't explicitly shown in the provided codebase).

## 5. Building a Custom Streaming App (Optional) {#5.-build-custom-app-typescript}

While `adk-ts web` is great for development, let's see how to build a custom web application using **Express.js** and **Socket.IO** (which ADK TypeScript uses internally).

Modify your project structure:

```console
adk-streaming/          # Project folder
└── app/                # Your application source folder
    ├── server.ts       # NEW: Express/Socket.IO server
    ├── static/         # NEW: Static content folder
    │   └── index.html  # NEW: The web client page
    ├── .env
    ├── google_search_agent/
    │   └── agent.ts
    ├── package.json
    └── tsconfig.json
    └── dist/           # Default output directory after building
```

Install necessary dependencies:

```bash
npm install express socket.io
npm install @types/express
```

**server.ts**

Create `server.ts` in your `app` directory. This replaces the Python `main.py`.

```typescript
// server.ts
import express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables first
dotenv.config();

import {
  Runner,
  InMemorySessionService,
  LiveRequestQueue,
  Content,
  Part,
  RunConfig, // Import RunConfig if needed
  Event // Import Event type
} from 'adk-typescript';

// Import your agent (adjust path if needed)
import { rootAgent } from './google_search_agent/agent'; // Assuming agent.ts exports rootAgent

const APP_NAME = "ADK_Streaming_Custom_App";
const sessionService = new InMemorySessionService();
const runner = new Runner({ // Use the standard Runner
    appName: APP_NAME,
    agent: rootAgent,
    sessionService: sessionService,
});

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: "*", // Configure allowed origins appropriately for production
        methods: ["GET", "POST"]
    }
});

const STATIC_DIR = path.join(__dirname, 'static'); // Assuming server.ts is in app/
app.use('/static', express.static(STATIC_DIR));

console.log(`Serving static files from: ${STATIC_DIR}`);

app.get("/", (req, res) => {
    res.sendFile(path.join(STATIC_DIR, "index.html"));
});

// --- WebSocket Logic ---
io.on('connection', (socket) => {
    const sessionId = socket.handshake.query.sessionId as string || `session_${socket.id}`;
    const userId = `user_${socket.id}`;
    console.log(`Client connected: ${socket.id} | Session: ${sessionId}`);

    // Ensure session exists
    let session = sessionService.getSession({ appName: APP_NAME, userId, sessionId });
    if (!session) {
        session = sessionService.createSession({ appName: APP_NAME, userId, sessionId });
        console.log(`Created new session for ${socket.id}: ${sessionId}`);
    }

    const liveRequestQueue = new LiveRequestQueue();

    // Task 1: Agent -> Client Communication
    const agentToClientTask = async () => {
        console.log(`Starting agent processing for session: ${sessionId}`);
        try {
            // runLive yields events from the agent's execution
            const eventStream = runner.runLive({
                session: session!, // Use non-null assertion as we ensured it exists
                liveRequestQueue,
                // runConfig: new RunConfig({ responseModalities: ["TEXT"] }) // Example config
            });

            for await (const event of eventStream) {
                 // console.log("Event from agent:", event); // Debug log

                 if (event.turnComplete) {
                    socket.emit('turn_complete', { turn_complete: true });
                    console.log(`[S->C] Turn Complete for ${sessionId}`);
                 }
                 if (event.interrupted) {
                    socket.emit('interrupted', { interrupted: true });
                     console.log(`[S->C] Interrupted for ${sessionId}`);
                 }

                 // Extract text from the first part if available
                 const part = event.content?.parts?.[0];
                 if (part?.text && event.partial) {
                     socket.emit('message_chunk', { message: part.text });
                     // console.log(`[S->C Chunk] ${part.text}`); // Verbose log
                 } else if (part?.text && event.isFinalResponse()) {
                     // Send final non-partial text response
                     socket.emit('final_message', { message: part.text });
                     console.log(`[S->C Final] ${part.text}`);
                 }
                 // Add handling for other event types (function calls, etc.) if needed
            }
            console.log(`Agent processing finished for session: ${sessionId}`);
        } catch (error) {
            console.error(`Error in agent_to_client_task for ${sessionId}:`, error);
            socket.emit('server_error', { error: `Agent processing error: ${error instanceof Error ? error.message : String(error)}` });
        }
    };

    // Task 2: Client -> Agent Communication
    socket.on('client_message', (text: string) => {
        if (typeof text !== 'string' || !text.trim()) {
            console.warn(`Received invalid message from ${socket.id}:`, text);
            return;
        }
        console.log(`[C->S] Received: ${text} from ${sessionId}`);
        const content: Content = {
            role: "user",
            parts: [{ text: text.trim() } as Part] // Cast to Part
        };
        liveRequestQueue.sendContent(content);
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id} | Session: ${sessionId}`);
        liveRequestQueue.sendClose(); // Signal agent to potentially clean up
        // Optional: Add logic to clean up resources associated with the session
    });

    // Start the agent processing loop
    agentToClientTask();

    // Optionally send an initial message or prompt
    // liveRequestQueue.sendContent({ role: "user", parts: [{ text: "Start" }] });
});

const PORT = process.env.PORT || 8080; // Use a different port than adk-ts web default
server.listen(PORT, () => {
    console.log(`Custom ADK Streaming Server running at http://localhost:${PORT}`);
});

```

This `server.ts` sets up an Express server with Socket.IO:

*   It serves a static `index.html` file.
*   It handles WebSocket connections on the root path (`/`).
*   When a client connects, it initializes an ADK `Runner` session using `runLive`.
*   It uses `async/await` and `for await...of` to handle the asynchronous event stream from `runner.runLive`.
*   It relays agent text responses (`message_chunk`, `final_message`) and status updates (`turn_complete`, `interrupted`) to the client via Socket.IO events.
*   It listens for `client_message` events from the client and forwards the text to the agent via the `LiveRequestQueue`.

**static/index.html**

Create `static/index.html` in your `app` directory.

```html
<!-- static/index.html -->
<!doctype html>
<html>
  <head>
    <title>ADK TypeScript Streaming Test</title>
    <script src="/socket.io/socket.io.js"></script> <!-- Include Socket.IO client -->
    <style>
        body { font-family: sans-serif; margin: 20px; }
        #messages { height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; background-color: #f9f9f9; }
        #messages p { margin: 5px 0; }
        #messages p.user { font-weight: bold; color: blue; }
        #messages p.agent { color: green; }
        form { display: flex; }
        input[type="text"] { flex-grow: 1; padding: 8px; margin-right: 5px; }
        button { padding: 8px 15px; }
    </style>
  </head>
  <body>
    <h1>ADK TypeScript Streaming Test</h1>
    <div id="messages"><p><i>Connecting...</i></p></div>
    <form id="messageForm">
      <input type="text" id="messageInput" autocomplete="off" placeholder="Type your message..." />
      <button type="submit" id="sendButton" disabled>Send</button>
    </form>

    <script>
      const messagesDiv = document.getElementById("messages");
      const messageForm = document.getElementById("messageForm");
      const messageInput = document.getElementById("messageInput");
      const sendButton = document.getElementById("sendButton");
      let currentAgentMessageP = null;

      // --- Socket.IO Connection ---
      // Connect to the server hosting this page
      const socket = io(); // Defaults to connecting to the server that served the page

      socket.on('connect', () => {
        console.log("Connected to server via Socket.IO", socket.id);
        messagesDiv.innerHTML = '<p><i>Connected! Ask the agent something.</i></p>'; // Clear connecting message
        sendButton.disabled = false;
      });

      // --- Receiving Messages from Server ---
      socket.on('message_chunk', (data) => {
        console.log('Received chunk:', data);
        if (!currentAgentMessageP) {
            currentAgentMessageP = document.createElement('p');
            currentAgentMessageP.classList.add('agent');
            messagesDiv.appendChild(currentAgentMessageP);
        }
        currentAgentMessageP.textContent += data.message;
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll down
      });

      socket.on('final_message', (data) => {
          console.log('Received final:', data);
          if (!currentAgentMessageP) { // Handle case where final message is the only message
              currentAgentMessageP = document.createElement('p');
              currentAgentMessageP.classList.add('agent');
              messagesDiv.appendChild(currentAgentMessageP);
              currentAgentMessageP.textContent = data.message; // Set directly if no chunks received
          }
          // Final message might already be complete from chunks, or this contains the full text
          // If currentAgentMessageP exists, its content should already be complete or near complete
          if(currentAgentMessageP && currentAgentMessageP.textContent !== data.message) {
             // Update if the final text differs significantly (e.g., if chunks were missed)
             currentAgentMessageP.textContent = data.message;
          }
          currentAgentMessageP = null; // Reset for the next agent turn
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
      });

       socket.on('turn_complete', (data) => {
          console.log('Turn complete received');
          if (currentAgentMessageP) { // If there was a partial message being built
             currentAgentMessageP = null; // Reset paragraph element for the next agent turn
          }
          // Optionally add a visual separator or indicator
          // const separator = document.createElement('hr');
          // messagesDiv.appendChild(separator);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
       });

       socket.on('interrupted', (data) => {
           console.log('Agent interrupted');
           if (currentAgentMessageP) {
               currentAgentMessageP = null;
           }
           const interruptMsg = document.createElement('p');
           interruptMsg.innerHTML = '<i>Agent interaction interrupted.</i>';
           messagesDiv.appendChild(interruptMsg);
           messagesDiv.scrollTop = messagesDiv.scrollHeight;
       });

       socket.on('server_error', (data) => {
           console.error('Server error:', data.error);
           const errorMsg = document.createElement('p');
           errorMsg.innerHTML = `<strong style="color: red;">Server Error:</strong> ${data.error}`;
           messagesDiv.appendChild(errorMsg);
           messagesDiv.scrollTop = messagesDiv.scrollHeight;
       });


      // --- Sending Messages to Server ---
      messageForm.onsubmit = (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message && socket.connected) {
          // Display user message
          const userMsgP = document.createElement('p');
          userMsgP.classList.add('user');
          userMsgP.textContent = `You: ${message}`;
          messagesDiv.appendChild(userMsgP);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;

          // Send message to server
          socket.emit('client_message', message);
          console.log(`Sent: ${message}`);
          messageInput.value = ""; // Clear input
          currentAgentMessageP = null; // Expect a new agent message paragraph
        }
      };

      // --- Handling Disconnection ---
      socket.on('disconnect', () => {
        console.log("Disconnected from server.");
        messagesDiv.innerHTML += '<p><i>Disconnected. Attempting to reconnect...</i></p>';
        sendButton.disabled = true;
        currentAgentMessageP = null;
      });

      socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        messagesDiv.innerHTML += `<p><i>Connection error: ${err.message}. Please check the server.</i></p>`;
        sendButton.disabled = true;
      });

    </script>
  </body>
</html>
```

This HTML file uses the **Socket.IO client library** (included via `<script src="/socket.io/socket.io.js"></script>`, which is automatically served by the Socket.IO server) to establish a real-time connection. It listens for `message_chunk`, `final_message`, `turn_complete`, and `interrupted` events from the server and updates the chat display accordingly. When the user sends a message, it emits a `client_message` event to the server.

## 6\. Interact with Your Streaming app {#6.-interact-with-your-streaming-app-typescript}

1.  **Build your TypeScript code:**
    ```bash
    cd app
    npm run build # Or: tsc
    ```

2.  **Start the Custom Server:** Run your `server.ts` file using Node.js (referencing the compiled JavaScript output in `dist/`):
    ```bash
    node dist/server.js
    ```

3.  **Access the UI:** Open your browser to the URL shown (e.g., `http://localhost:8080`).

You should see the UI from `index.html`. Try asking a question like `What is Gemini?`. The agent will use Google Search, and you'll see the response streamed into the chat box. You can interrupt by sending another message while it's responding.

This demonstrates building a custom application with bidirectional streaming using ADK TypeScript, Express.js, and Socket.IO.

Congratulations! You've successfully created and interacted with your first Streaming agent using ADK TypeScript!

## Next steps

*   **Add Multimodal Capabilities:** Modify the agent, server, and client to handle sending/receiving audio or video data using `LiveRequestQueue.sendBlob` and appropriate browser APIs (e.g., `MediaRecorder`, `getUserMedia`). Remember to use an LLM that supports multimodal input.
*   **Explore Other Tools:** Integrate different ADK tools (like `FunctionTool`) into your streaming agent.
*   **Implement State:** Add session state management using `ToolContext` or `outputKey` as shown in the [Multi-Agent Weather Bot Tutorial](./tutorial.md).
*   **Error Handling:** Enhance the error handling on both the server and client sides.