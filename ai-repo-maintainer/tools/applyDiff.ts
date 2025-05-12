import dotenv from 'dotenv';
dotenv.config();

/**
 * Interface representing a change to a specific line range
 */
export interface LineChange {
  startLine: number;
  endLine: number;
  newContent: string;
}

/**
 * Interface representing a complete diff for a file
 */
export interface FileDiff {
  filePath: string;
  changeType: 'create' | 'modify' | 'delete';
  content?: string;
  replacementType?: 'complete' | 'lines';
  lineChanges?: LineChange[];
}

/**
 * Applies a structured diff to file content
 * 
 * @param currentContent Current content of the file (empty string for new files)
 * @param diff The structured diff to apply
 * @returns The new content after applying the diff
 */
export function applyDiff(
  currentContent: string,
  diff: FileDiff
): string {
  // Handle different change types
  switch (diff.changeType) {
    case 'create':
      // For a new file, just return the content
      return diff.content || '';
    
    case 'modify':
      if (diff.replacementType === 'complete') {
        // Complete replacement
        return diff.content || '';
      } else if (diff.replacementType === 'lines' && diff.lineChanges) {
        // Line-by-line replacement
        return applyLineChanges(currentContent, diff.lineChanges);
      } else {
        throw new Error('Invalid diff format. For modify operations, either content (with replacementType: complete) or lineChanges (with replacementType: lines) must be provided.');
      }
    
    case 'delete':
      // For deletion, return empty string
      return '';
    
    default:
      throw new Error(`Invalid change type: ${diff.changeType}`);
  }
}

/**
 * Helper function to fetch file content from GitHub
 * 
 * @param owner Repository owner
 * @param repo Repository name
 * @param filePath Path to file
 * @param branch Branch name
 * @returns File content as string or null if file doesn't exist
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  filePath: string,
  branch?: string
): Promise<string | null> {
  const branchParam = branch ? `?ref=${branch}` : '';
  const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}${branchParam}`, {
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (fileResponse.status === 404) {
    return null; // File doesn't exist
  }

  if (!fileResponse.ok) {
    const errorData = await fileResponse.json();
    throw new Error(`Failed to get file content: ${fileResponse.status} ${fileResponse.statusText}`);
  }

  const fileData = await fileResponse.json();
  return Buffer.from(fileData.content, 'base64').toString();
}

/**
 * Applies line changes to a file's content
 * 
 * @param currentContent The current content of the file as a string
 * @param lineChanges Array of line change specifications
 * @returns The new content with changes applied
 */
function applyLineChanges(currentContent: string, lineChanges: LineChange[]): string {
  const lines = currentContent.split('\n');
  
  // Sort changes in reverse order by line number so we can apply them
  // without affecting the line numbers of subsequent changes
  const sortedChanges = [...lineChanges].sort((a, b) => b.startLine - a.startLine);
  
  for (const change of sortedChanges) {
    // Convert from 1-indexed to 0-indexed
    const startIndex = change.startLine - 1;
    const endIndex = change.endLine - 1;
    
    // Validate indices
    if (startIndex < 0 || endIndex >= lines.length || startIndex > endIndex) {
      throw new Error(`Invalid line range: ${change.startLine}-${change.endLine} (file has ${lines.length} lines)`);
    }
    
    // Replace the specified line range with new content
    const newLines = change.newContent.split('\n');
    lines.splice(startIndex, endIndex - startIndex + 1, ...newLines);
  }
  
  return lines.join('\n');
}

/**
 * Test function to demonstrate diff application
 * Run with: npx ts-node tools/applyDiff.ts
 */
async function runTests() {
  console.log("Running all applyDiff test cases...\n");
  
  // Sample file content for testing
  const sampleFileContent = `Line 1: This is a test file.
Line 2: It has multiple lines.
Line 3: We will modify some of these lines.
Line 4: This is the last line.`;
  
  // Test case 1: Creating a new file
  console.log("TEST CASE 1: Creating a new file");
  console.log("--------------------------------");
  
  const createDiff: FileDiff = {
    filePath: 'test-file.txt',
    changeType: 'create',
    content: 'This is a new file created with applyDiff.\nIt has multiple lines.\nCreated at: ' + new Date().toISOString()
  };
  
  const createResult = applyDiff('', createDiff);
  console.log("Result:");
  console.log(createResult);
  console.log("\n");
  
  
  // Test case 2: Complete file replacement
  console.log("TEST CASE 2: Complete file replacement");
  console.log("-------------------------------------");
  console.log("Original content:");
  console.log(sampleFileContent);
  
  const modifyCompleteDiff: FileDiff = {
    filePath: 'test-file.txt',
    changeType: 'modify',
    replacementType: 'complete',
    content: 'This file has been completely replaced.\nWith all new content.\nModified at: ' + new Date().toISOString()
  };
  
  const modifyCompleteResult = applyDiff(sampleFileContent, modifyCompleteDiff);
  console.log("\nModified content:");
  console.log(modifyCompleteResult);
  console.log("\n");
  
  
  // Test case 3: Line-by-line modification
  console.log("TEST CASE 3: Line-by-line modification");
  console.log("-------------------------------------");
  console.log("Original content:");
  console.log(sampleFileContent);
  
  const modifyLinesDiff: FileDiff = {
    filePath: 'test-file.txt',
    changeType: 'modify',
    replacementType: 'lines',
    lineChanges: [
      {
        startLine: 2, // Second line
        endLine: 3, // Third line
        newContent: "Line 2: This line has been modified.\nLine 3: This is a new inserted line."
      }
    ]
  };
  
  const modifyLinesResult = applyDiff(sampleFileContent, modifyLinesDiff);
  console.log("\nModified content:");
  console.log(modifyLinesResult);
  console.log("\n");
  
  
  // Test case 4: Multiple line changes
  console.log("TEST CASE 4: Multiple line changes");
  console.log("--------------------------------");
  console.log("Original content:");
  console.log(sampleFileContent);
  
  const multipleChangesDiff: FileDiff = {
    filePath: 'test-file.txt',
    changeType: 'modify',
    replacementType: 'lines',
    lineChanges: [
      {
        startLine: 1, // First line
        endLine: 1,
        newContent: "Line 1: This is the modified first line."
      },
      {
        startLine: 4, // Last line
        endLine: 4,
        newContent: "Line 4: This is the modified last line."
      }
    ]
  };
  
  const multipleChangesResult = applyDiff(sampleFileContent, multipleChangesDiff);
  console.log("\nModified content:");
  console.log(multipleChangesResult);
  console.log("\n");
  
  
  // Test case 5: File deletion
  console.log("TEST CASE 5: File deletion");
  console.log("-------------------------");
  console.log("Original content:");
  console.log(sampleFileContent);
  
  const deleteDiff: FileDiff = {
    filePath: 'test-file.txt',
    changeType: 'delete'
  };
  
  const deleteResult = applyDiff(sampleFileContent, deleteDiff);
  console.log("\nResult after deletion:");
  console.log(`"${deleteResult}" (empty string)`);
  console.log("\n");
  
  
  // Test case 6: GitHub integration (fetch and modify file)
  console.log("TEST CASE 6: GitHub integration (fetch and modify)");
  console.log("----------------------------------------------");
  
  try {
    console.log("Fetching file from GitHub and applying changes...");
    // Example parameters - change these to match your repo
    const owner = 'njraladdin';
    const repo = 'adk-typescript';
    const filePath = 'README.md';
    
    const fetchedContent = await fetchFileContent(owner, repo, filePath);
    if (fetchedContent) {
      console.log("\nFetched content (truncated):");
      console.log(fetchedContent.substring(0, 100) + '... (truncated)');
      
      // Example diff that adds a line at the top
      const addLineDiff: FileDiff = {
        filePath: filePath,
        changeType: 'modify',
        replacementType: 'lines',
        lineChanges: [
          {
            startLine: 1,
            endLine: 1, 
            newContent: "# This line was modified by applyDiff\n" + fetchedContent.split('\n')[0]
          }
        ]
      };
      
      const modifiedContent = applyDiff(fetchedContent, addLineDiff);
      console.log("\nModified content (truncated):");
      console.log(modifiedContent.substring(0, 100) + '... (truncated)');
    } else {
      console.log("File not found.");
    }
  } catch (error) {
    console.error("Error in GitHub integration test:", error);
  }
  
  console.log("\nAll tests completed!");
}

// Run the tests if this file is executed directly (not imported)
if (require.main === module) {
  runTests().catch(err => {
    console.error('Error running tests:', err);
    process.exit(1);
  });
} 