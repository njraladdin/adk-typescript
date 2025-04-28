# State: The Session's Scratchpad

Within each `Session` (our conversation thread), the **`state`** attribute acts like the agent's dedicated scratchpad for that specific interaction. While `session.events` holds the full history, `session.state` is where the agent stores and updates dynamic details needed *during* the conversation.

## What is `session.state`?

Conceptually, `session.state` is a record holding key-value pairs. It's designed for information the agent needs to recall or track to make the current conversation effective:

* **Personalize Interaction:** Remember user preferences mentioned earlier (e.g., `'user_preference_theme': 'dark'`).  
* **Track Task Progress:** Keep tabs on steps in a multi-turn process (e.g., `'booking_step': 'confirm_payment'`).  
* **Accumulate Information:** Build lists or summaries (e.g., `'shopping_cart_items': ['book', 'pen']`).  
* **Make Informed Decisions:** Store flags or values influencing the next response (e.g., `'user_is_authenticated': true`).

### Key Characteristics of `State`

1. **Structure: Serializable Key-Value Pairs**  

    * Data is stored as `key: value`.  
    * **Keys:** Always strings (`string`). Use clear names (e.g., `'departure_city'`, `'user:language_preference'`).  
    * **Values:** Must be **serializable**. This means they can be easily saved and loaded by the `SessionService`. Stick to basic TypeScript types like strings, numbers, booleans, and simple arrays or objects containing *only* these basic types. (See API documentation for precise details).  
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
    * **Example:** `session.state['current_intent'] = 'book_flight'`

* **`user:` Prefix (User State):**  

    * **Scope:** Tied to the `userId`, shared across *all* sessions for that user (within the same `appName`).  
    * **Persistence:** Persistent with persistent service implementations. (Stored by `InMemory` but lost on restart).  
    * **Use Cases:** User preferences (e.g., `'user:theme'`), profile details (e.g., `'user:name'`).  
    * **Example:** `session.state['user:preferred_language'] = 'fr'`

* **`app:` Prefix (App State):**  

    * **Scope:** Tied to the `appName`, shared across *all* users and sessions for that application.  
    * **Persistence:** Persistent with persistent service implementations. (Stored by `InMemory` but lost on restart).  
    * **Use Cases:** Global settings (e.g., `'app:api_endpoint'`), shared templates.  
    * **Example:** `session.state['app:global_discount_code'] = 'SAVE10'`

* **`temp:` Prefix (Temporary Session State):**  

    * **Scope:** Specific to the *current* session processing turn.  
    * **Persistence:** **Never Persistent.** Guaranteed to be discarded, even with persistent services.  
    * **Use Cases:** Intermediate results needed only immediately, data you explicitly don't want stored.  
    * **Example:** `session.state['temp:raw_api_response'] = {...}`

**How the Agent Sees It:** Your agent code interacts with the *combined* state through the single `session.state` record. The `SessionService` handles fetching/merging state from the correct underlying storage based on prefixes.

### How State is Updated: Recommended Methods

State should **always** be updated as part of adding an `Event` to the session history using `sessionService.appendEvent()`. This ensures changes are tracked, persistence works correctly, and updates are thread-safe.

**The Standard Way: `EventActions.stateDelta` for State Updates**

For updating state, you should construct the `stateDelta` within `EventActions` when creating an event:

```typescript
import { Event, EventActions } from './sessions/interfaces';
import { Content, Part } from './sessions/types';
import { InMemorySessionService } from './sessions/inMemorySessionService';
import { StatePrefix } from './sessions/state';

// --- Setup ---
const sessionService = new InMemorySessionService();
const appName = 'state_app_manual';
const userId = 'user2';
const sessionId = 'session2';

// Create a session with initial state
const session = sessionService.createSession({
  appName,
  userId,
  sessionId,
  state: { 'user:login_count': 0, 'task_status': 'idle' }
});
console.log(`Initial state: ${JSON.stringify(session.state)}`);

// --- Define State Changes ---
const currentTime = Date.now();
const stateChanges: Record<string, any> = {
  'task_status': 'active',              // Update session state
  'user:login_count': (session.state['user:login_count'] || 0) + 1, // Update user state
  'user:last_login_ts': currentTime,    // Add user state
  'temp:validation_needed': true        // Add temporary state (will be discarded)
};

// --- Create Event with Actions ---
const actionsWithUpdate: EventActions = { stateDelta: stateChanges };
// This event might represent an internal system action, not just an agent response
const systemEvent: Event = {
  invocationId: 'inv_login_update',
  author: 'system', // Or 'agent', 'tool' etc.
  actions: actionsWithUpdate,
  timestamp: currentTime,
  content: {
    role: 'system',
    parts: [{ text: 'System login update processed' }]
  }
};

// --- Append the Event (This updates the state) ---
sessionService.appendEvent({ session, event: systemEvent });
console.log('`appendEvent` called with explicit state delta.');

// --- Check Updated State ---
const updatedSession = sessionService.getSession({
  appName,
  userId,
  sessionId
});
console.log(`State after event: ${JSON.stringify(updatedSession?.state)}`);
// Expected: {'user:login_count': 1, 'task_status': 'active', 'user:last_login_ts': <timestamp>}
// Note: 'temp:validation_needed' is NOT present in persistent storage.
```

**What `appendEvent` Does:**

* Adds the `Event` to `session.events`.  
* Reads the `stateDelta` from the event's `actions`.  
* Applies these changes to the state managed by the `SessionService`, correctly handling prefixes and persistence based on the service type.  
* Updates the session's `lastUpdateTime`.  
* Ensures thread-safety for concurrent updates.

### ⚠️ A Warning About Direct State Modification

Avoid directly modifying the `session.state` object after retrieving a session (e.g., `retrievedSession.state['key'] = value`).

**Why this is strongly discouraged:**

1. **Bypasses Event History:** The change isn't recorded as an `Event`, losing auditability.  
2. **Breaks Persistence:** Changes made this way **will likely NOT be saved** by persistent implementations of `SessionService`. They rely on `appendEvent` to trigger saving.  
3. **Not Thread-Safe:** Can lead to race conditions and lost updates.  
4. **Ignores Timestamps/Logic:** Doesn't update `lastUpdateTime` or trigger related event logic.

**Recommendation:** Stick to updating state via `EventActions.stateDelta` within the `appendEvent` flow for reliable, trackable, and persistent state management. Use direct access only for *reading* state.

### Best Practices for State Design Recap

* **Minimalism:** Store only essential, dynamic data.  
* **Serialization:** Use basic, serializable types.  
* **Descriptive Keys & Prefixes:** Use clear names and appropriate prefixes (`user:`, `app:`, `temp:`, or none).  
* **Shallow Structures:** Avoid deep nesting where possible.  
* **Standard Update Flow:** Rely on `appendEvent`.

### Access Constants for Prefixes

TypeScript provides constants for the standard prefixes in the `StatePrefix` class:

```typescript
import { StatePrefix } from './sessions/state';

// Use constants for prefixes
const appSettings = `${StatePrefix.APP_PREFIX}feature_flags`;
const userPreference = `${StatePrefix.USER_PREFIX}theme`;
const tempData = `${StatePrefix.TEMP_PREFIX}calculation_result`;
```

This helps avoid typos and ensures consistent prefix usage throughout your application.
