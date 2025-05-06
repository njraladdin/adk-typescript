import axios from 'axios';

/**
 * Fetches the latest commits from the Google ADK Python repository
 * @param count Number of commits to retrieve (default: 10)
 * @returns Promise resolving to an array of commit objects
 */
export async function getLatestCommits(count: number = 10): Promise<any[]> {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/google/adk-python/commits`,
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
      console.log('Fetching latest commits from Google ADK Python repo:');
      const commits = await getLatestCommits(5);
      console.log(JSON.stringify(commits, null, 2));
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  testFunction();
} 