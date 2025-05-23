import { LlmAgent } from 'adk-typescript/agents';
import { LlmRegistry } from 'adk-typescript/models';
import { FunctionTool } from 'adk-typescript/tools';

// Import tool functions
import { getUnreportedCommits } from './tools/getUnreportedCommits';
import { getIssueDetails } from './tools/getIssueDetails';
import { getCommitDiff } from './tools/getCommitDiff';
import { createIssue } from './tools/createIssue';
import { getRepoFileStructure } from './tools/getRepoFileStructure';
import { getFileContentFromRepo } from './tools/getFileContentFromRepo';
// Import new PR creation tools
import { createBranch } from './tools/createBranch';
import { applyDiff, FileDiff, fetchFileContent } from './tools/applyDiff';
import { createPullRequest } from './tools/createPullRequest';
import { writeFileToRepo, deleteFileFromRepo, getFileSha } from './tools/writeFileToRepo';

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

const getRepoFileStructureTool = new FunctionTool({
  name: "getRepoFileStructure",
  description: "Gets the file structure of a GitHub repository in a format suitable for understanding the codebase organization",
  fn: async (params: Record<string, any>) => {
    const repo = params.repo;
    const [username, repoName] = repo.split('/');
    
    return getRepoFileStructure(
      username,
      repoName,
      params.path || '',
      params.branch,
      params.maxDepth || 15
    );
  },
  functionDeclaration: {
    name: "getRepoFileStructure",
    description: "Gets the file structure of a GitHub repository in a format suitable for understanding the codebase organization",
    parameters: {
      type: 'object',
      properties: {
        repo: { 
          type: 'string', 
          description: 'Repository in format "username/repo"'
        },
        path: { 
          type: 'string', 
          description: 'Optional path within the repository to start from (defaults to root)'
        },
        branch: { 
          type: 'string', 
          description: 'Optional branch name (defaults to the repository\'s default branch)'
        },
        maxDepth: { 
          type: 'number', 
          description: 'Maximum depth to display for directories (defaults to 15)'
        }
      },
      required: ['repo']
    }
  }
});

const getFileContentFromRepoTool = new FunctionTool({
  name: "getFileContentFromRepo",
  description: "Gets the content of a file from a GitHub repository",
  fn: async (params: Record<string, any>) => {
    const repo = params.repo;
    const [username, repoName] = repo.split('/');
    
    return getFileContentFromRepo(
      username,
      repoName,
      params.filePath,
      params.branch
    );
  },
  functionDeclaration: {
    name: "getFileContentFromRepo",
    description: "Gets the content of a file from a GitHub repository",
    parameters: {
      type: 'object',
      properties: {
        repo: { 
          type: 'string', 
          description: 'Repository in format "username/repo"'
        },
        filePath: { 
          type: 'string', 
          description: 'Path to the file within the repository'
        },
        branch: { 
          type: 'string', 
          description: 'Optional branch name (defaults to the repository\'s default branch)'
        }
      },
      required: ['repo', 'filePath']
    }
  }
});

// New tool for creating a branch
const createBranchTool = new FunctionTool({
  name: "createBranch",
  description: "Creates a new branch in a GitHub repository",
  fn: async (params: Record<string, any>) => {
    const repo = params.repo || DEFAULT_TS_REPO;
    const [username, repoName] = repo.split('/');
    
    return createBranch(
      username,
      repoName,
      params.branchName,
      params.baseBranch || 'main'
    );
  },
  functionDeclaration: {
    name: "createBranch",
    description: "Creates a new branch in a GitHub repository",
    parameters: {
      type: 'object',
      properties: {
        repo: { 
          type: 'string', 
          description: 'Repository in format "username/repo" (default: "njraladdin/adk-typescript")'
        },
        branchName: { 
          type: 'string', 
          description: 'Name of the new branch to create'
        },
        baseBranch: { 
          type: 'string', 
          description: 'Name of the branch to base the new branch on (default: "main")'
        }
      },
      required: ['branchName']
    }
  }
});

// New tool for applying diffs to files
const applyDiffTool = new FunctionTool({
  name: "applyDiff",
  description: "Applies a structured diff to file content",
  fn: async (params: Record<string, any>) => {
    // If file content is provided directly, use it
    if (params.fileContent !== undefined) {
      return applyDiff(params.fileContent, params.diff as FileDiff);
    }
    
    // Otherwise, fetch content from GitHub
    if (params.repo && params.diff?.filePath) {
      const repo = params.repo;
      const [username, repoName] = repo.split('/');
      
      // Get current file content if it's not a create operation
      let currentContent = '';
      if (params.diff.changeType !== 'create') {
        currentContent = await fetchFileContent(
          username,
          repoName,
          params.diff.filePath,
          params.branch
        ) || '';
      }
      
      // Apply the diff
      return applyDiff(currentContent, params.diff as FileDiff);
    }
    
    return {
      error: "Either fileContent or repo and diff.filePath must be provided"
    };
  },
  functionDeclaration: {
    name: "applyDiff",
    description: "Applies a structured diff to file content",
    parameters: {
      type: 'object',
      properties: {
        fileContent: { 
          type: 'string', 
          description: 'Current file content to apply diff to (empty string for new files)'
        },
        repo: { 
          type: 'string', 
          description: 'Repository in format "username/repo" to fetch file from (not needed if fileContent is provided)'
        },
        branch: { 
          type: 'string', 
          description: 'Branch to fetch file from (default: repository\'s default branch)'
        },
        diff: { 
          type: 'object', 
          description: 'Structured diff specification',
          properties: {
            filePath: { type: 'string', description: 'Path to the file to modify' },
            changeType: { type: 'string', enum: ['create', 'modify', 'delete'], description: 'Type of change to make' },
            content: { type: 'string', description: 'For new files or complete replacements, the entire content' },
            replacementType: { type: 'string', enum: ['complete', 'lines'], description: 'For modify operations, how to apply changes' },
            lineChanges: { 
              type: 'array', 
              description: 'For modify with line replacements, the specific line changes',
              items: {
                type: 'object',
                properties: {
                  startLine: { type: 'number', description: 'Starting line number (1-indexed)' },
                  endLine: { type: 'number', description: 'Ending line number (1-indexed)' },
                  newContent: { type: 'string', description: 'New content to replace the specified lines' }
                }
              }
            }
          },
          required: ['filePath', 'changeType']
        }
      },
      required: ['diff']
    }
  }
});

// New tool for writing files to GitHub repository
const writeFileToRepoTool = new FunctionTool({
  name: "writeFileToRepo",
  description: "Writes file content to a GitHub repository",
  fn: async (params: Record<string, any>) => {
    const repo = params.repo || DEFAULT_TS_REPO;
    const [username, repoName] = repo.split('/');
    
    // If SHA is not provided but we need to check if file exists
    let fileSha = params.sha;
    if (params.checkFileExists && !fileSha) {
      fileSha = await getFileSha(
        username,
        repoName,
        params.filePath,
        params.branch
      );
    }
    
    return writeFileToRepo(
      username,
      repoName,
      params.filePath,
      params.content,
      params.message,
      params.branch,
      fileSha
    );
  },
  functionDeclaration: {
    name: "writeFileToRepo",
    description: "Writes file content to a GitHub repository",
    parameters: {
      type: 'object',
      properties: {
        repo: { 
          type: 'string', 
          description: 'Repository in format "username/repo" (default: "njraladdin/adk-typescript")'
        },
        filePath: { 
          type: 'string', 
          description: 'Path to the file within the repository'
        },
        content: { 
          type: 'string', 
          description: 'Content to write to the file'
        },
        message: { 
          type: 'string', 
          description: 'Commit message'
        },
        branch: { 
          type: 'string', 
          description: 'Branch name to commit to'
        },
        sha: { 
          type: 'string', 
          description: 'SHA of the file if updating an existing file (optional)'
        },
        checkFileExists: { 
          type: 'boolean', 
          description: 'Whether to check if the file exists and get its SHA (default: false)'
        }
      },
      required: ['filePath', 'content', 'message', 'branch']
    }
  }
});

// New tool for deleting files from GitHub repository
const deleteFileFromRepoTool = new FunctionTool({
  name: "deleteFileFromRepo",
  description: "Deletes a file from a GitHub repository",
  fn: async (params: Record<string, any>) => {
    const repo = params.repo || DEFAULT_TS_REPO;
    const [username, repoName] = repo.split('/');
    
    // If SHA is not provided, get it
    let fileSha = params.sha;
    if (!fileSha) {
      fileSha = await getFileSha(
        username,
        repoName,
        params.filePath,
        params.branch
      );
      
      if (!fileSha) {
        return {
          error: `File not found: ${params.filePath}`
        };
      }
    }
    
    return deleteFileFromRepo(
      username,
      repoName,
      params.filePath,
      params.message,
      params.branch,
      fileSha
    );
  },
  functionDeclaration: {
    name: "deleteFileFromRepo",
    description: "Deletes a file from a GitHub repository",
    parameters: {
      type: 'object',
      properties: {
        repo: { 
          type: 'string', 
          description: 'Repository in format "username/repo" (default: "njraladdin/adk-typescript")'
        },
        filePath: { 
          type: 'string', 
          description: 'Path to the file to delete'
        },
        message: { 
          type: 'string', 
          description: 'Commit message'
        },
        branch: { 
          type: 'string', 
          description: 'Branch name to commit to'
        },
        sha: { 
          type: 'string', 
          description: 'SHA of the file to delete (optional, will be looked up if not provided)'
        }
      },
      required: ['filePath', 'message', 'branch']
    }
  }
});

// New tool for creating a pull request
const createPullRequestTool = new FunctionTool({
  name: "createPullRequest",
  description: "Creates a pull request in a GitHub repository",
  fn: async (params: Record<string, any>) => {
    const repo = params.repo || DEFAULT_TS_REPO;
    const [username, repoName] = repo.split('/');
    
    return createPullRequest(
      username,
      repoName,
      params.title,
      params.body,
      params.head,
      params.base || 'main',
      params.draft || false
    );
  },
  functionDeclaration: {
    name: "createPullRequest",
    description: "Creates a pull request in a GitHub repository",
    parameters: {
      type: 'object',
      properties: {
        repo: { 
          type: 'string', 
          description: 'Repository in format "username/repo" (default: "njraladdin/adk-typescript")'
        },
        title: { 
          type: 'string', 
          description: 'The title of the pull request'
        },
        body: { 
          type: 'string', 
          description: 'The body/description of the pull request'
        },
        head: { 
          type: 'string', 
          description: 'The name of the branch containing the changes'
        },
        base: { 
          type: 'string', 
          description: 'The name of the branch to merge into (default: "main")'
        },
        draft: { 
          type: 'boolean', 
          description: 'Whether to create the PR as a draft (default: false)'
        }
      },
      required: ['title', 'body', 'head']
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
  4. Get typescript repository file structure to understand codebase organization
  5. Get typescript file content from repositories to analyze equivalent files
  6. Create new issues in the TypeScript repo for tracking port work
  
  WORKFLOW TO FOLLOW:
  When asked to port changes, follow these steps:
  
  1. First, use getUnreportedCommits() to find Python commits that haven't been reported in the TypeScript repo, it will return the list of unreported commits if there are any, otherwise it would return an empty array.
  2. Filter out any commits with 'core' or 'bump' in their message or description as these don't need to be ported.
  3. Select the first remaining commit in the list if there are any unreported commits, otherwise return "No unreported commits found"
  4. Check if the commit message references any issues (e.g., contains "#123")
     a. If it does, use getIssueDetails() to get context about that issue
  5. Use getCommitDiff() with the commit's SHA to get the code changes
  6. Analyze the diff to understand what changed in Python and needs porting to TypeScript
  7. Use getRepoFileStructure() to get the file structure of the typescript repo to understand the codebase organization and the equivalent files in the python repo
  8. For each modified file in the Python diff, identify the equivalent TypeScript file(s) that need to be updated
  9. Use getFileContentFromRepo() to get the content of the equivalent TypeScript files for deeper analysis
  10. Create a detailed issue using createIssue() with:
     a. A title following the format: "[NEW COMMIT IN ADK-PYTHON] [commit:SHORT_SHA] Brief description"
     b. A body explaining what needs to be implemented in TypeScript, with these sections:
        - Introduce yourself as an agent responsible for detecting changes in the original python version of the project 
        - Overview of changes
        - implementation steps section with specific technical instructions / explanations on how to port the changes
        - List of equivalent TypeScript files that need modification
     c. Include the commit SHA to automatically attach the diff to the issue
  
  Only process one commit at a time. Be detailed in your analysis of the code changes.
  When analyzing diffs, focus on the core functionality, not syntax differences between languages.
  
  HANDLING LARGE DIFFS:
  When reviewing diffs received from getCommitDiff, if you observe files are too large and have been trimmed, flag the issue for human review. Clearly identify which specific files in the diff were truncated and explicitly state in the issue body that these files require manual inspection due to their size.
  
  implementation steps section:
  When creating the implementation steps section, be specific and detailed:
  1. Analyze the Python changes and identify the equivalent TypeScript files
  2. Provide step-by-step instructions for implementing the changes in TypeScript
  3. Reference specific files and code sections that need to be modified
  4. Consider TypeScript-specific implementation details that might differ from Python
  
  Always format your final analysis as JSON with "title" and "body" keys before creating an issue.
  When creating issues for commits, always include the commitSha parameter to automatically include the diff.
  
  If user asks to test only certain tools or steps, do so.`,
  tools: [
    getUnreportedCommitsTool,
    getIssueDetailsTool,
    getCommitDiffTool,
    getRepoFileStructureTool,
    getFileContentFromRepoTool,
    createIssueTool,
    createBranchTool,
    applyDiffTool,
    writeFileToRepoTool,
    deleteFileFromRepoTool,
    createPullRequestTool
  ]
});
