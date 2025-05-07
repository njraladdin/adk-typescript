import axios from 'axios';

/**
 * Fetches detailed information about a specific GitHub issue and its comments
 * @param username GitHub username or organization name
 * @param repo GitHub repository name
 * @param issueNumber Issue number identifier
 * @returns Promise resolving to an object containing issue details and its comments
 */
export async function getIssueDetails(
  username: string,
  repo: string,
  issueNumber: number
): Promise<{issue: any, comments: any[]}> {
  try {
    // Get the issue details
    const issueResponse = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/issues/${issueNumber}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    // Get the issue comments
    const commentsResponse = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/issues/${issueNumber}/comments`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    return {
      issue: issueResponse.data,
      comments: commentsResponse.data
    };
  } catch (error) {
    console.error(`Error fetching issue #${issueNumber} details:`, error);
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
      const issueNumber = 297; // Using the issue number from the commit message we saw
      
      console.log(`Fetching details for issue #${issueNumber} from ${username}/${repo} repo:`);
      const details = await getIssueDetails(username, repo, issueNumber);
      console.log('Issue details:', JSON.stringify(details.issue, null, 2));
      console.log(`Comments (${details.comments.length}):`);
      console.log(JSON.stringify(details.comments, null, 2));
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  testFunction();
} 