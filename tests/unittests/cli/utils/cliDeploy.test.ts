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
 * Tests for utilities in cliDeploy.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import * as os from 'os';
import { toCloudRun } from '../../../../src/cli/cliDeploy';

// Helpers
class Recorder {
  public calls: Array<[any[], Record<string, any>]> = [];

  public call(...args: any[]) {
    this.calls.push([args, {}]);
  }
}

// Test setup helpers
function createTempDir(): string {
  const tmpDir = path.join(__dirname, 'tmp', Math.random().toString(36).substring(7));
  fs.mkdirSync(tmpDir, { recursive: true });
  return tmpDir;
}

function cleanupTempDir(tmpDir: string) {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe('CLI Deploy Utils', () => {
  let originalConsoleLog: typeof console.log;
  let logOutput: string[] = [];
  let tmpDir: string;

  beforeEach(() => {
    // Mock console.log to capture output
    originalConsoleLog = console.log;
    logOutput = [];
    console.log = (...args: any[]) => {
      logOutput.push(args.join(' '));
    };

    tmpDir = createTempDir();
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;
    cleanupTempDir(tmpDir);
  });

  // Helper function to create agent directory
  function createAgentDir(includeRequirements: boolean): string {
    const base = createTempDir();
    fs.writeFileSync(path.join(base, 'agent.ts'), '// dummy agent');
    fs.writeFileSync(path.join(base, 'package.json'), '{}');
    if (includeRequirements) {
      fs.writeFileSync(path.join(base, 'requirements.txt'), 'pytest\n');
    }
    return base;
  }

  describe('resolveProject', () => {
    it('should return the explicit project value untouched', async () => {
      // This would test the internal resolveProject function
      // Since it's not exported, we test through toCloudRun
      const agentDir = createAgentDir(false);
      const tempDir = createTempDir();

      // Mock execFileSync to avoid actual gcloud calls
      const execFileSyncSpy = jest.spyOn(child_process, 'execFileSync').mockImplementation(() => Buffer.from(''));

      await toCloudRun({
        agentFolder: agentDir,
        project: 'my-project',
        serviceName: 'test-service',
        appName: 'test-app',
        tempFolder: tempDir,
        port: 8080,
        traceToCloud: false,
        withUi: false,
        verbosity: 'info',
      });

      // Verify gcloud was called with the explicit project
      expect(execFileSyncSpy).toHaveBeenCalledWith(
        'gcloud',
        expect.arrayContaining(['--project', 'my-project']),
        expect.any(Object)
      );

      execFileSyncSpy.mockRestore();
      cleanupTempDir(agentDir);
      cleanupTempDir(tempDir);
    });

    it('should fall back to gcloud config get-value project when no value supplied', async () => {
      const agentDir = createAgentDir(false);
      const tempDir = createTempDir();

      // Mock spawnSync for the project resolution
      const spawnSyncSpy = jest.spyOn(child_process, 'spawnSync').mockReturnValue({
        status: 0,
        stdout: 'gcp-proj\n',
        stderr: '',
      } as any);

      // Mock execFileSync for the actual deployment
      const execFileSyncSpy = jest.spyOn(child_process, 'execFileSync').mockImplementation(() => Buffer.from(''));

      await toCloudRun({
        agentFolder: agentDir,
        serviceName: 'test-service',
        appName: 'test-app',
        tempFolder: tempDir,
        port: 8080,
        traceToCloud: false,
        withUi: false,
        verbosity: 'info',
      });

      // Verify gcloud was called with the resolved project
      expect(execFileSyncSpy).toHaveBeenCalledWith(
        'gcloud',
        expect.arrayContaining(['--project', 'gcp-proj']),
        expect.any(Object)
      );

      spawnSyncSpy.mockRestore();
      execFileSyncSpy.mockRestore();
      cleanupTempDir(agentDir);
      cleanupTempDir(tempDir);
    });
  });

  describe('toCloudRun', () => {

    it.each([true, false])('should complete end-to-end execution with requirements.txt=%s', async (includeRequirements) => {
      const srcDir = createAgentDir(includeRequirements);
      const tempDir = createTempDir();

      const copyRecorder = new Recorder();
      const runRecorder = new Recorder();

      // Mock execFileSync to record calls instead of actually running gcloud
      const execFileSyncSpy = jest.spyOn(child_process, 'execFileSync').mockImplementation((...args) => {
        runRecorder.call(...args);
        return Buffer.from('');
      });

      // Mock spawnSync for project resolution
      const spawnSyncSpy = jest.spyOn(child_process, 'spawnSync').mockReturnValue({
        status: 0,
        stdout: 'test-project\n',
        stderr: '',
      } as any);

      await toCloudRun({
        agentFolder: srcDir,
        project: 'proj',
        region: 'asia-northeast1',
        serviceName: 'svc',
        appName: 'app',
        tempFolder: tempDir,
        port: 8080,
        traceToCloud: true,
        withUi: true,
        verbosity: 'info',
        sessionDbUrl: 'sqlite://',
      });

      // Assertions
      expect(runRecorder.calls.length).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(tempDir, 'Dockerfile'))).toBe(true);

      execFileSyncSpy.mockRestore();
      spawnSyncSpy.mockRestore();
      cleanupTempDir(srcDir);
    });

    it('should always delete the temporary folder on exit', async () => {
      const srcDir = createAgentDir(false);
      const tempDir = createTempDir();

      const deletedPaths: string[] = [];

      // Mock fs.rmSync to record deletions
      const rmSyncSpy = jest.spyOn(fs, 'rmSync').mockImplementation((path: any, options?: any) => {
        deletedPaths.push(path as string);
      });

      // Mock execFileSync to avoid actual gcloud calls
      const execFileSyncSpy = jest.spyOn(child_process, 'execFileSync').mockImplementation(() => Buffer.from(''));

      // Mock spawnSync for project resolution
      const spawnSyncSpy = jest.spyOn(child_process, 'spawnSync').mockReturnValue({
        status: 0,
        stdout: 'test-project\n',
        stderr: '',
      } as any);

      await toCloudRun({
        agentFolder: srcDir,
        project: 'proj',
        region: undefined,
        serviceName: 'svc',
        appName: 'app',
        tempFolder: tempDir,
        port: 8080,
        traceToCloud: false,
        withUi: false,
        verbosity: 'info',
        sessionDbUrl: undefined,
      });

      expect(deletedPaths).toContain(tempDir);

      rmSyncSpy.mockRestore();
      execFileSyncSpy.mockRestore();
      spawnSyncSpy.mockRestore();
      cleanupTempDir(srcDir);
    });

    it('should handle errors and still clean up temporary folder', async () => {
      const srcDir = createAgentDir(false);
      const tempDir = createTempDir();

      const deletedPaths: string[] = [];

      // Mock fs.rmSync to record deletions
      const rmSyncSpy = jest.spyOn(fs, 'rmSync').mockImplementation((path: any, options?: any) => {
        deletedPaths.push(path as string);
      });

      // Mock execFileSync to throw an error
      const execFileSyncSpy = jest.spyOn(child_process, 'execFileSync').mockImplementation(() => {
        throw new Error('Deployment failed');
      });

      // Mock spawnSync for project resolution
      const spawnSyncSpy = jest.spyOn(child_process, 'spawnSync').mockReturnValue({
        status: 0,
        stdout: 'test-project\n',
        stderr: '',
      } as any);

      await expect(toCloudRun({
        agentFolder: srcDir,
        project: 'proj',
        serviceName: 'svc',
        appName: 'app',
        tempFolder: tempDir,
        port: 8080,
        traceToCloud: false,
        withUi: false,
        verbosity: 'info',
      })).rejects.toThrow('Deployment failed');

      // Verify cleanup still happened
      expect(deletedPaths).toContain(tempDir);

      rmSyncSpy.mockRestore();
      execFileSyncSpy.mockRestore();
      spawnSyncSpy.mockRestore();
      cleanupTempDir(srcDir);
    });

    it('should generate correct Dockerfile content', async () => {
      const srcDir = createAgentDir(true); // with requirements.txt
      const tempDir = createTempDir();

      // Mock execFileSync to avoid actual gcloud calls
      const execFileSyncSpy = jest.spyOn(child_process, 'execFileSync').mockImplementation(() => Buffer.from(''));

      // Mock spawnSync for project resolution
      const spawnSyncSpy = jest.spyOn(child_process, 'spawnSync').mockReturnValue({
        status: 0,
        stdout: 'test-project\n',
        stderr: '',
      } as any);

      await toCloudRun({
        agentFolder: srcDir,
        project: 'test-proj',
        region: 'us-west1',
        serviceName: 'test-svc',
        appName: 'test-app',
        tempFolder: tempDir,
        port: 9000,
        traceToCloud: true,
        withUi: false,
        verbosity: 'debug',
        sessionDbUrl: 'postgresql://...',
      });

      const dockerfilePath = path.join(tempDir, 'Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(dockerfileContent).toContain('ENV GOOGLE_CLOUD_PROJECT=test-proj');
      expect(dockerfileContent).toContain('ENV GOOGLE_CLOUD_LOCATION=us-west1');
      expect(dockerfileContent).toContain('EXPOSE 9000');
      expect(dockerfileContent).toContain('RUN pip install -r "/app/agents/test-app/requirements.txt"');
      expect(dockerfileContent).toContain('--port=9000');
      expect(dockerfileContent).toContain('--db_url=postgresql://...');
      expect(dockerfileContent).toContain('--trace_to_cloud');
      expect(dockerfileContent).toContain('adk api_server'); // withUi=false

      execFileSyncSpy.mockRestore();
      spawnSyncSpy.mockRestore();
      cleanupTempDir(srcDir);
    });

    it('should generate Dockerfile for web UI when withUi=true', async () => {
      const srcDir = createAgentDir(false);
      const tempDir = createTempDir();

      // Mock execFileSync to avoid actual gcloud calls
      const execFileSyncSpy = jest.spyOn(child_process, 'execFileSync').mockImplementation(() => Buffer.from(''));

      // Mock spawnSync for project resolution
      const spawnSyncSpy = jest.spyOn(child_process, 'spawnSync').mockReturnValue({
        status: 0,
        stdout: 'test-project\n',
        stderr: '',
      } as any);

      await toCloudRun({
        agentFolder: srcDir,
        project: 'test-proj',
        serviceName: 'test-svc',
        appName: 'test-app',
        tempFolder: tempDir,
        port: 8080,
        traceToCloud: false,
        withUi: true,
        verbosity: 'info',
      });

      const dockerfilePath = path.join(tempDir, 'Dockerfile');
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(dockerfileContent).toContain('adk web'); // withUi=true

      execFileSyncSpy.mockRestore();
      spawnSyncSpy.mockRestore();
      cleanupTempDir(srcDir);
    });
  });
}); 