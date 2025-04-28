# Memory: Long-Term Knowledge with `MemoryService`

We've seen how `Session` tracks the history (`events`) and temporary data (`state`) for a *single, ongoing conversation*. But what if an agent needs to recall information from *past* conversations or access external knowledge bases? This is where the concept of **Long-Term Knowledge** and the **`MemoryService`** come into play.

Think of it this way:

* **`Session` / `State`:** Like your short-term memory during one specific chat.  
* **Long-Term Knowledge (`MemoryService`)**: Like a searchable archive or knowledge library the agent can consult, potentially containing information from many past chats or other sources.

## The `MemoryService` Role

The `BaseMemoryService` defines the interface for managing this searchable, long-term knowledge store. Its primary responsibilities are:

1. **Ingesting Information (`addSessionToMemory`):** Taking the contents of a (usually completed) `Session` and adding relevant information to the long-term knowledge store.  
2. **Searching Information (`searchMemory`):** Allowing an agent (typically via a `Tool`) to query the knowledge store and retrieve relevant snippets or context based on a search query.
3. **Key-Value Store (`store/retrieve/delete`):** Providing simple persistent storage for arbitrary data associated with app/user pairs.

## `MemoryService` Implementations

ADK provides different ways to implement this long-term knowledge store:

1. **`InMemoryMemoryService`**  

    * **How it works:** Stores session information in the application's memory and performs basic keyword matching for searches.  
    * **Persistence:** None. **All stored knowledge is lost if the application restarts.**  
    * **Requires:** Nothing extra.  
    * **Best for:** Prototyping, simple testing, scenarios where only basic keyword recall is needed and persistence isn't required.

    ```typescript
    import { InMemoryMemoryService } from './memory/InMemoryMemoryService';
    const memoryService = new InMemoryMemoryService();
    ```

2. **`VertexAiRagMemoryService`**  

    * **How it works:** Leverages Google Cloud's Vertex AI RAG (Retrieval-Augmented Generation) service. It ingests session data into a specified RAG Corpus and uses powerful semantic search capabilities for retrieval.  
    * **Persistence:** Yes. The knowledge is stored persistently within the configured Vertex AI RAG Corpus.  
    * **Requires:** A Google Cloud project, appropriate permissions, necessary SDKs, and a pre-configured Vertex AI RAG Corpus resource name/ID.  
    * **Best for:** Production applications needing scalable, persistent, and semantically relevant knowledge retrieval, especially when deployed on Google Cloud.

    ```typescript
    import { VertexAiRagMemoryService } from './memory/VertexAiRagMemoryService';

    // Configure the RAG memory service
    const memoryService = new VertexAiRagMemoryService({
      project: "your-gcp-project-id",
      location: "us-central1",
      ragCorpus: "your-rag-corpus-id",
      // Optional parameters
      similarityTopK: 5, // Limit search results to top 5 matches
      vectorDistanceThreshold: 0.8 // Only return results with similarity above this threshold
    });
    ```

    Note: To use this service, you'll need to install the required dependencies:

    ```bash
    npm install @google-cloud/vertexai google-auth-library axios form-data
    ```

    This implementation uses the Vertex AI RAG API to store conversation content in a RAG corpus and perform semantic searches. The RAG corpus must be pre-created in your Google Cloud project.

## How Memory Works in Practice

The typical workflow involves these steps:

1. **Session Interaction:** A user interacts with an agent via a `Session`, managed by a `SessionService`. Events are added, and state might be updated.  
2. **Ingestion into Memory:** At some point (often when a session is considered complete or has yielded significant information), your application calls `memoryService.addSessionToMemory(session)`. This extracts relevant information from the session's events and adds it to the long-term knowledge store (in-memory dictionary or RAG Corpus).  
3. **Later Query:** In a *different* (or the same) session, the user might ask a question requiring past context (e.g., "What did we discuss about project X last week?").  
4. **Agent Uses Memory Tool:** An agent equipped with a memory-retrieval tool (like the built-in `loadMemory` tool) recognizes the need for past context. It calls the tool, providing a search query (e.g., "discussion project X last week").  
5. **Search Execution:** The tool internally calls `memoryService.searchMemory(appName, userId, query)`.  
6. **Results Returned:** The `MemoryService` searches its store (using keyword matching or semantic search) and returns relevant snippets as a `SearchMemoryResponse` containing a list of `MemoryResult` objects (each potentially holding events from a relevant past session).  
7. **Agent Uses Results:** The tool returns these results to the agent, usually as part of the context or function response. The agent can then use this retrieved information to formulate its final answer to the user.

## Example: Adding and Searching Memory

This example demonstrates the basic flow using the `InMemory` services for simplicity.

```typescript
import { InMemorySessionService } from './sessions/inMemorySessionService';
import { InMemoryMemoryService } from './memory/InMemoryMemoryService';
import { Session } from './sessions/interfaces';
import { Content, Part } from './sessions/types';
import { loadMemoryTool } from './tools/LoadMemoryTool';
import { Runner } from './runners/runner';
import { LlmAgent } from './agents/LlmAgent';

// --- Constants ---
const APP_NAME = "memory_example_app";
const USER_ID = "mem_user";
const MODEL = "gemini-pro"; // Use an appropriate model

// --- Initialize Services ---
const sessionService = new InMemorySessionService();
const memoryService = new InMemoryMemoryService();

// --- Agent 1: Simple agent to capture information ---
const infoCaptureAgent = new LlmAgent({
  model: MODEL,
  name: "InfoCaptureAgent",
  instruction: "Acknowledge the user's statement."
});

// --- Agent 2: Agent that can use memory ---
const memoryRecallAgent = new LlmAgent({
  model: MODEL,
  name: "MemoryRecallAgent",
  instruction: "Answer the user's question. Use the 'load_memory' tool if the answer might be in past conversations.",
  tools: [loadMemoryTool] // Give the agent the ability to load memory
});

// --- Create a runner ---
const runner = new Runner({
  agent: infoCaptureAgent, // Start with info capture agent
  appName: APP_NAME,
  sessionService: sessionService,
  memoryService: memoryService // Provide memory service to the runner
});

// --- SCENARIO: First capture information, then recall it ---

async function runScenario() {
  // --- Turn 1: Capture some information in a session ---
  console.log("--- Turn 1: Capturing Information ---");
  const SESSION1_ID = "session_info";
  
  // Create session and prepare user message
  const session1 = sessionService.createSession({
    appName: APP_NAME, 
    userId: USER_ID, 
    sessionId: SESSION1_ID
  });
  
  // User's message
  const userMessage1: Content = {
    role: "user",
    parts: [{ text: "My favorite project is Project Alpha." }]
  };

  // Process the user message with the info capture agent
  let finalResponseText1 = "";
  for await (const event of runner.run({
    userId: USER_ID,
    sessionId: SESSION1_ID,
    message: userMessage1
  })) {
    if (event.turnComplete && event.content && event.content.parts && event.content.parts.length > 0) {
      finalResponseText1 = event.content.parts[0].text || "";
    }
  }
  console.log(`Agent 1 Response: ${finalResponseText1}`);

  // Get the completed session
  const completedSession1 = sessionService.getSession({
    appName: APP_NAME,
    userId: USER_ID,
    sessionId: SESSION1_ID
  });

  // Add session to memory
  console.log("\n--- Adding Session 1 to Memory ---");
  if (completedSession1) {
    await memoryService.addSessionToMemory(completedSession1);
    console.log("Session added to memory.");
  }

  // --- Turn 2: In a new session, ask a question requiring memory ---
  console.log("\n--- Turn 2: Recalling Information ---");
  const SESSION2_ID = "session_recall";
  
  // Create a new session
  const session2 = sessionService.createSession({
    appName: APP_NAME,
    userId: USER_ID,
    sessionId: SESSION2_ID
  });

  // Update runner to use the memory recall agent
  runner.agent = memoryRecallAgent;
  
  // User's question
  const userMessage2: Content = {
    role: "user",
    parts: [{ text: "What is my favorite project?" }]
  };

  // Process the user question with the memory recall agent
  console.log("Running MemoryRecallAgent...");
  let finalResponseText2 = "";
  
  for await (const event of runner.run({
    userId: USER_ID,
    sessionId: SESSION2_ID,
    message: userMessage2
  })) {
    // Log the event type
    console.log(`  Event: ${event.author} - ${
      event.content && event.content.parts && event.content.parts[0].text ? 'Text' : 
      event.actions?.functionCalls ? 'FuncCall' : 
      event.actions?.functionResponses ? 'FuncResp' : 'Other'
    }`);
    
    // If this is the final response, capture it
    if (event.turnComplete && event.content && event.content.parts && event.content.parts.length > 0) {
      finalResponseText2 = event.content.parts[0].text || "";
      console.log(`Agent 2 Final Response: ${finalResponseText2}`);
    }
  }
}

// Run the scenario
runScenario().catch(console.error);

/**
 * Expected Event Sequence for Turn 2:
 * 1. User sends "What is my favorite project?"
 * 2. Agent (LLM) decides to call `load_memory` tool with a query like "favorite project".
 * 3. Runner executes the `load_memory` tool, which calls `memoryService.searchMemory`.
 * 4. `InMemoryMemoryService` finds the relevant text ("My favorite project is Project Alpha.") from session1.
 * 5. Tool returns this text in a function response event.
 * 6. Agent (LLM) receives the function response, processes the retrieved text.
 * 7. Agent generates the final answer (e.g., "Your favorite project is Project Alpha.").
 */
```

## Memory Service Interface

In TypeScript, the `BaseMemoryService` interface is defined as:

```typescript
export interface BaseMemoryService {
  /**
   * Adds a session to the memory service.
   * @param session The session to add
   */
  addSessionToMemory(session: Session): Promise<void>;

  /**
   * Searches for memories that match the query.
   * @param appName The application name
   * @param userId The user ID
   * @param query The query to search for
   */
  searchMemory(appName: string, userId: string, query: string): Promise<SearchMemoryResponse>;

  /**
   * Stores a key-value pair.
   * @param appName The application name
   * @param userId The user ID
   * @param key The key
   * @param value The value
   */
  store(appName: string, userId: string, key: string, value: any): Promise<void>;

  /**
   * Retrieves a value by key.
   * @param appName The application name
   * @param userId The user ID
   * @param key The key
   */
  retrieve(appName: string, userId: string, key: string): Promise<any | undefined>;

  /**
   * Deletes a key-value pair.
   * @param appName The application name
   * @param userId The user ID
   * @param key The key
   */
  delete(appName: string, userId: string, key: string): Promise<void>;
}
```

All memory service implementations in the ADK follow this interface, ensuring a consistent API regardless of the backend technology.
