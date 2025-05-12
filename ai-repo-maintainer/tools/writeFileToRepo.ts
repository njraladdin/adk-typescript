import dotenv from 'dotenv';
dotenv.config();

/**
 * Writes file content to a GitHub repository
 * 
 * @param owner The owner of the repository (username or organization)
 * @param repo The name of the repository
 * @param filePath Path to the file within the repository
 * @param content Content to write to the file
 * @param message Commit message
 * @param branch Branch name to commit to
 * @param sha SHA of the file if updating an existing file (optional)
 * @returns Result of the operation
 */
export async function writeFileToRepo(
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
): Promise<any> {
  try {
    // Convert content to base64
    const contentBase64 = Buffer.from(content).toString('base64');
    
    // Prepare request body
    const requestBody: any = {
      message,
      content: contentBase64,
      branch
    };
    
    // If updating an existing file, include the SHA
    if (sha) {
      requestBody.sha = sha;
    }
    
    // Send PUT request to GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      return {
        error: `Failed to write file: ${response.status} ${response.statusText}`,
        details: responseData
      };
    }
    
    return {
      success: true,
      message: `Successfully ${sha ? 'updated' : 'created'} file ${filePath}`,
      data: responseData
    };
  } catch (error: any) {
    return {
      error: `Exception writing file: ${error.message}`,
      details: error
    };
  }
}

/**
 * Deletes a file from a GitHub repository
 * 
 * @param owner The owner of the repository (username or organization)
 * @param repo The name of the repository
 * @param filePath Path to the file to delete
 * @param message Commit message
 * @param branch Branch name to commit to
 * @param sha SHA of the file to delete (required)
 * @returns Result of the operation
 */
export async function deleteFileFromRepo(
  owner: string,
  repo: string,
  filePath: string,
  message: string,
  branch: string,
  sha: string
): Promise<any> {
  try {
    // Send DELETE request to GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        message,
        branch,
        sha
      })
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      return {
        error: `Failed to delete file: ${response.status} ${response.statusText}`,
        details: responseData
      };
    }
    
    return {
      success: true,
      message: `Successfully deleted file ${filePath}`,
      data: responseData
    };
  } catch (error: any) {
    return {
      error: `Exception deleting file: ${error.message}`,
      details: error
    };
  }
}

/**
 * Gets the SHA of an existing file in a repository
 * 
 * @param owner The owner of the repository (username or organization)
 * @param repo The name of the repository
 * @param filePath Path to the file
 * @param branch Branch name (optional)
 * @returns The SHA of the file or null if the file doesn't exist
 */
export async function getFileSha(
  owner: string,
  repo: string,
  filePath: string,
  branch?: string
): Promise<string | null> {
  const branchParam = branch ? `?ref=${branch}` : '';
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}${branchParam}`, {
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  
  if (response.status === 404) {
    return null; // File doesn't exist
  }
  
  if (!response.ok) {
    throw new Error(`Failed to get file info: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.sha;
}

/**
 * Test function to run the writeFileToRepo functionality
 * Run with: npx ts-node tools/writeFileToRepo.ts [operation]
 */
async function runTest() {
  // Check if required environment variables are set
  if (!process.env.GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is not set.');
    console.error('Please set it in your .env file or environment variables.');
    process.exit(1);
  }

  // Get operation from command line or use default
  const operation = process.argv[2] || 'write';
  
  // Set up common test parameters
  const owner = 'njraladdin'; // Change this to your GitHub username
  const repo = 'adk-typescript'; // Change this to your repository name
  const testBranch = 'test-write-file';
  const testFilePath = 'test/write-file-test.txt';
  const commitMessage = `Test ${operation} operation from writeFileToRepo tool`;
  
  console.log(`Running operation: ${operation}`);
  console.log(`Repository: ${owner}/${repo}`);
  console.log(`Branch: ${testBranch}`);
  console.log(`File path: ${testFilePath}`);
  
  try {
    let result;
    
    // Prepare variables used in multiple cases
    const sampleContent = `This is a test file created by the writeFileToRepo tool.
It has multiple lines.
Created/modified at: ${new Date().toISOString()}`;
    
    switch (operation) {
      case 'write': {
        // Test creating/updating a file
        // Get SHA if the file already exists
        const sha = await getFileSha(owner, repo, testFilePath, testBranch);
        
        console.log(sha ? 'Updating existing file' : 'Creating new file');
        result = await writeFileToRepo(
          owner,
          repo,
          testFilePath,
          sampleContent,
          commitMessage,
          testBranch,
          sha || undefined
        );
        break;
      }
        
      case 'delete': {
        // Test deleting a file
        const fileSha = await getFileSha(owner, repo, testFilePath, testBranch);
        
        if (!fileSha) {
          console.error(`File ${testFilePath} does not exist in branch ${testBranch}`);
          process.exit(1);
        }
        
        console.log(`Deleting file with SHA: ${fileSha}`);
        result = await deleteFileFromRepo(
          owner,
          repo,
          testFilePath,
          commitMessage,
          testBranch,
          fileSha
        );
        break;
      }
        
      default:
        console.error(`Unknown operation: ${operation}`);
        console.error('Available operations: write, delete');
        process.exit(1);
    }
    
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