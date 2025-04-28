# Runtime

## What is runtime?

The ADK Runtime is the underlying engine that powers your agent application during user interactions. It's the system that takes your defined agents, tools, and callbacks and orchestrates their execution in response to user input, managing the flow of information, state changes, and interactions with external services like LLMs or storage.

Think of the Runtime as the **"engine"** of your agentic application. You define the parts (agents, tools), and the Runtime handles how they connect and run together to fulfill a user's request.

## Core Idea: The Event Loop

At its heart, the ADK Runtime operates on an **Event Loop**. This loop facilitates a back-and-forth communication between the `Runner` component and your defined "Execution Logic" (which includes your Agents, the LLM calls they make, Callbacks, and Tools).

![intro_components.png](../assets/event-loop.png)

In simple terms:

1. The `Runner` receives a user query and asks the main `Agent` to start processing.
2. The `Agent` (and its associated logic) runs until it has something to report (like a response, a request to use a tool, or a state change) – it then returns an `Event` as part of an async generator.
3. The `Runner` receives this `Event`, processes any associated actions (like saving state changes via `Services`), and forwards the event onwards (e.g., to the user interface).
4. Only *after* the `Runner` has processed the event does the `Agent`'s logic **continue** from where it was, now potentially seeing the effects of the changes committed by the Runner.
5. This cycle repeats until the agent has no more events to yield for the current user query.

This event-driven loop is the fundamental pattern governing how ADK executes your agent code.

## The Heartbeat: The Event Loop - Inner workings

The Event Loop is the core operational pattern defining the interaction between the `Runner` and your custom code (Agents, Tools, Callbacks, collectively referred to as "Execution Logic" or "Logic Components"). It establishes a clear division of responsibilities:

### Runner's Role (Orchestrator)

The `Runner` acts as the central coordinator for a single user invocation. Its responsibilities in the loop are:

1. **Initiation:** Receives the end user's query (`newMessage`) and typically appends it to the session history via the `SessionService`.
2. **Kick-off:** Starts the event generation process by calling the main agent's execution method (e.g., `agent.invoke(invocationContext)`).
3. **Receive & Process:** Waits for the agent logic to return an `Event` from its async generator. Upon receiving an event, the Runner **promptly processes** it. This involves:
      * Using configured `Services` (`SessionService`, `ArtifactService`, `MemoryService`) to commit changes indicated in `event.actions` (like `stateDelta`, `artifactDelta`).
      * Performing other internal bookkeeping.
4. **Yield Upstream:** Forwards the processed event onwards (e.g., to the calling application or UI for rendering).
5. **Iterate:** Signals the agent logic that processing is complete for the current event, allowing it to continue and generate the *next* event.

*Conceptual Runner Loop:*

```typescript
// Simplified view of Runner's main runAsync method
async *runAsync(params: {
  userId: string;
  sessionId: string;
  newMessage: Content;
}): AsyncGenerator<Event, void, unknown> {
  // 1. Get session and append new message to session event history (via SessionService)
  const session = await this.sessionService.getSession({
    appName: this.appName,
    userId: params.userId,
    sessionId: params.sessionId
  });
  
  // Add user message as an event
  await this._appendNewMessageToSession({
    session,
    newMessage: params.newMessage,
    invocationContext
  });

  // 2. Kick off event loop by creating an invocation context and calling the agent
  const invocationContext = this._newInvocationContext({...});
  invocationContext.agent = this._findAgentToRun(session, this.agent);
  
  // 3-5. Process events from the agent generator
  for await (const event of invocationContext.agent.invoke(invocationContext)) {
    // Process non-partial events (commit state/artifact changes)
    if (!event.partial) {
      await this.sessionService.appendEvent({
        session,
        event
      });
    }
    
    // 4. Yield event for upstream processing (e.g., UI rendering)
    yield event;
    // Runner implicitly signals agent generator can continue after yielding
  }
}
```

### Execution Logic's Role (Agent, Tool, Callback)

Your code within agents, tools, and callbacks is responsible for the actual computation and decision-making. Its interaction with the loop involves:

1. **Execute:** Runs its logic based on the current `InvocationContext`, including the session state *as it was when execution started or resumed*.
2. **Yield:** When the logic needs to communicate (send a message, call a tool, report a state change), it constructs an `Event` containing the relevant content and actions, and then returns this event as part of the async generator.
3. **Pause:** Execution of the agent logic **pauses** after the `yield` statement within the async generator. It waits for the `Runner` to process the event.
4. **Resume:** *Only after* the `Runner` has processed the yielded event does the agent logic resume execution from the statement immediately following the `yield`.
5. **See Updated State:** Upon resumption, the agent logic can now reliably access the session state (`ctx.session.state`) reflecting the changes that were committed by the `Runner` from the *previously yielded* event.

*Conceptual Execution Logic:*

```typescript
// Simplified view of logic inside Agent.invoke
async *invoke(ctx: InvocationContext): AsyncGenerator<Event, void, unknown> {
  // ... previous code runs based on current state ...

  // 1. Determine a change or output is needed, construct the event
  // Example: Updating state
  const updateData = { 'field_1': 'value_2' };
  const eventWithStateChange: Event = {
    author: this.name,
    invocationId: ctx.invocationId,
    content: {
      role: 'assistant',
      parts: [{ text: 'State updated.' }]
    },
    actions: {
      stateDelta: updateData
    }
    // ... other event fields ...
  };

  // 2. Yield the event to the Runner for processing & commit
  yield eventWithStateChange;
  // <<<<<<<<<<<< EXECUTION PAUSES HERE UNTIL THE NEXT ITERATION >>>>>>>>>>>>

  // <<<<<<<<<<<< RUNNER PROCESSES & COMMITS THE EVENT >>>>>>>>>>>>

  // 3. Resume execution ONLY after Runner processes the above event
  // Now, the state committed by the Runner is reliably reflected
  // Subsequent code can safely assume the change from the yielded event happened
  const val = ctx.session.state['field_1'];
  // here `val` is guaranteed to be "value_2" (assuming Runner committed successfully)
  console.log(`Resumed execution. Value of field_1 is now: ${val}`);

  // ... subsequent code continues ...
  // Maybe yield another event later...
}
```

This cooperative async generator pattern between the `Runner` and your Execution Logic, mediated by `Event` objects, forms the core of the ADK Runtime.

## Key components of the Runtime

Several components work together within the ADK Runtime to execute an agent invocation. Understanding their roles clarifies how the event loop functions:

1. ### `Runner`

      * **Role:** The main entry point and orchestrator for a single user query (`runAsync`).
      * **Function:** Manages the overall Event Loop, receives events yielded by the Execution Logic, coordinates with Services to process and commit event actions (state/artifact changes), and forwards processed events upstream (e.g., to the UI). It essentially drives the conversation turn by turn based on generated events. (Defined in `runners.ts`).

2. ### Execution Logic Components

      * **Role:** The parts containing your custom code and the core agent capabilities.
      * **Components:**
      * `Agent` (`BaseAgent`, `LlmAgent`, etc.): Your primary logic units that process information and decide on actions. They implement the `invoke` method which yields events.
      * `Tools` (`BaseTool`, `FunctionTool`, etc.): External functions or capabilities used by agents (often `LlmAgent`) to interact with the outside world or perform specific tasks. They execute and return results, which are then wrapped in events.
      * `Callbacks` (Functions): User-defined functions attached to agents (e.g., callbacks) that hook into specific points in the execution flow, potentially modifying behavior or state, whose effects are captured in events.
      * **Function:** Perform the actual thinking, calculation, or external interaction. They communicate their results or needs by **yielding `Event` objects** via async generators.

3. ### `Event`

      * **Role:** The message passed back and forth between the `Runner` and the Execution Logic.
      * **Function:** Represents an atomic occurrence (user input, agent text, tool call/result, state change request, control signal). It carries both the content of the occurrence and the intended side effects (`actions` like `stateDelta`). (Defined in `events/Event.ts`).

4. ### `Services`

      * **Role:** Backend components responsible for managing persistent or shared resources. Used primarily by the `Runner` during event processing.
      * **Components:**
      * `SessionService` (`BaseSessionService`, `InMemorySessionService`, etc.): Manages `Session` objects, including saving/loading them, applying `stateDelta` to the session state, and appending events to the `event history`.
      * `ArtifactService` (`BaseArtifactService`, `InMemoryArtifactService`, etc.): Manages the storage and retrieval of binary artifact data. Although `saveArtifact` is called via context during execution logic, the `artifactDelta` in the event confirms the action for the Runner/SessionService.
      * `MemoryService` (`BaseMemoryService`, etc.): (Optional) Manages long-term semantic memory across sessions for a user.
      * **Function:** Provide the persistence layer. The `Runner` interacts with them to ensure changes signaled by `event.actions` are reliably stored *before* the Execution Logic resumes.

5. ### `Session`

      * **Role:** A data container holding the state and history for *one specific conversation* between a user and the application.
      * **Function:** Stores the current `state` record, the list of all past `events` (`event history`), and references to associated artifacts. It's the primary record of the interaction, managed by the `SessionService`. (Defined in `sessions/Session.ts`).

6. ### `Invocation`

      * **Role:** A conceptual term representing everything that happens in response to a *single* user query, from the moment the `Runner` receives it until the agent logic finishes yielding events for that query.
      * **Function:** An invocation might involve multiple agent runs (if using agent transfer or agent tools), multiple LLM calls, tool executions, and callback executions, all tied together by a single `invocationId` within the `InvocationContext`.

These players interact continuously through the Event Loop to process a user's request.

## How It Works: A Simplified Invocation

Let's trace a simplified flow for a typical user query that involves an LLM agent calling a tool:

![intro_components.png](../assets/invocation-flow.png)

### Step-by-Step Breakdown

1. **User Input:** The User sends a query (e.g., "What's the capital of France?").
2. **Runner Starts:** `Runner.runAsync` begins. It interacts with the `SessionService` to load the relevant `Session` and adds the user query as the first `Event` to the session history. An `InvocationContext` (`ctx`) is prepared.
3. **Agent Execution:** The `Runner` calls `agent.invoke(ctx)` on the designated root agent (e.g., an `LlmAgent`).
4. **LLM Call (Example):** The `Agent_Llm` determines it needs information, perhaps by calling a tool. It prepares a request for the `LLM`. Let's assume the LLM decides to call `MyTool`.
5. **Yield FunctionCall Event:** The `Agent_Llm` receives the `functionCall` response from the LLM, wraps it in an `Event` with appropriate content, and `yield`s this event.
6. **Agent Pauses:** The `Agent_Llm`'s execution pauses after the `yield` statement (in the async generator).
7. **Runner Processes:** The `Runner` receives the FunctionCall event. It passes it to the `SessionService` to record it in the history. The `Runner` then yields the event upstream to the `User` (or application).
8. **Agent Resumes:** The `Runner` signals that the event is processed by continuing with the async generator iteration, and `Agent_Llm` resumes execution.
9. **Tool Execution:** The `Agent_Llm`'s internal flow now proceeds to execute the requested `MyTool`.
10. **Tool Returns Result:** `MyTool` executes and returns its result (e.g., `{ result: 'Paris' }`).
11. **Yield FunctionResponse Event:** The agent (`Agent_Llm`) wraps the tool result into an `Event` containing a function response. This event might also contain `actions` if the tool modified state (`stateDelta`) or saved artifacts (`artifactDelta`). The agent `yield`s this event.
12. **Agent Pauses:** `Agent_Llm` pauses again.
13. **Runner Processes:** `Runner` receives the FunctionResponse event. It passes it to `SessionService` which applies any `stateDelta`/`artifactDelta` and adds the event to history. `Runner` yields the event upstream.
14. **Agent Resumes:** `Agent_Llm` resumes, now knowing the tool result and any state changes are committed.
15. **Final LLM Call (Example):** `Agent_Llm` sends the tool result back to the `LLM` to generate a natural language response.
16. **Yield Final Text Event:** `Agent_Llm` receives the final text from the `LLM`, wraps it in an `Event` with text content, and `yield`s it.
17. **Agent Pauses:** `Agent_Llm` pauses.
18. **Runner Processes:** `Runner` receives the final text event, passes it to `SessionService` for history, and yields it upstream to the `User`. This is likely marked as `turnComplete: true`.
19. **Agent Resumes & Finishes:** `Agent_Llm` resumes. Having completed its task for this invocation, its async generator finishes.
20. **Runner Completes:** The `Runner` sees the agent's generator is exhausted and finishes its loop for this invocation.

This async generator pattern ensures that state changes are consistently applied and that the execution logic always operates on the most recently committed state after yielding an event.

## Important Runtime Behaviors

Understanding a few key aspects of how the ADK Runtime handles state, streaming, and asynchronous operations is crucial for building predictable and efficient agents.

### State Updates & Commitment Timing

* **The Rule:** When your code (in an agent, tool, or callback) modifies the session state (e.g., `context.session.state['my_key'] = 'new_value'`), this change is initially recorded locally within the current `InvocationContext`. The change is only **guaranteed to be persisted** (saved by the `SessionService`) *after* the `Event` carrying the corresponding `stateDelta` in its `actions` has been yielded by your code and subsequently processed by the `Runner`.

* **Implication:** Code that runs *after* resuming from the next iteration of the async generator can reliably assume that the state changes signaled in the *previously yielded event* have been committed.

```typescript
// Inside agent logic (conceptual)

// 1. Modify state
ctx.session.state['status'] = 'processing';
const event1: Event = {
  author: this.name,
  invocationId: ctx.invocationId,
  actions: { stateDelta: { 'status': 'processing' } },
  // Other event properties...
};

// 2. Yield event with the delta
yield event1;
// --- PAUSE --- Runner processes event1, SessionService commits 'status' = 'processing' ---

// 3. Resume execution on next iterator iteration
// Now it's safe to rely on the committed state
const currentStatus = ctx.session.state['status']; // Guaranteed to be 'processing'
console.log(`Status after resuming: ${currentStatus}`);
```

### "Dirty Reads" of Session State

* **Definition:** While commitment happens *after* the event is processed, code running *later within the same invocation*, but *before* the state-changing event is actually yielded and processed, **can often see the local, uncommitted changes**. This is sometimes called a "dirty read".
* **Example:**

```typescript
// Code in beforeAgentCallback
callbackContext.session.state['field_1'] = 'value_1';
// State is locally set to 'value_1', but not yet committed by Runner

// ... agent runs ...

// Code in a tool called later *within the same invocation*
// Readable (dirty read), but 'value_1' isn't guaranteed persistent yet
const val = toolContext.session.state['field_1']; // 'val' will likely be 'value_1' here
console.log(`Dirty read value in tool: ${val}`);

// Assume the event carrying the stateDelta={'field_1': 'value_1'}
// is yielded *after* this tool runs and is processed by the Runner
```

* **Implications:**
  * **Benefit:** Allows different parts of your logic within a single complex step (e.g., multiple callbacks or tool calls before the next LLM turn) to coordinate using state without waiting for a full yield/commit cycle.
  * **Caveat:** Relying heavily on dirty reads for critical logic can be risky. If the invocation fails *before* the event carrying the `stateDelta` is yielded and processed by the `Runner`, the uncommitted state change will be lost. For critical state transitions, ensure they are associated with an event that gets successfully processed.

### Streaming vs. Non-Streaming Output (`partial=true`)

This primarily relates to how responses from the LLM are handled, especially when using streaming generation APIs.

* **Streaming:** The LLM generates its response token-by-token or in small chunks.
  * The framework (often within LLM handling code) yields multiple `Event` objects for a single conceptual response. Most of these events will have `partial=true`.
  * The `Runner`, upon receiving an event with `partial=true`, typically **forwards it immediately** upstream (for UI display) but **skips processing its `actions`** (like `stateDelta`).
  * Eventually, the framework yields a final event for that response, marked as non-partial (`partial=false` or implicitly via `turnComplete=true`).
  * The `Runner` **fully processes only this final event**, committing any associated `stateDelta` or `artifactDelta`.
* **Non-Streaming:** The LLM generates the entire response at once. The framework yields a single event marked as non-partial, which the `Runner` processes fully.
* **Why it Matters:** Ensures that state changes are applied atomically and only once based on the *complete* response from the LLM, while still allowing the UI to display text progressively as it's generated.

## Async is Primary (`runAsync`)

* **Core Design:** The ADK Runtime is fundamentally built on TypeScript's asynchronous capabilities using Promises and AsyncGenerators to handle concurrent operations (like waiting for LLM responses or tool executions) efficiently without blocking.
* **Main Entry Point:** `Runner.runAsync` is the primary method for executing agent invocations. All core runnable components (Agents, specific flows) use `async` functions and generators internally.
* **Synchronous Convenience (`run`):** While `run` exists, in TypeScript it's also asynchronous and mainly serves as a wrapper around `runAsync`.
* **Developer Experience:** You should generally design your application logic (e.g., web servers using ADK) using async/await patterns.
* **Sync/Async Callbacks/Tools:** The framework can handle both async and sync functions provided as tools or callbacks. Long-running *synchronous* tools or callbacks, especially those performing blocking I/O, should be avoided as they can block the entire event loop. Always prefer async implementations when possible.

Understanding these behaviors helps you write more robust ADK applications and debug issues related to state consistency, streaming updates, and asynchronous execution.
