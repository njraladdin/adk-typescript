import { AuthCredential } from '../../../../src/auth/AuthCredential';
import { ApplicationIntegrationToolset } from '../../../../src/tools/application-integration-tool/ApplicationIntegrationToolset';
import { IntegrationConnectorTool } from '../../../../src/tools/application-integration-tool/IntegrationConnectorTool';
import { IntegrationClient } from '../../../../src/tools/application-integration-tool/IntegrationClient';
import { ConnectionsClient } from '../../../../src/tools/application-integration-tool/ConnectionsClient';
import { OpenAPIToolset } from '../../../../src/tools/openapi-tool/openapi-spec-parser/OpenAPIToolset';
import { RestApiTool } from '../../../../src/tools/openapi-tool/openapi-spec-parser/RestApiTool';

// Mock the necessary dependencies
jest.mock('../../../../src/tools/application-integration-tool/IntegrationClient');
jest.mock('../../../../src/tools/application-integration-tool/ConnectionsClient');
jest.mock('../../../../src/tools/openapi-tool/openapi-spec-parser/OpenAPIToolset');

describe('ApplicationIntegrationToolset', () => {
  const project = 'test-project';
  const location = 'us-central1';
  
  // Prepare mock OpenAPI specs
  const integrationOpenApiSpec = {
    openapi: '3.0.0',
    info: { title: 'Integration API' },
    paths: {
      '/v1/issues': {
        get: {
          operationId: 'list_issues',
          description: 'List issues',
          'x-entity': 'Issues',
          'x-operation': 'LIST_ENTITIES'
        }
      }
    }
  };
  
  const connectionOpenApiSpec = {
    openapi: '3.0.0',
    info: { title: 'Connection API' },
    paths: {
      '/v1/actions': {
        post: {
          operationId: 'list_issues_operation',
          description: 'Custom action',
          'x-action': 'CustomAction',
          'x-operation': 'EXECUTE_ACTION'
        }
      }
    }
  };
  
  // Connection details for mocking
  const connectionDetails = {
    serviceName: 'test-service',
    host: 'test.host',
    name: 'test-connection'
  };

  // Client instance mocks
  let mockIntegrationClient: { getOpenApiSpecForIntegration: jest.Mock; getOpenApiSpecForConnection: jest.Mock };
  let mockConnectionsClient: { getConnectionDetails: jest.Mock };
  let mockOpenAPIToolset: { getTools: jest.Mock };
  let mockRestApiTool: any;

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock RestApiTool that will be returned by OpenAPIToolset
    mockRestApiTool = {
      name: 'list_issues',
      description: 'List issues',
      parsedOperation: {
        operation: {
          'x-entity': 'Issues',
          'x-operation': 'LIST_ENTITIES'
        }
      }
    };
    
    // Setup mock methods
    const getOpenApiSpecForIntegration = jest.fn().mockReturnValue(integrationOpenApiSpec);
    const getOpenApiSpecForConnection = jest.fn().mockReturnValue(connectionOpenApiSpec);
    const getConnectionDetails = jest.fn().mockReturnValue(connectionDetails);
    const getTools = jest.fn().mockResolvedValue([mockRestApiTool]);
    
    // Create mock instances
    mockIntegrationClient = {
      getOpenApiSpecForIntegration,
      getOpenApiSpecForConnection
    };
    
    mockConnectionsClient = {
      getConnectionDetails
    };
    
    mockOpenAPIToolset = {
      getTools
    };
    
    // Setup mock constructors
    (IntegrationClient as jest.Mock).mockImplementation(() => mockIntegrationClient);
    (ConnectionsClient as unknown as jest.Mock).mockImplementation(() => mockConnectionsClient);
    (OpenAPIToolset as jest.Mock).mockImplementation(() => mockOpenAPIToolset);
  });

  describe('Initialization', () => {
    it('should initialize with integration and trigger', async () => {
      const integrationName = 'test-integration';
      const triggerName = 'test-trigger';
      
      const toolset = new ApplicationIntegrationToolset(
        project, 
        location, 
        {
          integration: integrationName, 
          triggers: [triggerName]
        }
      );
      
      // Check that the IntegrationClient was called with correct parameters
      expect(IntegrationClient).toHaveBeenCalledWith(
        project, location, integrationName, [triggerName], null, null, null, null
      );
      
      // Check that tools were created
      const tools = await toolset.getTools();
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should initialize with integration and list of triggers', async () => {
      const integrationName = 'test-integration';
      const triggers = ['test-trigger1', 'test-trigger2'];
      
      const toolset = new ApplicationIntegrationToolset(
        project, 
        location, 
        {
          integration: integrationName, 
          triggers: triggers
        }
      );
      
      // Check that the IntegrationClient was called with correct parameters
      expect(IntegrationClient).toHaveBeenCalledWith(
        project, location, integrationName, triggers, null, null, null, null
      );
      
      // Check that tools were created
      const tools = await toolset.getTools();
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should initialize with integration and empty trigger list', async () => {
      const integrationName = 'test-integration';
      
      const toolset = new ApplicationIntegrationToolset(
        project, 
        location, 
        {
          integration: integrationName
        }
      );
      
      // Check that the IntegrationClient was called with correct parameters
      expect(IntegrationClient).toHaveBeenCalledWith(
        project, location, integrationName, null, null, null, null, null
      );
      
      // Check that tools were created
      const tools = await toolset.getTools();
      expect(tools.length).toBeGreaterThan(0);
    });
    
    it('should initialize with connection and entity operations', async () => {
      const connectionName = 'test-connection';
      const entityOperationsList = ['list', 'get'];
      const toolName = 'My Connection Tool';
      const toolInstructions = 'Use this tool to manage entities.';
      
      const toolset = new ApplicationIntegrationToolset(
        project, 
        location, 
        {
          connection: connectionName,
          entityOperations: entityOperationsList,
          toolName,
          toolInstructions
        }
      );
      
      // Check that the clients were called with correct parameters
      expect(IntegrationClient).toHaveBeenCalledWith(
        project, location, null, null, connectionName, entityOperationsList, null, null
      );
      
      expect(ConnectionsClient).toHaveBeenCalledWith(
        project, location, connectionName, null
      );
      
      // Check that the mock methods were called
      expect(mockConnectionsClient.getConnectionDetails).toHaveBeenCalled();
      expect(mockIntegrationClient.getOpenApiSpecForConnection).toHaveBeenCalledWith(
        toolName, toolInstructions
      );
      
      // Check that tools were created
      const tools = await toolset.getTools();
      expect(tools.length).toBeGreaterThan(0);
    });
    
    it('should initialize with connection and actions', async () => {
      const connectionName = 'test-connection';
      const actionsList = ['create', 'delete'];
      const toolName = 'My Actions Tool';
      const toolInstructions = 'Perform actions using this tool.';
      
      const toolset = new ApplicationIntegrationToolset(
        project, 
        location, 
        {
          connection: connectionName,
          actions: actionsList,
          toolName,
          toolInstructions
        }
      );
      
      // Check that the clients were called with correct parameters
      expect(IntegrationClient).toHaveBeenCalledWith(
        project, location, null, null, connectionName, null, actionsList, null
      );
      
      expect(ConnectionsClient).toHaveBeenCalledWith(
        project, location, connectionName, null
      );
      
      // Check that the mock methods were called
      expect(mockConnectionsClient.getConnectionDetails).toHaveBeenCalled();
      expect(mockIntegrationClient.getOpenApiSpecForConnection).toHaveBeenCalledWith(
        toolName, toolInstructions
      );
      
      // Check that tools were created
      const tools = await toolset.getTools();
      expect(tools.length).toBeGreaterThan(0);
    });
    
    it('should throw error without required params', () => {
      expect(() => {
        new ApplicationIntegrationToolset(project, location, {});
      }).toThrow(/Either \(integration and triggers\) or \(connection and \(entityOperations or actions\)\) should be provided/);
      
      expect(() => {
        new ApplicationIntegrationToolset(project, location, { triggers: ['test'] });
      }).toThrow(/Either \(integration and triggers\) or \(connection and \(entityOperations or actions\)\) should be provided/);
      
      expect(() => {
        new ApplicationIntegrationToolset(project, location, { connection: 'test' });
      }).toThrow(/Either \(integration and triggers\) or \(connection and \(entityOperations or actions\)\) should be provided/);
    });
    
    it('should initialize with service account credentials', () => {
      const serviceAccountJson = JSON.stringify({
        type: 'service_account',
        project_id: 'dummy',
        private_key_id: 'dummy',
        private_key: 'dummy',
        client_email: 'test@example.com',
        client_id: '131331543646416',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'http://www.googleapis.com/robot/v1/metadata/x509/dummy%40dummy.com',
        universe_domain: 'googleapis.com'
      });
      
      const integrationName = 'test-integration';
      const triggerName = 'test-trigger';
      
      const toolset = new ApplicationIntegrationToolset(
        project, 
        location, 
        {
          integration: integrationName,
          triggers: [triggerName],
          serviceAccountJson
        }
      );
      
      // Check that the IntegrationClient was called with service account JSON
      expect(IntegrationClient).toHaveBeenCalledWith(
        project, location, integrationName, [triggerName], null, null, null, serviceAccountJson
      );
    });
    
    it('should initialize without explicit service account credentials', () => {
      const integrationName = 'test-integration';
      const triggerName = 'test-trigger';
      
      const toolset = new ApplicationIntegrationToolset(
        project, 
        location, 
        {
          integration: integrationName,
          triggers: [triggerName]
        }
      );
      
      // Check that the IntegrationClient was called without service account JSON
      expect(IntegrationClient).toHaveBeenCalledWith(
        project, location, integrationName, [triggerName], null, null, null, null
      );
    });
  });
  
  describe('Tool Retrieval', () => {
    it('should get tools correctly', async () => {
      const integrationName = 'test-integration';
      const triggerName = 'test-trigger';
      
      const toolset = new ApplicationIntegrationToolset(
        project, 
        location, 
        {
          integration: integrationName,
          triggers: [triggerName]
        }
      );
      
      // We can't make specific assertions about the tools since we're not mocking
      // the internal implementation, but we can check that tools are returned
      const tools = await toolset.getTools();
      expect(tools.length).toBeGreaterThan(0);
    });
  });
}); 