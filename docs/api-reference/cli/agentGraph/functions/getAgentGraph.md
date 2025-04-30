[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../../README.md)

***

[ADK TypeScript API Reference](../../../modules.md) / [cli/agentGraph](../README.md) / getAgentGraph

# Function: getAgentGraph()

> **getAgentGraph**(`rootAgent`, `highlightPairs?`, `asImage?`): `any`

Defined in: [src/cli/agentGraph.ts:183](https://github.com/njraladdin/adk-typescript/blob/main/src/cli/agentGraph.ts#L183)

Generate an agent graph visualization

## Parameters

### rootAgent

[`BaseAgent`](../../../agents/BaseAgent/classes/BaseAgent.md)

The root agent to visualize

### highlightPairs?

`HighlightPair`[]

Optional pairs of node names to highlight

### asImage?

`boolean` = `false`

Whether to return the graph as an image (PNG) or as a graphviz object

## Returns

`any`

The graph as PNG binary data or as a graphviz object
