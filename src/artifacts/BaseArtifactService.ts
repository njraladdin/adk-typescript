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

import { Part } from '../models/types';

/**
 * Parameters for artifact operations.
 */
export interface ArtifactParams {
  /** The application name */
  appName: string;
  
  /** The user ID */
  userId: string;
  
  /** The session ID */
  sessionId: string;
  
  /** The filename of the artifact */
  filename: string;
  
  /** The version of the artifact (for load operations) */
  version?: number;
  
  /** The artifact content (for save operations) */
  artifact?: Part;
}

/**
 * Interface for artifact services.
 * Artifact services provide functionality to store and retrieve artifacts.
 */
export interface BaseArtifactService {
  /**
   * Loads an artifact.
   * 
   * @param params The artifact parameters
   * @returns The loaded artifact, or undefined if not found
   */
  loadArtifact(params: ArtifactParams): Part | undefined | Promise<Part | undefined>;

  /**
   * Saves an artifact.
   * 
   * @param params The artifact parameters
   * @returns The version of the saved artifact
   */
  saveArtifact(params: ArtifactParams): number | Promise<number>;

  /**
   * Deletes an artifact.
   * 
   * @param params The artifact parameters
   * @returns A promise that resolves when the operation is complete
   */
  deleteArtifact(params: ArtifactParams): Promise<void>;
  
  /**
   * Lists all the artifact filenames within a session.
   * 
   * @param params The artifact parameters
   * @returns A list of all artifact filenames within a session
   */
  listArtifactKeys(params: ArtifactParams): string[] | Promise<string[]>;
  
  /**
   * Lists all versions of an artifact.
   * 
   * @param params The artifact parameters
   * @returns A list of all available versions of the artifact
   */
  listVersions(params: ArtifactParams): number[] | Promise<number[]>;
} 