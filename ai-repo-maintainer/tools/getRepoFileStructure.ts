import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get GitHub token from environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

/**
 * Gets the file structure of a GitHub repository in a format suitable for LLMs
 * @param username GitHub username or organization name
 * @param repo GitHub repository name
 * @param path Optional path within the repository to start from (defaults to root)
 * @param branch Optional branch name (defaults to the repository's default branch)
 * @param maxDepth Maximum depth to display for directories (defaults to 3)
 * @returns Promise resolving to a formatted string representation of the file structure
 */
export async function getRepoFileStructure(
  username: string,
  repo: string,
  path: string = '',
  branch?: string,
  maxDepth: number = 15
): Promise<string> {
  try {
    // Create headers with authorization token if available
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    } else {
      console.warn('Warning: No GitHub token found. API rate limits will be restricted.');
    }
    
    // Get default branch if not specified
    if (!branch) {
      const repoResponse = await axios.get(
        `https://api.github.com/repos/${username}/${repo}`,
        { headers }
      );
      branch = repoResponse.data.default_branch;
    }
    
    // Get the entire tree in one request with recursive=1
    const treeResponse = await axios.get<GitHubTreeResponse>(
      `https://api.github.com/repos/${username}/${repo}/git/trees/${branch}:?recursive=1`,
      { headers }
    );
    
    // Check if the response was truncated (tree too large)
    if (treeResponse.data.truncated) {
      console.warn('Warning: Repository tree was truncated due to size limitations. Some files may not be shown.');
    }
    
    // Process the tree into a structured format
    const treeItems = treeResponse.data.tree;
    
    // Build a proper tree structure and then format it
    const fileStructure = buildFileTree(treeItems, path, maxDepth);
    
    return `Repository structure for ${username}/${repo} (branch: ${branch}):\n\n${fileStructure}`;
  } catch (error: any) {
    console.error('Error fetching repository structure:', error.message);
    // Provide more context about rate limiting if that's the error
    if (error.response && error.response.status === 403) {
      console.error('This may be due to GitHub API rate limiting. Try using a GitHub token for higher limits.');
    }
    throw error;
  }
}

interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: Map<string, TreeNode>;
  depth: number;
}

/**
 * Build a hierarchical file tree from the flat list of files from GitHub API
 */
function buildFileTree(items: GitHubTreeItem[], rootPath: string = '', maxDepth: number = 15): string {
  // Filter out ignored files/directories and keep only those under rootPath
  const relevantItems = items.filter(item => {
    if (shouldIgnoreTreeItem(item.path)) return false;
    if (rootPath && !item.path.startsWith(rootPath) && rootPath !== item.path) return false;
    
    // Calculate path depth from root
    const pathFromRoot = rootPath && item.path.startsWith(rootPath) 
      ? item.path.substring(rootPath.length).replace(/^\/+/, '') 
      : item.path;
    
    const depth = pathFromRoot ? pathFromRoot.split('/').length : 0;
    
    // Include if depth is within maxDepth
    return depth <= maxDepth;
  });
  
  // Create root node
  const root: TreeNode = {
    name: rootPath || '/',
    type: 'directory',
    children: new Map<string, TreeNode>(),
    depth: 0
  };
  
  // Add each item to the tree
  for (const item of relevantItems) {
    addToTree(root, item, rootPath, maxDepth);
  }
  
  // Now format the tree for display
  return formatTree(root, maxDepth);
}

/**
 * Add an item to the appropriate place in the tree
 */
function addToTree(root: TreeNode, item: GitHubTreeItem, rootPath: string = '', maxDepth: number = 15): void {
  // Get the relative path from the rootPath
  const relativePath = rootPath && item.path.startsWith(rootPath) 
    ? item.path.substring(rootPath.length).replace(/^\/+/, '')
    : item.path;
  
  // Skip the root itself
  if (!relativePath) return;
  
  const pathParts = relativePath.split('/');
  let current = root;
  
  // Navigate to the correct parent node
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!part) continue; // Skip empty parts
    
    const currentDepth = current.depth + 1;
    if (currentDepth > maxDepth) return; // Skip if we've reached max depth
    
    if (!current.children!.has(part)) {
      // Create directory node if it doesn't exist
      current.children!.set(part, {
        name: part,
        type: 'directory',
        children: new Map<string, TreeNode>(),
        depth: currentDepth
      });
    }
    
    current = current.children!.get(part)!;
  }
  
  // Add the leaf node (file or directory)
  const nodeName = pathParts[pathParts.length - 1];
  const nodeDepth = current.depth + 1;
  
  if (nodeName && nodeDepth <= maxDepth) {
    if (item.type === 'blob') {
      // It's a file
      current.children!.set(nodeName, {
        name: nodeName,
        type: 'file',
        depth: nodeDepth
      });
    } else if (item.type === 'tree') {
      // It's a directory
      if (!current.children!.has(nodeName)) {
        current.children!.set(nodeName, {
          name: nodeName,
          type: 'directory',
          children: new Map<string, TreeNode>(),
          depth: nodeDepth
        });
      }
    }
  }
}

/**
 * Format the tree recursively with proper indentation
 */
function formatTree(node: TreeNode, maxDepth: number = 15, prefix: string = '', isLast: boolean = true, isRoot: boolean = true): string {
  if (isRoot) {
    // For the root node, just format its children
    return formatChildren(node, maxDepth);
  }
  
  // Generate the line for this node
  const icon = node.type === 'directory' ? '📂' : '📄';
  const connector = isLast ? '└── ' : '├── ';
  const line = `${prefix}${connector}${icon} ${node.name}${node.type === 'directory' ? '/' : ''}\n`;
  
  // If this is a directory and not at max depth, format its children
  if (node.type === 'directory' && node.children && node.children.size > 0 && node.depth < maxDepth) {
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    return line + formatChildren(node, maxDepth, childPrefix);
  }
  
  return line;
}

/**
 * Format the children of a node
 */
function formatChildren(node: TreeNode, maxDepth: number, prefix: string = ''): string {
  if (!node.children || node.children.size === 0) return '';
  
  // Convert to array and sort (directories first, then alphabetically)
  const sortedChildren = Array.from(node.children.values())
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  
  let result = '';
  sortedChildren.forEach((child, index) => {
    const isLastChild = index === sortedChildren.length - 1;
    result += formatTree(child, maxDepth, prefix, isLastChild, false);
  });
  
  return result;
}

/**
 * Helper to ignore common files that are not useful to show in the structure
 */
function shouldIgnoreTreeItem(path: string): boolean {
  const ignorePatterns = [
    // Version control
    '.git', '.gitignore', '.gitattributes', '.gitmodules',
    '.svn', '.hg',
    
    // Package management
    'node_modules', 'package-lock.json', 'yarn.lock', 'contributing',
    'venv', 'env', '.venv', '.env', 'virtualenv',
    
    // Python specific
    '__pycache__', '*.pyc', '*.pyo', '*.pyd',
    '.pytest_cache', '.coverage', 'htmlcov',
    '.tox', '.nox', '.eggs', '*.egg-info', 'dist', 'build',
    '.ipynb_checkpoints', 'poetry.lock', 'Pipfile.lock',
    
    // IDE and editor files
    '.vscode', '.idea', '.vs', '*.suo', '*.user', '*.sln.docstates',
    '.project', '.classpath', '.settings',
    '.sublime-project', '.sublime-workspace',
    
    // OS specific
    '.DS_Store', 'Thumbs.db', 'Desktop.ini', '$RECYCLE.BIN',
    
    // Miscellaneous
    '.env.local', '.env.development.local', '.env.test.local', '.env.production.local',
    '*.log', 'logs', 'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*'
  ];
  
  // Check for exact matches or pattern matches
  for (const pattern of ignorePatterns) {
    // Check if the path contains the pattern as a directory or file name
    if (pattern.includes('*')) {
      // Simple wildcard matching for file extensions
      const regex = new RegExp(`(^|/)${pattern.replace(/\*/g, '.*')}$`);
      if (regex.test(path)) {
        return true;
      }
    } else if (
      path === pattern || 
      path.endsWith(`/${pattern}`) || 
      path.includes(`/${pattern}/`) ||
      path.startsWith(`${pattern}/`)
    ) {
      return true;
    }
  }
  
  return false;
}

// For direct testing via command line
if (require.main === module) {
  const testFunction = async () => {
    try {
      // Example values for testing
      const username = 'google';
      const repo = 'adk-python';
      const path = ''; // Start from root
      const branch = 'main'; // Optional branch name
      const maxDepth = 15; // Maximum depth to display
      
      // Log authentication status
      if (GITHUB_TOKEN) {
        console.log('Using GitHub token for authentication (higher rate limits)');
      } else {
        console.log('No GitHub token found. Running with restricted rate limits.');
      }
      
      console.log(`Fetching repo structure for ${username}/${repo}${branch ? ` (branch: ${branch})` : ''}...`);
      const structure = await getRepoFileStructure(username, repo, path, branch, maxDepth);
      console.log(structure);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  testFunction();
} 