import axios from 'axios';

/**
 * Gets the content of a file from a GitHub repository
 * @param username GitHub username or organization name
 * @param repo GitHub repository name
 * @param filePath Path to the file within the repository
 * @param branch Optional branch name (defaults to the repository's default branch)
 * @returns Promise resolving to the file content as a string
 */
export async function getFileContentFromRepo(
  username: string,
  repo: string,
  filePath: string,
  branch?: string
): Promise<string> {
  try {
    // Build the URL - if branch is specified, include it, otherwise get from default branch
    const url = branch 
      ? `https://api.github.com/repos/${username}/${repo}/contents/${filePath}?ref=${branch}`
      : `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`;
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching file content:', error.message);
    throw error;
  }
}

// For direct testing via command line
if (require.main === module) {
  const testFunction = async () => {
    try {
      // Example values for testing
      const username = 'google';
      const repo = 'adk-python';
      const filePath = 'README.md'; // Example file path
      const branch = 'main'; // Optional branch name
      
      console.log(`Fetching ${filePath} from ${username}/${repo} repo (branch: ${branch || 'default'}):`);
      const content = await getFileContentFromRepo(username, repo, filePath, branch);
      console.log(content);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  testFunction();
} 