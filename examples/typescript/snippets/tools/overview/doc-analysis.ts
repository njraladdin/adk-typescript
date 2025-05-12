/**
 * TypeScript port of the doc_analysis.py example from the Python ADK library
 * 
 * This example demonstrates how to use ToolContext with artifacts and memory services
 * to analyze documents and save the results.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { ToolContext, FunctionTool, Part } from 'adk-typescript';

/**
 * Analyzes a document using context from memory.
 * 
 * @param documentName The name of the document to analyze
 * @param analysisQuery The query to guide the analysis
 * @param toolContext The context for the tool execution with access to artifacts and memory
 * @returns A status object with analysis results information
 */
function processDocument(
  documentName: string, 
  analysisQuery: string, 
  toolContext: ToolContext
): Record<string, string | number> {
  // 1. Load the artifact
  console.log(`Tool: Attempting to load artifact: ${documentName}`);
  const documentPart = toolContext.loadArtifact(documentName);

  if (!documentPart) {
    return { 
      "status": "error", 
      "message": `Document '${documentName}' not found.` 
    };
  }

  // Assuming it's text for simplicity
  const documentText = documentPart.text || "";
  console.log(`Tool: Loaded document '${documentName}' (${documentText.length} chars).`);

  // 2. Search memory for related context
  console.log(`Tool: Searching memory for context related to: '${analysisQuery}'`);
  const memoryResponse = toolContext.searchMemory(`Context for analyzing document about ${analysisQuery}`);
  
  // Simplified extraction from memory response
  const memoryContext = memoryResponse.memories
    .filter(m => m.events && m.events.length > 0 && m.events[0].content)
    .map(m => m.events[0].content.parts[0].text)
    .join("\n");
    
  console.log(`Tool: Found memory context: ${memoryContext.substring(0, 100)}...`);

  // 3. Perform analysis (placeholder)
  const analysisResult = `Analysis of '${documentName}' regarding '${analysisQuery}' using memory context: [Placeholder Analysis Result]`;
  console.log("Tool: Performed analysis.");

  // 4. Save the analysis result as a new artifact
  const analysisPart = Part.fromText(analysisResult);
  const newArtifactName = `analysis_${documentName}`;
  const version = toolContext.saveArtifact(newArtifactName, analysisPart);
  console.log(`Tool: Saved analysis result as '${newArtifactName}' version ${version}.`);

  return { 
    "status": "success", 
    "analysis_artifact": newArtifactName, 
    "version": version 
  };
}

// Create the function tool
const docAnalysisTool = new FunctionTool(processDocument);

// Export for use in an Agent
export const documentAnalysisTool = docAnalysisTool;

/**
 * Usage example in an Agent:
 * 
 * ```typescript
 * import { Agent } from 'adk-typescript';
 * import { documentAnalysisTool } from './doc-analysis';
 * 
 * const myAgent = new Agent("analysis_agent", {
 *   model: "gemini-2.0-flash",
 *   instruction: "You can analyze documents when asked.",
 *   tools: [documentAnalysisTool]
 * });
 * ```
 * 
 * Notes:
 * - Assume artifact 'report.txt' was previously saved.
 * - Assume memory service is configured and has relevant past data.
 * - The agent must be configured with appropriate artifact and memory services.
 */ 