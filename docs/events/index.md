# Events:

Events are the fundamental units of information flow within the Agent Development Kit (ADK). They represent every significant occurrence during an agent's interaction lifecycle, from initial user input to the final response and all the steps in between. Understanding events is crucial because they are the primary way components communicate, state is managed, and control flow is directed.

## What Events Are and Why They Matter

An `Event` in ADK is an immutable record representing a specific point in the agent's execution. It captures user messages, agent replies, requests to use tools (function calls), tool results, state changes, control signals, and errors. Technically, it's an instance of the `Event` class from the events directory, which builds upon the basic `LlmResponse` structure by adding essential ADK-specific metadata and an `actions` payload.

```typescript
// Conceptual Structure of an Event
// import { LlmResponse } from '../models/LlmResponse';
// import { EventActions } from './EventActions';
// import { FunctionCall, FunctionResponse } from '../models/types';

// export class Event extends LlmResponse {
//     // --- LlmResponse fields ---
//     content?: any;
//     partial?: boolean;
//     turnComplete?: boolean;
//     errorCode?: string;
//     errorMessage?: string;
//     interrupted?: boolean;
//     customMetadata?: Record<string, any>;
//     // ... other response fields ...

//     // --- ADK specific additions ---
//     author: string;       // 'user' or agent name
//     invocationId: string; // ID for the whole interaction run
//     id: string;           // Unique ID for this specific event
//     timestamp: number;    // Creation time (seconds since epoch)
//     actions: EventActions; // Important for side-effects & control
//     longRunningToolIds?: Set<string>; // IDs of long-running tool calls
//     branch?: string;      // Hierarchy path
//     // ...
// }
```

Events are central to ADK's operation for several key reasons:

1.  **Communication:** They serve as the standard message format between the user interface, the `Runner`, agents, the LLM, and tools. Everything flows as an `Event`.
2.  **Signaling State & Artifact Changes:** Events carry instructions for state modifications via `event.actions.stateDelta` and track artifact updates via `event.actions.artifactDelta`. The `BaseSessionService` (and its implementations) use these signals to ensure persistence.
3.  **Control Flow:** Specific fields like `event.actions.transferToAgent` or `event.actions.escalate` act as signals that direct the framework, determining which agent runs next or if a loop should terminate.
4.  **History & Observability:** The sequence of events recorded in `session.events` provides a complete, chronological history of an interaction, invaluable for debugging, auditing, and understanding agent behavior step-by-step.

In essence, the entire process, from a user's query to the agent's final answer, is orchestrated through the generation, interpretation, and processing of `Event` objects.

## Understanding and Using Events

As a developer, you'll primarily interact with the stream of events yielded by the `Runner`. Here's how to understand and extract information from them:

### Identifying Event Origin and Type

Quickly determine what an event represents by checking:

*   **Who sent it? (`event.author`)**
    *   `'user'`: Indicates input directly from the end-user.
    *   `'AgentName'`: Indicates output or action from a specific agent (e.g., `'WeatherAgent'`, `'SummarizerAgent'`).
*   **What's the main payload? (`event.content` and `event.content.parts`)**
    *   **Text:** If `event.content.parts[0].text` exists, it's likely a conversational message.
    *   **Tool Call Request:** Check `event.getFunctionCalls()`. If not empty, the LLM is asking to execute one or more tools. Each item in the list has `.name` and `.args`.
    *   **Tool Result:** Check `event.getFunctionResponses()`. If not empty, this event carries the result(s) from tool execution(s). Each item has `.name` and `.response` (the object returned by the tool). *Note:* For history structuring, the `role` inside the `content` is often `'user'`, but the event `author` is typically the agent that requested the tool call.
*   **Is it streaming output? (`event.partial`)**
    *   `true`: This is an incomplete chunk of text from the LLM; more will follow.
    *   `false` or `undefined`: This part of the content is complete (though the overall turn might not be finished if `turnComplete` is also false).

```typescript
// TypeScript: Basic event identification
// (async () => {
//   for await (const event of runner.runAsync(...)) {
//     console.log(`Event from: ${event.author}`);
//
//     if (event.content && event.content.parts) {
//       if (event.getFunctionCalls().length > 0) {
//         console.log("  Type: Tool Call Request");
//       } else if (event.getFunctionResponses().length > 0) {
//         console.log("  Type: Tool Result");
//       } else if (event.content.parts[0].text) {
//         if (event.partial) {
//           console.log("  Type: Streaming Text Chunk");
//         } else {
//           console.log("  Type: Complete Text Message");
//         }
//       } else {
//         console.log("  Type: Other Content (e.g., code result)");
//       }
//     } else if (event.actions && 
//                (Object.keys(event.actions.stateDelta).length > 0 || 
//                 Object.keys(event.actions.artifactDelta).length > 0)) {
//       console.log("  Type: State/Artifact Update");
//     } else {
//       console.log("  Type: Control Signal or Other");
//     }
//   }
// })();
```

### Extracting Key Information

Once you know the event type, access the relevant data:

*   **Text Content:** `text = event.content.parts[0].text` (Always check `event.content` and `event.content.parts` first).
*   **Function Call Details:**
    ```typescript
    const calls = event.getFunctionCalls();
    if (calls.length > 0) {
      for (const call of calls) {
        const toolName = call.name;
        const arguments = call.args; // This is usually an object
        console.log(`  Tool: ${toolName}, Args:`, arguments);
        // Application might dispatch execution based on this
      }
    }
    ```
*   **Function Response Details:**
    ```typescript
    const responses = event.getFunctionResponses();
    if (responses.length > 0) {
      for (const response of responses) {
        const toolName = response.name;
        const resultObj = response.response; // The object returned by the tool
        console.log(`  Tool Result: ${toolName} ->`, resultObj);
      }
    }
    ```
*   **Identifiers:**
    *   `event.id`: Unique ID for this specific event instance (an 8-character random string generated by `Event.newId()`).
    *   `event.invocationId`: ID for the entire user-request-to-final-response cycle this event belongs to. Useful for logging and tracing.

### Detecting Actions and Side Effects

The `event.actions` object signals changes that occurred or should occur. Always check if `event.actions` exists before accessing its fields.

*   **State Changes:** `delta = event.actions.stateDelta` gives you an object of `{key: value}` pairs that were modified in the session state during the step that produced this event.
    ```typescript
    if (event.actions && Object.keys(event.actions.stateDelta).length > 0) {
      console.log(`  State changes:`, event.actions.stateDelta);
      // Update local UI or application state if necessary
    }
    ```
*   **Artifact Saves:** `artifactChanges = event.actions.artifactDelta` gives you an object of `{filename: version}` indicating which artifacts were saved and their new version number.
    ```typescript
    if (event.actions && Object.keys(event.actions.artifactDelta).length > 0) {
      console.log(`  Artifacts saved:`, event.actions.artifactDelta);
      // UI might refresh an artifact list
    }
    ```
*   **Control Flow Signals:** Check boolean flags or string values:
    *   `event.actions.transferToAgent` (string): Control should pass to the named agent.
    *   `event.actions.escalate` (boolean): A loop should terminate.
    *   `event.actions.skipSummarization` (boolean): A tool result should not be summarized by the LLM.
    *   `event.actions.requestedAuthConfigs` (Map<string, AuthConfig>): Authentication configurations requested by tools.
    ```typescript
    if (event.actions) {
      if (event.actions.transferToAgent) {
        console.log(`  Signal: Transfer to ${event.actions.transferToAgent}`);
      }
      if (event.actions.escalate) {
        console.log("  Signal: Escalate (terminate loop)");
      }
      if (event.actions.skipSummarization) {
        console.log("  Signal: Skip summarization for tool result");
      }
      if (event.actions.requestedAuthConfigs.size > 0) {
        console.log("  Signal: Authentication requested for tools");
      }
    }
    ```

### Determining if an Event is a "Final" Response

Use the built-in helper method `event.isFinalResponse()` to identify events suitable for display as the agent's complete output for a turn.

*   **Purpose:** Filters out intermediate steps (like tool calls, partial streaming text, internal state updates) from the final user-facing message(s).
*   **When `true`?** The implementation in code checks:
    1.  If `this.actions.skipSummarization` is true (regardless of event content).
    2.  If `this.longRunningToolIds` is set (indicating a tool is running in the background).
    3.  OR, **all** of the following are met:
        *   No function calls (`getFunctionCalls()` is empty).
        *   No function responses (`getFunctionResponses()` is empty).
        *   Not a partial stream chunk (`partial` is not `true`).
        *   Doesn't end with a code execution result that might need further processing/display.
*   **Usage:** Filter the event stream in your application logic.

    ```typescript
    // TypeScript: Handling final responses in application
    // let fullResponseText = "";
    // (async () => {
    //   for await (const event of runner.runAsync(...)) {
    //     // Accumulate streaming text if needed...
    //     if (event.partial && event.content && event.content.parts && 
    //         event.content.parts[0].text) {
    //       fullResponseText += event.content.parts[0].text;
    //     }
    //
    //     // Check if it's a final, displayable event
    //     if (event.isFinalResponse()) {
    //       console.log("\n--- Final Output Detected ---");
    //       if (event.content && event.content.parts && event.content.parts[0].text) {
    //         // If it's the final part of a stream, use accumulated text
    //         const finalText = fullResponseText + (event.content.parts[0].text || "");
    //         console.log(`Display to user: ${finalText.trim()}`);
    //         fullResponseText = ""; // Reset accumulator
    //       } else if (event.actions.skipSummarization) {
    //         // Handle displaying the raw tool result if needed
    //         const responseData = event.getFunctionResponses()[0].response;
    //         console.log("Display raw tool result:", responseData);
    //       } else if (event.longRunningToolIds) {
    //         console.log("Display message: Tool is running in background...");
    //       } else {
    //         // Handle other types of final responses if applicable
    //         console.log("Display: Final non-textual response or signal.");
    //       }
    //     }
    //   }
    // })();
    ```

By carefully examining these aspects of an event, you can build robust applications that react appropriately to the rich information flowing through the ADK system.

## How Events Flow: Generation and Processing 

Events are created at different points and processed systematically by the framework. Understanding this flow helps clarify how actions and history are managed.

*   **Generation Sources:**
    *   **User Input:** The `Runner` typically wraps initial user messages or mid-conversation inputs into an `Event` with `author='user'`.
    *   **Agent Logic:** Agents (`BaseAgent`, `LlmAgent`) explicitly create and yield `new Event({author: this.name, ...})` objects to communicate responses or signal actions.
    *   **LLM Responses:** The ADK model integration layer translates raw LLM output (text, function calls, errors) into `Event` objects, authored by the calling agent.
    *   **Tool Results:** After a tool executes, the framework generates an `Event` containing the `functionResponse`. The `author` is typically the agent that requested the tool, while the `role` inside the `content` is set to `'user'` for the LLM history.

*   **Processing Flow:**
    1.  **Yield:** An event is generated and yielded by its source.
    2.  **Runner Receives:** The main `Runner` executing the agent receives the event.
    3.  **SessionService Processing (`appendEvent`):** The `Runner` sends the event to the configured `SessionService` (an implementation of `BaseSessionService`). This is a critical step:
        *   **Processes State Delta:** The `BaseSessionService._updateSessionStateFromEvent` method processes `event.actions.stateDelta` and applies it to `session.state`, filtering out keys with `temp:` prefix.
        *   **Artifact Processing:** Note that while `event.actions.artifactDelta` tracks which artifacts were saved, the actual artifact handling is implementation-specific and not directly handled in the base `appendEvent` method.
        *   **Finalizes Metadata:** The event ID and timestamp are usually set during construction of the Event object.
        *   **Persists to History:** Appends the processed event to the `session.events` list.
    4.  **External Yield:** The `Runner` yields the processed event outwards to the calling application (e.g., the code that invoked `runner.runAsync`).

This flow ensures that state changes and history are consistently recorded alongside the communication content of each event.

## Common Event Examples (Illustrative Patterns)

Here are concise examples of typical events you might see in the stream:

*   **User Input:**
    ```json
    {
      "author": "user",
      "invocationId": "e-xyz...",
      "content": {"parts": [{"text": "Book a flight to London for next Tuesday"}]}
      // actions usually empty
    }
    ```
*   **Agent Final Text Response:** (`isFinalResponse() === true`)
    ```json
    {
      "author": "TravelAgent",
      "invocationId": "e-xyz...",
      "content": {"parts": [{"text": "Okay, I can help with that. Could you confirm the departure city?"}]},
      "partial": false,
      "turnComplete": true
      // actions might have state delta, etc.
    }
    ```
*   **Agent Streaming Text Response:** (`isFinalResponse() === false`)
    ```json
    {
      "author": "SummaryAgent",
      "invocationId": "e-abc...",
      "content": {"parts": [{"text": "The document discusses three main points:"}]},
      "partial": true,
      "turnComplete": false
    }
    // ... more partial=true events follow ...
    ```
*   **Tool Call Request (by LLM):** (`isFinalResponse() === false`)
    ```json
    {
      "author": "TravelAgent",
      "invocationId": "e-xyz...",
      "content": {"parts": [{"functionCall": {"name": "findAirports", "args": {"city": "London"}}}]}
      // actions usually empty
    }
    ```
*   **Tool Result Provided (to LLM):** (`isFinalResponse()` depends on `skipSummarization`)
    ```json
    {
      "author": "TravelAgent", // Author is agent that requested the call
      "invocationId": "e-xyz...",
      "content": {
        "role": "user", // Role for LLM history
        "parts": [{"functionResponse": {"name": "findAirports", "response": {"result": ["LHR", "LGW", "STN"]}}}]
      },
      "actions": {
        "skipSummarization": true // This would make isFinalResponse() return true
      }
    }
    ```
*   **State/Artifact Update Only:** (`isFinalResponse() === false`)
    ```json
    {
      "author": "InternalUpdater",
      "invocationId": "e-def...",
      "content": null,
      "actions": {
        "stateDelta": {"userStatus": "verified"},
        "artifactDelta": {"verification_doc.pdf": 2}
      }
    }
    ```
*   **Agent Transfer Signal:** (`isFinalResponse() === false`)
    ```json
    {
      "author": "OrchestratorAgent",
      "invocationId": "e-789...",
      "content": {"parts": [{"functionCall": {"name": "transferToAgent", "args": {"agentName": "BillingAgent"}}}]},
      "actions": {"transferToAgent": "BillingAgent"} // Added by framework
    }
    ```
*   **Loop Escalation Signal:** (`isFinalResponse() === false`)
    ```json
    {
      "author": "CheckerAgent",
      "invocationId": "e-loop...",
      "content": {"parts": [{"text": "Maximum retries reached."}]}, // Optional content
      "actions": {"escalate": true}
    }
    ```
*   **Authentication Request:** (`isFinalResponse() === false`)
    ```json
    {
      "author": "APIAgent",
      "invocationId": "e-auth...",
      "content": {"parts": [{"text": "Need authentication to proceed"}]},
      "actions": {
        "requestedAuthConfigs": {
          "func-123": {
            "type": "oauth",
            "provider": "gmail"
          }
        }
      }
    }
    ```

## Additional Context and Event Details

Beyond the core concepts, here are a few specific details about context and events that are important for certain use cases:

1.  **`ToolContext.functionCallId` (Linking Tool Actions):**
    *   When an LLM requests a tool (`FunctionCall`), that request has an ID. The `ToolContext` provided to your tool function includes this `functionCallId`.
    *   **Importance:** This ID is crucial for linking actions like authentication (`requestCredential`, `getAuthResponse`) back to the specific tool request that initiated them, especially if multiple tools are called in one turn. The framework uses this ID internally for associating auth requests with the right tool call.

2.  **How State/Artifact Changes are Recorded:**
    *   When you modify state (`context.state['key'] = value`) or save an artifact (`context.saveArtifact(...)`) using `CallbackContext` or `ToolContext`, these changes aren't immediately written to persistent storage.
    *   Instead, they populate the `stateDelta` and `artifactDelta` fields within the `EventActions` object.
    *   This `EventActions` object is attached to the *next event* generated after the change (e.g., the agent's response or a tool result event).
    *   The `BaseSessionService.appendEvent` method reads the state deltas from the incoming event and applies non-temporary ones to the session's state. The handling of artifact deltas depends on the specific SessionService implementation.

3.  **State Scope Prefixes (`app:`, `user:`, `temp:`):**
    *   When managing state via `context.state`, you can optionally use prefixes:
        *   `app:mySetting`: Suggests state relevant to the entire application (requires a persistent `SessionService`).
        *   `user:userPreference`: Suggests state relevant to the specific user across sessions (requires a persistent `SessionService`).
        *   `temp:intermediateResult` or no prefix: Typically session-specific or temporary state for the current invocation.
    *   The `BaseSessionService._updateSessionStateFromEvent` method specifically excludes keys with the `temp:` prefix from being persisted to the session state.

4.  **Conversation History vs Events:**
    *   The `Session` class maintains both `events: Event[]` and a private `conversationHistory: Content[]` property.
    *   The `events` array contains the complete record of all events in chronological order, while the `conversationHistory` specifically stores semantic content for LLM context.
    *   Use `session.addConversationHistory(content)` to add to the conversation history and `session.getConversationHistory()` to retrieve it.

5.  **Error Events:**
    *   An `Event` can represent an error. Check the `event.errorCode` and `event.errorMessage` fields (inherited from `LlmResponse`).
    *   Errors might originate from the LLM (e.g., safety filters, resource limits) or potentially be packaged by the framework if a tool fails critically. Check tool `FunctionResponse` content for typical tool-specific errors.
    ```json
    // Example Error Event (conceptual)
    {
      "author": "LLMAgent",
      "invocationId": "e-err...",
      "content": null,
      "errorCode": "SAFETY_FILTER_TRIGGERED",
      "errorMessage": "Response blocked due to safety settings.",
      "actions": {}
    }
    ```

These details provide a more complete picture for advanced use cases involving tool authentication, state persistence scope, and error handling within the event stream.

## Best Practices for Working with Events

To use events effectively in your ADK applications:

*   **Clear Authorship:** When building custom agents (`BaseAgent`), ensure `new Event({author: this.name, ...})` to correctly attribute agent actions in the history. The framework generally handles authorship correctly for LLM/tool events.
*   **Semantic Content & Actions:** Use `event.content` for the core message/data (text, function call/response). Use `event.actions` specifically for signaling side effects (state/artifact deltas) or control flow (`transferToAgent`, `escalate`, `skipSummarization`, `requestedAuthConfigs`).
*   **Idempotency Awareness:** Understand that the `BaseSessionService` is responsible for applying the state changes signaled in `event.actions.stateDelta`. Implementation-specific sessionService classes may handle artifact deltas differently.
*   **Use `isFinalResponse()`:** Rely on this helper method in your application/UI layer to identify complete, user-facing text responses. Avoid manually replicating its logic.
*   **Leverage History:** The `session.events` list is your primary debugging tool. Examine the sequence of authors, content, and actions to trace execution and diagnose issues.
*   **Use Metadata:** Use `invocationId` to correlate all events within a single user interaction. Use `event.id` to reference specific, unique occurrences.

Treating events as structured messages with clear purposes for their content and actions is key to building, debugging, and managing complex agent behaviors in ADK.