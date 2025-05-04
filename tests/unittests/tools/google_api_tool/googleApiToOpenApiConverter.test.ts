import { GoogleApiToOpenApiConverterImpl } from '../../../../src/tools/google-api-tool/GoogleApiToOpenApiConverter';

// Mock the googleapis build function
jest.mock('googleapis', () => {
  return {
    google: {
      discoverAPI: jest.fn()
    }
  };
});

/**
 * Calendar API test fixture
 */
function getCalendarApiSpec() {
  return {
    "kind": "discovery#restDescription",
    "id": "calendar:v3",
    "name": "calendar",
    "version": "v3",
    "title": "Google Calendar API",
    "description": "Accesses the Google Calendar API",
    "documentationLink": "https://developers.google.com/calendar/",
    "protocol": "rest",
    "rootUrl": "https://www.googleapis.com/",
    "servicePath": "calendar/v3/",
    "auth": {
      "oauth2": {
        "scopes": {
          "https://www.googleapis.com/auth/calendar": {
            "description": "Full access to Google Calendar"
          },
          "https://www.googleapis.com/auth/calendar.readonly": {
            "description": "Read-only access to Google Calendar"
          },
        }
      }
    },
    "schemas": {
      "Calendar": {
        "type": "object",
        "description": "A calendar resource",
        "properties": {
          "id": {
            "type": "string",
            "description": "Calendar identifier",
          },
          "summary": {
            "type": "string",
            "description": "Calendar summary",
            "required": true,
          },
          "timeZone": {
            "type": "string",
            "description": "Calendar timezone",
          },
        },
      },
      "Event": {
        "type": "object",
        "description": "An event resource",
        "properties": {
          "id": { "type": "string", "description": "Event identifier" },
          "summary": { "type": "string", "description": "Event summary" },
          "start": { "$ref": "EventDateTime" },
          "end": { "$ref": "EventDateTime" },
          "attendees": {
            "type": "array",
            "description": "Event attendees",
            "items": { "$ref": "EventAttendee" },
          },
        },
      },
      "EventDateTime": {
        "type": "object",
        "description": "Date/time for an event",
        "properties": {
          "dateTime": {
            "type": "string",
            "format": "date-time",
            "description": "Date/time in RFC3339 format",
          },
          "timeZone": {
            "type": "string",
            "description": "Timezone for the date/time",
          },
        },
      },
      "EventAttendee": {
        "type": "object",
        "description": "An attendee of an event",
        "properties": {
          "email": { "type": "string", "description": "Attendee email" },
          "responseStatus": {
            "type": "string",
            "description": "Response status",
            "enum": [
              "needsAction",
              "declined",
              "tentative",
              "accepted",
            ],
          },
        },
      },
    },
    "resources": {
      "calendars": {
        "methods": {
          "get": {
            "id": "calendar.calendars.get",
            "flatPath": "calendars/{calendarId}",
            "httpMethod": "GET",
            "description": "Returns metadata for a calendar.",
            "parameters": {
              "calendarId": {
                "type": "string",
                "description": "Calendar identifier",
                "required": true,
                "location": "path",
              }
            },
            "response": { "$ref": "Calendar" },
            "scopes": [
              "https://www.googleapis.com/auth/calendar",
              "https://www.googleapis.com/auth/calendar.readonly",
            ],
          },
          "insert": {
            "id": "calendar.calendars.insert",
            "path": "calendars",
            "httpMethod": "POST",
            "description": "Creates a secondary calendar.",
            "request": { "$ref": "Calendar" },
            "response": { "$ref": "Calendar" },
            "scopes": ["https://www.googleapis.com/auth/calendar"],
          },
        },
        "resources": {
          "events": {
            "methods": {
              "list": {
                "id": "calendar.events.list",
                "flatPath": "calendars/{calendarId}/events",
                "httpMethod": "GET",
                "description": "Returns events on the specified calendar.",
                "parameters": {
                  "calendarId": {
                    "type": "string",
                    "description": "Calendar identifier",
                    "required": true,
                    "location": "path",
                  },
                  "maxResults": {
                    "type": "integer",
                    "description": "Maximum number of events returned",
                    "format": "int32",
                    "minimum": "1",
                    "maximum": "2500",
                    "default": "250",
                    "location": "query",
                  },
                  "orderBy": {
                    "type": "string",
                    "description": "Order of the events returned",
                    "enum": ["startTime", "updated"],
                    "location": "query",
                  },
                },
                "response": { "$ref": "Events" },
                "scopes": [
                  "https://www.googleapis.com/auth/calendar",
                  "https://www.googleapis.com/auth/calendar.readonly",
                ],
              }
            }
          }
        },
      }
    },
  };
}

/**
 * Mock API resource for testing
 */
class MockApiResource {
  _rootDesc: any;

  constructor(apiSpec: any) {
    this._rootDesc = apiSpec;
  }
}

// Mock HttpError for testing error handling
class MockHttpError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

describe('GoogleApiToOpenApiConverter', () => {
  let converter: GoogleApiToOpenApiConverterImpl;
  let mockApiResource: MockApiResource;
  let calendarApiSpec: any;

  // Setup before each test
  beforeEach(() => {
    calendarApiSpec = getCalendarApiSpec();
    converter = new GoogleApiToOpenApiConverterImpl('calendar', 'v3');
    mockApiResource = new MockApiResource(calendarApiSpec);
  });

  describe('Initialization', () => {
    test('should initialize with API name and version', () => {
      expect(converter['apiName']).toBe('calendar');
      expect(converter['apiVersion']).toBe('v3');
      expect(converter['googleApiResource']).toBeNull();
      expect(converter['googleApiSpec']).toBeNull();
      expect(converter['openApiSpec'].openapi).toBe('3.0.0');
      expect('info' in converter['openApiSpec']).toBeTruthy();
      expect('paths' in converter['openApiSpec']).toBeTruthy();
      expect('components' in converter['openApiSpec']).toBeTruthy();
    });
  });

  describe('API Spec Conversion', () => {
    beforeEach(() => {
      // Manually set the API spec instead of fetching it
      converter['googleApiSpec'] = calendarApiSpec;
    });

    test('should convert basic API information', () => {
      // Call the method
      converter['_convertInfo']();

      // Verify the results
      const info = converter['openApiSpec'].info;
      expect(info.title).toBe('Google Calendar API');
      expect(info.description).toBe('Accesses the Google Calendar API');
      expect(info.version).toBe('v3');
      expect(info.termsOfService).toBe('https://developers.google.com/calendar/');

      // Check external docs
      const externalDocs = converter['openApiSpec'].externalDocs;
      expect(externalDocs.url).toBe('https://developers.google.com/calendar/');
    });

    test('should convert server information', () => {
      // Call the method
      converter['_convertServers']();

      // Verify the results
      const servers = converter['openApiSpec'].servers;
      expect(servers.length).toBe(1);
      expect(servers[0].url).toBe('https://www.googleapis.com/calendar/v3');
      expect(servers[0].description).toBe('calendar v3 API');
    });

    test('should convert security schemes', () => {
      // Call the method
      converter['_convertSecuritySchemes']();

      // Verify the results
      const securitySchemes = converter['openApiSpec'].components.securitySchemes;

      // Check OAuth2 configuration
      expect('oauth2' in securitySchemes).toBeTruthy();
      const oauth2 = securitySchemes.oauth2;
      expect(oauth2.type).toBe('oauth2');

      // Check OAuth2 scopes
      const scopes = oauth2.flows.authorizationCode.scopes;
      expect('https://www.googleapis.com/auth/calendar' in scopes).toBeTruthy();
      expect('https://www.googleapis.com/auth/calendar.readonly' in scopes).toBeTruthy();

      // Check API key configuration
      expect('apiKey' in securitySchemes).toBeTruthy();
      expect(securitySchemes.apiKey.type).toBe('apiKey');
      expect(securitySchemes.apiKey.in).toBe('query');
      expect(securitySchemes.apiKey.name).toBe('key');
    });

    test('should convert schemas', () => {
      // Call the method
      converter['_convertSchemas']();

      // Verify the results
      const schemas = converter['openApiSpec'].components.schemas;

      // Check Calendar schema
      expect('Calendar' in schemas).toBeTruthy();
      const calendarSchema = schemas.Calendar;
      expect(calendarSchema.type).toBe('object');
      expect(calendarSchema.description).toBe('A calendar resource');

      // Check required properties
      expect('required' in calendarSchema).toBeTruthy();
      expect(calendarSchema.required).toContain('summary');

      // Check Event schema references
      expect('Event' in schemas).toBeTruthy();
      const eventSchema = schemas.Event;
      expect(eventSchema.properties.start.$ref).toBe('#/components/schemas/EventDateTime');

      // Check array type with references
      const attendeesSchema = eventSchema.properties.attendees;
      expect(attendeesSchema.type).toBe('array');
      expect(attendeesSchema.items.$ref).toBe('#/components/schemas/EventAttendee');

      // Check enum values
      const attendeeSchema = schemas.EventAttendee;
      const responseStatus = attendeeSchema.properties.responseStatus;
      expect('enum' in responseStatus).toBeTruthy();
      expect(responseStatus.enum).toContain('accepted');
    });
  });

  describe('Schema Conversion Tests', () => {
    test('should convert object type schema', () => {
      const schemaDef = {
        "type": "object",
        "description": "Test object",
        "properties": {
          "id": { "type": "string", "required": true },
          "name": { "type": "string" },
        },
      };

      const converted = converter['_convertSchemaObject'](schemaDef);
      
      expect(converted.type).toBe('object');
      expect(converted.description).toBe('Test object');
      expect('required' in converted).toBeTruthy();
      expect(converted.required).toContain('id');
    });

    test('should convert array type schema', () => {
      const schemaDef = {
        "type": "array",
        "description": "Test array",
        "items": { "type": "string" },
      };

      const converted = converter['_convertSchemaObject'](schemaDef);
      
      expect(converted.type).toBe('array');
      expect(converted.description).toBe('Test array');
      expect(converted.items && converted.items.type).toBe('string');
    });

    test('should convert references', () => {
      const schemaDef = { "$ref": "Calendar" };

      const converted = converter['_convertSchemaObject'](schemaDef);
      
      expect(converted.$ref).toBe('#/components/schemas/Calendar');
    });

    test('should convert enums', () => {
      const schemaDef = { "type": "string", "enum": ["value1", "value2"] };

      const converted = converter['_convertSchemaObject'](schemaDef);
      
      expect(converted.type).toBe('string');
      expect(converted.enum).toEqual(["value1", "value2"]);
    });
  });

  describe('Path Parameter Extraction', () => {
    test('should extract path parameters with parameters', () => {
      const path = '/calendars/{calendarId}/events/{eventId}';
      const params = converter['_extractPathParameters'](path);
      
      expect(params).toContain('calendarId');
      expect(params).toContain('eventId');
      expect(params.length).toBe(2);
    });

    test('should extract path parameters without parameters', () => {
      const path = '/calendars/events';
      const params = converter['_extractPathParameters'](path);
      
      expect(params.length).toBe(0);
    });

    test('should extract path parameters from mixed paths', () => {
      const path = '/users/{userId}/calendars/default';
      const params = converter['_extractPathParameters'](path);
      
      expect(params).toContain('userId');
      expect(params.length).toBe(1);
    });
  });

  describe('Parameter Schema Conversion', () => {
    test('should convert string parameter with pattern', () => {
      const paramData = {
        "type": "string",
        "description": "String parameter",
        "pattern": "^[a-z]+$",
      };

      const converted = converter['_convertParameterSchema'](paramData);
      
      expect(converted.type).toBe('string');
      expect(converted.pattern).toBe('^[a-z]+$');
    });

    test('should convert integer parameter with format', () => {
      const paramData = {
        "type": "integer",
        "format": "int32",
        "default": "10",
      };

      const converted = converter['_convertParameterSchema'](paramData);
      
      expect(converted.type).toBe('integer');
      expect(converted.format).toBe('int32');
      expect(converted.default).toBe('10');
    });

    test('should convert enum parameter', () => {
      const paramData = {
        "type": "string",
        "enum": ["option1", "option2"],
      };

      const converted = converter['_convertParameterSchema'](paramData);
      
      expect(converted.type).toBe('string');
      expect(converted.enum).toEqual(["option1", "option2"]);
    });
  });

  describe('Method Conversion', () => {
    beforeEach(() => {
      // Reset the OpenAPI spec paths before each test
      converter['openApiSpec'].paths = {};
    });

    test('should convert methods', () => {
      // Get the methods from the calendar API spec
      const methods = calendarApiSpec.resources.calendars.methods;
      
      // Call the method
      converter['_convertMethods'](methods, '/calendars');

      // Verify the results
      const paths = converter['openApiSpec'].paths;

      // Check GET method
      expect('/calendars/{calendarId}' in paths).toBeTruthy();
      const getMethod = paths['/calendars/{calendarId}'].get;
      expect(getMethod.operationId).toBe('calendar.calendars.get');

      // Check parameters
      const params = getMethod.parameters;
      const paramNames = params.map((p: any) => p.name);
      expect(paramNames).toContain('calendarId');

      // Check POST method
      expect('/calendars' in paths).toBeTruthy();
      const postMethod = paths['/calendars'].post;
      expect(postMethod.operationId).toBe('calendar.calendars.insert');

      // Check request body
      expect('requestBody' in postMethod).toBeTruthy();
      expect(postMethod.requestBody.content['application/json'].schema.$ref)
        .toBe('#/components/schemas/Calendar');

      // Check response
      expect(postMethod.responses['200'].content['application/json'].schema.$ref)
        .toBe('#/components/schemas/Calendar');
    });
  });

  describe('Resource Conversion', () => {
    beforeEach(() => {
      // Reset the OpenAPI spec paths before each test
      converter['openApiSpec'].paths = {};
    });

    test('should convert resources', () => {
      // Get the resources from the calendar API spec
      const resources = calendarApiSpec.resources;
      
      // Call the method
      converter['_convertResources'](resources);

      // Verify the results
      const paths = converter['openApiSpec'].paths;

      // Check top-level resource methods
      expect('/calendars/{calendarId}' in paths).toBeTruthy();

      // Check nested resource methods
      expect('/calendars/{calendarId}/events' in paths).toBeTruthy();
      const eventsMethod = paths['/calendars/{calendarId}/events'].get;
      expect(eventsMethod.operationId).toBe('calendar.events.list');

      // Check parameters in nested resource
      const params = eventsMethod.parameters;
      const paramNames = params.map((p: any) => p.name);
      expect(paramNames).toContain('calendarId');
      expect(paramNames).toContain('maxResults');
      expect(paramNames).toContain('orderBy');
    });
  });

  describe('Full Conversion', () => {
    test('should perform complete conversion', async () => {
      // Mock Google API fetch
      jest.spyOn(converter, 'fetchGoogleApiSpec').mockImplementation(async () => {
        converter['googleApiSpec'] = calendarApiSpec;
        return Promise.resolve();
      });
      
      // Call the convert method
      const openApiSpec = await converter.convert();

      // Verify conversion results
      expect(openApiSpec.info.title).toBe('Google Calendar API');
      expect(openApiSpec.servers[0].url).toBe('https://www.googleapis.com/calendar/v3');

      // Check security schemes
      const securitySchemes = openApiSpec.components.securitySchemes;
      expect('oauth2' in securitySchemes).toBeTruthy();
      expect('apiKey' in securitySchemes).toBeTruthy();

      // Check schemas
      const schemas = openApiSpec.components.schemas;
      expect('Calendar' in schemas).toBeTruthy();
      expect('Event' in schemas).toBeTruthy();
      expect('EventDateTime' in schemas).toBeTruthy();

      // Check paths
      const paths = openApiSpec.paths;
      expect('/calendars/{calendarId}' in paths).toBeTruthy();
      expect('/calendars' in paths).toBeTruthy();
      expect('/calendars/{calendarId}/events' in paths).toBeTruthy();

      // Check method details
      const getEvents = paths['/calendars/{calendarId}/events'].get;
      expect(getEvents.operationId).toBe('calendar.events.list');

      // Check parameter details
      const paramDict: Record<string, any> = {};
      getEvents.parameters.forEach((p: any) => {
        paramDict[p.name] = p;
      });
      
      expect('maxResults' in paramDict).toBeTruthy();
      const maxResults = paramDict.maxResults;
      expect(maxResults.in).toBe('query');
      expect(maxResults.schema.type).toBe('integer');
      expect(maxResults.schema.default).toBe('250');
    });

    test('should handle errors when fetching Google API spec', async () => {
      // Mock fetchGoogleApiSpec to throw an error
      jest.spyOn(converter, 'fetchGoogleApiSpec').mockImplementation(async () => {
        throw new MockHttpError(404, 'API Not Found');
      });
      
      // Verify the error is propagated
      await expect(converter.convert()).rejects.toThrow('API Not Found');
    });
  });
}); 