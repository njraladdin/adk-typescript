/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BaseAgent } from '../agents/BaseAgent';
import { LlmAgent } from '../agents/LlmAgent';
import { BaseTool, FunctionTool, AgentTool } from '../tools';

/**
 * Type for highlight pairs in the graph
 */
type HighlightPair = [string, string];

// Graphviz is an optional dependency - we'll try to load it but handle the case where it's not installed
let graphviz: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  graphviz = require('graphviz');
} catch (e) {
  console.log('Graphviz module not found. Agent graph visualization will not be available.');
  console.log('To install graphviz, run: npm install graphviz');
}

// Try to load retrieval tool module - handle case when it's not available
let BaseRetrievalTool: any;
let retrievalToolModuleLoaded = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BaseRetrievalTool = require('../tools/retrieval/BaseRetrievalTool').BaseRetrievalTool;
  retrievalToolModuleLoaded = true;
} catch (e) {
  // Retrieval tool module is optional
  retrievalToolModuleLoaded = false;
}

/**
 * Build a graph representation of the agent and its sub-agents/tools
 * 
 * @param graph The graphviz graph object
 * @param agent The agent to build the graph for
 * @param highlightPairs Optional pairs of node names to highlight
 */
function buildGraph(graph: any, agent: BaseAgent, highlightPairs?: HighlightPair[]): void {
  const darkGreen = '#0F5223';
  const lightGreen = '#69CB87';
  const lightGray = '#cccccc';

  /**
   * Get the name of a node (agent or tool)
   */
  function getNodeName(toolOrAgent: BaseAgent | BaseTool): string {
    if (toolOrAgent instanceof BaseAgent) {
      return toolOrAgent.name;
    } else if (toolOrAgent instanceof BaseTool) {
      return toolOrAgent.name;
    } else {
      throw new Error(`Unsupported tool type: ${toolOrAgent}`);
    }
  }

  /**
   * Get the caption for a node (with emoji)
   */
  function getNodeCaption(toolOrAgent: BaseAgent | BaseTool): string {
    if (toolOrAgent instanceof BaseAgent) {
      return '🤖 ' + toolOrAgent.name;
    } else if (retrievalToolModuleLoaded && toolOrAgent instanceof BaseRetrievalTool) {
      return '🔎 ' + toolOrAgent.name;
    } else if (toolOrAgent instanceof FunctionTool) {
      return '🔧 ' + toolOrAgent.name;
    } else if (toolOrAgent instanceof AgentTool) {
      return '🤖 ' + toolOrAgent.name;
    } else if (toolOrAgent instanceof BaseTool) {
      return '🔧 ' + toolOrAgent.name;
    } else {
      console.warn(
        'Unsupported tool, type:', typeof toolOrAgent,
        'obj:', toolOrAgent
      );
      return `❓ Unsupported tool type: ${typeof toolOrAgent}`;
    }
  }

  /**
   * Get the shape for a node based on its type
   */
  function getNodeShape(toolOrAgent: BaseAgent | BaseTool): string {
    if (toolOrAgent instanceof BaseAgent) {
      return 'ellipse';
    } else if (retrievalToolModuleLoaded && toolOrAgent instanceof BaseRetrievalTool) {
      return 'cylinder';
    } else if (toolOrAgent instanceof FunctionTool) {
      return 'box';
    } else if (toolOrAgent instanceof BaseTool) {
      return 'box';
    } else {
      console.warn(
        'Unsupported tool, type:', typeof toolOrAgent,
        'obj:', toolOrAgent
      );
      return 'cylinder';
    }
  }

  /**
   * Draw a node in the graph
   */
  function drawNode(toolOrAgent: BaseAgent | BaseTool): void {
    const name = getNodeName(toolOrAgent);
    const shape = getNodeShape(toolOrAgent);
    const caption = getNodeCaption(toolOrAgent);

    if (highlightPairs) {
      for (const highlightTuple of highlightPairs) {
        if (highlightTuple.includes(name)) {
          graph.addNode(name, {
            label: caption,
            style: 'filled,rounded',
            fillcolor: darkGreen,
            color: darkGreen,
            shape: shape,
            fontcolor: lightGray,
          });
          return;
        }
      }
    }

    // If not highlighted, draw a normal node
    graph.addNode(name, {
      label: caption,
      shape: shape,
      style: 'rounded',
      color: lightGray,
      fontcolor: lightGray,
    });
  }

  /**
   * Draw an edge between nodes
   */
  function drawEdge(fromName: string, toName: string): void {
    if (highlightPairs) {
      for (const [highlightFrom, highlightTo] of highlightPairs) {
        if (fromName === highlightFrom && toName === highlightTo) {
          graph.addEdge(fromName, toName, { color: lightGreen });
          return;
        } else if (fromName === highlightTo && toName === highlightFrom) {
          graph.addEdge(fromName, toName, { color: lightGreen, dir: 'back' });
          return;
        }
      }
    }

    // If not highlighted, draw a normal edge
    graph.addEdge(fromName, toName, { arrowhead: 'none', color: lightGray });
  }

  // Draw the agent node
  drawNode(agent);

  // Draw sub-agents
  for (const subAgent of agent.subAgents) {
    buildGraph(graph, subAgent, highlightPairs);
    drawEdge(agent.name, subAgent.name);
  }

  // Draw tools if it's an LLM agent
  if (agent instanceof LlmAgent && agent.canonicalTools) {
    for (const tool of agent.canonicalTools) {
      drawNode(tool);
      drawEdge(agent.name, getNodeName(tool));
    }
  }
}

/**
 * Generate an agent graph visualization
 * 
 * @param rootAgent The root agent to visualize
 * @param highlightPairs Optional pairs of node names to highlight
 * @param asImage Whether to return the graph as an image (PNG) or as a graphviz object
 * @returns The graph as PNG binary data or as a graphviz object
 */
export function getAgentGraph(
  rootAgent: BaseAgent,
  highlightPairs?: HighlightPair[],
  asImage = false
): Buffer | any {
  if (!graphviz) {
    throw new Error('Graphviz module not found. Please install it with: npm install graphviz');
  }

  console.log('Building graph...');
  const graph = graphviz.digraph('G');
  
  // Set graph attributes
  graph.set('rankdir', 'LR');
  graph.set('bgcolor', '#333537');

  buildGraph(graph, rootAgent, highlightPairs);

  if (asImage) {
    return graph.output('png');
  } else {
    return graph;
  }
} 