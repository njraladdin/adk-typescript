[**ADK TypeScript API Reference v0.0.1-alpha.2**](../../README.md)

***

[ADK TypeScript API Reference](../../modules.md) / [index](../README.md) / default

# Variable: default

> **default**: `object`

Defined in: [src/index.ts:70](https://github.com/njraladdin/adk-typescript/blob/main/src/index.ts#L70)

The main entry point for the ADK library.
Provides both flat direct exports and namespaced exports,
similar to Python's import structure.

Users can import in different ways:

1. Default flat import:
   import ADK from 'adk-typescript';
   const agent = new ADK.LlmAgent({...});

2. Named flat import (for common components):
   import { LlmAgent, googleSearch } from 'adk-typescript';
   const agent = new LlmAgent({...});

3. Namespaced import (like Python):
   import { agents, tools } from 'adk-typescript';
   const agent = new agents.LlmAgent({...});
   tools.googleSearch({...});

4. Direct submodule import:
   import { LlmAgent } from 'adk-typescript/agents';
   import { googleSearch } from 'adk-typescript/tools';

## Type declaration

### agents

> **agents**: [`agents`](../../agents/README.md)

### AutoFlow

> **AutoFlow**: *typeof* [`AutoFlow`](../../flows/llm_flows/AutoFlow/classes/AutoFlow.md)

### BaseAgent

> **BaseAgent**: *typeof* [`BaseAgent`](../../agents/BaseAgent/classes/BaseAgent.md)

### flows

> **flows**: [`flows/llm_flows`](../../flows/llm_flows/README.md)

### googleSearch

> **googleSearch**: [`GoogleSearchTool`](../../tools/GoogleSearchTool/classes/GoogleSearchTool.md)

### InMemoryRunner

> **InMemoryRunner**: *typeof* [`InMemoryRunner`](../../runners/classes/InMemoryRunner.md)

### LlmAgent

> **LlmAgent**: *typeof* [`LlmAgent`](../../agents/LlmAgent/classes/LlmAgent.md)

### LlmRegistry

> **LlmRegistry**: *typeof* [`LlmRegistry`](../../models/LlmRegistry/classes/LlmRegistry.md)

### memory

> **memory**: [`memory`](../../memory/README.md)

### models

> **models**: [`models`](../../models/README.md)

### Runner

> **Runner**: *typeof* [`Runner`](../../runners/classes/Runner.md)

### runners

> **runners**: [`runners`](../../runners/README.md)

### sessions

> **sessions**: [`sessions`](../../sessions/README.md)

### tools

> **tools**: [`tools`](../../tools/README.md)

### utils

> **utils**: [`utils`](../../utils/README.md)

### VERSION

> **VERSION**: `string`
