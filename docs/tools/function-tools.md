# Function tools

## What are function tools?

When out-of-the-box tools don't fully meet specific requirements, developers can create custom function tools. This allows for **tailored functionality**, such as connecting to proprietary databases or implementing unique algorithms.

*For example,* a function tool, "myfinancetool", might be a function that calculates a specific financial metric. ADK also supports long running functions, so if that calculation takes a while, the agent can continue working on other tasks.

ADK offers several ways to create functions tools, each suited to different levels of complexity and control:

1. Function Tool
2. Long Running Function Tool
3. Agents-as-a-Tool

## 1. Function Tool

Transforming a function into a tool is a straightforward way to integrate custom logic into your agents. This approach offers flexibility and quick integration.

### Parameters

Define your function parameters using standard **JSON-serializable types** (e.g., string, number, array, object). It's important to avoid setting default values for parameters, as the language model (LLM) does not currently support interpreting them.

### Return Type

The preferred return type for a TypeScript Function Tool is an **object**. This allows you to structure the response with key-value pairs, providing context and clarity to the LLM. If your function returns a type other than an object, the framework automatically wraps it into an object with a single key named **"result"**.

Strive to make your return values as descriptive as possible. *For example,* instead of returning a numeric error code, return an object with an "errorMessage" key containing a human-readable explanation. **Remember that the LLM**, not a piece of code, needs to understand the result. As a best practice, include a "status" key in your return object to indicate the overall outcome (e.g., "success", "error", "pending"), providing the LLM with a clear signal about the operation's state.

### JSDoc Comments

The JSDoc comments of your function serve as the tool's description and are sent to the LLM. Therefore, a well-written and comprehensive JSDoc comment is crucial for the LLM to understand how to use the tool effectively. Clearly explain the purpose of the function, the meaning of its parameters, and the expected return values.

??? "Example"

    This tool is a TypeScript function which obtains the stock price of a given stock ticker/symbol.

    <u>Note</u>: You need to install the Yahoo Finance library before using this tool: `npm install yahoo-finance2`

    ```typescript
    --8<-- "docs/examples/typescript/snippets/tools/function-tools/FuncTool.ts"
    ```

    The return value from this tool will be wrapped into an object if it's not already one:

    ```json
    {"result": "$123.45"}
    ```

### Best Practices

While you have considerable flexibility in defining your function, remember that simplicity enhances usability for the LLM. Consider these guidelines:

* **Fewer Parameters are Better:** Minimize the number of parameters to reduce complexity.  
* **Simple Data Types:** Favor primitive data types like `string` and `number` over custom classes whenever possible.  
* **Meaningful Names:** The function's name and parameter names significantly influence how the LLM interprets and utilizes the tool. Choose names that clearly reflect the function's purpose and the meaning of its inputs. Avoid generic names like `doStuff()`.  

## 2. Long Running Function Tool

Designed for tasks that require a significant amount of processing time without blocking the agent's execution. This tool is a specialized version of `FunctionTool`.

When using a `LongRunningFunctionTool`, your TypeScript function can initiate the long-running operation and optionally return an **intermediate result** to keep the model and user informed about the progress. The agent can then continue with other tasks. An example is the human-in-the-loop scenario where the agent needs human approval before proceeding with a task.

### How it Works

You wrap a TypeScript *async generator* function (a function using `async function*` and `yield`) with `LongRunningFunctionTool`.

1. **Initiation:** When the LLM calls the tool, your generator function starts executing.

2. **Intermediate Updates (`yield`):** Your function should yield intermediate JavaScript objects (typically objects) periodically to report progress. The ADK framework takes each yielded value and sends it back to the LLM packaged within a `FunctionResponse`. This allows the LLM to inform the user (e.g., status, percentage complete, messages).

3. **Completion (`return`):** When the task is finished, the generator function uses `return` to provide the final JavaScript object result.

4. **Framework Handling:** The ADK framework manages the execution. It sends each yielded value back as an intermediate `FunctionResponse`. When the generator completes, the framework sends the returned value as the content of the final `FunctionResponse`, signaling the end of the long-running operation to the LLM.

### Creating the Tool

Define your generator function and wrap it using the `LongRunningFunctionTool` class:

```typescript
import { LongRunningFunctionTool } from 'adk-typescript/tools';

// Define your generator function (see example below)
async function* myLongTaskGenerator(...args: any[]): AsyncGenerator<any, any, unknown> {
  // ... setup ...
  yield { status: "pending", message: "Starting task..." }; // Framework sends this as FunctionResponse
  // ... perform work incrementally ...
  yield { status: "pending", progress: 50 };               // Framework sends this as FunctionResponse
  // ... finish work ...
  return { status: "completed", result: "Final outcome" }; // Framework sends this as final FunctionResponse
}

// Wrap the function
const myTool = new LongRunningFunctionTool({
  func: myLongTaskGenerator
});
```

### Intermediate Updates

Yielding structured JavaScript objects is crucial for providing meaningful updates. Include keys like:

* status: e.g., "pending", "running", "waiting_for_input"

* progress: e.g., percentage, steps completed

* message: Descriptive text for the user/LLM

* estimatedCompletionTime: If calculable

Each value you yield is packaged into a FunctionResponse by the framework and sent to the LLM.

### Final Result

The JavaScript object your generator function returns is considered the final result of the tool execution. The framework packages this value (even if it's null or undefined) into the content of the final `FunctionResponse` sent back to the LLM, indicating the tool execution is complete.

??? "Example: File Processing Simulation"

    ```typescript
    --8<-- "docs/examples/typescript/snippets/tools/function-tools/FileProcessor.ts"
    ```

#### Key aspects of this example

* **processLargeFile**: This generator simulates a lengthy operation, yielding intermediate status/progress objects.

* **`LongRunningFunctionTool`**: Wraps the generator; the framework handles sending yielded updates and the final return value as sequential FunctionResponses.

* **Agent instruction**: Directs the LLM to use the tool and understand the incoming FunctionResponse stream (progress vs. completion) for user updates.

* **Final return**: The function returns the final result object, which is sent in the concluding FunctionResponse to indicate completion.

## 3. Agent-as-a-Tool

This powerful feature allows you to leverage the capabilities of other agents within your system by calling them as tools. The Agent-as-a-Tool enables you to invoke another agent to perform a specific task, effectively **delegating responsibility**. This is conceptually similar to creating a TypeScript function that calls another agent and uses the agent's response as the function's return value.

### Key difference from sub-agents

It's important to distinguish an Agent-as-a-Tool from a Sub-Agent.

* **Agent-as-a-Tool:** When Agent A calls Agent B as a tool (using Agent-as-a-Tool), Agent B's answer is **passed back** to Agent A, which then summarizes the answer and generates a response to the user. Agent A retains control and continues to handle future user input.  

* **Sub-agent:** When Agent A calls Agent B as a sub-agent, the responsibility of answering the user is completely **transferred to Agent B**. Agent A is effectively out of the loop. All subsequent user input will be answered by Agent B.

### Usage

To use an agent as a tool, wrap the agent with the AgentTool class.

```typescript
import { AgentTool } from 'adk-typescript/tools';

tools: [new AgentTool({ agent: agentB })]
```

### Customization

The `AgentTool` class provides the following attributes for customizing its behavior:

* **skipSummarization: boolean:** If set to true, the framework will **bypass the LLM-based summarization** of the tool agent's response. This can be useful when the tool's response is already well-formatted and requires no further processing.

??? "Example"

    ```typescript
    --8<-- "docs/examples/typescript/snippets/tools/function-tools/Summarizer.ts"
    ```

### How it works

1. When the `mainAgent` receives the long text, its instruction tells it to use the 'summarize' tool for long texts.  
2. The framework recognizes 'summarize' as an `AgentTool` that wraps the `summaryAgent`.  
3. Behind the scenes, the `mainAgent` will call the `summaryAgent` with the long text as input.  
4. The `summaryAgent` will process the text according to its instruction and generate a summary.  
5. **The response from the `summaryAgent` is then passed back to the `mainAgent`.**  
6. The `mainAgent` can then take the summary and formulate its final response to the user (e.g., "Here's a summary of the text: ...")
