import axios from 'axios';

/**
 * Fetches the latest commits from a GitHub repository
 * @param username GitHub username or organization name
 * @param repo GitHub repository name
 * @param count Number of commits to retrieve (default: 10)
 * @returns Promise resolving to an array of commit objects
 */
export async function getRepoCommits(
  username: string,
  repo: string,
  count: number = 10
): Promise<any[]> {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/commits`,
      {
        params: {
          per_page: count
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching commits:', error);
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
      
      console.log(`Fetching latest commits from ${username}/${repo} repo:`);
      const commits = await getRepoCommits(username, repo, 5);
      console.log(JSON.stringify(commits, null, 2));
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  testFunction();
} 