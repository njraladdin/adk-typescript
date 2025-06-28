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

/**
 * Tests for the artifact service.
 */

import { jest } from '@jest/globals';
import { GcsArtifactService } from '../../../src/artifacts/GcsArtifactService';
import { InMemoryArtifactService } from '../../../src/artifacts/InMemoryArtifactService';
import { BaseArtifactService } from '../../../src/artifacts/BaseArtifactService';
import { Part } from '../../../src/models/types';

enum ArtifactServiceType {
  IN_MEMORY = 'IN_MEMORY',
  GCS = 'GCS'
}

/**
 * Mocks a GCS Blob object.
 * This class provides mock implementations for a few common GCS Blob methods,
 * allowing the user to test code that interacts with GCS without actually
 * connecting to a real bucket.
 */
class MockBlob {
  public name: string;
  public content: Buffer | null = null;
  public contentType: string | null = null;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Mocks uploading data to the blob (from a string or Buffer).
   */
  async save(data: Buffer, options?: { contentType?: string }): Promise<void> {
    this.content = data;
    if (options?.contentType) {
      this.contentType = options.contentType;
    }
  }

  /**
   * Mocks downloading the blob's content as bytes.
   */
  async download(): Promise<[Buffer]> {
    if (this.content === null) {
      throw new Error('Blob not found');
    }
    return [this.content];
  }

  /**
   * Mocks getting blob metadata.
   */
  async getMetadata(): Promise<[{ contentType?: string }]> {
    return [{ contentType: this.contentType || 'application/octet-stream' }];
  }

  /**
   * Mocks deleting a blob.
   */
  async delete(): Promise<void> {
    this.content = null;
    this.contentType = null;
  }
}

/**
 * Mocks a GCS Bucket object.
 */
class MockBucket {
  public name: string;
  public blobs: Map<string, MockBlob> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Mocks getting a Blob object (doesn't create it in storage).
   */
  file(blobName: string): MockBlob {
    if (!this.blobs.has(blobName)) {
      this.blobs.set(blobName, new MockBlob(blobName));
    }
    return this.blobs.get(blobName)!;
  }

  /**
   * Mocks getting files with a prefix.
   */
  async getFiles(options?: { prefix?: string }): Promise<[MockBlob[]]> {
    const files: MockBlob[] = [];
    for (const [name, blob] of this.blobs) {
      if (!options?.prefix || name.startsWith(options.prefix)) {
        // Only include files that have been uploaded (have content)
        if (blob.content !== null) {
          files.push(blob);
        }
      }
    }
    return [files];
  }
}

/**
 * Mocks the GCS Storage Client.
 */
class MockStorage {
  public buckets: Map<string, MockBucket> = new Map();

  /**
   * Mocks getting a Bucket object.
   */
  bucket(bucketName: string): MockBucket {
    if (!this.buckets.has(bucketName)) {
      this.buckets.set(bucketName, new MockBucket(bucketName));
    }
    return this.buckets.get(bucketName)!;
  }
}

/**
 * Creates a mock GCS artifact service for testing.
 */
function mockGcsArtifactService(): GcsArtifactService {
  const mockStorage = new MockStorage();
  
  // Mock the Storage constructor to return our mock
  jest.doMock('@google-cloud/storage', () => ({
    Storage: jest.fn().mockImplementation(() => mockStorage)
  }));

  const service = new GcsArtifactService('test_bucket');
  
  // Replace the internal storage and bucket with our mocks
  (service as any).storage = mockStorage;
  (service as any).bucket = mockStorage.bucket('test_bucket');
  
  return service;
}

/**
 * Creates an artifact service for testing.
 */
function getArtifactService(
  serviceType: ArtifactServiceType = ArtifactServiceType.IN_MEMORY
): BaseArtifactService {
  if (serviceType === ArtifactServiceType.GCS) {
    return mockGcsArtifactService();
  }
  return new InMemoryArtifactService();
}

/**
 * Helper function to create a Part from bytes.
 */
function createPartFromBytes(data: Buffer, mimeType: string): Part {
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType
    }
  };
}

describe('Artifact Service Tests', () => {
  describe.each([
    ArtifactServiceType.IN_MEMORY,
    ArtifactServiceType.GCS
  ])('Service Type: %s', (serviceType) => {
    
    test('should return undefined when loading non-existent artifact', async () => {
      const artifactService = getArtifactService(serviceType);
      
      const result = await artifactService.loadArtifact({
        appName: 'test_app',
        userId: 'test_user',
        sessionId: 'session_id',
        filename: 'filename'
      });
      
      expect(result).toBeUndefined();
    });

    test('should save, load, and delete an artifact', async () => {
      const artifactService = getArtifactService(serviceType);
      const artifact = createPartFromBytes(Buffer.from('test_data'), 'text/plain');
      
      const appName = 'app0';
      const userId = 'user0';
      const sessionId = '123';
      const filename = 'file456';

      // Save artifact
      const version = await artifactService.saveArtifact({
        appName,
        userId,
        sessionId,
        filename,
        artifact
      });
      
      expect(typeof version).toBe('number');

      // Load artifact
      const loadedArtifact = await artifactService.loadArtifact({
        appName,
        userId,
        sessionId,
        filename
      });
      
      expect(loadedArtifact).toEqual(artifact);

      // Delete artifact
      await artifactService.deleteArtifact({
        appName,
        userId,
        sessionId,
        filename
      });

      // Verify deletion
      const deletedArtifact = await artifactService.loadArtifact({
        appName,
        userId,
        sessionId,
        filename
      });
      
      expect(deletedArtifact).toBeUndefined();
    });

    test('should list artifact keys', async () => {
      const artifactService = getArtifactService(serviceType);
      const artifact = createPartFromBytes(Buffer.from('test_data'), 'text/plain');
      
      const appName = 'app0';
      const userId = 'user0';
      const sessionId = '123';
      const filename = 'filename';
      const filenames = Array.from({ length: 5 }, (_, i) => filename + i);

      // Save multiple artifacts
      for (const f of filenames) {
        await artifactService.saveArtifact({
          appName,
          userId,
          sessionId,
          filename: f,
          artifact
        });
      }

      // List artifact keys
      const keys = await artifactService.listArtifactKeys({
        appName,
        userId,
        sessionId,
        filename: '' // Not used for listing
      });
      
      expect(keys.sort()).toEqual(filenames.sort());
    });

    test('should list versions of an artifact', async () => {
      const artifactService = getArtifactService(serviceType);
      
      const appName = 'app0';
      const userId = 'user0';
      const sessionId = '123';
      const filename = 'filename';
      
      const versions = Array.from({ length: 3 }, (_, i) => 
        createPartFromBytes(
          Buffer.from(i.toString().padStart(2, '0'), 'utf8'), 
          'text/plain'
        )
      );

      // Save multiple versions
      for (let i = 0; i < 3; i++) {
        await artifactService.saveArtifact({
          appName,
          userId,
          sessionId,
          filename,
          artifact: versions[i]
        });
      }

      // List versions
      const responseVersions = await artifactService.listVersions({
        appName,
        userId,
        sessionId,
        filename
      });
      
      expect(responseVersions).toEqual([0, 1, 2]);
    });

    test('should handle empty artifacts gracefully', async () => {
      const artifactService = getArtifactService(serviceType);
      
      await expect(artifactService.saveArtifact({
        appName: 'test_app',
        userId: 'test_user',
        sessionId: 'test_session',
        filename: 'test_file'
        // No artifact provided
      })).rejects.toThrow('Cannot save empty artifact');
    });

    test('should load specific version of artifact', async () => {
      const artifactService = getArtifactService(serviceType);
      
      const appName = 'app0';
      const userId = 'user0';
      const sessionId = '123';
      const filename = 'versioned_file';
      
      const version1 = createPartFromBytes(Buffer.from('version1'), 'text/plain');
      const version2 = createPartFromBytes(Buffer.from('version2'), 'text/plain');

      // Save two versions
      await artifactService.saveArtifact({
        appName,
        userId,
        sessionId,
        filename,
        artifact: version1
      });
      
      await artifactService.saveArtifact({
        appName,
        userId,
        sessionId,
        filename,
        artifact: version2
      });

      // Load specific version (version 0)
      const loadedVersion1 = await artifactService.loadArtifact({
        appName,
        userId,
        sessionId,
        filename,
        version: 0
      });
      
      expect(loadedVersion1).toEqual(version1);

      // Load latest version (should be version 1)
      const loadedLatest = await artifactService.loadArtifact({
        appName,
        userId,
        sessionId,
        filename
      });
      
      expect(loadedLatest).toEqual(version2);
    });
  });
}); 