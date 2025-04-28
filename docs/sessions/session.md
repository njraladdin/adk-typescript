# Session: Tracking Individual Conversations

Following our Introduction, let's dive into the `Session`. Think back to the idea of a "conversation thread." Just like you wouldn't start every text message from scratch, agents need context from the ongoing interaction. **`Session`** is the ADK object designed specifically to track and manage these individual conversation threads.

## The `Session` Object

When a user starts interacting with your agent, the `SessionService` creates a `Session` object. This object acts as the container holding everything related to that *one specific chat thread*. Here are its key properties:

* **Identification (`id`, `appName`, `userId`):** Unique labels for the conversation.  
    * `id`: A unique identifier for *this specific* conversation thread, essential for retrieving it later.  
    * `appName`: Identifies which agent application this conversation belongs to.  
    * `userId`: Links the conversation to a particular user.  
* **History (`events`):** A chronological sequence of all interactions (`Event` objects – user messages, agent responses, tool actions) that have occurred within this specific thread.  
* **Session Data (`state`):** A place to store temporary data relevant *only* to this specific, ongoing conversation. This acts as a scratchpad for the agent during the interaction. We will cover how to use and manage `state` in detail in the next section.  
* **Activity Tracking (`lastUpdateTime`):** A timestamp indicating the last time an event was added to this conversation thread.

### Example: Examining Session Properties

```typescript
import { InMemorySessionService } from './sessions/inMemorySessionService';
import { Session } from './sessions/interfaces';

// Create a simple session to examine its properties
const tempService = new InMemorySessionService();
const exampleSession: Session = tempService.createSession({
    appName: "my_app",
    userId: "example_user",
    state: {"initial_key": "initial_value"} // State can be initialized
});

console.log("--- Examining Session Properties ---");
console.log(`ID (id):                ${exampleSession.id}`);
console.log(`Application Name (appName): ${exampleSession.appName}`);
console.log(`User ID (userId):         ${exampleSession.userId}`);
console.log(`State (state):           ${JSON.stringify(exampleSession.state)}`); // Note: Only shows initial state here
console.log(`Events (events):         ${exampleSession.events.length}`); // Initially empty
console.log("---------------------------------");

// Clean up (optional for this example)
tempService.deleteSession({
    appName: exampleSession.appName,
    userId: exampleSession.userId,
    sessionId: exampleSession.id
});
```

*(**Note:** The state shown above is only the initial state. State updates happen via events, as discussed in the State section.)*

## Managing Sessions with a `SessionService`

You don't typically create or manage `Session` objects directly. Instead, you use a **`SessionService`**. This service acts as the central manager responsible for the entire lifecycle of your conversation sessions.

Its core responsibilities include:

* **Starting New Conversations:** Creating fresh `Session` objects when a user begins an interaction.  
* **Resuming Existing Conversations:** Retrieving a specific `Session` (using its ID) so the agent can continue where it left off.  
* **Saving Progress:** Appending new interactions (`Event` objects) to a session's history. This is also the mechanism through which session `state` gets updated (more in the State section).  
* **Listing Conversations:** Finding the active session threads for a particular user and application.  
* **Cleaning Up:** Deleting `Session` objects and their associated data when conversations are finished or no longer needed.

## `SessionService` Implementations

ADK provides different `SessionService` implementations, allowing you to choose the storage backend that best suits your needs:

1. **`InMemorySessionService`**  

    * **How it works:** Stores all session data directly in the application's memory.  
    * **Persistence:** None. **All conversation data is lost if the application restarts.**  
    * **Requires:** Nothing extra.  
    * **Best for:** Quick tests, local development, examples, and scenarios where long-term persistence isn't required.

    ```typescript
    import { InMemorySessionService } from './sessions/inMemorySessionService';
    const sessionService = new InMemorySessionService();
    ```

2. **`DatabaseSessionService`**  

    * **How it works:** Connects to a relational database (e.g., SQLite) to store session data persistently in tables.  
    * **Persistence:** Yes. Data survives application restarts.  
    * **Requires:** A configured database connection URL and TypeORM dependencies.  
    * **Best for:** Applications needing reliable, persistent storage that you manage yourself.

    ```typescript
    import { DatabaseSessionService } from './sessions/databaseSessionService';
    
    // Example using a local SQLite file:
    const dbUrl = "sqlite:///./my_agent_data.db";
    const sessionService = new DatabaseSessionService(dbUrl);
    ```

3. **`VertexAiSessionService`**  

    * **How it works:** Uses Google Cloud's Vertex AI infrastructure via API calls for session management.  
    * **Persistence:** Yes. Data is managed reliably and scalably by Google Cloud.  
    * **Requires:** A Google Cloud project, appropriate permissions, necessary SDKs, and the Reasoning Engine resource name/ID.  
    * **Best for:** Scalable production applications deployed on Google Cloud, especially when integrating with other Vertex AI features.

    ```typescript
    import { VertexAiSessionService } from './sessions/vertexAiSessionService';

    const PROJECT_ID = "your-gcp-project-id";
    const LOCATION = "us-central1";
    // The appName used with this service should be the Reasoning Engine ID or name
    const REASONING_ENGINE_APP_NAME = "projects/your-gcp-project-id/locations/us-central1/reasoningEngines/your-engine-id";

    const sessionService = new VertexAiSessionService({
      project: PROJECT_ID,
      location: LOCATION
    });
    // Use REASONING_ENGINE_APP_NAME when calling service methods, e.g.:
    // sessionService.createSession({ appName: REASONING_ENGINE_APP_NAME, ... })
    ```

Choosing the right `SessionService` is key to defining how your agent's conversation history and temporary data are stored and persist.

## The Session Lifecycle

<img src="../../assets/session_lifecycle.png" alt="Session lifecycle">

Here's a simplified flow of how `Session` and `SessionService` work together during a conversation turn:

1. **Start or Resume:** A user sends a message. Your application's `Runner` uses the `SessionService` to either `createSession` (for a new chat) or `getSession` (to retrieve an existing one).  
2. **Context Provided:** The `Runner` gets the appropriate `Session` object from the service, providing the agent with access to its `state` and `events`.  
3. **Agent Processing:** The agent uses the current user message, its instructions, and potentially the session `state` and `events` history to decide on a response.  
4. **Response & State Update:** The agent generates a response (and potentially flags data to be updated in the `state`). The `Runner` packages this as an `Event`.  
5. **Save Interaction:** The `Runner` calls `sessionService.appendEvent(...)` with the `Session` and the new `Event`. The service adds the `Event` to the history and updates the session's `state` in storage based on information within the event.
6. **Ready for Next:** The agent's response goes to the user. The updated `Session` is now stored by the `SessionService`, ready for the next turn (which restarts the cycle at step 1, usually with `getSession`).  
7. **End Conversation:** When the conversation is over, ideally your application calls `sessionService.deleteSession(...)` to clean up the stored session data.

This cycle highlights how the `SessionService` ensures conversational continuity by managing the history and state associated with each `Session` object.

## Session Interface

In TypeScript, the Session is defined by the following interface:

```typescript
interface Session {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, any>;
  events: Event[];
}
```

All `SessionService` implementations in the ADK work with this common interface, ensuring consistency across different storage backends.
