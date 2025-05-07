import axios from 'axios';

/**
 * Fetches the list of issues from a GitHub repository
 * @param username GitHub username or organization name
 * @param repo GitHub repository name
 * @param state Issue state to filter by (default: 'open')
 * @param count Number of issues to retrieve (default: 30)
 * @returns Promise resolving to an array of issue objects
 */
export async function getRepoIssues(
  username: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open', 
  count: number = 30
): Promise<any[]> {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/issues`,
      {
        params: {
          state: state,
          per_page: count
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching issues:', error);
    throw error;
  }
}

// For direct testing via command line
if (require.main === module) {
  const testFunction = async () => {
    try {
      // Using the previously hardcoded values for testing
      const username = 'google';
      const repo = 'adk-python';
      // const username = 'njraladdin';
      // const repo = 'adk-typescript';
      
      console.log(`Fetching open issues from ${username}/${repo} repo:`);
      const issues = await getRepoIssues(username, repo, 'open', 5);
      console.log(JSON.stringify(issues, null, 2));
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  testFunction();
} 