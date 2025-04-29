# OpenAPI Integration

## Integrating REST APIs with OpenAPI

ADK simplifies interacting with external REST APIs by automatically generating callable tools directly from an [OpenAPI Specification (v3.x)](https://swagger.io/specification/). This eliminates the need to manually define individual function tools for each API endpoint.

!!! tip "Core Benefit"
    Use `OpenAPIToolset` to instantly create agent tools (`RestApiTool`) from your existing API documentation (OpenAPI spec), enabling agents to seamlessly call your web services.

## Key Components

* **`OpenAPIToolset`**: This is the primary class you'll use. You initialize it with your OpenAPI specification, and it handles the parsing and generation of tools.
* **`RestApiTool`**: This class represents a single, callable API operation (like `GET /pets/{petId}` or `POST /pets`). `OpenAPIToolset` creates one `RestApiTool` instance for each operation defined in your spec.

## How it Works

The process involves these main steps when you use `OpenAPIToolset`:

1. **Initialization & Parsing**:
    * You provide the OpenAPI specification to `OpenAPIToolset` either as a JavaScript object, a JSON string, or a YAML string.
    * The toolset internally parses the spec, resolving any internal references (`$ref`) to understand the complete API structure.

2. **Operation Discovery**:
    * It identifies all valid API operations (e.g., `GET`, `POST`, `PUT`, `DELETE`) defined within the `paths` object of your specification.

3. **Tool Generation**:
    * For each discovered operation, `OpenAPIToolset` automatically creates a corresponding `RestApiTool` instance.
    * **Tool Name**: Derived from the `operationId` in the spec (converted to camelCase). If `operationId` is missing, a name is generated from the method and path.
    * **Tool Description**: Uses the `summary` or `description` from the operation for the LLM.
    * **API Details**: Stores the required HTTP method, path, server base URL, parameters (path, query, header, cookie), and request body schema internally.

4. **`RestApiTool` Functionality**: Each generated `RestApiTool`:
    * **Schema Generation**: Dynamically creates a `FunctionDeclaration` based on the operation's parameters and request body. This schema tells the LLM how to call the tool (what arguments are expected).
    * **Execution**: When called by the LLM, it constructs the correct HTTP request (URL, headers, query params, body) using the arguments provided by the LLM and the details from the OpenAPI spec. It handles authentication (if configured) and executes the API call.
    * **Response Handling**: Returns the API response (typically JSON) back to the agent flow.

5. **Authentication**: You can configure global authentication (like API keys or OAuth - see [Authentication](../tools/authentication.md) for details) when initializing `OpenAPIToolset`. This authentication configuration is automatically applied to all generated `RestApiTool` instances.

## Usage Workflow

Follow these steps to integrate an OpenAPI spec into your agent:

1. **Obtain Spec**: Get your OpenAPI specification document (e.g., load from a `.json` or `.yaml` file, fetch from a URL).
2. **Instantiate Toolset**: Create an `OpenAPIToolset` instance, passing the spec content and type (`specStr`/`specDict`, `specStrType`). Provide authentication details (`authScheme`, `authCredential`) if required by the API.

    ```typescript
    import { OpenAPIToolset } from 'adk-typescript';
    import * as fs from 'fs';

    // Example with a JSON string
    const openApiSpecJson = '...'; // Your OpenAPI JSON string
    const toolset = new OpenAPIToolset({
      specStr: openApiSpecJson, 
      specStrType: 'json'
    });

    // Example loading from file
    const openApiSpecYaml = fs.readFileSync('petstore.yaml', 'utf8');
    const toolsetFromFile = new OpenAPIToolset({
      specStr: openApiSpecYaml,
      specStrType: 'yaml'
    });

    // Example with a JavaScript object
    // const openApiSpecObj = {...}; // Your OpenAPI spec as an object
    // const toolsetFromObj = new OpenAPIToolset({
    //   specDict: openApiSpecObj
    // });
    ```

3. **Retrieve Tools**: Get the list of generated `RestApiTool` instances from the toolset.

    ```typescript
    const apiTools = toolset.getTools();
    // Or get a specific tool by its generated name (camelCase operationId)
    // const specificTool = toolset.getTool("listPets");
    ```

4. **Add to Agent**: Include the retrieved tools in your `Agent`'s `tools` list.

    ```typescript
    import { Agent } from 'adk-typescript';

    const myAgent = new Agent({
      name: "api_interacting_agent",
      model: "gemini-2.0-flash", // Or your preferred model
      tools: apiTools, // Pass the list of generated tools
      // ... other agent config ...
    });
    ```

5. **Instruct Agent**: Update your agent's instructions to inform it about the new API capabilities and the names of the tools it can use (e.g., `listPets`, `createPet`). The tool descriptions generated from the spec will also help the LLM.
6. **Run Agent**: Execute your agent using the `Runner`. When the LLM determines it needs to call one of the APIs, it will generate a function call targeting the appropriate `RestApiTool`, which will then handle the HTTP request automatically.

## Example

This example demonstrates generating tools from a simple Pet Store OpenAPI spec (using `httpbin.org` for mock responses) and interacting with them via an agent.

???+ "Code: Pet Store API"

    ```typescript title="openapi_example.ts"
    import { 
      OpenAPIToolset, 
      Agent, 
      Runner, 
      InMemorySessionService,
      Content 
    } from 'adk-typescript';
    import * as fs from 'fs';
    
    async function main() {
      // 1. Load the OpenAPI specification
      // This simplified pet store spec points to httpbin.org to simulate actual API responses
      const spec = `
      openapi: 3.0.0
      info:
        title: Simplified Pet Store API
        version: 1.0.0
        description: A simplified pet store API for demonstration
      servers:
        - url: https://httpbin.org
      paths:
        /anything/pets:
          get:
            operationId: listPets
            summary: List all pets
            description: Returns a list of all available pets
            responses:
              '200':
                description: A list of pets
        /anything/pets/{petId}:
          get:
            operationId: getPetById
            summary: Get a pet by ID
            description: Returns details for a specific pet
            parameters:
              - name: petId
                in: path
                required: true
                schema:
                  type: string
                description: The ID of the pet to retrieve
            responses:
              '200':
                description: Pet details
      `;
    
      // 2. Create the OpenAPIToolset
      const toolset = new OpenAPIToolset({
        specStr: spec,
        specStrType: 'yaml'
      });
    
      // 3. Get the generated API tools
      const apiTools = toolset.getTools();
      console.log(`Generated ${apiTools.length} API tools:`);
      apiTools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });
    
      // 4. Create an agent with the API tools
      const agent = new Agent({
        name: "pet_store_agent",
        model: "gemini-2.0-flash",
        description: "An agent that can interact with the Pet Store API",
        instruction: `You can help users interact with the Pet Store API.
          You can list all pets and get details for a specific pet by ID.
          Use the appropriate API tool when a user asks about pets.`,
        tools: apiTools
      });
    
      // 5. Set up a session and runner
      const sessionService = new InMemorySessionService();
      const session = await sessionService.createSession({
        appName: "pet_store_demo",
        userId: "user123"
      });
    
      const runner = new Runner({
        appName: "pet_store_demo",
        agent: agent,
        sessionService: sessionService
      });
    
      // 6. Function to process user queries
      async function processQuery(query: string) {
        console.log(`\nUser Query: ${query}`);
        
        const content = {
          role: "user",
          parts: [{ text: query }]
        };
    
        for await (const event of runner.runAsync({
          sessionId: session.id,
          userId: "user123",
          newMessage: content
        })) {
          if (event.content?.parts?.[0]?.text) {
            console.log(`Agent: ${event.content.parts[0].text}`);
          }
        }
      }
    
      // 7. Run some example queries
      await processQuery("Can you show me all the available pets?");
      await processQuery("Get details for pet with ID 123");
    }
    
    main().catch(console.error);
    ```
