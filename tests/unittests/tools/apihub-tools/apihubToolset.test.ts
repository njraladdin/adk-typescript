/*
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

import { APIHubToolset } from '../../../../src/tools/apihub-tool/APIHubToolset';
import { BaseAPIHubClient } from '../../../../src/tools/apihub-tool/clients/APIHubClient';
import { AuthCredential, AuthScheme } from '../../../../src/tools/openapi-tool/auth/AuthTypes';
import * as yaml from 'js-yaml';

class MockAPIHubClient implements BaseAPIHubClient {
  async getSpecContent(_apihubResourceName: string): Promise<string> {
    return `
openapi: 3.0.0
info:
  version: 1.0.0
  title: Mock API
  description: Mock API Description
paths:
  /test:
    get:
      summary: Test GET endpoint
      operationId: testGet
      responses:
        '200':
          description: Successful response
`;
  }
}

describe('APIHubToolset', () => {
  let basicApihubToolset: APIHubToolset;
  let lazyApihubToolset: APIHubToolset;
  let mockAuthScheme: AuthScheme;
  let mockAuthCredential: AuthCredential;

  beforeEach(() => {
    const apihubClient = new MockAPIHubClient();
    
    basicApihubToolset = new APIHubToolset({
      apihubResourceName: 'test_resource',
      apihubClient: apihubClient
    });

    lazyApihubToolset = new APIHubToolset({
      apihubResourceName: 'test_resource',
      apihubClient: apihubClient,
      lazyLoadSpec: true
    });

    mockAuthScheme = {} as AuthScheme;
    mockAuthCredential = {} as AuthCredential;
  });

  describe('initialization', () => {
    it('should initialize basic toolset correctly', async () => {
      expect(basicApihubToolset.name).toBe('mock_api');
      expect(basicApihubToolset.description).toBe('Mock API Description');
      expect((basicApihubToolset as any)._apihubResourceName).toBe('test_resource');
      expect((basicApihubToolset as any)._lazyLoadSpec).toBe(false);

      const generatedTools = await basicApihubToolset.getTools();
      expect(generatedTools).toHaveLength(1);
      expect(generatedTools[0].name).toBe('test_get');
    });

    it('should handle lazy loading correctly', async () => {
      expect((lazyApihubToolset as any)._lazyLoadSpec).toBe(true);

      const generatedTools = await lazyApihubToolset.getTools();
      expect(generatedTools).toBeTruthy();

      const tools = await lazyApihubToolset.getTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test_get');
    });
  });

  describe('spec handling', () => {
    it('should handle spec with no title', () => {
      const spec = `
openapi: 3.0.0
info:
  version: 1.0.0
paths:
  /empty_desc_test:
    delete:
      summary: Test DELETE endpoint
      operationId: emptyDescTest
      responses:
        '200':
          description: Successful response
`;

      class MockAPIHubClientEmptySpec implements BaseAPIHubClient {
        async getSpecContent(_apihubResourceName: string): Promise<string> {
          return spec;
        }
      }

      const apihubClient = new MockAPIHubClientEmptySpec();
      const toolset = new APIHubToolset({
        apihubResourceName: 'test_resource',
        apihubClient: apihubClient
      });

      expect(toolset.name).toBe('unnamed');
    });

    it('should handle empty description in spec', () => {
      const spec = `
openapi: 3.0.0
info:
  version: 1.0.0
  title: Empty Description API
paths:
  /empty_desc_test:
    delete:
      summary: Test DELETE endpoint
      operationId: emptyDescTest
      responses:
        '200':
          description: Successful response
`;

      class MockAPIHubClientEmptySpec implements BaseAPIHubClient {
        async getSpecContent(_apihubResourceName: string): Promise<string> {
          return spec;
        }
      }

      const apihubClient = new MockAPIHubClientEmptySpec();
      const toolset = new APIHubToolset({
        apihubResourceName: 'test_resource',
        apihubClient: apihubClient
      });

      expect(toolset.name).toBe('empty_description_api');
      expect(toolset.description).toBe('');
    });

    it('should handle empty spec with lazy loading', async () => {
      class MockAPIHubClientEmptySpec implements BaseAPIHubClient {
        async getSpecContent(_apihubResourceName: string): Promise<string> {
          return '';
        }
      }

      const apihubClient = new MockAPIHubClientEmptySpec();
      const tool = new APIHubToolset({
        apihubResourceName: 'test_resource',
        apihubClient: apihubClient,
        lazyLoadSpec: true
      });

      const tools = await tool.getTools();
      expect(tools).toHaveLength(0);
    });

    it('should handle invalid YAML', async () => {
      class MockAPIHubClientInvalidYAML implements BaseAPIHubClient {
        async getSpecContent(_apihubResourceName: string): Promise<string> {
          return '{invalid yaml';  // Return invalid YAML
        }
      }

      const apihubClient = new MockAPIHubClientInvalidYAML();
      const tool = new APIHubToolset({
        apihubResourceName: 'test_resource',
        apihubClient: apihubClient
      });

      await expect(tool.getTools()).rejects.toThrow();
    });
  });

  describe('authentication', () => {
    it('should get tools with auth', async () => {
      const apihubClient = new MockAPIHubClient();
      const tool = new APIHubToolset({
        apihubResourceName: 'test_resource',
        apihubClient: apihubClient,
        authScheme: mockAuthScheme,
        authCredential: mockAuthCredential
      });

      const tools = await tool.getTools();
      expect(tools).toHaveLength(1);
    });
  });

  describe('cleanup', () => {
    it('should close properly', async () => {
      const closeSpy = jest.fn();
      const mockOpenApiToolset = {
        close: closeSpy,
        getTools: jest.fn().mockResolvedValue([])
      };

      // Access the private field to set up the mock
      (basicApihubToolset as any)._openApiToolset = mockOpenApiToolset;

      await basicApihubToolset.close();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should handle close when no openapi toolset exists', async () => {
      const newToolset = new APIHubToolset({
        apihubResourceName: 'test_resource',
        apihubClient: new MockAPIHubClient(),
        lazyLoadSpec: true
      });

      // Should not throw
      await expect(newToolset.close()).resolves.not.toThrow();
    });
  });
}); 