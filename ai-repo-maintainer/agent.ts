import { LlmAgent } from 'adk-typescript/agents';
import { LlmRegistry } from 'adk-typescript/models';
import { FunctionTool } from 'adk-typescript/tools';

// Import tool functions
import { getUnreportedCommits } from './tools/getUnreportedCommits';
import { getIssueDetails } from './tools/getIssueDetails';
import { getCommitDiff } from './tools/getCommitDiff';
import { createIssue } from './tools/createIssue';

// Configure default GitHub repository information
const DEFAULT_PYTHON_REPO = 'google/adk-python';
const DEFAULT_TS_REPO = 'njraladdin/adk-typescript';

// Create FunctionTool wrappers for each tool
const getUnreportedCommitsTool = new FunctionTool({
  name: "getUnreportedCommits",
  description: "Gets commits from the Python repo that haven't been reported as issues in the TypeScript repo",
  fn: async (params: Record<string, any>) => {
    const pythonRepo = params.pythonRepo || DEFAULT_PYTHON_REPO;
    const tsRepo = params.tsRepo || DEFAULT_TS_REPO;
    
    const [pythonRepoUsername, pythonRepoName] = pythonRepo.split('/');
    const [tsRepoUsername, tsRepoName] = tsRepo.split('/');
    
    return getUnreportedCommits(
      pythonRepoUsername,
      pythonRepoName,
      tsRepoUsername,
      tsRepoName,
      params.commitCount || 10
    );
  },
  functionDeclaration: {
    name: "getUnreportedCommits",
    description: "Gets commits from the Python repo that haven't been reported as issues in the TypeScript repo",
    parameters: {
      type: 'object',
      properties: {
        pythonRepo: { 
          type: 'string', 
          description: 'Python repo in format "username/repo" (default: "google/adk-python")'
        },
        tsRepo: { 
          type: 'string', 
          description: 'TypeScript repo in format "username/repo" (default: "njraladdin/adk-typescript")'
        },
        commitCount: { 
          type: 'number', 
          description: 'Number of recent commits to check (default: 10)'
        }
      }
    }
  }
});

const getIssueDetailsTool = new FunctionTool({
  name: "getIssueDetails",
  description: "Gets detailed information about a specific GitHub issue and its comments",
  fn: async (params: Record<string, any>) => {
    const repo = params.repo || DEFAULT_PYTHON_REPO;
    const [username, repoName] = repo.split('/');
    
    return getIssueDetails(username, repoName, params.issueNumber);
  },
  functionDeclaration: {
    name: "getIssueDetails",
    description: "Gets detailed information about a specific GitHub issue and its comments",
    parameters: {
      type: 'object',
      properties: {
        repo: { 
          type: 'string', 
          description: 'Repository in format "username/repo" (default: "google/adk-python")'
        },
        issueNumber: { 
          type: 'number', 
          description: 'Issue number identifier'
        }
      },
      required: ['issueNumber']
    }
  }
});

const getCommitDiffTool = new FunctionTool({
  name: "getCommitDiff",
  description: "Gets the diff for a specific commit",
  fn: async (params: Record<string, any>) => {
    const repo = params.repo || DEFAULT_PYTHON_REPO;
    const [username, repoName] = repo.split('/');
    
    return getCommitDiff(username, repoName, params.commitSha);
  },
  functionDeclaration: {
    name: "getCommitDiff",
    description: "Gets the diff for a specific commit",
    parameters: {
      type: 'object',
      properties: {
        repo: { 
          type: 'string', 
          description: 'Repository in format "username/repo" (default: "google/adk-python")'
        },
        commitSha: { 
          type: 'string', 
          description: 'The commit hash to get the diff for'
        }
      },
      required: ['commitSha']
    }
  }
});

const createIssueTool = new FunctionTool({
  name: "createIssue",
  description: "Creates a new issue in the TypeScript repository",
  fn: async (params: Record<string, any>) => {
    return createIssue(params.title, params.body, params.commitSha, params.repoForDiff);
  },
  functionDeclaration: {
    name: "createIssue",
    description: "Creates a new issue in the TypeScript repository",
    parameters: {
      type: 'object',
      properties: {
        title: { 
          type: 'string', 
          description: 'Issue title. For commit ports, use the format "[commit:SHA] Description"'
        },
        body: { 
          type: 'string', 
          description: 'Issue body with details about what needs to be implemented'
        },
        commitSha: {
          type: 'string',
          description: 'Optional. The commit SHA to include in the issue body as a diff'
        },
        repoForDiff: {
          type: 'string',
          description: 'Optional. Repository in format "username/repo" where to get the commit diff from (default: "google/adk-python")'
        }
      },
      required: ['title', 'body']
    }
  }
});

// Use LlmRegistry to get a model instance
const agentLlm = LlmRegistry.newLlm("gemini-2.0-flash"); 

// Export the root agent with all tools for ADK CLI to find
export const rootAgent = new LlmAgent({
  name: "python_to_ts_porter",
  model: agentLlm,
  description: "Automates the process of identifying and porting Python ADK changes to TypeScript",
  instruction: `You are an AI assistant that helps port features from the Python version of the Agent Development Kit (ADK) to the TypeScript version.
  
  You have access to tools that allow you to:
  1. Find Python commits that haven't been ported to TypeScript
  2. Get issue details for related GitHub issues
  3. Examine commit diffs to understand code changes
  4. Create new issues in the TypeScript repo for tracking port work
  
  WORKFLOW TO FOLLOW:
  When asked to port changes, follow these steps:
  
  1. First, use getUnreportedCommits() to find Python commits that haven't been reported in the TypeScript repo, it will return the lsit of unreported commits if there are any, otherwise it would return an empty array.
  2. Select the first commit in the list if there are any unreported commits, otherwise return "No unreported commits found"
  3. Check if the commit message references any issues (e.g., contains "#123")
     a. If it does, use getIssueDetails() to get context about that issue
  4. Use getCommitDiff() with the commit's SHA to get the code changes
  5. Analyze the diff to understand what changed in Python and needs porting to TypeScript
  6. Create a detailed issue using createIssue() with:
     a. A title following the format: "[NEW COMMIT IN PYTHON VERSION] [commit:SHORT_SHA] Brief description"
     b. A body explaining what needs to be implemented in TypeScript
     c. Include the commit SHA to automatically attach the diff to the issue
  
  Only process one commit at a time. Be detailed in your analysis of the code changes.
  When analyzing diffs, focus on the core functionality, not syntax differences between languages.
  
  Always format your final analysis as JSON with "title" and "body" keys before creating an issue.
  When creating issues for commits, always include the commitSha parameter to automatically include the diff.
  
  If user asks to test only certain tools or steps, do so.`,
  tools: [
    getUnreportedCommitsTool,
    getIssueDetailsTool,
    getCommitDiffTool,
    createIssueTool
  ]
});
