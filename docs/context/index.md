# Context

## What are Context

In the Agent Development Kit (ADK), "context" refers to the crucial bundle of information available to your agent and its tools during specific operations. Think of it as the necessary background knowledge and resources needed to handle a current task or conversation turn effectively.

Agents often need more than just the latest user message to perform well. Context is essential because it enables:

1. **Maintaining State:** Remembering details across multiple steps in a conversation (e.g., user preferences, previous calculations, items in a shopping cart). This is primarily managed through **session state**.
2. **Passing Data:** Sharing information discovered or generated in one step (like an LLM call or a tool execution) with subsequent steps. Session state is key here too.
3. **Accessing Services:** Interacting with framework capabilities like:
    * **Artifact Storage:** Saving or loading files or data blobs (like PDFs, images, configuration files) associated with the session.
    * **Memory:** Searching for relevant information from past interactions or external knowledge sources connected to the user.
    * **Authentication:** Requesting and retrieving credentials needed by tools to access external APIs securely.
4. **Identity and Tracking:** Knowing which agent is currently running (`agent.name`) and uniquely identifying the current request-response cycle (`invocationId`) for logging and debugging.
5. **Tool-Specific Actions:** Enabling specialized operations within tools, such as requesting authentication or searching memory, which require access to the current interaction's details.


The central piece holding all this information together for a single, complete user-request-to-final-response cycle (an **invocation**) is the `InvocationContext`. However, you typically won't create or manage this object directly. The ADK framework creates it when an invocation starts (e.g., via `runner.runAsync()`) and passes the relevant contextual information implicitly to your agent code, callbacks, and tools.

```typescript
// Conceptual Pseudocode: How the framework provides context (Internal Logic)

// const runner = new Runner({
//   agent: myRootAgent, 
//   sessionService: sessionService, 
//   artifactService: artifactService
// });
// const userMessage = { ... }; // Content object
// const session = await sessionService.getSession(...); // Or create new

// --- Inside runner.runAsync(...) ---
// 1. Framework creates the main context for this specific run
// const invocationContext = new InvocationContext({
//   invocationId: "unique-id-for-this-run",
//   session: session,
//   userContent: userMessage,
//   agent: myRootAgent, // The starting agent
//   sessionService: sessionService,
//   artifactService: artifactService,
//   memoryService: memoryService,
//   // ... other necessary fields ...
// });

// 2. Framework calls the agent's run method, passing the context implicitly
// await myRootAgent.runAsync(invocationContext);
// --- End Internal Logic ---

// As a developer, you work with the context objects provided in method arguments.
```

## The Different types of Context

While `InvocationContext` acts as the comprehensive internal container, ADK provides specialized context objects tailored to specific situations. This ensures you have the right tools and permissions for the task at hand without needing to handle the full complexity of the internal context everywhere. Here are the different "flavors" you'll encounter:

1.  **`InvocationContext`**
    *   **Where Used:** Received as the `ctx` argument directly within an agent's core implementation methods (`runAsyncImpl`, `runLiveImpl`).
    *   **Purpose:** Provides access to the *entire* state of the current invocation. This is the most comprehensive context object.
    *   **Key Contents:** Direct access to `session` (including `state` and `events`), the current `agent` instance, `invocationId`, initial `userContent`, references to configured services (`artifactService`, `memoryService`, `sessionService`), and fields related to live/streaming modes.
    *   **Use Case:** Primarily used when the agent's core logic needs direct access to the overall session or services, though often state and artifact interactions are delegated to callbacks/tools which use their own contexts. Also used to control the invocation itself (e.g., setting `ctx.endInvocation = true`).

    ```typescript
    // Example: Agent implementation receiving InvocationContext
    import { BaseAgent, InvocationContext } from '../agents';
    import { Event } from '../events/Event';

    class MyAgent extends BaseAgent {
      async *runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event> {
        // Direct access example
        const agentName = ctx.agent.name;
        const sessionId = ctx.session.id;
        console.log(`Agent ${agentName} running in session ${sessionId} for invocation ${ctx.invocationId}`);
        // ... agent logic using ctx ...
        yield new Event({ /* ... */ });
      }
    }
    ```

2.  **`ReadonlyContext`**
    *   **Where Used:** Provided in scenarios where only read access to basic information is needed and mutation is disallowed (e.g., instruction provider functions). It's also the base class for other contexts.
    *   **Purpose:** Offers a safe, read-only view of fundamental contextual details.
    *   **Key Contents:** `invocationId`, `agentName`, and a read-only *view* of the current `state`.

    ```typescript
    // Example: Instruction provider receiving ReadonlyContext
    import { ReadonlyContext } from '../agents';

    function myInstructionProvider(context: ReadonlyContext): string {
      // Read-only access example
      const userTier = context.state.get("userTier", "standard"); // Can read state
      // context.state['newKey'] = 'value'; // This would typically cause an error or be ineffective
      return `Process the request for a ${userTier} user.`;
    }
    ```

3.  **`CallbackContext`**
    *   **Where Used:** Passed as `callbackContext` to agent lifecycle callbacks (`beforeAgentCallback`, `afterAgentCallback`) and model interaction callbacks (`beforeModelCallback`, `afterModelCallback`).
    *   **Purpose:** Facilitates inspecting and modifying state, interacting with artifacts, and accessing invocation details *specifically within callbacks*.
    *   **Key Capabilities (Adds to `ReadonlyContext`):**
        *   **Mutable `state` Property:** Allows reading *and writing* to session state. Changes made here (`callbackContext.state['key'] = value`) are tracked and associated with the event generated by the framework after the callback.
        *   **Artifact Methods:** `loadArtifact(filename)` and `saveArtifact(filename, part)` methods for interacting with the configured `artifactService`.
        *   Direct `userContent` access.

    ```typescript
    // Example: Callback receiving CallbackContext
    import { CallbackContext } from '../agents';
    import { LlmRequest } from '../models';
    import { Content } from '../models/types';

    function myBeforeModelCb(callbackContext: CallbackContext, request: LlmRequest): Content | null {
      // Read/Write state example
      const callCount = callbackContext.state.get("modelCalls", 0);
      callbackContext.state["modelCalls"] = callCount + 1; // Modify state

      // Optionally load an artifact
      // const configPart = callbackContext.loadArtifact("model_config.json");
      console.log(`Preparing model call #${callCount + 1} for invocation ${callbackContext.invocationId}`);
      return null; // Allow model call to proceed
    }
    ```

4.  **`ToolContext`**
    *   **Where Used:** Passed as `toolContext` to the functions backing `FunctionTool`s and to tool execution callbacks (`beforeToolCallback`, `afterToolCallback`).
    *   **Purpose:** Provides a simplified context for tool execution, with access to the session and additional context properties.
    *   **Key Capabilities:**
        *   **Extends `CallbackContext`:** Inherits all capabilities of `CallbackContext`, including `loadArtifact` and `saveArtifact` methods.
        *   **Artifact Methods:** Adds `listArtifacts()` method to enumerate available artifacts.
        *   **Memory Search:** Provides `searchMemory(query: string)` to access memory services.
        *   **Authentication:** Methods for handling credentials via `requestCredential(authConfig)` and `getAuthResponse(authConfig)`.
        *   **Helper Methods:** `has(key)`, `get(key, defaultValue)`, and `set(key, value)` for managing context properties.
        *   **Function Call ID:** Maintains a reference to the current `functionCallId` to link tool executions with their calling events.

    ```typescript
    // Example: Tool function receiving ToolContext
    import { ToolContext } from '../tools';

    // Assume this function is wrapped by a FunctionTool
    function searchExternalApi(query: string, toolContext: ToolContext): Record<string, any> {
      // Access to parent CallbackContext methods like loadArtifact
      const configArtifact = toolContext.loadArtifact("api_config.json");
      
      // ToolContext-specific memory search capabilities
      const memoryResults = toolContext.searchMemory(query);
      
      // Auth handling
      const apiKey = toolContext.get('apiKey');
      if (!apiKey) {
        // Request authentication if needed
        toolContext.requestCredential({/* auth config */});
        return { status: "Auth Required" };
      }

      // Set a value in the context if needed
      toolContext.set('lastQuery', query);

      return { 
        result: `Data for ${query} fetched.`,
        memoryResults
      };
    }
    ```

Understanding these different context objects and when to use them is key to effectively managing state, accessing services, and controlling the flow of your ADK application. The next section will detail common tasks you can perform using these contexts.


## Common Tasks Using Context

Now that you understand the different context objects, let's focus on how to use them for common tasks when building your agents and tools.

### Accessing Information

You'll frequently need to read information stored within the context.

*   **Reading Session State:** Access data saved in previous steps or user/app-level settings.

    ```typescript
    // Example: In a Tool function
    import { ToolContext } from '../tools';

    function myTool(toolContext: ToolContext): Record<string, any> {
      const userPref = toolContext.session.state.get("userDisplayPreference", "default_mode");
      const apiEndpoint = toolContext.session.state.get("app:apiEndpoint"); // Read app-level state

      if (userPref === "dark_mode") {
        // ... apply dark mode logic ...
      }
      console.log(`Using API endpoint: ${apiEndpoint}`);
      // ... rest of tool logic ...
      return { /* result */ };
    }

    // Example: In a Callback function
    import { CallbackContext } from '../agents';

    function myCallback(callbackContext: CallbackContext): void {
      const lastToolResult = callbackContext.state.get("temp:lastApiResult"); // Read temporary state
      if (lastToolResult) {
        console.log(`Found temporary result from last tool: ${lastToolResult}`);
      }
      // ... callback logic ...
    }
    ```

*   **Getting Current Identifiers:** Useful for logging or custom logic based on the current operation.

    ```typescript
    // Example: In any context (ToolContext shown)
    import { ToolContext } from '../tools';

    function logToolUsage(toolContext: ToolContext): Record<string, any> {
      const agentName = toolContext.get('agentName', 'unknown');
      const invId = toolContext.session.id;
      const funcCallId = toolContext.get('functionCallId', 'N/A');

      console.log(`Log: Session=${invId}, Agent=${agentName}, FunctionCallID=${funcCallId} - Tool Executed.`);
      return { /* result */ };
    }
    ```

*   **Accessing the Initial User Input:** Refer back to the message that started the current invocation.

    ```typescript
    // Example: In a Callback
    import { CallbackContext } from '../agents';

    function checkInitialIntent(callbackContext: CallbackContext): void {
      let initialText = "N/A";
      if (callbackContext.userContent && callbackContext.userContent.parts) {
        initialText = callbackContext.userContent.parts[0].text || "Non-text input";
      }

      console.log(`This invocation started with user input: '${initialText}'`);
    }

    // Example: In an Agent's runAsyncImpl
    // async *runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event> {
    //   if (ctx.userContent && ctx.userContent.parts) {
    //     const initialText = ctx.userContent.parts[0].text;
    //     console.log(`Agent logic remembering initial query: ${initialText}`);
    //   }
    //   // ...
    // }
    ```

### Managing Session State

State is crucial for memory and data flow. When you modify state using `CallbackContext` or accessing state via `ToolContext`, the changes are tracked and persisted by the framework.

*   **How it Works:** Writing to `callbackContext.state['myKey'] = myValue` or `toolContext.session.state['myKey'] = myValue` adds this change to the state which will be persisted by the framework.
*   **Passing Data Between Tools:**

    ```typescript
    // Example: Tool 1 - Fetches user ID
    import { ToolContext } from '../tools';
    import { v4 as uuidv4 } from 'uuid';

    function getUserProfile(toolContext: ToolContext): Record<string, any> {
      const userId = uuidv4(); // Simulate fetching ID
      // Save the ID to state for the next tool
      toolContext.session.state["temp:currentUserId"] = userId;
      return { profileStatus: "ID generated" };
    }

    // Example: Tool 2 - Uses user ID from state
    function getUserOrders(toolContext: ToolContext): Record<string, any> {
      const userId = toolContext.session.state.get("temp:currentUserId");
      if (!userId) {
        return { error: "User ID not found in state" };
      }

      console.log(`Fetching orders for user ID: ${userId}`);
      // ... logic to fetch orders using userId ...
      return { orders: ["order123", "order456"] };
    }
    ```

*   **Updating User Preferences:**

    ```typescript
    // Example: Tool or Callback identifies a preference
    import { ToolContext } from '../tools'; // Or CallbackContext

    function setUserPreference(toolContext: ToolContext, preference: string, value: string): Record<string, any> {
      // Use 'user:' prefix for user-level state (if using a persistent SessionService)
      const stateKey = `user:${preference}`;
      toolContext.session.state[stateKey] = value;
      console.log(`Set user preference '${preference}' to '${value}'`);
      return { status: "Preference updated" };
    }
    ```

*   **State Prefixes:** While basic state is session-specific, prefixes like `app:` and `user:` can be used with persistent `SessionService` implementations to indicate broader scope (app-wide or user-wide across sessions). `temp:` can denote data only relevant within the current invocation.

### Working with Artifacts

Use artifacts to handle files or large data blobs associated with the session. Common use case: processing uploaded documents.

*   **Document Summarizer Example Flow:**

    1.  **Ingest Reference (e.g., in a Setup Tool or Callback):** Save the *path or URI* of the document, not the entire content, as an artifact.

        ```typescript
        // Example: In a callback or initial tool
        import { CallbackContext } from '../agents'; // Or ToolContext
        import { Part } from '../models/types';

        async function saveDocumentReference(context: CallbackContext, filePath: string): Promise<void> {
          // Assume filePath is something like "gs://my-bucket/docs/report.pdf" or "/local/path/to/report.pdf"
          try {
            // Create a Part containing the path/URI text
            const artifactPart: Part = { text: filePath };
            const version = await context.saveArtifact("document_to_summarize.txt", artifactPart);
            console.log(`Saved document reference '${filePath}' as artifact version ${version}`);
            // Store the filename in state if needed by other tools
            context.state["temp:docArtifactName"] = "document_to_summarize.txt";
          } catch (e) {
            console.log(`Error saving artifact: ${e}`); // E.g., Artifact service not configured
          }
        }

        // Example usage:
        // await saveDocumentReference(callbackContext, "gs://my-bucket/docs/report.pdf");
        ```

    2.  **Summarizer Tool:** Load the artifact to get the path/URI, read the actual document content using appropriate libraries, summarize, and return the result.

        ```typescript
        // Example: In the Summarizer tool function
        import { ToolContext } from '../tools';
        import { Part } from '../models/types';
        
        async function summarizeDocumentTool(toolContext: ToolContext): Promise<Record<string, any>> {
          const artifactName = toolContext.session.state.get("temp:docArtifactName");
          if (!artifactName) {
            return { error: "Document artifact name not found in state." };
          }

          try {
            // ToolContext extends CallbackContext, so it has loadArtifact method
            const artifactPart = await toolContext.loadArtifact(artifactName);
            if (!artifactPart || !artifactPart.text) {
              return { error: `No artifact data available: ${artifactName}` };
            }

            const filePath = artifactPart.text;
            console.log(`Using document reference: ${filePath}`);
            
            // Read the file and process it...
            // (file reading code would go here)
            
            return { summary: `Summary of content from ${filePath}` };
          } catch (e) {
            if (e instanceof Error) {
              return { error: `Error processing document: ${e.message}` };
            }
            return { error: "Unknown error occurred" };
          }
        }
        ```

*   **Listing Artifacts:** If you need to work with artifacts, do so via the appropriate context.

    ```typescript
    // Example: Using CallbackContext to work with artifacts
    import { CallbackContext } from '../agents';
    
    async function handleArtifacts(callbackContext: CallbackContext): Promise<void> {
      try {
        // CallbackContext has loadArtifact and saveArtifact methods
        // Load an existing artifact
        const artifact = await callbackContext.loadArtifact("document.txt");
        console.log("Loaded artifact content:", artifact?.text);
        
        // Save a new artifact
        const newArtifact: Part = { text: "This is new artifact content" };
        const version = await callbackContext.saveArtifact("new-document.txt", newArtifact);
        console.log(`Saved new artifact with version ${version}`);
      } catch (e) {
        console.error("Error handling artifacts:", e);
      }
    }
    ```

### Authentication Handling

Managing authentication for tools that need to access external services.

```typescript
// Example: Tool requiring auth
import { ToolContext } from '../tools';

// Define a key to store credentials
const AUTH_STATE_KEY = "user:myApiCredential";

function callSecureApi(toolContext: ToolContext, requestData: string): Record<string, any> {
  // 1. Check if credential already exists in state
  const credential = toolContext.session.state.get(AUTH_STATE_KEY);

  if (!credential) {
    // 2. Handle missing credential
    console.log("Credential not found");
    
    // Request auth implementation depends on your framework's specifics
    // This is a simplified example
    toolContext.set('needsAuth', true);
    return { status: "Authentication required. Please provide credentials." };
  }

  // 3. Use credential to make API call
  console.log(`Using credential to call API with data: ${requestData}`);
  // ... Make the actual API call using credential ...
  const apiResult = `API result for ${requestData}`;

  return { result: apiResult };
}
```

### Leveraging Memory

Access relevant information from the past or external sources.

```typescript
// Example: Tool using memory search
import { ToolContext } from '../tools';

function findRelatedInfo(toolContext: ToolContext, topic: string): Record<string, any> {
  try {
    // ToolContext has a dedicated searchMemory method
    const searchResults = toolContext.searchMemory(`Information about ${topic}`);
    
    if (searchResults) {
      // Process the search results
      // searchResults is of type SearchMemoryResponse, which includes a list of results
      return { 
        found: true,
        memoryResults: searchResults 
      };
    } else {
      return { message: "No relevant memories found." };
    }
  } catch (e) {
    if (e instanceof Error) {
      return { error: `Memory service error: ${e.message}` }; // e.g., Service not configured
    }
    return { error: "Unexpected error searching memory" };
  }
}
```

### Advanced: Direct `InvocationContext` Usage

While most interactions happen via specialized contexts, sometimes the agent's core logic (`runAsyncImpl`/`runLiveImpl`) needs direct access.

```typescript
// Example: Inside agent's runAsyncImpl
import { InvocationContext, BaseAgent } from '../agents';
import { Event } from '../events/Event';

class MyControllingAgent extends BaseAgent {
  async *runAsyncImpl(ctx: InvocationContext): AsyncGenerator<Event> {
    // Example: Check if a specific service is available
    if (!ctx.memoryService) {
      console.log("Memory service is not available for this invocation.");
      // Potentially change agent behavior
    }

    // Example: Early termination based on some condition
    if (ctx.session.state.get("criticalErrorFlag")) {
      console.log("Critical error detected, ending invocation.");
      ctx.endInvocation = true; // Signal framework to stop processing
      yield new Event({
        author: this.name,
        invocationId: ctx.invocationId,
        content: { parts: [{ text: "Stopping due to critical error." }] }
      });
      return; // Stop this agent's execution
    }

    // ... Normal agent processing ...
    yield new Event({ /* event details */ });
  }
}
```

Setting `ctx.endInvocation = true` is a way to gracefully stop the entire request-response cycle from within the agent or its callbacks/tools.

## Key Takeaways & Best Practices

*   **Use the Right Context:** Always use the most specific context object provided (`ToolContext` in tools/tool-callbacks, `CallbackContext` in agent/model-callbacks, `ReadonlyContext` where applicable). Use the full `InvocationContext` (`ctx`) directly in `runAsyncImpl` / `runLiveImpl` only when necessary.
*   **State for Data Flow:** Session state is the primary way to share data, remember preferences, and manage conversational memory *within* an invocation. Use prefixes (`app:`, `user:`, `temp:`) thoughtfully when using persistent storage.
*   **Artifacts for Files:** Use `saveArtifact` and `loadArtifact` for managing file references (like paths or URIs) or larger data blobs. Store references, load content on demand.
*   **Tracked Changes:** Modifications to state or artifacts are automatically managed by the framework.
*   **Start Simple:** Focus on `state` and basic artifact usage first. Explore authentication, memory, and advanced `InvocationContext` fields (like those for live streaming) as your needs become more complex. When building more sophisticated agents, gradually incorporate additional context capabilities as your understanding of the framework deepens.

By understanding and effectively using these context objects, you can build more sophisticated, stateful, and capable agents with the TypeScript ADK.
