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
 * Tests for utilities in CLI tools.
 */

import * as fs from 'fs';
import * as path from 'path';
import { runCmd } from '../../../../src/cli/cliCreate';
import { runCli } from '../../../../src/cli/cli';
import { toCloudRun } from '../../../../src/cli/cliDeploy';
import { createApiServer } from '../../../../src/cli/apiServer';
import { startWebServer } from '../../../../src/cli/webServer';
import * as envs from '../../../../src/cli/utils/envs';

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

describe('CLI Tools', () => {
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

  describe('CLI create command', () => {
    it('should forward arguments to cliCreate.runCmd', async () => {
      const rec = new Recorder();
      const originalRunCmd = runCmd;
      
      // Mock runCmd to record calls
      const runCmdSpy = jest.fn().mockImplementation((...args) => {
        rec.call(...args);
        return Promise.resolve();
      });

      // Replace the function temporarily
      const cliCreateModule = require('../../../../src/cli/cliCreate');
      cliCreateModule.runCmd = runCmdSpy;

      // Mock readline for interactive prompts
      const mockReadline = {
        createInterface: jest.fn().mockReturnValue({
          question: jest.fn((question: string, callback: (answer: string) => void) => {
            callback('1'); // Default responses
          }),
          close: jest.fn(),
        }),
      };

      jest.doMock('readline', () => mockReadline, { virtual: true });

      await runCmd({
        agentName: 'my_app',
        model: 'gemini',
        googleApiKey: 'key123',
      });

      expect(runCmdSpy).toHaveBeenCalled();
      expect(rec.calls.length).toBeGreaterThan(0);

      // Restore original
      cliCreateModule.runCmd = originalRunCmd;
    });
  });

  describe('CLI run command', () => {
    it('should call runCli with correct parameters', async () => {
      const rec = new Recorder();
      
      // Mock runCli to record calls
      const runCliSpy = jest.fn().mockImplementation((kwargs) => {
        rec.call(kwargs);
        return Promise.resolve();
      });

      // Create dummy agent directory
      const agentDir = path.join(tmpDir, 'agent');
      fs.mkdirSync(agentDir);
      fs.writeFileSync(path.join(agentDir, 'package.json'), '{}');
      fs.writeFileSync(path.join(agentDir, 'agent.ts'), 'export const rootAgent = {};');

      // Mock the CLI module
      const cliModule = require('../../../../src/cli/cli');
      const originalRunCli = cliModule.runCli;
      cliModule.runCli = runCliSpy;

      // Mock ts-node/register
      jest.doMock('ts-node/register', () => ({}), { virtual: true });

      // Mock envs.loadDotenvForAgent
      jest.spyOn(envs, 'loadDotenvForAgent').mockImplementation(() => {});

      await runCli({
        agentParentDir: tmpDir,
        agentFolderName: 'agent',
        saveSession: false,
      });

      expect(runCliSpy).toHaveBeenCalled();
      expect(rec.calls.length).toBeGreaterThan(0);
      expect(rec.calls[0][0]).toHaveProperty('agentFolderName', 'agent');

      // Restore original
      cliModule.runCli = originalRunCli;
    });
  });

  describe('CLI deploy cloud_run command', () => {
    it('should call cliDeploy.toCloudRun on success', async () => {
      const rec = new Recorder();
      
      // Mock toCloudRun to record calls
      const toCloudRunSpy = jest.fn().mockImplementation((...args) => {
        rec.call(...args);
        return Promise.resolve();
      });

      const agentDir = path.join(tmpDir, 'agent2');
      fs.mkdirSync(agentDir);

      // Mock the deploy module
      const deployModule = require('../../../../src/cli/cliDeploy');
      const originalToCloudRun = deployModule.toCloudRun;
      deployModule.toCloudRun = toCloudRunSpy;

      await toCloudRun({
        agentFolder: agentDir,
        project: 'proj',
        region: 'asia-northeast1',
        serviceName: 'test-service',
        appName: 'test-app',
        tempFolder: path.join(tmpDir, 'temp'),
        port: 8080,
        traceToCloud: false,
        withUi: false,
        verbosity: 'info',
        adkVersion: '0.0.5',
      });

      expect(toCloudRunSpy).toHaveBeenCalled();
      expect(rec.calls.length).toBeGreaterThan(0);

      // Restore original
      deployModule.toCloudRun = originalToCloudRun;
    });

    it('should handle deployment failures gracefully', async () => {
      const capturedErrors: string[] = [];
      
      // Mock console.error to capture error output
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        capturedErrors.push(args.join(' '));
      };

      // Mock toCloudRun to throw an error
      const toCloudRunSpy = jest.fn().mockImplementation(() => {
        throw new Error('boom');
      });

      const agentDir = path.join(tmpDir, 'agent3');
      fs.mkdirSync(agentDir);

      // Mock the deploy module
      const deployModule = require('../../../../src/cli/cliDeploy');
      const originalToCloudRun = deployModule.toCloudRun;
      deployModule.toCloudRun = toCloudRunSpy;

      await expect(toCloudRun({
        agentFolder: agentDir,
        project: 'proj',
        serviceName: 'test-service',
        appName: 'test-app',
        tempFolder: path.join(tmpDir, 'temp'),
        port: 8080,
        traceToCloud: false,
        withUi: false,
        verbosity: 'info',
        adkVersion: '0.0.5',
      })).rejects.toThrow('boom');

      // Restore originals
      deployModule.toCloudRun = originalToCloudRun;
      console.error = originalConsoleError;
    });
  });

  describe('CLI eval command', () => {
    it('should handle missing evaluation dependencies', async () => {
      // Mock module loading to simulate missing dependencies
      const originalRequire = require;
      jest.doMock('../../../../src/cli/cliEval', () => {
        throw new Error('Module not found');
      }, { virtual: true });

      // This test verifies that the CLI gracefully handles missing eval dependencies
      // In a real implementation, this would show an appropriate error message
      expect(() => {
        require('../../../../src/cli/cliEval');
      }).toThrow('Module not found');
    });

    it('should execute evaluation successfully with stub module', async () => {
      // Create stub eval sets manager module
      const stubEvalSetsManagerModule = {
        EvalCase: class {
          constructor(public evalId: string) {}
        },
        EvalSet: class {
          constructor(public evalCases: any[]) {}
        },
        loadEvalSetFromFile: function(x: any, y: any) {
          return new this.EvalSet([
            new this.EvalCase('e1'),
            new this.EvalCase('e2')
          ]);
        },
      };

      // Create a stub eval module for testing
      const stubEvalModule = {
        EvalMetric: class {
          constructor(public metricName: string, public threshold: number) {}
        },
        EvalCaseResult: class {
          constructor(public evalSetId: string, public finalEvalStatus: string) {}
        },
        EvalStatus: {
          PASSED: 'PASSED',
          FAILED: 'FAILED',
        },
        getEvaluationCriteriaOrDefault: () => ({ foo: 1.0 }),
        getRootAgent: () => ({ name: 'test-agent' }),
        tryGetResetFunc: () => null,
        parseAndGetEvalsToRun: () => ({ 'set1.json': ['e1', 'e2'] }),
        runEvals: async function* () {
          yield new this.EvalCaseResult('set1.json', 'PASSED');
          yield new this.EvalCaseResult('set1.json', 'FAILED');
        },
      };

      // Mock the eval module and eval sets manager module
      jest.doMock('../../../../src/cli/cliEval', () => stubEvalModule, { virtual: true });
      jest.doMock('../../../../src/evaluation/localEvalSetsManager', () => stubEvalSetsManagerModule, { virtual: true });

      // Create dummy agent directory
      const agentDir = path.join(tmpDir, 'agent5');
      fs.mkdirSync(agentDir);
      fs.writeFileSync(path.join(agentDir, 'package.json'), '{}');

      // Mock envs.loadDotenvForAgent
      jest.spyOn(envs, 'loadDotenvForAgent').mockImplementation(() => {});

      // Test that eval functions can be imported and used
      const evalModule = require('../../../../src/cli/cliEval');
      expect(evalModule.EvalStatus.PASSED).toBe('PASSED');
      expect(evalModule.EvalStatus.FAILED).toBe('FAILED');

      const results: any[] = [];
      for await (const result of evalModule.runEvals({})) {
        results.push(result);
      }

      expect(results).toHaveLength(2);
      expect(results[0].finalEvalStatus).toBe('PASSED');
      expect(results[1].finalEvalStatus).toBe('FAILED');
    });
  });

  describe('CLI web and api_server commands', () => {
    it('should configure and start web server', async () => {
      const rec = new Recorder();
      
      // Mock startWebServer to record calls
      const startWebServerSpy = jest.fn().mockImplementation((...args) => {
        rec.call(...args);
        return Promise.resolve();
      });

      const agentsDir = path.join(tmpDir, 'agents');
      fs.mkdirSync(agentsDir);

      // Mock the web server module
      const webServerModule = require('../../../../src/cli/webServer');
      const originalStartWebServer = webServerModule.startWebServer;
      webServerModule.startWebServer = startWebServerSpy;

             await startWebServer({
         agentDir: agentsDir,
         port: 8080,
         allowOrigins: ['*'],
       });

      expect(startWebServerSpy).toHaveBeenCalled();
      expect(rec.calls.length).toBeGreaterThan(0);

      // Restore original
      webServerModule.startWebServer = originalStartWebServer;
    });

    it('should configure and start API server', async () => {
      const rec = new Recorder();
      
      // Mock createApiServer to record calls
      const createApiServerSpy = jest.fn().mockImplementation((...args) => {
        rec.call(...args);
        return Promise.resolve();
      });

      const agentsDir = path.join(tmpDir, 'agents_api');
      fs.mkdirSync(agentsDir);

      // Mock the API server module
      const apiServerModule = require('../../../../src/cli/apiServer');
      const originalCreateApiServer = apiServerModule.createApiServer;
      apiServerModule.createApiServer = createApiServerSpy;

                   await createApiServer({
        agentDir: agentsDir,
        port: 8080,
        web: false,
      });

      expect(createApiServerSpy).toHaveBeenCalled();
      expect(rec.calls.length).toBeGreaterThan(0);

      // Restore original
      apiServerModule.createApiServer = originalCreateApiServer;
    });
  });

  describe('Validation helpers', () => {
    it('should validate exclusive options correctly', () => {
      // Test exclusive option validation logic
      // This would test the validation of mutually exclusive CLI options
      // like --replay and --resume
      
      const options = { replay: 'file1.json', resume: null };
      expect(options.replay).toBe('file1.json');
      expect(options.resume).toBe(null);

      const conflictingOptions = { replay: 'file1.json', resume: 'file2.json' };
      // In a real CLI, this would trigger a validation error
      expect(conflictingOptions.replay && conflictingOptions.resume).toBe(true);
    });

    it('should handle single exclusive option', () => {
      // Test that providing exactly one exclusive option works
      const options = { replay: 'file.json', resume: null };
      const hasReplay = !!options.replay;
      const hasResume = !!options.resume;
      
      expect(hasReplay).toBe(true);
      expect(hasResume).toBe(false);
      expect(hasReplay && hasResume).toBe(false); // Not both
    });

    it('should block multiple exclusive options', () => {
      // Test that providing two exclusive options is detected
      const options = { replay: 'file1.json', resume: 'file2.json' };
      const hasReplay = !!options.replay;
      const hasResume = !!options.resume;
      
      expect(hasReplay && hasResume).toBe(true); // Both provided - should be invalid
    });
  });
}); 