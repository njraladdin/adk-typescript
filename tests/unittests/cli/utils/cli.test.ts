

/**
 * Unit tests for utilities in cli.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { InMemoryArtifactService } from '../../../../src/artifacts/InMemoryArtifactService';
import { InMemorySessionService } from '../../../../src/sessions/InMemorySessionService';
import { Content, Part } from '../../../../src/models/types';
import { Session } from '../../../../src/sessions/Session';
import { BaseAgent } from '../../../../src/agents/BaseAgent';
import { Event } from '../../../../src/events/Event';
import { InvocationContext } from '../../../../src/agents/InvocationContext';
import * as envs from '../../../../src/cli/utils/envs';

// Mock the Runner class before importing the CLI functions
jest.mock('../../../../src/runners', () => {
  const originalModule = jest.requireActual('../../../../src/runners');
  
  class MockRunner extends originalModule.Runner {
    constructor(params: any) {
      super(params);
    }

    async *runAsync(params: {
      userId: string;
      sessionId: string;
      newMessage: Content;
      runConfig?: any;
    }): AsyncGenerator<Event, void, unknown> {
      const { newMessage } = params;
      const text = newMessage?.parts?.[0]?.text || '';
      
      yield new Event({
        author: 'assistant',
        content: { role: 'assistant', parts: [{ text: `echo:${text}` }] }
      });
    }
  }
  
  return {
    ...originalModule,
    Runner: MockRunner
  };
});

// Provide a controllable mock for readline before importing CLI
const __readlineAnswers: string[] = [];
const setReadlineAnswers = (...answers: string[]) => {
  __readlineAnswers.splice(0, __readlineAnswers.length, ...answers);
};
const readlineMock = {
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((question: string, callback: (answer: string) => void) => {
      const answer = __readlineAnswers.length ? __readlineAnswers.shift()! : 'exit';
      callback(answer);
    }),
    close: jest.fn(),
  }),
};
jest.mock('readline', () => readlineMock);

import { runInputFile, runInteractively, runCli } from '../../../../src/cli/cli';
import { Runner } from '../../../../src/runners';

// Helpers
class Recorder {
  public calls: Array<[any[], Record<string, any>]> = [];

  public call(...args: any[]) {
    this.calls.push([args, {}]);
  }
}

// Mock types for testing
class MockPart {
  constructor(public text: string = '') {}
}

class MockContent {
  constructor(public role: string, public parts: MockPart[]) {}
}

class MockAgent extends BaseAgent {
  constructor(name: string) {
    super(name);
  }

  protected async *runAsyncImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      invocationId: invocationContext.invocationId,
      branch: invocationContext.branch,
      content: { role: 'assistant', parts: [{ text: `Mock response from ${this.name}` }] }
    });
  }

  protected async *runLiveImpl(
    invocationContext: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    yield new Event({
      author: this.name,
      invocationId: invocationContext.invocationId,
      branch: invocationContext.branch,
      content: { role: 'assistant', parts: [{ text: `Mock live response from ${this.name}` }] }
    });
  }

  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // No-op for testing
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

describe('CLI Utils', () => {
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

  describe('runInputFile', () => {
    it('should echo user & assistant messages and return a populated session', async () => {
      const inputJson = {
        state: { foo: 'bar' },
        queries: ['hello world'],
      };
      const inputPath = path.join(tmpDir, 'input.json');
      fs.writeFileSync(inputPath, JSON.stringify(inputJson));

      const artifactService = new InMemoryArtifactService();
      const sessionService = new InMemorySessionService();
      const dummyRoot = new MockAgent('root') as any;

      const session = await runInputFile(
        'app',
        'user',
        dummyRoot,
        artifactService,
        sessionService,
        inputPath
      );

      expect(session.state.get('foo')).toBe('bar');
      expect(logOutput.some(line => line.includes('[user]'))).toBe(true);
      expect(logOutput.some(line => line.includes('[assistant]'))).toBe(true);
    });
  });

  describe('runCli', () => {
    let fakeAgentDir: string;

    beforeEach(() => {
      // Create fake agent structure
      const parentDir = path.join(tmpDir, 'agents');
      fakeAgentDir = path.join(parentDir, 'fake_agent');
      fs.mkdirSync(fakeAgentDir, { recursive: true });
      
      // Create agent.ts file
      fs.writeFileSync(
        path.join(fakeAgentDir, 'agent.ts'),
        `
        import { LlmAgent } from 'adk-typescript/agents';
        export const rootAgent = new LlmAgent({
          name: 'fake_root',
          model: null as any,
          description: 'Test agent'
        });
        `
      );

      // Mock ts-node/register
      jest.mock('ts-node/register', () => ({}), { virtual: true });
      
      // Mock envs.loadDotenvForAgent
      jest.spyOn(envs, 'loadDotenvForAgent').mockImplementation(() => {});
    });

    it('should process an input file without raising and without saving', async () => {
      const inputJson = { state: {}, queries: ['ping'] };
      const inputPath = path.join(tmpDir, 'in.json');
      fs.writeFileSync(inputPath, JSON.stringify(inputJson));

      // Mock require to return our fake agent
      const originalRequire = require;
      jest.doMock(path.join(fakeAgentDir, 'agent.ts'), () => ({
        rootAgent: { name: 'fake_root' }
      }), { virtual: true });

      await expect(runCli({
        agentParentDir: path.dirname(fakeAgentDir),
        agentFolderName: 'fake_agent',
        replayFile: inputPath,
        saveSession: false,
      })).resolves.not.toThrow();
    });

    it('should save a session file when saveSession=true', async () => {
      // Mock readline to simulate user input
      const mockReadline = {
        createInterface: jest.fn().mockReturnValue({
          question: jest.fn((question: string, callback: (answer: string) => void) => {
            if (question.includes('Session ID')) {
              callback('sess123');
            } else {
              callback('exit');
            }
          }),
          close: jest.fn(),
        }),
      };
      
      setReadlineAnswers('exit', 'sess123');
      jest.doMock(path.join(fakeAgentDir, 'agent.ts'), () => ({
        rootAgent: { name: 'fake_root' }
      }), { virtual: true });

      const sessionFile = path.join(fakeAgentDir, 'sess123.session.json');
      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
      }

      await runCli({
        agentParentDir: path.dirname(fakeAgentDir),
        agentFolderName: 'fake_agent',
        saveSession: true,
      });

      expect(fs.existsSync(sessionFile)).toBe(true);
      const data = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('events');
    });
  });

  describe('runInteractively', () => {
    it('should skip blank input, echo once, then exit', async () => {
      const sessionService = new InMemorySessionService();
      const session = await sessionService.createSession({
        appName: 'dummy',
        userId: 'u',
      });
      const artifactService = new InMemoryArtifactService();

      const rootAgent = new MockAgent('root') as any;

      // Mock readline
      let questionCount = 0;
      const mockReadline = {
        createInterface: jest.fn().mockReturnValue({
          question: jest.fn((question: string, callback: (answer: string) => void) => {
            questionCount++;
            if (questionCount === 1) callback('  '); // blank input
            else if (questionCount === 2) callback('hello');
            else callback('exit');
          }),
          close: jest.fn(),
        }),
      };

      setReadlineAnswers('  ', 'hello', 'exit');

      await runInteractively(rootAgent, artifactService, session, sessionService);

      // Verify assistant echoed with 'echo:hello'
      expect(logOutput.some(msg => msg.includes('echo:hello'))).toBe(true);
    });
  });

  describe('runCli resume functionality', () => {
    it('should load previous session, print its events, then re-enter interactive mode', async () => {
      const fakeAgentDir = path.join(tmpDir, 'agents', 'fake_agent');
      fs.mkdirSync(fakeAgentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(fakeAgentDir, 'agent.ts'),
        `export const rootAgent = { name: 'fake_root' };`
      );

      // Create a fake saved session
      const dummySession = {
        id: 'sess',
        appName: 'fake_agent',
        userId: 'u',
        events: [
          {
            author: 'user',
            content: { parts: [{ text: 'hi' }] },
            partial: false,
          },
          {
            author: 'assistant', 
            content: { parts: [{ text: 'hello!' }] },
            partial: false,
          },
        ],
      };

      const savedPath = path.join(tmpDir, 'prev.session.json');
      fs.writeFileSync(savedPath, JSON.stringify(dummySession));

      // Mock readline to immediately exit
      const mockReadline = {
        createInterface: jest.fn().mockReturnValue({
          question: jest.fn((question: string, callback: (answer: string) => void) => {
            callback('exit');
          }),
          close: jest.fn(),
        }),
      };

      setReadlineAnswers('exit');
     jest.doMock(path.join(fakeAgentDir, 'agent.ts'), () => ({
       rootAgent: new MockAgent('fake_root')
     }), { virtual: true });
      
      await runCli({
        agentParentDir: path.dirname(fakeAgentDir),
        agentFolderName: 'fake_agent',
        resumeFile: savedPath,
        saveSession: false,
      });

      // Ensure both historical messages were printed
      expect(logOutput.some(msg => msg.includes('[user]: hi'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('[assistant]: hello!'))).toBe(true);
    });
  });
});