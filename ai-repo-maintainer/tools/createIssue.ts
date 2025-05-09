import axios from 'axios';
import dotenv from "dotenv";
import { getCommitDiff } from './getCommitDiff';

dotenv.config();

// Your bot's PAT here
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "your_token_here";
console.log(GITHUB_TOKEN)
export async function createIssue(
  title: string, 
  body: string, 
  commitSha?: string, 
  repoForDiff?: string
) {
  try {
    let finalBody = body;
    
    // If a commit SHA is provided, fetch and append the diff
    if (commitSha) {
      try {
        const repo = repoForDiff || 'google/adk-python'; // Default to Python repo
        const [username, repoName] = repo.split('/');
        
        console.log(`Fetching diff for commit ${commitSha} from ${repo}...`);
        const diff = await getCommitDiff(username, repoName, commitSha);
        
        // Append the diff to the issue body in a collapsible section
        finalBody += `\n\n<details>
<summary>Commit Diff (${commitSha})</summary>\n
\`\`\`diff
${diff}
\`\`\`
</details>`;
      } catch (error: any) {
        console.error(`❌ Failed to fetch commit diff: ${error.message}`);
        finalBody += `\n\n> Note: Tried to include commit diff for ${commitSha}, but encountered an error.`;
      }
    }
    
    const response = await axios.post(
      'https://api.github.com/repos/njraladdin/adk-typescript/issues',
      {
        title,
        body: finalBody
      },
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`
        }
      }
    );

    console.log(`✅ Issue created: ${response.data.html_url}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to create issue:", error.message);
    throw error;
  }
}

// For direct testing via command line
// Check if this file is being run directly
if (require.main === module) {
  const testFunction = async () => {
    try {
      // Test without commit diff
      const issue = await createIssue("Test Issue", "This is a test issue created with axios");
      console.log("Issue created:", issue);
      
      // Uncomment to test with commit diff
      // const issueWithDiff = await createIssue(
      //   "Test Issue with Diff",
      //   "This is a test issue that includes a commit diff",
      //   "2cbbf881353835ba1c321de865b0f53d1c4540e5", // Example commit SHA
      //   "google/adk-python"
      // );
      // console.log("Issue with diff created:", issueWithDiff);
    } catch (error: any) {
      console.error('Test failed:', error?.message);
    }
  };
  
  testFunction();
}
