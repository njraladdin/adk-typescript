# State: The Session's Scratchpad

Within each `Session` (our conversation thread), the **`state`** attribute acts like the agent's dedicated scratchpad for that specific interaction. While `session.events` holds the full history, `session.state` is where the agent stores and updates dynamic details needed *during* the conversation.

## What is `session.state`?

Conceptually, `session.state` is an instance of the `State` class which behaves like a record holding key-value pairs. It's designed for information the agent needs to recall or track to make the current conversation effective:

* **Personalize Interaction:** Remember user preferences mentioned earlier (e.g., `'user_preference_theme': 'dark'`).  
* **Track Task Progress:** Keep tabs on steps in a multi-turn process (e.g., `'booking_step': 'confirm_payment'`).  
* **Accumulate Information:** Build lists or summaries (e.g., `'shopping_cart_items': ['book', 'pen']`).  
* **Make Informed Decisions:** Store flags or values influencing the next response (e.g., `'user_is_authenticated': true`).

### Key Characteristics of `State`

1. **Structure: Serializable Key-Value Pairs**  

    * Data is stored as `key: value`.  
    * **Keys:** Always strings (`string`). Use clear names (e.g., `'departure_city'`, `'user:language_preference'`).  
    * **Values:** Must be **serializable**. This means they can be easily saved and loaded by the `SessionService`. Stick to basic TypeScript types like strings, numbers, booleans, and simple arrays or objects containing *only* these basic types.
    * **⚠️ Avoid Complex Objects:** **Do not store non-serializable objects** (custom class instances, functions, connections, etc.) directly in the state. Store simple identifiers if needed, and retrieve the complex object elsewhere.

2. **Mutability: It Changes**  

    * The contents of the `state` are expected to change as the conversation evolves.

3. **Persistence: Depends on `SessionService`**  

    * Whether state survives application restarts depends on your chosen service:  
      * `InMemorySessionService`: **Not Persistent.** State is lost on restart.  
      * `DatabaseSessionService` / `VertexAiSessionService`: **Persistent.** State is saved reliably.

### Organizing State with Prefixes: Scope Matters

Prefixes on state keys define their scope and persistence behavior, especially with persistent services:

* **No Prefix (Session State):**  

    * **Scope:** Specific to the *current* session (`id`).  
    * **Persistence:** Only persists if the `SessionService` is persistent (`Database`, `VertexAI`).  
    * **Use Cases:** Tracking progress within the current task (e.g., `'current_booking_step'`), temporary flags for this interaction (e.g., `'needs_clarification'`).  
    * **Example:** `session.state['current_intent'] = 'book_flight'` or `session.state.set('current_intent', 'book_flight')`

* **`user:` Prefix (User State):**  

    * **Scope:** Tied to the `userId`, shared across *all* sessions for that user (within the same `appName`).  
    * **Persistence:** Persistent with persistent service implementations. (Stored by `InMemory` but lost on restart).  
    * **Use Cases:** User preferences (e.g., `'user:theme'`), profile details (e.g., `'user:name'`).  
    * **Example:** `session.state['user:preferred_language'] = 'fr'` or `session.state.set('user:preferred_language', 'fr')`

* **`app:` Prefix (App State):**  

    * **Scope:** Tied to the `appName`, shared across *all* users and sessions for that application.  
    * **Persistence:** Persistent with persistent service implementations. (Stored by `InMemory` but lost on restart).  
    * **Use Cases:** Global settings (e.g., `'app:api_endpoint'`), shared templates.  
    * **Example:** `session.state['app:global_discount_code'] = 'SAVE10'` or `session.state.set('app:global_discount_code', 'SAVE10')`

* **`temp:` Prefix (Temporary Session State):**  

    * **Scope:** Specific to the *current* session processing turn.  
    * **Persistence:** **Never Persistent.** Guaranteed to be discarded, even with persistent services.  
    * **Use Cases:** Intermediate results needed only immediately, data you explicitly don't want stored.  
    * **Example:** `session.state['temp:raw_api_response'] = {...}` or `session.state.set('temp:raw_api_response', {...})`

**How the Agent Sees It:** Your agent code interacts with the *combined* state through the single `session.state` object. The `SessionService` handles fetching/merging state from the correct underlying storage based on prefixes.

### Accessing State Data

The `State` class provides multiple ways to access and modify state data:

1. **Direct Property Access:**
   ```typescript
   // Get a value
   const theme = session.state['user:theme'];
   
   // Set a value
   session.state['current_step'] = 'confirmation';
   ```

2. **Method-based Access:**
   ```typescript
   // Get a value
   const theme = session.state.get('user:theme');
   
   // Set a value
   session.state.set('current_step', 'confirmation');
   
   // Check if a key exists
   if (session.state.has('user:preferences')) {
     // Do something with the preferences
   }
   
   // Delete a key
   session.state.delete('temp:calculation_result');
   
   // Get all state as a plain object
   const allState = session.state.getAll();
   
   // Update multiple values at once
   session.state.update({
     'step': 'payment',
     'user:last_action': 'checkout',
     'temp:validation_results': { valid: true }
   });
   ```

The method-based approach is more explicit and provides additional functionality like `has()`, `delete()`, and `update()`.

### How State is Updated: Recommended Methods

State should **always** be updated as part of adding an `Event` to the session history using `sessionService.appendEvent()`. This ensures changes are tracked, persistence works correctly, and updates are thread-safe.

**1. The Easy Way: `outputKey` (for Agent Text Responses)**

This is the simplest method for saving an agent's final text response directly into the state. When defining your `LlmAgent`, specify the `outputKey`:

```typescript
import { LlmAgent } from 'adk-typescript/agents';
import { InMemorySessionService } from 'adk-typescript/sessions';
import { Runner } from 'adk-typescript/runners';
import { Content, Part } from 'adk-typescript/models';

// Define agent with outputKey
const greetingAgent = new LlmAgent({
  name: "Greeter",
  model: "gemini-2.0-flash", // Use a valid model
  instruction: "Generate a short, friendly greeting.",
  outputKey: "last_greeting" // Save response to state['last_greeting']
});

// --- Setup Runner and Session ---
const appName = "state_app";
const userId = "user1";
const sessionId = "session1";
const sessionService = new InMemorySessionService();
const runner = new Runner({
  agent: greetingAgent,
  appName: appName,
  sessionService: sessionService
});

const session = await sessionService.createSession({
  appName: appName,
  userId: userId,
  sessionId: sessionId
});
console.log(`Initial state: ${JSON.stringify(session.state.getAll())}`);

// --- Run the Agent ---
// Runner handles calling appendEvent, which uses the outputKey
// to automatically create the stateDelta.
const userMessage = new Content({
  role: 'user',
  parts: [new Part({ text: "Hello" })]
});

for await (const event of runner.run({
  userId: userId,
  sessionId: sessionId,
  newMessage: userMessage
})) {
  if (event.isFinalResponse()) {
    console.log("Agent responded."); // Response text is also in event.content
  }
}

// --- Check Updated State ---
const updatedSession = await sessionService.getSession({
  appName: appName,
  userId: userId,
  sessionId: sessionId
});
console.log(`State after agent run: ${JSON.stringify(updatedSession?.state.getAll())}`);
// Expected output might include: {'last_greeting': 'Hello there! How can I help you today?'}
```

Behind the scenes, the `Runner` uses the `outputKey` to create the necessary `EventActions` with a `stateDelta` and calls `appendEvent`.

**2. The Standard Way: `EventActions.stateDelta` (for Complex Updates)**

For more complex scenarios (updating multiple keys, non-string values, specific scopes like `user:` or `app:`, or updates not tied directly to the agent's final text), you manually construct the `stateDelta` within `EventActions`.

```typescript
import { Event, EventActions } from 'adk-typescript/events';
import { InMemorySessionService } from 'adk-typescript/sessions';
import { StatePrefix } from 'adk-typescript/sessions';

// --- Setup ---
const sessionService = new InMemorySessionService();
const appName = "state_app_manual";
const userId = "user2";
const sessionId = "session2";

// Create a session with initial state
const session = await sessionService.createSession({
  appName,
  userId,
  sessionId,
  state: { 'user:login_count': 0, 'task_status': 'idle' }
});
console.log(`Initial state: ${JSON.stringify(session.state.getAll())}`);

// --- Define State Changes ---
const currentTime = Date.now() / 1000; // Convert to seconds for timestamp consistency
const stateChanges: Record<string, any> = {
  'task_status': 'active',              // Update session state
  'user:login_count': (session.state.get('user:login_count') || 0) + 1, // Update user state
  'user:last_login_ts': currentTime,    // Add user state
  'temp:validation_needed': true        // Add temporary state (will be discarded)
};

// --- Create Event with Actions ---
const actionsWithUpdate = new EventActions({ stateDelta: stateChanges });
// This event might represent an internal system action, not just an agent response
const systemEvent = new Event({
  invocationId: 'inv_login_update',
  author: 'system', // Or 'agent', 'tool' etc.
  actions: actionsWithUpdate,
  timestamp: currentTime,
  content: {
    role: 'system',
    parts: [{ text: 'System login update processed' }]
  }
});

// --- Append the Event (This updates the state) ---
await sessionService.appendEvent({ session, event: systemEvent });
console.log('`appendEvent` called with explicit state delta.');

// --- Check Updated State ---
const updatedSession = await sessionService.getSession({
  appName,
  userId,
  sessionId
});
console.log(`State after event: ${JSON.stringify(updatedSession?.state.getAll())}`);
// Expected: {'user:login_count': 1, 'task_status': 'active', 'user:last_login_ts': <timestamp>}
// Note: 'temp:validation_needed' is NOT present in persistent storage.
```

**3. Via `CallbackContext` or `ToolContext` (Recommended for Callbacks and Tools)**

Modifying state within agent callbacks (e.g., `beforeModelCallback`, `afterModelCallback`) or tool functions is best done using the `state` attribute of the `CallbackContext` or `ToolContext` provided to your function.

*   `callbackContext.state.set('my_key', my_value)`
*   `toolContext.state.set('my_key', my_value)`

These context objects are specifically designed to manage state changes within their respective execution scopes. When you modify `context.state`, the ADK framework ensures that these changes are automatically captured and correctly routed into the `EventActions.stateDelta` for the event being generated by the callback or tool. This delta is then processed by the `SessionService` when the event is appended, ensuring proper persistence and tracking.

This method abstracts away the manual creation of `EventActions` and `stateDelta` for most common state update scenarios within callbacks and tools, making your code cleaner and less error-prone.

For more comprehensive details on context objects, refer to the [Context documentation](../context/index.md).

```typescript
// In an agent callback or tool function
import { CallbackContext } from 'adk-typescript/agents'; // or ToolContext from 'adk-typescript/tools'

function myCallbackOrToolFunction(
  context: CallbackContext, // Or ToolContext
  // ... other parameters ...
): void {
  // Update existing state
  const count = context.state.get("user_action_count", 0);
  context.state.set("user_action_count", count + 1);

  // Add new state
  context.state.set("temp:last_operation_status", "success");

  // State changes are automatically part of the event's stateDelta
  // ... rest of callback/tool logic ...
}
```

**What `appendEvent` Does:**

* Adds the `Event` to `session.events`.  
* Reads the `stateDelta` from the event's `actions`.  
* Applies these changes to the state managed by the `SessionService`, correctly handling prefixes and persistence based on the service type.  
* Updates the session's `lastUpdateTime`.  
* Ensures thread-safety for concurrent updates.

### ⚠️ A Warning About Direct State Modification

Avoid directly modifying the `session.state` object on a `Session` object that was obtained directly from the `SessionService` (e.g., via `sessionService.getSession()` or `sessionService.createSession()`) *outside* of the managed lifecycle of an agent invocation (i.e., not through a `CallbackContext` or `ToolContext`). For example, code like `retrievedSession = await sessionService.getSession(...); retrievedSession.state.set('key', value)` is problematic.

State modifications *within* callbacks or tools using `CallbackContext.state` or `ToolContext.state` are the correct way to ensure changes are tracked, as these context objects handle the necessary integration with the event system.

**Why direct modification (outside of contexts) is strongly discouraged:**

1. **Bypasses Event History:** The change isn't recorded as an `Event`, losing auditability.
2. **Breaks Persistence:** Changes made this way **will likely NOT be saved** by `DatabaseSessionService` or `VertexAiSessionService`. They rely on `appendEvent` to trigger saving.
3. **Not Thread-Safe:** Can lead to race conditions and lost updates.
4. **Ignores Timestamps/Logic:** Doesn't update `lastUpdateTime` or trigger related event logic.

**Recommendation:** Stick to updating state via `outputKey`, `EventActions.stateDelta` (when manually creating events), or by modifying the `state` property of `CallbackContext` or `ToolContext` objects when within their respective scopes. These methods ensure reliable, trackable, and persistent state management. Use direct access to `session.state` (from a `SessionService`-retrieved session) only for *reading* state.

### Best Practices for State Design Recap

* **Minimalism:** Store only essential, dynamic data.  
* **Serialization:** Use basic, serializable types.  
* **Descriptive Keys & Prefixes:** Use clear names and appropriate prefixes (`user:`, `app:`, `temp:`, or none).  
* **Shallow Structures:** Avoid deep nesting where possible.  
* **Standard Update Flow:** Rely on `appendEvent`.

### Access Constants for Prefixes

TypeScript provides constants for the standard prefixes in the `StatePrefix` class:

```typescript
import { StatePrefix } from 'adk-typescript/sessions';

// Use constants for prefixes
const appSettings = `${StatePrefix.APP_PREFIX}feature_flags`;
const userPreference = `${StatePrefix.USER_PREFIX}theme`;
const tempData = `${StatePrefix.TEMP_PREFIX}calculation_result`;
```

This helps avoid typos and ensures consistent prefix usage throughout your application.
