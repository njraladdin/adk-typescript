import { getRepoCommits } from './getRepoCommits';
import { getRepoIssues } from './getRepoIssues';

/**
 * Format used in issue titles to indicate a commit has been reported
 * Format: [commit:SHORT_HASH] or the full commit hash in the issue body
 */
const COMMIT_REFERENCE_REGEX = /\[commit:([a-f0-9]+)\]|\b([a-f0-9]{40})\b/gi;

/**
 * Gets commits from the Python repo that haven't been reported as issues in the TypeScript repo
 * @param pythonRepoUsername GitHub username/org for the Python repo (e.g., 'google')
 * @param pythonRepoName GitHub repo name for the Python repo (e.g., 'adk-python')
 * @param tsRepoUsername GitHub username/org for the TypeScript repo (e.g., 'njraladdin')
 * @param tsRepoName GitHub repo name for the TypeScript repo (e.g., 'adk-typescript')
 * @param commitCount Number of recent commits to check (default: 10)
 * @returns Promise resolving to an array of unreported commit objects
 */
export async function getUnreportedCommits(
  pythonRepoUsername: string,
  pythonRepoName: string,
  tsRepoUsername: string, 
  tsRepoName: string,
  commitCount: number = 10
): Promise<any[]> {
  try {
    // Get the latest commits from the Python repo
    const pythonCommits = await getRepoCommits(pythonRepoUsername, pythonRepoName, commitCount);
    
    // Get all issues from the TypeScript repo (including closed ones to avoid re-reporting)
    const tsIssues = await getRepoIssues(tsRepoUsername, tsRepoName, 'all', 100);
    
    // Create a set of commit hashes that have already been reported as issues
    const reportedCommitHashes = new Set<string>();
    
    // Extract commit hashes from issue titles and bodies
    for (const issue of tsIssues) {
      // Check the title and body for commit references
      const titleAndBody = `${issue.title} ${issue.body || ''}`;
      let match;
      while ((match = COMMIT_REFERENCE_REGEX.exec(titleAndBody)) !== null) {
        // Store both the full hash and the first 7 characters (short hash)
        const commitHash = match[1] || match[2];
        reportedCommitHashes.add(commitHash.toLowerCase());
        
        // Also add the short hash version if we found a full hash
        if (commitHash.length === 40) {
          reportedCommitHashes.add(commitHash.substring(0, 7).toLowerCase());
        }
      }
    }
    
    // Filter out commits that have already been reported
    const unreportedCommits = pythonCommits.filter(commit => {
      const fullHash = commit.sha.toLowerCase();
      const shortHash = fullHash.substring(0, 7);
      
      return !reportedCommitHashes.has(fullHash) && !reportedCommitHashes.has(shortHash);
    });
    
    return unreportedCommits;
  } catch (error) {
    console.error('Error getting unreported commits:', error);
    throw error;
  }
}

// For direct testing via command line
if (require.main === module) {
  const testFunction = async () => {
    try {
      // Example repositories
      const pythonRepoUsername = 'google';
      const pythonRepoName = 'adk-python';
      const tsRepoUsername = 'njraladdin';
      const tsRepoName = 'adk-typescript';
      
      console.log(`Checking for unreported commits from ${pythonRepoUsername}/${pythonRepoName} that are not reported in ${tsRepoUsername}/${tsRepoName}...`);
      const unreportedCommits = await getUnreportedCommits(
        pythonRepoUsername, 
        pythonRepoName, 
        tsRepoUsername, 
        tsRepoName,
        10
      );
      
      console.log(`Found ${unreportedCommits.length} unreported commits:`);
      for (const commit of unreportedCommits) {
        console.log(`- ${commit.sha.substring(0, 7)}: ${commit.commit.message.split('\n')[0]}`);
      }
      
      console.log('\nFull details:');
      console.log(JSON.stringify(unreportedCommits, null, 2));
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  testFunction();
} 