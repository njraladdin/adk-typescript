import dotenv from 'dotenv';
dotenv.config();

/**
 * Creates a new branch in a GitHub repository based on an existing branch
 * 
 * @param owner The owner of the repository (username or organization)
 * @param repo The name of the repository
 * @param branchName The name of the new branch to create
 * @param baseBranch The name of the branch to base the new branch on (default: 'main')
 * @returns The created reference object or error
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  baseBranch: string = 'main'
): Promise<any> {
  try {
    // Get the SHA of the latest commit on the base branch
    const baseRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, {
      headers: { 
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!baseRefResponse.ok) {
      const errorData = await baseRefResponse.json();
      return {
        error: `Failed to get base branch reference: ${baseRefResponse.status} ${baseRefResponse.statusText}`,
        details: errorData
      };
    }

    const baseRefData = await baseRefResponse.json();
    
    // Create the new branch
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseRefData.object.sha
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      return {
        error: `Failed to create branch: ${response.status} ${response.statusText}`,
        details: responseData
      };
    }
    
    return {
      success: true,
      message: `Created branch ${branchName} from ${baseBranch}`,
      data: responseData
    };
  } catch (error: any) {
    return {
      error: `Exception creating branch: ${error.message}`,
      details: error
    };
  }
} 

/**
 * Test function to run the createBranch functionality
 * Run with: npx ts-node tools/createBranch.ts [branchName]
 */
async function runTest() {
  // Check if required environment variables are set
  if (!process.env.GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is not set.');
    console.error('Please set it in your .env file or environment variables.');
    process.exit(1);
  }

  // Get branch name from command line or use default
  const branchName = process.argv[2] || `test-branch-${Date.now()}`;
  const baseBranch = process.argv[3] || 'main';
  
  // Set up repository information
  const owner = 'njraladdin'; // Change this to your GitHub username
  const repo = 'adk-typescript'; // Change this to your repository name
  
  console.log(`Creating branch: ${branchName}`);
  console.log(`Base branch: ${baseBranch}`);
  console.log(`Repository: ${owner}/${repo}`);
  
  try {
    const result = await createBranch(owner, repo, branchName, baseBranch);
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error running test:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly (not imported)
if (require.main === module) {
  runTest();
} 