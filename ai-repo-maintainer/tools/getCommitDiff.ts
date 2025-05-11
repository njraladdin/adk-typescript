import axios from 'axios';

/**
 * Interface representing a structured diff for a file
 */
export interface FileDiff {
  file: string;
  changed_lines: number;
  excerpt: string[];
  additions: number;
  deletions: number;
  is_binary: boolean;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
}

/**
 * Interface representing a structured commit diff
 */
export interface CommitDiffResponse {
  files: FileDiff[];
  total_additions: number;
  total_deletions: number;
  total_files_changed: number;
}

/**
 * Gets the diff for a specific commit
 * @param username GitHub username or organization name
 * @param repo GitHub repository name
 * @param commitSha The commit hash to get the diff for
 * @param maxExcerptLines Maximum number of lines to include in the excerpt (default: 10)
 * @returns Promise resolving to a structured diff object
 */
export async function getCommitDiff(
  username: string,
  repo: string,
  commitSha: string,
  maxExcerptLines: number = 10
): Promise<CommitDiffResponse> {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/commits/${commitSha}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3.diff',
        }
      }
    );
    
    const rawDiff = response.data;
    return parseDiff(rawDiff, maxExcerptLines);
  } catch (error: any) {
    console.error('Error fetching commit diff:', error.message);
    throw error;
  }
}

/**
 * Parse a raw git diff into a structured format
 * @param rawDiff The raw diff string from GitHub API
 * @param maxExcerptLines Maximum number of lines to include in the excerpt
 * @returns Structured diff object
 */
function parseDiff(
  rawDiff: string, 
  maxExcerptLines: number
): CommitDiffResponse {
  const files: FileDiff[] = [];
  let totalAdditions = 0;
  let totalDeletions = 0;
  
  // Split the diff by file sections (diff --git lines)
  const filePatterns = rawDiff.split(/\ndiff --git /);
  
  // First element might be empty or contain some header information
  const fileSections = filePatterns[0].trim().length > 0 
    ? [`diff --git ${filePatterns[0]}`] 
    : [];
  
  // Add the rest of the file sections with the diff --git prefix restored
  for (let i = 1; i < filePatterns.length; i++) {
    fileSections.push(`diff --git ${filePatterns[i]}`);
  }
  
  for (let sectionIndex = 0; sectionIndex < fileSections.length; sectionIndex++) {
    const section = fileSections[sectionIndex];
    if (!section.startsWith('diff --git')) continue;
    
    // Extract filenames from the section
    const fileNameMatch = section.match(/diff --git a\/(.*?) b\/(.*?)(\n|$)/);
    if (!fileNameMatch) continue;
    
    const fromFile = fileNameMatch[1];
    const toFile = fileNameMatch[2];
    
    // Determine file status
    let status: 'modified' | 'added' | 'deleted' | 'renamed' = 'modified';
    let fileName = toFile;
    
    if (section.includes('new file mode')) {
      status = 'added';
      fileName = toFile;
    } else if (section.includes('deleted file mode')) {
      status = 'deleted';
      fileName = fromFile;
    } else if (fromFile !== toFile) {
      status = 'renamed';
      fileName = toFile; // Use the new name for renamed files
    }
    
    const isBinary = section.includes('Binary files') || section.includes('GIT binary patch');
    
    if (isBinary) {
      files.push({
        file: fileName,
        changed_lines: 0,
        excerpt: ['Binary file changed'],
        additions: 0,
        deletions: 0,
        is_binary: true,
        status
      });
      continue;
    }
    
    // Extract the actual diff content - everything after the first @@ line
    // This handles multiple hunks in the diff
    const hunks: string[] = [];
    const hunkMatches = section.matchAll(/@@.*?@@.*?(?=(?:\n@@|\n?$))/gs);
    
    for (const match of hunkMatches) {
      if (match[0]) hunks.push(match[0]);
    }
    
    // If no hunks were found, try a different approach for the entire section after the header
    let diffContent = '';
    if (hunks.length === 0) {
      const headerEndIndex = section.indexOf('\n+++');
      if (headerEndIndex !== -1) {
        // Find the first @@ after the header
        const firstHunkIndex = section.indexOf('@@', headerEndIndex);
        if (firstHunkIndex !== -1) {
          diffContent = section.substring(firstHunkIndex);
        }
      }
    } else {
      diffContent = hunks.join('\n');
    }
    
    // If we still couldn't extract content, skip this file
    if (!diffContent) continue;
    
    // Process the diff content
    const lines = diffContent.split('\n').filter(line => line.length > 0);
    
    // Count additions and deletions
    const addedLines = lines.filter(line => line.startsWith('+')).length;
    const removedLines = lines.filter(line => line.startsWith('-')).length;
    
    totalAdditions += addedLines;
    totalDeletions += removedLines;
    
    // Get changed lines (lines starting with + or -)
    const changedLines = lines.filter(line => line.startsWith('+') || line.startsWith('-'));
    
    // Maximum line length to include in excerpt
    const MAX_LINE_LENGTH = 500;
    
    // Create the excerpt with trimmed lines
    const excerpt: string[] = [];
    
    // Check if we have any very large lines in this file
    const hasVeryLargeLines = changedLines.some(line => line.length > 3000);
    
    // Process all changed lines up to maxExcerptLines
    for (let i = 0; i < Math.min(changedLines.length, maxExcerptLines); i++) {
      const line = changedLines[i];
      
      // For normal-sized lines, just include them directly
      if (line.length <= MAX_LINE_LENGTH) {
        excerpt.push(line);
      } else {
        // For long lines, trim them and add information about how much is trimmed
        const prefix = line.charAt(0); // Keep the + or - prefix
        const remainingChars = line.length - MAX_LINE_LENGTH;
        
        // Format large numbers with commas for readability
        const formattedLength = line.length.toLocaleString();
        const formattedRemaining = remainingChars.toLocaleString();
        
        excerpt.push(`${prefix}${line.substring(1, MAX_LINE_LENGTH)}... [trimmed ${formattedRemaining} chars from ${formattedLength} char line]`);
      }
    }
    
    // If this file has very large lines and we haven't yet included a sample from it
    if (hasVeryLargeLines && !excerpt.some(line => line.includes('[trimmed'))) {
      // Find the first very large line
      for (const line of changedLines) {
        if (line.length > 3000) {
          const prefix = line.charAt(0);
          
          // Try to find a meaningful part of the code to show
          let startIndex = 0;
          
          // Look for common code patterns
          const codePatterns = ['var ', 'function ', 'const ', 'let ', 'class ', 'import '];
          for (const pattern of codePatterns) {
            const patternIndex = line.indexOf(pattern);
            if (patternIndex >= 0) {
              startIndex = patternIndex;
              break;
            }
          }
          
          const charsToShow = Math.min(MAX_LINE_LENGTH, line.length - startIndex);
          const snippet = line.substring(startIndex, startIndex + charsToShow);
          const totalLength = line.length;
          
          // Format large numbers with commas for readability
          const formattedLength = totalLength.toLocaleString();
          
          excerpt.push(`${prefix}${snippet}... [showing ${charsToShow} chars from ${formattedLength} char line]`);
          break;
        }
      }
    }
    
    // Add ellipsis if there are more lines than what we included
    if (changedLines.length > maxExcerptLines) {
      excerpt.push(`... (${changedLines.length - maxExcerptLines} more lines)`);
    }
    
    files.push({
      file: fileName,
      changed_lines: addedLines + removedLines,
      excerpt,
      additions: addedLines,
      deletions: removedLines,
      is_binary: false,
      status
    });
  }
  
  return {
    files,
    total_additions: totalAdditions,
    total_deletions: totalDeletions,
    total_files_changed: files.length
  };
}

// For direct testing via command line
if (require.main === module) {
  const testFunction = async () => {
    try {
      // Example values for testing
      const username = 'google';
      const repo = 'adk-python';
      const commitSha = '6dec235c13f42f1a6f69048b30fb78f48831cdbd'; // Replace with an actual commit SHA to test
      
      console.log(`Fetching diff for commit ${commitSha} from ${username}/${repo} repo:`);
      const diffData = await getCommitDiff(username, repo, commitSha, 10);
      console.log(JSON.stringify(diffData, null, 2));
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  testFunction();
} 