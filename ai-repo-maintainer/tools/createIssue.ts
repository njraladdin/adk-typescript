import axios from 'axios';
import dotenv from "dotenv";

dotenv.config();

// Your bot's PAT here
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "your_token_here";
console.log(GITHUB_TOKEN)
export async function createIssue(title: string, body: string) {
  try {
    const response = await axios.post(
      'https://api.github.com/repos/njraladdin/adk-typescript/issues',
      {
        title,
        body
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
      const issue = await createIssue("Test Issue", "This is a test issue created with axios");
      console.log("Issue created:", issue);
    } catch (error: any) {
      console.error('Test failed:', error?.message);
    }
  };
  
  testFunction();
}
