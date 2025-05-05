import { ApiParameter } from '../../../../../src/tools/openapi-tool/common/common';
import { OpenApiSpecParser } from '../../../../../src/tools/openapi-tool/openapi-spec-parser/OpenApiSpecParser';

/**
 * Creates a minimal valid OpenAPI spec for testing
 */
function createMinimalOpenApiSpec(): Record<string, any> {
  return {
    "openapi": "3.1.0",
    "info": {"title": "Minimal API", "version": "1.0.0"},
    "paths": {
      "/test": {
        "get": {
          "summary": "Test GET endpoint",
          "operationId": "testGet",
          "responses": {
            "200": {
              "description": "Successful response",
              "content": {
                "application/json": {"schema": {"type": "string"}}
              },
            }
          },
        }
      }
    },
  };
}

describe('OpenApiSpecParser', () => {
  let openApiSpecParser: OpenApiSpecParser;

  beforeEach(() => {
    openApiSpecParser = new OpenApiSpecParser();
  });

  test('parse_minimal_spec', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    
    const parsedOperations = openApiSpecParser.parse(openApiSpec);
    const op = parsedOperations[0];

    expect(parsedOperations.length).toBe(1);
    expect(op.name).toBe("test_get");
    expect(op.endpoint.path).toBe("/test");
    expect(op.endpoint.method).toBe("get");
    expect(op.returnValue.typeValue).toBe(String);
  });

  test('parse_spec_with_no_operation_id', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    delete openApiSpec.paths["/test"].get.operationId; // Remove operationId

    const parsedOperations = openApiSpecParser.parse(openApiSpec);

    expect(parsedOperations.length).toBe(1);
    // Check if operationId is auto generated based on path and method
    expect(parsedOperations[0].name).toBe("test_get");
  });

  test('parse_spec_with_multiple_methods', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    openApiSpec.paths["/test"].post = {
      "summary": "Test POST endpoint",
      "operationId": "testPost",
      "responses": {"200": {"description": "Successful response"}},
    };

    const parsedOperations = openApiSpecParser.parse(openApiSpec);
    const operationNames = new Set(parsedOperations.map(op => op.name));

    expect(parsedOperations.length).toBe(2);
    expect(operationNames.has("test_get")).toBe(true);
    expect(operationNames.has("test_post")).toBe(true);
  });

  test('parse_spec_with_parameters', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    openApiSpec.paths["/test"].get.parameters = [
      {"name": "param1", "in": "query", "schema": {"type": "string"}},
      {"name": "param2", "in": "header", "schema": {"type": "integer"}},
    ];

    const parsedOperations = openApiSpecParser.parse(openApiSpec);

    expect(parsedOperations[0].parameters.length).toBe(2);
    expect(parsedOperations[0].parameters[0].originalName).toBe("param1");
    expect(parsedOperations[0].parameters[0].paramLocation).toBe("query");
    expect(parsedOperations[0].parameters[1].originalName).toBe("param2");
    expect(parsedOperations[0].parameters[1].paramLocation).toBe("header");
  });

  test('parse_spec_with_request_body', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    openApiSpec.paths["/test"].post = {
      "summary": "Endpoint with request body",
      "operationId": "testPostWithBody",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {"name": {"type": "string"}},
            }
          }
        }
      },
      "responses": {"200": {"description": "OK"}},
    };

    const parsedOperations = openApiSpecParser.parse(openApiSpec);
    const postOperations = parsedOperations.filter(
      op => op.endpoint.method === "post"
    );
    const op = postOperations[0];

    expect(postOperations.length).toBe(1);
    expect(op.name).toBe("test_post_with_body");
    expect(op.parameters.length).toBe(1);
    expect(op.parameters[0].originalName).toBe("name");
    expect(op.parameters[0].typeValue).toBe(String);
  });

  test('parse_spec_with_reference', () => {
    const openApiSpec = {
      "openapi": "3.1.0",
      "info": {"title": "API with Refs", "version": "1.0.0"},
      "paths": {
        "/test_ref": {
          "get": {
            "summary": "Endpoint with ref",
            "operationId": "testGetRef",
            "responses": {
              "200": {
                "description": "Success",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/MySchema"
                    }
                  }
                },
              }
            },
          }
        }
      },
      "components": {
        "schemas": {
          "MySchema": {
            "type": "object",
            "properties": {"name": {"type": "string"}},
          }
        }
      },
    };
    
    const parsedOperations = openApiSpecParser.parse(openApiSpec);
    const op = parsedOperations[0];

    expect(parsedOperations.length).toBe(1);
    expect(op.returnValue.typeValue).toBe(Object);
  });

  test('parse_spec_with_circular_reference', () => {
    const openApiSpec = {
      "openapi": "3.1.0",
      "info": {"title": "Circular Ref API", "version": "1.0.0"},
      "paths": {
        "/circular": {
          "get": {
            "responses": {
              "200": {
                "description": "OK",
                "content": {
                  "application/json": {
                    "schema": {"$ref": "#/components/schemas/A"}
                  }
                },
              }
            }
          }
        }
      },
      "components": {
        "schemas": {
          "A": {
            "type": "object",
            "properties": {"b": {"$ref": "#/components/schemas/B"}},
          },
          "B": {
            "type": "object",
            "properties": {"a": {"$ref": "#/components/schemas/A"}},
          },
        }
      },
    };

    const parsedOperations = openApiSpecParser.parse(openApiSpec);
    expect(parsedOperations.length).toBe(1);

    const op = parsedOperations[0];
    expect(op.returnValue.typeValue).toBe(Object);
    expect(op.returnValue.typeHint).toBe("Record<string, any>");
  });

  test('parse_no_paths', () => {
    const openApiSpec = {
      "openapi": "3.1.0",
      "info": {"title": "No Paths API", "version": "1.0.0"},
    };
    
    const parsedOperations = openApiSpecParser.parse(openApiSpec);
    expect(parsedOperations.length).toBe(0);  // Should be empty
  });

  test('parse_empty_path_item', () => {
    const openApiSpec = {
      "openapi": "3.1.0",
      "info": {"title": "Empty Path Item API", "version": "1.0.0"},
      "paths": {"/empty": null},
    };

    const parsedOperations = openApiSpecParser.parse(openApiSpec);

    expect(parsedOperations.length).toBe(0);
  });

  test('parse_spec_with_global_auth_scheme', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    openApiSpec.security = [{"api_key": []}];
    openApiSpec.components = {
      "securitySchemes": {
        "api_key": {"type": "apiKey", "in": "header", "name": "X-API-Key"}
      }
    };

    const parsedOperations = openApiSpecParser.parse(openApiSpec);
    const op = parsedOperations[0];

    expect(parsedOperations.length).toBe(1);
    expect(op.authScheme).not.toBeUndefined();
    expect(op.authScheme?.type_).toBe("apiKey");
  });

  test('parse_spec_with_local_auth_scheme', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    openApiSpec.paths["/test"].get.security = [{"local_auth": []}];
    openApiSpec.components = {
      "securitySchemes": {"local_auth": {"type": "http", "scheme": "bearer"}}
    };

    const parsedOperations = openApiSpecParser.parse(openApiSpec);
    const op = parsedOperations[0];

    expect(op.authScheme).not.toBeUndefined();
    expect(op.authScheme?.type_).toBe("http");
    expect(op.authScheme?.scheme).toBe("bearer");
  });

  test('parse_spec_with_servers', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    openApiSpec.servers = [
      {"url": "https://api.example.com"},
      {"url": "http://localhost:8000"},
    ];

    const parsedOperations = openApiSpecParser.parse(openApiSpec);

    expect(parsedOperations.length).toBe(1);
    expect(parsedOperations[0].endpoint.baseUrl).toBe("https://api.example.com");
  });

  test('parse_spec_with_no_servers', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    if ("servers" in openApiSpec) {
      delete openApiSpec.servers;
    }

    const parsedOperations = openApiSpecParser.parse(openApiSpec);

    expect(parsedOperations.length).toBe(1);
    expect(parsedOperations[0].endpoint.baseUrl).toBe("");
  });

  test('parse_spec_with_description', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    const expectedDescription = "This is a test description.";
    openApiSpec.paths["/test"].get.description = expectedDescription;

    const parsedOperations = openApiSpecParser.parse(openApiSpec);

    expect(parsedOperations.length).toBe(1);
    expect(parsedOperations[0].description).toBe(expectedDescription);
  });

  test('parse_spec_with_empty_description', () => {
    const openApiSpec = createMinimalOpenApiSpec();
    openApiSpec.paths["/test"].get.description = "";
    openApiSpec.paths["/test"].get.summary = "";

    const parsedOperations = openApiSpecParser.parse(openApiSpec);

    expect(parsedOperations.length).toBe(1);
    expect(parsedOperations[0].description).toBe("");
  });

  test('parse_spec_with_no_description', () => {
    const openApiSpec = createMinimalOpenApiSpec();

    // delete description
    if ("description" in openApiSpec.paths["/test"].get) {
      delete openApiSpec.paths["/test"].get.description;
    }
    if ("summary" in openApiSpec.paths["/test"].get) {
      delete openApiSpec.paths["/test"].get.summary;
    }

    const parsedOperations = openApiSpecParser.parse(openApiSpec);

    expect(parsedOperations.length).toBe(1);
    expect(parsedOperations[0].description).toBe("");  // it should be initialized with empty string
  });

  test('parse_invalid_openapi_spec_type', () => {
    expect(() => {
      // @ts-ignore - Intentionally passing wrong type for test
      openApiSpecParser.parse(123);
    }).toThrow();

    expect(() => {
      // @ts-ignore - Intentionally passing wrong type for test
      openApiSpecParser.parse("openapi_spec");
    }).toThrow();

    expect(() => {
      // @ts-ignore - Intentionally passing wrong type for test
      openApiSpecParser.parse([]);
    }).toThrow();
  });

  test('parse_external_ref_raises_error', () => {
    const openApiSpec = {
      "openapi": "3.1.0",
      "info": {"title": "External Ref API", "version": "1.0.0"},
      "paths": {
        "/external": {
          "get": {
            "responses": {
              "200": {
                "description": "OK",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "external_file.json#/components/schemas/ExternalSchema"
                    }
                  }
                },
              }
            }
          }
        }
      },
    };
    
    expect(() => {
      openApiSpecParser.parse(openApiSpec);
    }).toThrow();
  });

  test('parse_spec_with_multiple_paths_deep_refs', () => {
    const openApiSpec = {
      "openapi": "3.1.0",
      "info": {"title": "Multiple Paths Deep Refs API", "version": "1.0.0"},
      "paths": {
        "/path1": {
          "post": {
            "operationId": "postPath1",
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Request1"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "OK",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/Response1"
                    }
                  }
                },
              }
            },
          }
        },
        "/path2": {
          "put": {
            "operationId": "putPath2",
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Request2"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "OK",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/Response2"
                    }
                  }
                },
              }
            },
          },
          "get": {
            "operationId": "getPath2",
            "responses": {
              "200": {
                "description": "OK",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/Response2"
                    }
                  }
                },
              }
            },
          },
        },
      },
      "components": {
        "schemas": {
          "Request1": {
            "type": "object",
            "properties": {
              "req1_prop1": {"$ref": "#/components/schemas/Level1_1"}
            },
          },
          "Response1": {
            "type": "object",
            "properties": {
              "res1_prop1": {"$ref": "#/components/schemas/Level1_2"}
            },
          },
          "Request2": {
            "type": "object",
            "properties": {
              "req2_prop1": {"$ref": "#/components/schemas/Level1_1"}
            },
          },
          "Response2": {
            "type": "object",
            "properties": {
              "res2_prop1": {"$ref": "#/components/schemas/Level1_2"}
            },
          },
          "Level1_1": {
            "type": "object",
            "properties": {
              "level1_1_prop1": {
                "$ref": "#/components/schemas/Level2_1"
              }
            },
          },
          "Level1_2": {
            "type": "object",
            "properties": {
              "level1_2_prop1": {
                "$ref": "#/components/schemas/Level2_2"
              }
            },
          },
          "Level2_1": {
            "type": "object",
            "properties": {
              "level2_1_prop1": {"$ref": "#/components/schemas/Level3"}
            },
          },
          "Level2_2": {
            "type": "object",
            "properties": {"level2_2_prop1": {"type": "string"}},
          },
          "Level3": {"type": "integer"},
        }
      },
    };

    const parsedOperations = openApiSpecParser.parse(openApiSpec);
    expect(parsedOperations.length).toBe(3);

    // Verify Path 1
    const path1Ops = parsedOperations.filter(op => op.endpoint.path === "/path1");
    expect(path1Ops.length).toBe(1);
    
    const path1Op = path1Ops[0];
    expect(path1Op.name).toBe("post_path1");

    expect(path1Op.parameters.length).toBe(1);
    expect(path1Op.parameters[0].originalName).toBe("req1_prop1");
    
    // Verify returned properties are correctly resolved
    const path1OpRequestSchema = path1Op.parameters[0].paramSchema;
    expect(path1OpRequestSchema.properties?.level1_1_prop1?.properties?.level2_1_prop1?.type).toBe("integer");
    
    const path1OpResponseSchema = path1Op.returnValue.paramSchema;
    expect(path1OpResponseSchema.properties?.res1_prop1?.properties?.level1_2_prop1?.properties?.level2_2_prop1?.type).toBe("string");

    // Verify Path 2
    const path2Ops = parsedOperations.filter(
      op => op.endpoint.path === "/path2" && op.name === "put_path2"
    );
    
    expect(path2Ops.length).toBe(1);
    const path2Op = path2Ops[0];
    
    expect(path2Op.parameters.length).toBe(1);
    expect(path2Op.parameters[0].originalName).toBe("req2_prop1");
    
    // Verify request props are correctly resolved
    const path2OpRequestSchema = path2Op.parameters[0].paramSchema;
    expect(path2OpRequestSchema.properties?.level1_1_prop1?.properties?.level2_1_prop1?.type).toBe("integer");
    
    // Verify response props are correctly resolved
    const path2OpResponseSchema = path2Op.returnValue.paramSchema;
    expect(path2OpResponseSchema.properties?.res2_prop1?.properties?.level1_2_prop1?.properties?.level2_2_prop1?.type).toBe("string");
  });

  test('parse_spec_with_duplicate_parameter_names', () => {
    const openApiSpec = {
      "openapi": "3.1.0",
      "info": {"title": "Duplicate Parameter Names API", "version": "1.0.0"},
      "paths": {
        "/duplicate": {
          "post": {
            "operationId": "createWithDuplicate",
            "parameters": [{
              "name": "name",
              "in": "query",
              "schema": {"type": "string"},
            }],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {"name": {"type": "integer"}},
                  }
                }
              }
            },
            "responses": {"200": {"description": "OK"}},
          }
        }
      },
    };

    const parsedOperations = openApiSpecParser.parse(openApiSpec);
    expect(parsedOperations.length).toBe(1);
    
    const op = parsedOperations[0];
    expect(op.name).toBe("create_with_duplicate");
    expect(op.parameters.length).toBe(2);

    // Find query and body parameters
    let queryParam: ApiParameter | undefined;
    let bodyParam: ApiParameter | undefined;
    
    for (const param of op.parameters) {
      if (param.paramLocation === "query" && param.originalName === "name") {
        queryParam = param;
      } else if (param.paramLocation === "body" && param.originalName === "name") {
        bodyParam = param;
      }
    }

    expect(queryParam).not.toBeUndefined();
    expect(queryParam?.originalName).toBe("name");
    expect(queryParam?.pyName).toBe("name");

    expect(bodyParam).not.toBeUndefined();
    expect(bodyParam?.originalName).toBe("name");
    expect(bodyParam?.pyName).toBe("name_0");
  });
}); 