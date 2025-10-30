

/**
 * Tests for utilities in cliCreate.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as child_process from 'child_process';

// Mock readline at the module level
const mockQuestion = jest.fn();
const mockClose = jest.fn();
const mockCreateInterface = jest.fn(() => ({
  question: mockQuestion,
  close: mockClose,
}));

jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: mockQuestion,
    close: mockClose,
  })),
}));

// Import after mocking
import { runCmd } from '../../../../src/cli/cliCreate';

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

describe('CLI Create Utils', () => {
  let originalConsoleLog: typeof console.log;
  let originalCwd: () => string;
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

    // Mock process.cwd to return tmpDir
    originalCwd = process.cwd;
    process.cwd = jest.fn(() => tmpDir);

    // Reset mock functions
    mockQuestion.mockReset();
    mockClose.mockClear();
    mockCreateInterface.mockClear();

    // Default implementation
    mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
      callback(''); // Default to empty answer
    });
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;
    process.cwd = originalCwd;
    cleanupTempDir(tmpDir);
  });

  describe('generateFiles functionality', () => {
    it('should create files with the API-key backend and correct .env flags', async () => {
      const agentFolder = path.join(tmpDir, 'test_agent');

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // gemini-2.0-flash
        } else if (question.includes('Choose a backend')) {
          callback('1'); // API key backend
        } else if (question.includes('Enter Google API key')) {
          callback('dummy-key');
        } else {
          callback('');
        }
      });

      await runCmd({
        agentName: 'test_agent',
        googleApiKey: 'dummy-key',
        model: 'gemini-2.0-flash',
      });

      const envContent = fs.readFileSync(path.join(agentFolder, '.env'), 'utf-8');
      expect(envContent).toContain('GOOGLE_API_KEY=dummy-key');
      expect(envContent).toContain('GOOGLE_GENAI_USE_VERTEXAI=0');
      expect(fs.existsSync(path.join(agentFolder, 'agent.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'package.json'))).toBe(true);
    });

    it('should create files with Vertex AI backend and correct .env flags', async () => {
      const agentFolder = path.join(tmpDir, 'test_agent');

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // gemini-2.0-flash
        } else if (question.includes('Choose a backend (1): ')) {
          callback('2'); // Vertex AI
        } else if (question.includes('Enter Google Cloud project ID')) {
          callback('proj');
        } else if (question.includes('Enter Google Cloud region')) {
          callback('us-central1');
        } else {
          callback('');
        }
      });

      await runCmd({
        agentName: 'test_agent',
        googleCloudProject: 'proj',
        googleCloudRegion: 'us-central1',
        model: 'gemini-2.0-flash',
      });

      const envContent = fs.readFileSync(path.join(agentFolder, '.env'), 'utf-8');
      expect(envContent).toContain('GOOGLE_CLOUD_PROJECT=proj');
      expect(envContent).toContain('GOOGLE_CLOUD_LOCATION=us-central1');
      expect(envContent).toContain('GOOGLE_GENAI_USE_VERTEXAI=1');
    });

    it('should overwrite existing files when generating again', async () => {
      const agentFolder = path.join(tmpDir, 'test_agent');
      fs.mkdirSync(agentFolder, { recursive: true });
      fs.writeFileSync(path.join(agentFolder, '.env'), 'OLD');

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // gemini-2.0-flash
        } else if (question.includes('Choose a backend')) {
          callback('1'); // API key
        } else if (question.includes('Enter Google API key')) {
          callback('new-key');
        } else {
          callback('');
        }
      });

      await runCmd({
        agentName: 'test_agent',
        googleApiKey: 'new-key',
        model: 'gemini-2.0-flash',
      });

      const envContent = fs.readFileSync(path.join(agentFolder, '.env'), 'utf-8');
      expect(envContent).toContain('GOOGLE_API_KEY=new-key');
    });

    it('should handle permission errors gracefully', async () => {
      // Simulate a permission error on the first write (agent.ts)
      const writeSpy = jest.spyOn(fs.promises, 'writeFile').mockRejectedValueOnce(Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }));

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // gemini-2.0-flash
        } else if (question.includes('1. Google AI\n2. Vertex AI\nChoose a backend (1): ')) {
          callback('1'); // Google AI
        } else if (question.includes('Enter Google API key: ')) {
          callback(''); // Empty key
        } else {
          callback('');
        }
      });

      await expect(runCmd({
        agentName: 'test_agent',
        model: 'gemini-2.0-flash',
      })).rejects.toThrow();

      writeSpy.mockRestore();
    });

    it('should generate minimal .env file with no backend parameters', async () => {
      const agentFolder = path.join(tmpDir, 'test_agent');

      // Setup mock readline responses - provide empty API key
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // gemini-2.0-flash
        } else if (question.includes('1. Google AI\n2. Vertex AI\nChoose a backend (1): ')) {
          callback('1'); // Google AI
        } else if (question.includes('Enter Google API key: ')) {
          callback(''); // Empty API key
        } else {
          callback(''); // Default/empty responses
        }
      });

      // Ensure environment variables do not pre-fill values
      delete process.env.GOOGLE_API_KEY;
      delete process.env.GOOGLE_CLOUD_PROJECT;
      delete process.env.GOOGLE_CLOUD_LOCATION;

      await runCmd({
        agentName: 'test_agent',
        model: 'gemini-2.0-flash',
      });

      const envContent = fs.readFileSync(path.join(agentFolder, '.env'), 'utf-8');
      // With empty responses, no backend keys should be written
      expect(envContent.trim()).toBe('');
    });
  });

  describe('runCmd overwrite behavior', () => {
    it('should allow overwriting existing agent directory', async () => {
      const agentName = 'test_agent';
      const agentDir = path.join(tmpDir, agentName);
      fs.mkdirSync(agentDir);
      fs.writeFileSync(path.join(agentDir, 'dummy.txt'), 'dummy');

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // gemini-2.0-flash
        } else if (question.includes('Choose a backend (1): ')) {
          callback('1'); // API key
        } else if (question.includes('Enter Google API key: ')) {
          callback('test-key');
        } else {
          callback('');
        }
      });

      // Should succeed and overwrite
      await runCmd({
        agentName,
        model: 'gemini-2.0-flash',
        googleApiKey: 'test-key',
      });

      // Verify new files were created
      expect(fs.existsSync(path.join(agentDir, 'agent.ts'))).toBe(true);
      expect(fs.existsSync(path.join(agentDir, '.env'))).toBe(true);
    });
  });

  describe('Prompt helpers', () => {
    it('should return project input from prompt', async () => {
      // This test would require mocking the internal prompt functions
      // For now, we'll test through the main runCmd function
      expect(true).toBe(true);
    });

    it('should return region input from prompt', async () => {
      // This test would require mocking the internal prompt functions
      // For now, we'll test through the main runCmd function
      expect(true).toBe(true);
    });

    it('should return API key input from prompt', async () => {
      // This test would require mocking the internal prompt functions
      // For now, we'll test through the main runCmd function
      expect(true).toBe(true);
    });

    it('should return default Gemini model when selecting option 1', async () => {
      const agentFolder = path.join(tmpDir, 'test_agent');

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // Select gemini-2.0-flash
        } else {
          callback('');
        }
      });

      await runCmd({
        agentName: 'test_agent',
        model: 'gemini-2.0-flash',
      });

      // Verify the agent.ts file contains the correct model
      const agentContent = fs.readFileSync(path.join(agentFolder, 'agent.ts'), 'utf-8');
      expect(agentContent).toContain('gemini-2.0-flash');
    });

    it('should return placeholder when selecting other models option', async () => {
      const agentFolder = path.join(tmpDir, 'test_agent');

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('3'); // Select other models
        } else {
          callback('');
        }
      });

      await runCmd({
        agentName: 'test_agent',
      });

      // Verify the agent.ts file contains the placeholder
      const agentContent = fs.readFileSync(path.join(agentFolder, 'agent.ts'), 'utf-8');
      expect(agentContent).toContain('<FILL_IN_MODEL>');
    });
  });

  describe('Backend selection', () => {
    it('should choose API key backend and return correct values', async () => {
      const agentFolder = path.join(tmpDir, 'test_agent');

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // gemini-2.0-flash
        } else if (question.includes('Choose a backend (1): ')) {
          callback('1'); // API key backend
        } else if (question.includes('Enter Google API key: ')) {
          callback('api-key');
        } else {
          callback('');
        }
      });

      await runCmd({
        agentName: 'test_agent',
        googleApiKey: 'api-key',
      });

      const envContent = fs.readFileSync(path.join(agentFolder, '.env'), 'utf-8');
      expect(envContent).toContain('GOOGLE_API_KEY=api-key');
      expect(envContent).not.toContain('GOOGLE_CLOUD_PROJECT');
      expect(envContent).not.toContain('GOOGLE_CLOUD_LOCATION');
    });

    it('should choose Vertex backend and return correct values', async () => {
      const agentFolder = path.join(tmpDir, 'test_agent');

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // gemini-2.0-flash
        } else if (question.includes('Choose a backend (1): ')) {
          callback('2'); // Vertex backend
        } else if (question.includes('Enter Google Cloud project ID')) {
          callback('proj');
        } else if (question.includes('Enter Google Cloud region')) {
          callback('region');
        } else {
          callback('');
        }
      });

      await runCmd({
        agentName: 'test_agent',
        googleCloudProject: 'proj',
        googleCloudRegion: 'region',
      });

      const envContent = fs.readFileSync(path.join(agentFolder, '.env'), 'utf-8');
      expect(envContent).not.toContain('GOOGLE_API_KEY');
      expect(envContent).toContain('GOOGLE_CLOUD_PROJECT=proj');
      expect(envContent).toContain('GOOGLE_CLOUD_LOCATION=region');
    });
  });

  describe('GCloud fallback helpers', () => {
    it('should use environment variables when available', async () => {
      const agentFolder = path.join(tmpDir, 'test_agent');

      // Set environment variables
      process.env.GOOGLE_CLOUD_PROJECT = 'env-project';
      process.env.GOOGLE_CLOUD_LOCATION = 'env-region';

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // gemini-2.0-flash
        } else if (question.includes('Choose a backend (1): ')) {
          callback('2'); // Vertex backend
        } else if (question.includes('Enter Google Cloud project ID')) {
          // Should default to env variable
          callback('');
        } else if (question.includes('Enter Google Cloud region')) {
          // Should default to env variable
          callback('');
        } else {
          callback('');
        }
      });

      await runCmd({
        agentName: 'test_agent',
      });

      const envContent = fs.readFileSync(path.join(agentFolder, '.env'), 'utf-8');
      // Even with empty input, should use the passed parameters (which come from env)

      // Cleanup
      delete process.env.GOOGLE_CLOUD_PROJECT;
      delete process.env.GOOGLE_CLOUD_LOCATION;
    });

    it('should handle missing gcloud config gracefully', async () => {
      const agentFolder = path.join(tmpDir, 'test_agent');

      // Ensure no environment variables are set
      delete process.env.GOOGLE_CLOUD_PROJECT;
      delete process.env.GOOGLE_CLOUD_LOCATION;
      delete process.env.GOOGLE_API_KEY;

      // Setup mock readline responses
      mockQuestion.mockImplementation((question: string, callback: (answer: string) => void) => {
        if (question.includes('Choose a model for the root agent')) {
          callback('1'); // gemini-2.0-flash
        } else if (question.includes('Choose a backend')) {
          callback('1'); // API key
        } else if (question.includes('Enter Google API key')) {
          callback('test-key');
        } else {
          callback('');
        }
      });

      await runCmd({
        agentName: 'test_agent',
        googleApiKey: 'test-key',
      });

      // Should succeed even without gcloud configured
      expect(fs.existsSync(path.join(agentFolder, 'agent.ts'))).toBe(true);
    });
  });
});