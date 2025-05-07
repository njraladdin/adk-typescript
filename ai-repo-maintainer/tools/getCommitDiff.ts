import axios from 'axios';

/**
 * Gets the diff for a specific commit
 * @param username GitHub username or organization name
 * @param repo GitHub repository name
 * @param commitSha The commit hash to get the diff for
 * @returns Promise resolving to the diff as a string
 */
export async function getCommitDiff(
  username: string,
  repo: string,
  commitSha: string
): Promise<string> {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/commits/${commitSha}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3.diff',
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching commit diff:', error);
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
      const commitSha = '0123456789abcdef'; // Replace with an actual commit SHA to test
      
      console.log(`Fetching diff for commit ${commitSha} from ${username}/${repo} repo:`);
      const diff = await getCommitDiff(username, repo, commitSha);
      console.log(diff);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  testFunction();
} 