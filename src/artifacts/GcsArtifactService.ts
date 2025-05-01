 

/**
 * An artifact service implementation using Google Cloud Storage (GCS).
 */
import { Storage, Bucket } from '@google-cloud/storage';
import { Part } from '../models/types';
import { ArtifactParams, BaseArtifactService } from './BaseArtifactService';

/**
 * An artifact service implementation using Google Cloud Storage (GCS).
 */
export class GcsArtifactService implements BaseArtifactService {
  private bucket: Bucket;
  private storage: Storage;
  private bucketName: string;

  /**
   * Initializes the GcsArtifactService.
   * 
   * @param bucketName The name of the bucket to use
   * @param options Optional configuration options for the Google Cloud Storage client
   */
  constructor(bucketName: string, options: Record<string, any> = {}) {
    this.bucketName = bucketName;
    this.storage = new Storage(options);
    this.bucket = this.storage.bucket(this.bucketName);
  }

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
   * Constructs the blob name in GCS.
   * 
   * @param appName The name of the application
   * @param userId The ID of the user
   * @param sessionId The ID of the session
   * @param filename The name of the artifact file
   * @param version The version of the artifact
   * @returns The constructed blob name in GCS
   */
  private getBlobName(
    appName: string,
    userId: string,
    sessionId: string,
    filename: string,
    version: number | string,
  ): string {
    if (this.fileHasUserNamespace(filename)) {
      return `${appName}/${userId}/user/${filename}/${version}`;
    }
    return `${appName}/${userId}/${sessionId}/${filename}/${version}`;
  }

  /**
   * Saves an artifact to the artifact service storage.
   * 
   * @param params The artifact parameters
   * @returns The revision ID
   */
  async saveArtifact(params: ArtifactParams): Promise<number> {
    const { appName, userId, sessionId, filename, artifact } = params;

    if (!artifact) {
      throw new Error('Cannot save empty artifact');
    }

    const versions = await this.listVersions(params);
    const version = versions.length > 0 ? Math.max(...versions) + 1 : 0;

    const blobName = this.getBlobName(appName, userId, sessionId, filename, version);
    const file = this.bucket.file(blobName);

    // Check if the artifact has inline data
    if (!artifact.inlineData || !artifact.inlineData.data) {
      throw new Error('Artifact must contain inline data');
    }

    // Upload the file content
    await file.save(
      Buffer.from(artifact.inlineData.data, 'base64'), 
      {
        contentType: artifact.inlineData.mimeType
      }
    );

    return version;
  }

  /**
   * Gets an artifact from the artifact service storage.
   * 
   * @param params The artifact parameters
   * @returns The artifact or undefined if not found
   */
  async loadArtifact(params: ArtifactParams): Promise<Part | undefined> {
    const { appName, userId, sessionId, filename, version } = params;
    
    let versionToLoad = version;
    if (versionToLoad === undefined) {
      const versions = await this.listVersions(params);
      if (versions.length === 0) {
        return undefined;
      }
      versionToLoad = Math.max(...versions);
    }

    const blobName = this.getBlobName(appName, userId, sessionId, filename, versionToLoad);
    const file = this.bucket.file(blobName);

    try {
      const [contents] = await file.download();
      const [metadata] = await file.getMetadata();

      return {
        inlineData: {
          data: contents.toString('base64'),
          mimeType: metadata.contentType || 'application/octet-stream'
        }
      };
    } catch (error) {
      console.error('Error loading artifact:', error);
      return undefined;
    }
  }

  /**
   * Lists all the artifact filenames within a session.
   * 
   * @param params The artifact parameters
   * @returns A list of all artifact filenames within a session
   */
  async listArtifactKeys(params: ArtifactParams): Promise<string[]> {
    const { appName, userId, sessionId } = params;
    const filenames = new Set<string>();

    // List files in the session-specific prefix
    const sessionPrefix = `${appName}/${userId}/${sessionId}/`;
    const [sessionFiles] = await this.storage.bucket(this.bucketName).getFiles({
      prefix: sessionPrefix
    });

    for (const file of sessionFiles) {
      const parts = file.name.split('/');
      if (parts.length >= 4) {
        filenames.add(parts[3]);
      }
    }

    // List files in the user namespace prefix
    const userNamespacePrefix = `${appName}/${userId}/user/`;
    const [userNamespaceFiles] = await this.storage.bucket(this.bucketName).getFiles({
      prefix: userNamespacePrefix
    });

    for (const file of userNamespaceFiles) {
      const parts = file.name.split('/');
      if (parts.length >= 4) {
        filenames.add(parts[3]);
      }
    }

    return Array.from(filenames).sort();
  }

  /**
   * Deletes an artifact.
   * 
   * @param params The artifact parameters
   */
  async deleteArtifact(params: ArtifactParams): Promise<void> {
    const { appName, userId, sessionId, filename } = params;

    const versions = await this.listVersions(params);
    const deletePromises = versions.map(version => {
      const blobName = this.getBlobName(appName, userId, sessionId, filename, version);
      return this.bucket.file(blobName).delete().catch(error => {
        console.error(`Failed to delete version ${version} of ${filename}:`, error);
      });
    });

    await Promise.all(deletePromises);
  }

  /**
   * Lists all versions of an artifact.
   * 
   * @param params The artifact parameters
   * @returns A list of all available versions of the artifact
   */
  async listVersions(params: ArtifactParams): Promise<number[]> {
    const { appName, userId, sessionId, filename } = params;

    const prefix = this.getBlobName(appName, userId, sessionId, filename, '');
    const [files] = await this.bucket.getFiles({
      prefix
    });

    const versions: number[] = [];
    for (const file of files) {
      const parts = file.name.split('/');
      if (parts.length >= 5) {
        const version = parseInt(parts[4], 10);
        if (!isNaN(version)) {
          versions.push(version);
        }
      }
    }

    return versions;
  }
} 