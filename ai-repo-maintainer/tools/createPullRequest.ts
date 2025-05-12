import dotenv from 'dotenv';
dotenv.config();

/**
 * Creates a pull request in a GitHub repository
 * 
 * @param owner The owner of the repository (username or organization)
 * @param repo The name of the repository
 * @param title The title of the pull request
 * @param body The body/description of the pull request
 * @param head The name of the branch containing the changes
 * @param base The name of the branch to merge into (default: 'main')
 * @param draft Whether to create the PR as a draft (default: false)
 * @returns The created pull request object or error
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string = 'main',
  draft: boolean = false
): Promise<any> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        title,
        body,
        head,
        base,
        draft
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      return {
        error: `Failed to create pull request: ${response.status} ${response.statusText}`,
        details: responseData
      };
    }
    
    return {
      success: true,
      message: `Created pull request #${responseData.number}: ${title}`,
      data: responseData,
      url: responseData.html_url
    };
  } catch (error: any) {
    return {
      error: `Exception creating pull request: ${error.message}`,
      details: error
    };
  }
} 

/**
 * Test function to run the createPullRequest functionality
 * Run with: npx ts-node tools/createPullRequest.ts [headBranch]
 * 
 * Note: The branch specified must already exist and have changes committed to it
 */
async function runTest() {
  // Check if required environment variables are set
  if (!process.env.GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is not set.');
    console.error('Please set it in your .env file or environment variables.');
    process.exit(1);
  }

  // Get branch name from command line or use default
  const headBranch = process.argv[2];
  
  if (!headBranch) {
    console.error('Error: Head branch name is required.');
    console.error('Usage: npx ts-node tools/createPullRequest.ts <headBranch> [baseBranch]');
    process.exit(1);
  }
  
  const baseBranch = process.argv[3] || 'main';
  const isDraft = process.argv[4] === 'draft';
  
  // Set up repository and PR information
  const owner = 'njraladdin'; // Change this to your GitHub username
  const repo = 'adk-typescript'; // Change this to your repository name
  const title = `Test PR from ${headBranch}`;
  const body = `This is a test pull request created by the createPullRequest tool.
  
* Created at: ${new Date().toISOString()}
* Head branch: ${headBranch}
* Base branch: ${baseBranch}
* Draft: ${isDraft}

This PR was automatically generated for testing purposes.`;
  
  console.log(`Creating pull request from ${headBranch} into ${baseBranch}`);
  console.log(`Repository: ${owner}/${repo}`);
  console.log(`Draft: ${isDraft}`);
  
  try {
    const result = await createPullRequest(
      owner,
      repo,
      title,
      body,
      headBranch,
      baseBranch,
      isDraft
    );
    
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.url) {
      console.log(`\nPull request created successfully! View it at: ${result.url}`);
    }
  } catch (error) {
    console.error('Error running test:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly (not imported)
if (require.main === module) {
  runTest();
} 