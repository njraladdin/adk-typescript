import { Agent } from '../../../src';

/**
 * TestRunner class used for testing agents in the integration tests
 */
export class TestRunner {
  private agent: Agent;
  private events: any[] = [];

  /**
   * Create a new TestRunner instance
   * @param agent The agent to test
   */
  constructor(agent: Agent) {
    this.agent = agent;
  }

  /**
   * Create a TestRunner from an agent name
   * @param agentName The name of the agent to test
   * @returns A new TestRunner instance
   */
  static fromAgentName(agentName: string): TestRunner {
    // This would load an agent by name from a registry or configuration
    const agent = Agent.loadFromName(agentName);
    return new TestRunner(agent);
  }

  /**
   * Execute a query against the agent
   * @param query The query to send to the agent
   * @returns The agent's response
   */
  async executeQuery(query: string): Promise<string> {
    const response = await this.agent.generateResponse(query);
    
    // Store the event for later inspection
    this.events.push({
      author: this.agent.name,
      content: {
        role: 'model',
        parts: [{ text: response.text() }]
      }
    });
    
    return response.text();
  }

  /**
   * Execute a function call using the agent
   * @param functionName The name of the function to call
   * @param params The parameters for the function
   * @returns The result of the function call
   */
  async executeFunction(functionName: string, params: any): Promise<any> {
    const response = await this.agent.executeTool(functionName, params);
    return response;
  }
  
  /**
   * Get all events recorded during agent execution
   * @returns Array of events
   */
  getEvents(): any[] {
    return this.events;
  }
} 