# Callbacks: Observe, Customize, and Control Agent Behavior

## Introduction: What are Callbacks and Why Use Them?

Callbacks are a cornerstone feature of ADK, providing a powerful mechanism to hook into an agent's execution process. They allow you to observe, customize, and even control the agent's behavior at specific, predefined points without modifying the core ADK framework code.

**What are they?** In essence, callbacks are standard TypeScript functions that you define. You then associate these functions with an agent when you create it. The ADK framework automatically calls your functions at key stages, letting you observe or intervene. Think of it like checkpoints during the agent's process:

* **Before the agent starts its main work on a request, and after it finishes:** When you ask an agent to do something (e.g., answer a question), it runs its internal logic to figure out the response.
  * The `beforeAgentCallback` executes *right before* this main work begins for that specific request.
  * The `afterAgentCallback` executes *right after* the agent has finished all its steps for that request and has prepared the final result, but just before the result is returned.
  * This "main work" encompasses the agent's *entire* process for handling that single request. This might involve deciding to call an LLM, actually calling the LLM, deciding to use a tool, using the tool, processing the results, and finally putting together the answer. These callbacks essentially wrap the whole sequence from receiving the input to producing the final output for that one interaction.
* **Before sending a request to, or after receiving a response from, the Large Language Model (LLM):** These callbacks (`beforeModelCallback`, `afterModelCallback`) allow you to inspect or modify the data going to and coming from the LLM specifically.
* **Before executing a tool (like a function or another agent) or after it finishes:** Similarly, `beforeToolCallback` and `afterToolCallback` callbacks give you control points specifically around the execution of tools invoked by the agent.


![intro_components.png](../assets/callback_flow.png)

**Why use them?** Callbacks unlock significant flexibility and enable advanced agent capabilities:

* **Observe & Debug:** Log detailed information at critical steps for monitoring and troubleshooting.  
* **Customize & Control:** Modify data flowing through the agent (like LLM requests or tool results) or even bypass certain steps entirely based on your logic.  
* **Implement Guardrails:** Enforce safety rules, validate inputs/outputs, or prevent disallowed operations.  
* **Manage State:** Read or dynamically update the agent's session state during execution.  
* **Integrate & Enhance:** Trigger external actions (API calls, notifications) or add features like caching.

**How are they added?** You register callbacks by passing your defined TypeScript functions as arguments to the agent's constructor when you create an instance of `LlmAgent`.

```ts
import { LlmAgent, CallbackContext } from '@google/adk';
import { LlmResponse, LlmRequest } from '@google/adk/models';

// --- Define your callback function ---
function myBeforeModelLogic(
    callbackContext: CallbackContext, 
    llmRequest: LlmRequest
): LlmResponse | undefined {
    console.log(`Callback running before model call for agent: ${callbackContext.agentName}`);
    // ... your custom logic here ...
    return undefined; // Allow the model call to proceed
}

// --- Register it during Agent creation ---
const myAgent = new LlmAgent("MyCallbackAgent", {
    model: "gemini-2.0-flash", // Or your desired model
    instruction: "Be helpful.",
    // Other agent parameters...
    beforeModelCallback: myBeforeModelLogic // Pass the function here
});
```

## The Callback Mechanism: Interception and Control

When the ADK framework encounters a point where a callback can run (e.g., just before calling the LLM), it checks if you provided a corresponding callback function for that agent. If you did, the framework executes your function.

**Context is Key:** Your callback function isn't called in isolation. The framework provides special **context objects** (`CallbackContext` or `ToolContext`) as arguments. These objects contain vital information about the current state of the agent's execution, including the invocation details, session state, and potentially references to services like artifacts or memory. You use these context objects to understand the situation and interact with the framework. (See the dedicated "Context Objects" section for full details).

**Controlling the Flow (The Core Mechanism):** The most powerful aspect of callbacks lies in how their **return value** influences the agent's subsequent actions. This is how you intercept and control the execution flow:

1. **`return undefined` (Allow Default Behavior):**  

    * This is the standard way to signal that your callback has finished its work (e.g., logging, inspection, minor modifications to *mutable* input arguments like `llmRequest`) and that the ADK agent should **proceed with its normal operation**.  
    * For `before*` callbacks (`beforeAgentCallback`, `beforeModelCallback`, `beforeToolCallback`), returning `undefined` means the next step in the sequence (running the agent logic, calling the LLM, executing the tool) will occur.  
    * For `after*` callbacks (`afterAgentCallback`, `afterModelCallback`, `afterToolCallback`), returning `undefined` means the result just produced by the preceding step (the agent's output, the LLM's response, the tool's result) will be used as is.

2. **`return <Specific Object>` (Override Default Behavior):**  

    * Returning a *specific type of object* (instead of `undefined`) is how you **override** the ADK agent's default behavior. The framework will use the object you return and *skip* the step that would normally follow or *replace* the result that was just generated.  
    * **`beforeAgentCallback` → `Content`**: Skips the agent's main execution logic. The returned `Content` object is immediately treated as the agent's final output for this turn. Useful for handling simple requests directly or enforcing access control.  
    * **`beforeModelCallback` → `LlmResponse`**: Skips the call to the external Large Language Model. The returned `LlmResponse` object is processed as if it were the actual response from the LLM. Ideal for implementing input guardrails, prompt validation, or serving cached responses.  
    * **`beforeToolCallback` → `Record<string, any>`**: Skips the execution of the actual tool function (or sub-agent). The returned object is used as the result of the tool call, which is then typically passed back to the LLM. Perfect for validating tool arguments, applying policy restrictions, or returning mocked/cached tool results.  
    * **`afterAgentCallback` → `Content`**: *Replaces* the `Content` that the agent's run logic just produced.  
    * **`afterModelCallback` → `LlmResponse`**: *Replaces* the `LlmResponse` received from the LLM. Useful for sanitizing outputs, adding standard disclaimers, or modifying the LLM's response structure.  
    * **`afterToolCallback` → `Record<string, any>`**: *Replaces* the result returned by the tool. Allows for post-processing or standardization of tool outputs before they are sent back to the LLM.

**Conceptual Code Example (Guardrail):**

This example demonstrates the common pattern for a guardrail using `beforeModelCallback`.

```ts
import { LlmAgent, CallbackContext, Runner } from '@google/adk';
import { LlmResponse, LlmRequest } from '@google/adk/models';
import { Content, Part } from '@google/adk/models/types';
import { InMemorySessionService } from '@google/adk/sessions';

const GEMINI_2_FLASH = "gemini-2.0-flash";

// --- Define the Callback Function ---
function simpleBeforeModelModifier(
    callbackContext: CallbackContext, 
    llmRequest: LlmRequest
): LlmResponse | undefined {
    // Inspect/modify the LLM request or skip the call
    const agentName = callbackContext.agentName;
    console.log(`[Callback] Before model call for agent: ${agentName}`);

    // Inspect the last user message in the request contents
    let lastUserMessage = "";
    if (llmRequest.contents && llmRequest.contents.length > 0) {
        const lastContent = llmRequest.contents[llmRequest.contents.length - 1];
        if (lastContent.role === 'user' && lastContent.parts && lastContent.parts.length > 0) {
            lastUserMessage = lastContent.parts[0].text || "";
        }
    }
    console.log(`[Callback] Inspecting last user message: '${lastUserMessage}'`);

    // --- Modification Example ---
    // Add a prefix to the system instruction
    const originalInstruction = llmRequest.config.systemInstruction || { role: "system", parts: [] };
    const prefix = "[Modified by Callback] ";
    
    // Ensure systemInstruction is Content and parts list exists
    if (!originalInstruction.parts) {
        originalInstruction.parts = [];
    }
    
    if (originalInstruction.parts.length === 0) {
        originalInstruction.parts.push({ text: "" }); // Add an empty part if none exist
    }

    // Modify the text of the first part
    const modifiedText = prefix + (originalInstruction.parts[0].text || "");
    originalInstruction.parts[0].text = modifiedText;
    llmRequest.config.systemInstruction = originalInstruction;
    console.log(`[Callback] Modified system instruction to: '${modifiedText}'`);

    // --- Skip Example ---
    // Check if the last user message contains "BLOCK"
    if (lastUserMessage.toUpperCase().includes("BLOCK")) {
        console.log("[Callback] 'BLOCK' keyword found. Skipping LLM call.");
        // Return an LlmResponse to skip the actual LLM call
        return new LlmResponse({
            content: {
                role: "model",
                parts: [{ text: "LLM call was blocked by beforeModelCallback." }]
            }
        });
    } else {
        console.log("[Callback] Proceeding with LLM call.");
        // Return undefined to allow the (modified) request to go to the LLM
        return undefined;
    }
}

// Create LlmAgent and Assign Callback
const myLlmAgent = new LlmAgent("ModelCallbackAgent", {
    model: GEMINI_2_FLASH,
    instruction: "You are a helpful assistant.", // Base instruction
    description: "An LLM agent demonstrating beforeModelCallback",
    beforeModelCallback: simpleBeforeModelModifier // Assign the function here
});

const APP_NAME = "guardrail_app";
const USER_ID = "user_1";
const SESSION_ID = "session_001";

// Session and Runner
const sessionService = new InMemorySessionService();
const session = sessionService.createSession({
    appName: APP_NAME, 
    userId: USER_ID, 
    sessionId: SESSION_ID
});
const runner = new Runner({
    agent: myLlmAgent, 
    appName: APP_NAME, 
    sessionService: sessionService
});

// Agent Interaction
async function callAgent(query: string) {
    const content = {
        role: 'user', 
        parts: [{ text: query }]
    };
    
    for await (const event of runner.run({
        userId: USER_ID,
        sessionId: SESSION_ID,
        newMessage: content
    })) {
        if (event.isFinalResponse()) {
            const finalResponse = event.content?.parts?.[0]?.text;
            console.log("Agent Response: ", finalResponse);
        }
    }
}

// Usage: 
callAgent("callback example");
```

By understanding this mechanism of returning `undefined` versus returning specific objects, you can precisely control the agent's execution path, making callbacks an essential tool for building sophisticated and reliable agents with ADK.
