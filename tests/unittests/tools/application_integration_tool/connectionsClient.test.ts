/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ConnectionsClient } from '../../../../src/tools/application-integration-tool/ConnectionsClient';

describe('ConnectionsClient', () => {
  const project = 'test-project';
  const location = 'us-central1';
  const connection = 'test-connection';

  describe('Initialization', () => {
    it('should initialize with required parameters', () => {
      const client = new ConnectionsClient(project, location, connection, null);
      expect(client).toBeDefined();
    });

    it('should initialize with service account JSON', () => {
      const serviceAccountJson = JSON.stringify({
        client_email: 'test@example.com',
        private_key: 'test_key'
      });
      const client = new ConnectionsClient(project, location, connection, serviceAccountJson);
      expect(client).toBeDefined();
    });
  });

  describe('getConnectionDetails', () => {
    it('should return default connection details', () => {
      const client = new ConnectionsClient(project, location, connection, null);
      const details = client.getConnectionDetails();
      
      expect(details).toEqual({
        serviceName: 'default-service',
        host: 'default.host',
        name: 'default-connection'
      });
    });
  });

  describe('Static schema methods', () => {
    describe('getConnectorBaseSpec', () => {
      it('should return base connector specification', () => {
        const spec = ConnectionsClient.getConnectorBaseSpec();
        
        expect(spec.openapi).toBe('3.0.1');
        expect(spec.info.title).toBe('ExecuteConnection');
        expect(spec.components.schemas).toBeDefined();
        expect(spec.components.schemas.filterClause).toBeDefined();
        expect(spec.components.schemas.filterClause.type).toBe('string');
      });
    });

    describe('updateOperationRequest', () => {
      it('should include filterClause in properties', () => {
        const schema = ConnectionsClient.updateOperationRequest('TestEntity');
        
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        expect(schema.properties.entityId).toBeDefined();
        expect(schema.properties.filterClause).toBeDefined();
        expect(schema.properties.filterClause.$ref).toBe('#/components/schemas/filterClause');
      });

      it('should have required fields', () => {
        const schema = ConnectionsClient.updateOperationRequest('TestEntity');
        
        expect(schema.required).toContain('connectorInputPayload');
        expect(schema.required).toContain('entityId');
        expect(schema.required).toContain('operation');
        expect(schema.required).toContain('connectionName');
        expect(schema.required).toContain('serviceName');
        expect(schema.required).toContain('host');
        expect(schema.required).toContain('entity');
      });
    });

    describe('deleteOperationRequest', () => {
      it('should include filterClause in properties', () => {
        const schema = ConnectionsClient.deleteOperationRequest();
        
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        expect(schema.properties.entityId).toBeDefined();
        expect(schema.properties.filterClause).toBeDefined();
        expect(schema.properties.filterClause.$ref).toBe('#/components/schemas/filterClause');
      });

      it('should have required fields', () => {
        const schema = ConnectionsClient.deleteOperationRequest();
        
        expect(schema.required).toContain('entityId');
        expect(schema.required).toContain('operation');
        expect(schema.required).toContain('connectionName');
        expect(schema.required).toContain('serviceName');
        expect(schema.required).toContain('host');
        expect(schema.required).toContain('entity');
      });
    });

    describe('createOperationRequest', () => {
      it('should not include filterClause in properties', () => {
        const schema = ConnectionsClient.createOperationRequest('TestEntity');
        
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        expect(schema.properties.filterClause).toBeUndefined();
      });
    });

    describe('getOperationRequest', () => {
      it('should not include filterClause in properties', () => {
        const schema = ConnectionsClient.getOperationRequest();
        
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        expect(schema.properties.filterClause).toBeUndefined();
      });
    });

    describe('listOperationRequest', () => {
      it('should include filterClause in properties', () => {
        const schema = ConnectionsClient.listOperationRequest();
        
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        expect(schema.properties.filterClause).toBeDefined();
        expect(schema.properties.filterClause.$ref).toBe('#/components/schemas/filterClause');
      });
    });

    describe('actionRequest', () => {
      it('should return valid action request schema', () => {
        const schema = ConnectionsClient.actionRequest('TestAction');
        
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        expect(schema.properties.connectorInputPayload).toBeDefined();
      });
    });

    describe('actionResponse', () => {
      it('should return valid action response schema', () => {
        const schema = ConnectionsClient.actionResponse('TestAction');
        
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        expect(schema.properties.connectorOutputPayload).toBeDefined();
      });
    });

    describe('executeCustomQueryRequest', () => {
      it('should return valid custom query request schema', () => {
        const schema = ConnectionsClient.executeCustomQueryRequest();
        
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        expect(schema.properties.query).toBeDefined();
      });
    });

    describe('Operation specs', () => {
      it('should create list operation spec', () => {
        const operation = ConnectionsClient.listOperation(
          'Issues', 
          '{"type": "object"}', 
          'test_tool'
        );
        
        expect(operation.post).toBeDefined();
        expect(operation.post.summary).toBe('List Issues');
        expect(operation.post.operationId).toBe('test_tool_list_Issues');
        expect(operation.post['x-operation']).toBe('LIST_ENTITIES');
        expect(operation.post['x-entity']).toBe('Issues');
      });

      it('should create get operation spec', () => {
        const operation = ConnectionsClient.getOperation(
          'Issues', 
          '{"type": "object"}', 
          'test_tool'
        );
        
        expect(operation.post).toBeDefined();
        expect(operation.post.summary).toBe('Get Issues');
        expect(operation.post.operationId).toBe('test_tool_get_Issues');
        expect(operation.post['x-operation']).toBe('GET_ENTITY');
        expect(operation.post['x-entity']).toBe('Issues');
      });

      it('should create create operation spec', () => {
        const operation = ConnectionsClient.createOperation('Issues', 'test_tool');
        
        expect(operation.post).toBeDefined();
        expect(operation.post.summary).toBe('Creates a new Issues');
        expect(operation.post.operationId).toBe('test_tool_create_Issues');
        expect(operation.post['x-operation']).toBe('CREATE_ENTITY');
        expect(operation.post['x-entity']).toBe('Issues');
      });

      it('should create update operation spec', () => {
        const operation = ConnectionsClient.updateOperation('Issues', 'test_tool');
        
        expect(operation.post).toBeDefined();
        expect(operation.post.summary).toBe('Updates the Issues');
        expect(operation.post.operationId).toBe('test_tool_update_Issues');
        expect(operation.post['x-operation']).toBe('UPDATE_ENTITY');
        expect(operation.post['x-entity']).toBe('Issues');
      });

      it('should create delete operation spec', () => {
        const operation = ConnectionsClient.deleteOperation('Issues', 'test_tool');
        
        expect(operation.post).toBeDefined();
        expect(operation.post.summary).toBe('Delete the Issues');
        expect(operation.post.operationId).toBe('test_tool_delete_Issues');
        expect(operation.post['x-operation']).toBe('DELETE_ENTITY');
        expect(operation.post['x-entity']).toBe('Issues');
      });

      it('should create action operation spec', () => {
        const operation = ConnectionsClient.getActionOperation(
          'TestAction',
          'EXECUTE_ACTION',
          'TestActionDisplayName',
          'test_tool'
        );
        
        expect(operation.post).toBeDefined();
        expect(operation.post.summary).toBe('TestActionDisplayName');
        expect(operation.post.operationId).toBe('test_tool_TestActionDisplayName');
        expect(operation.post['x-action']).toBe('TestAction');
        expect(operation.post['x-operation']).toBe('EXECUTE_ACTION');
      });

      it('should create action operation spec with EXECUTE_QUERY', () => {
        const operation = ConnectionsClient.getActionOperation(
          'TestAction',
          'EXECUTE_QUERY',
          'TestActionDisplayName',
          'test_tool'
        );
        
        expect(operation.post).toBeDefined();
        expect(operation.post.description).toContain('Use pageSize = 50 and timeout = 120');
      });
    });
  });
}); 