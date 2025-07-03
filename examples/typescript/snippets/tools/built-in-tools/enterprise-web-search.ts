/**
 * TypeScript example demonstrating the Enterprise Web Search tool in ADK TypeScript.
 * 
 * This example shows how to use the built-in EnterpriseWebSearchTool for enterprise-compliant
 * web grounding with Gemini models.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * The actual imports and usage may vary depending on your project setup.
 */

// Example of how to import and use EnterpriseWebSearchTool
// import { LlmAgent } from 'adk-typescript/agents';
// import { EnterpriseWebSearchTool } from 'adk-typescript/tools';

/**
 * Example 1: Basic Enterprise Web Search Agent
 */
export function createEnterpriseWebSearchAgent() {
  // This example shows how to create an agent with Enterprise Web Search
  const agent = {
    name: "enterprise_search_agent",
    model: "gemini-2.0-flash", // Enterprise Web Search works with Gemini 2.x models
    description: "Agent to answer questions using Enterprise Web Search for compliance.",
    instruction: "I can answer your questions by searching the internet using enterprise-compliant web grounding. This ensures that the search results meet enterprise security and compliance standards. Just ask me anything!",
    tools: [
      // new EnterpriseWebSearchTool() // Uncomment when using actual library
    ]
  };
  
  return agent;
}

/**
 * Example 2: Enterprise Compliance Research Agent
 */
export function createEnterpriseComplianceAgent() {
  const agent = {
    name: "compliance_search_agent",
    model: "gemini-2.0-flash",
    description: "Specialized agent for enterprise compliance research using secure web grounding.",
    instruction: `I am a specialized agent for enterprise compliance research. I use enterprise-grade web search to find information about:
    - Regulatory compliance requirements
    - Industry best practices
    - Security standards and frameworks
    - Data privacy regulations
    - Enterprise technology guidelines
    
    All my searches are conducted through enterprise-compliant channels to ensure data security and regulatory compliance.`,
    tools: [
      // new EnterpriseWebSearchTool() // Uncomment when using actual library
    ]
  };
  
  return agent;
}

/**
 * Example 3: Usage with different Gemini models
 */
export function createEnterpriseWebSearchExamples() {
  const examples = {
    // Works with Gemini 2.x models
    gemini2Agent: {
      name: "gemini2_enterprise_search",
      model: "gemini-2.0-flash",
      tools: [
        // new EnterpriseWebSearchTool()
      ]
    },
    
    // Also works with Gemini 1.x models (but with limitations)
    gemini1Agent: {
      name: "gemini1_enterprise_search", 
      model: "gemini-1.5-flash",
      // Note: In Gemini 1.x, EnterpriseWebSearchTool cannot be used with other tools
      tools: [
        // new EnterpriseWebSearchTool() // Must be the only tool for Gemini 1.x
      ]
    }
  };
  
  return examples;
}

/**
 * Example queries that work well with Enterprise Web Search
 */
export const enterpriseSearchQueries = [
  "What are the latest enterprise cloud security best practices for 2025?",
  "What are the current trends in enterprise AI governance?", 
  "What are the latest enterprise data privacy regulations?",
  "What are the recommended cybersecurity frameworks for large enterprises?",
  "What are the compliance requirements for enterprise data storage?",
  "What are the best practices for enterprise API security?",
  "What are the latest developments in enterprise zero-trust architecture?"
];

/**
 * Key features of EnterpriseWebSearchTool:
 * 
 * 1. Enterprise Compliance: Uses enterprise-grade web grounding that meets 
 *    corporate security and compliance standards
 * 
 * 2. Model Support: Works with both Gemini 1.x and Gemini 2.x models
 *    - Gemini 1.x: Cannot be combined with other tools
 *    - Gemini 2.x: Can be used alongside other tools
 * 
 * 3. Automatic Configuration: The tool automatically configures the LLM request
 *    to enable enterprise web search capabilities
 * 
 * 4. Built-in Tool: Execution happens internally within the model, no local
 *    code execution required
 * 
 * 5. Error Handling: Provides clear error messages for unsupported models
 *    or invalid configurations
 */

export default {
  createEnterpriseWebSearchAgent,
  createEnterpriseComplianceAgent,
  createEnterpriseWebSearchExamples,
  enterpriseSearchQueries
}; 