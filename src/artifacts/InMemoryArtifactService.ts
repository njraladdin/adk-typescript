// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * An in-memory implementation of the artifact service.
 */
import { Part } from '../models/types';
import { ArtifactParams, BaseArtifactService } from './BaseArtifactService';

/**
 * An in-memory implementation of the artifact service.
 */
export class InMemoryArtifactService implements BaseArtifactService {
  private artifacts: Map<string, Part[]> = new Map();

  /**
   * Checks if the filename has a user namespace.
   * 
   * @param filename The filename to check
   * @returns True if the filename has a user namespace (starts with "user:"), false otherwise
   */
  private fileHasUserNamespace(filename: string): boolean {
    return filename.startsWith('user:');
  }

  /**
   * Constructs the artifact path.
   * 
   * @param appName The name of the application
   * @param userId The ID of the user
   * @param sessionId The ID of the session
   * @param filename The name of the artifact file
   * @returns The constructed artifact path
   */
  private artifactPath(appName: string, userId: string, sessionId: string, filename: string): string {
    if (this.fileHasUserNamespace(filename)) {
      return `${appName}/${userId}/user/${filename}`;
    }
    return `${appName}/${userId}/${sessionId}/${filename}`;
  }

  /**
   * Saves an artifact to the artifact service storage.
   * 
   * @param params The artifact parameters
   * @returns The revision ID
   */
  saveArtifact(params: ArtifactParams): number {
    const { appName, userId, sessionId, filename, artifact } = params;

    if (!artifact) {
      throw new Error('Cannot save empty artifact');
    }

    const path = this.artifactPath(appName, userId, sessionId, filename);
    if (!this.artifacts.has(path)) {
      this.artifacts.set(path, []);
    }

    const versions = this.artifacts.get(path)!;
    const version = versions.length;
    versions.push(artifact);

    return version;
  }

  /**
   * Gets an artifact from the artifact service storage.
   * 
   * @param params The artifact parameters
   * @returns The artifact or undefined if not found
   */
  loadArtifact(params: ArtifactParams): Part | undefined {
    const { appName, userId, sessionId, filename, version } = params;

    const path = this.artifactPath(appName, userId, sessionId, filename);
    const versions = this.artifacts.get(path);
    
    if (!versions || versions.length === 0) {
      return undefined;
    }

    const versionIndex = version !== undefined ? version : versions.length - 1;
    return versions[versionIndex];
  }

  /**
   * Lists all the artifact filenames within a session.
   * 
   * @param params The artifact parameters
   * @returns A list of all artifact filenames within a session
   */
  listArtifactKeys(params: ArtifactParams): string[] {
    const { appName, userId, sessionId } = params;

    const sessionPrefix = `${appName}/${userId}/${sessionId}/`;
    const userNamespacePrefix = `${appName}/${userId}/user/`;
    const filenames: string[] = [];

    for (const path of this.artifacts.keys()) {
      if (path.startsWith(sessionPrefix)) {
        const filename = path.substring(sessionPrefix.length);
        filenames.push(filename);
      } else if (path.startsWith(userNamespacePrefix)) {
        const filename = path.substring(userNamespacePrefix.length);
        filenames.push(filename);
      }
    }

    return filenames.sort();
  }

  /**
   * Deletes an artifact.
   * 
   * @param params The artifact parameters
   */
  async deleteArtifact(params: ArtifactParams): Promise<void> {
    const { appName, userId, sessionId, filename } = params;

    const path = this.artifactPath(appName, userId, sessionId, filename);
    this.artifacts.delete(path);
  }

  /**
   * Lists all versions of an artifact.
   * 
   * @param params The artifact parameters
   * @returns A list of all available versions of the artifact
   */
  listVersions(params: ArtifactParams): number[] {
    const { appName, userId, sessionId, filename } = params;

    const path = this.artifactPath(appName, userId, sessionId, filename);
    const versions = this.artifacts.get(path);
    
    if (!versions || versions.length === 0) {
      return [];
    }

    return Array.from({ length: versions.length }, (_, i) => i);
  }
} 