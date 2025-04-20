# OpenAPI Tool Module

This module provides tools for working with OpenAPI specifications and creating tools that interact with REST APIs documented with OpenAPI.

## Features

- Parse OpenAPI specifications into a set of tools
- Automatically generate tool parameters from OpenAPI operations
- Support for authentication with various schemes (API key, OAuth2, etc.)
- Convert between OpenAPI schema and Gemini schema formats
- Execute REST API calls with proper parameter handling

## Usage

```typescript
import { OpenAPIToolset } from '@google/adk/tools/openapi_tool';

// Create a toolset from an OpenAPI specification string
const openApiSpec = `
openapi: 3.0.0
info:
  title: Pet Store API
  version: 1.0.0
paths:
  /pets:
    get:
      operationId: listPets
      summary: List all pets
      responses:
        '200':
          description: A list of pets
`;

// Create a toolset from a YAML OpenAPI spec
const petStoreToolset = new OpenAPIToolset({
  specStr: openApiSpec,
  specStrType: 'yaml'
});

// Get all tools from the toolset
const tools = petStoreToolset.getTools();

// Find a specific tool
const listPetsTool = petStoreToolset.getTool('list_pets');

// Use the tool
const result = await listPetsTool.execute({}, toolContext);
```

## Components

The module is organized into the following components:

1. **OpenAPIToolset** - Main class for creating a toolset from an OpenAPI specification
2. **RestApiTool** - Tool implementation for a single REST API operation
3. **OpenApiSpecParser** - Parser for OpenAPI specifications
4. **Common Utilities** - Helper functions for schema conversion, type hints, etc.
5. **Authentication** - Support for various authentication schemes

## Integration with ADK

This module integrates with the ADK framework, allowing you to use OpenAPI-based tools in your agents:

```typescript
import { Agent } from '@google/adk';
import { OpenAPIToolset } from '@google/adk/tools/openapi_tool';

// Create an agent with OpenAPI tools
const agent = new Agent({
  name: 'PetStoreAgent',
  tools: [
    ...new OpenAPIToolset({
      specStr: petStoreSpec,
      specStrType: 'yaml'
    }).getTools()
  ]
});
``` 