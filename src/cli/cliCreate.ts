 

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { promisify } from 'util';

const AGENT_TS_TEMPLATE = `const { LlmAgent, AutoFlow, LlmRegistry } = require('adk-typescript');
const dotenv = require('dotenv');

dotenv.config();

// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm('{model_name}');

// Create flow instance
const flow = new AutoFlow();

// Define the root agent
const rootAgent = new LlmAgent('root_agent', {
  model: model,
  flow: flow,
  instruction: 'Answer user questions to the best of your knowledge',
  tools: [],
});

// Export the agent - CommonJS style
module.exports = { rootAgent };
`;

const PACKAGE_JSON_TEMPLATE = `{
  "name": "{agent_name}",
  "version": "1.0.0",
  "description": "Agent created with ADK TypeScript",
  "main": "dist/agent.js",
  "scripts": {
    "build": "tsc",
    "start": "ts-node src/agent.ts"
  },
  "dependencies": {
    "adk-typescript": "^0.0.1-alpha.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}
`;

const TSCONFIG_JSON_TEMPLATE = `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
`;

const GOOGLE_API_MSG = `\nDon't have API Key? Create one in AI Studio: https://aistudio.google.com/apikey\n`;
const GOOGLE_CLOUD_SETUP_MSG = `\nYou need an existing Google Cloud account and project, check out this link for details:\nhttps://google.github.io/adk-docs/get-started/quickstart/#gemini---google-cloud-vertex-ai\n`;
const OTHER_MODEL_MSG = `\nPlease see below guide to configure other models:\nhttps://google.github.io/adk-docs/agents/models\n`;
const SUCCESS_MSG = `\nAgent created in {agent_folder}:\n- .env\n- package.json\n- tsconfig.json\n- src/agent.ts\n\nNext steps:\n1. cd {agent_folder}\n2. npm install              # Install dependencies\n3. adk-ts run .             # Run your agent (use '.' when inside the agent directory)\n\nAlternatively, you can run it from the parent directory:\n  adk-ts run {agent_folder}\n`;

function askQuestion(rl: readline.Interface, question: string, defaultValue?: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(defaultValue ? `${question} (${defaultValue}): ` : `${question}: `, answer => {
      resolve(answer && answer.trim() ? answer.trim() : (defaultValue || ''));
    });
  });
}

async function promptStr(rl: readline.Interface, promptPrefix: string, priorMsg?: string, defaultValue?: string): Promise<string> {
  if (priorMsg) {
    console.log(priorMsg);
  }
  
  // No need for a loop here as we will resolve only when we have a valid value
  const value = await askQuestion(rl, promptPrefix, defaultValue);
  return value && value.trim() ? value.trim() : (defaultValue || '');
}

async function promptForGoogleCloud(rl: readline.Interface, googleCloudProject?: string): Promise<string> {
  googleCloudProject = googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT || '';
  return promptStr(rl, 'Enter Google Cloud project ID', undefined, googleCloudProject);
}

async function promptForGoogleCloudRegion(rl: readline.Interface, googleCloudRegion?: string): Promise<string> {
  googleCloudRegion = googleCloudRegion || process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  return promptStr(rl, 'Enter Google Cloud region', undefined, googleCloudRegion);
}

async function promptForGoogleApiKey(rl: readline.Interface, googleApiKey?: string): Promise<string> {
  googleApiKey = googleApiKey || process.env.GOOGLE_API_KEY || '';
  return promptStr(rl, 'Enter Google API key', GOOGLE_API_MSG, googleApiKey);
}

async function promptForModel(rl: readline.Interface): Promise<string> {
  // Ask once and handle response
  const modelChoice = await askQuestion(rl, `Choose a model for the root agent:\n1. gemini-2.0-flash\n2. Other models (fill later)\nChoose model`, '1');
  
  if (modelChoice === '1') {
    return 'gemini-2.0-flash';
  } else if (modelChoice === '2') {
    console.log(OTHER_MODEL_MSG);
    return '<FILL_IN_MODEL>';
  }
  
  // Default fallback
  return 'gemini-2.0-flash';
}

async function promptToChooseBackend(
  rl: readline.Interface,
  googleApiKey?: string,
  googleCloudProject?: string,
  googleCloudRegion?: string
): Promise<{ googleApiKey?: string; googleCloudProject?: string; googleCloudRegion?: string }> {
  // Ask once and handle response
  const backendChoice = await askQuestion(rl, '1. Google AI\n2. Vertex AI\nChoose a backend', '1');
  
  if (backendChoice === '1') {
    googleApiKey = await promptForGoogleApiKey(rl, googleApiKey);
    return { googleApiKey };
  } else if (backendChoice === '2') {
    console.log(GOOGLE_CLOUD_SETUP_MSG);
    googleCloudProject = await promptForGoogleCloud(rl, googleCloudProject);
    googleCloudRegion = await promptForGoogleCloudRegion(rl, googleCloudRegion);
    return { googleCloudProject, googleCloudRegion };
  }
  
  // Default fallback to Google AI
  googleApiKey = await promptForGoogleApiKey(rl, googleApiKey);
  return { googleApiKey };
}

async function generateFiles(
  agentFolder: string,
  opts: {
    googleApiKey?: string;
    googleCloudProject?: string;
    googleCloudRegion?: string;
    model?: string;
    agentName: string;
  }
) {
  await fs.promises.mkdir(agentFolder, { recursive: true });
  await fs.promises.mkdir(path.join(agentFolder, 'src'), { recursive: true });
  
  const dotenvFilePath = path.join(agentFolder, '.env');
  const packageJsonFilePath = path.join(agentFolder, 'package.json');
  const tsconfigFilePath = path.join(agentFolder, 'tsconfig.json');
  const agentFilePath = path.join(agentFolder, 'src', 'agent.ts');
  
  const lines: string[] = [];
  if (opts.googleApiKey) {
    lines.push('GOOGLE_GENAI_USE_VERTEXAI=0');
  } else if (opts.googleCloudProject && opts.googleCloudRegion) {
    lines.push('GOOGLE_GENAI_USE_VERTEXAI=1');
  }
  if (opts.googleApiKey) lines.push(`GOOGLE_API_KEY=${opts.googleApiKey}`);
  if (opts.googleCloudProject) lines.push(`GOOGLE_CLOUD_PROJECT=${opts.googleCloudProject}`);
  if (opts.googleCloudRegion) lines.push(`GOOGLE_CLOUD_LOCATION=${opts.googleCloudRegion}`);
  
  await fs.promises.writeFile(dotenvFilePath, lines.join('\n'), 'utf-8');
  await fs.promises.writeFile(packageJsonFilePath, PACKAGE_JSON_TEMPLATE.replace('{agent_name}', opts.agentName), 'utf-8');
  await fs.promises.writeFile(tsconfigFilePath, TSCONFIG_JSON_TEMPLATE, 'utf-8');
  await fs.promises.writeFile(agentFilePath, AGENT_TS_TEMPLATE.replace('{model_name}', opts.model || '<FILL_IN_MODEL>'), 'utf-8');
  
  const successMessage = SUCCESS_MSG.replace(/{agent_folder}/g, agentFolder);
  console.log(successMessage);
}

export async function runCmd({
  agentName,
  model,
  googleApiKey,
  googleCloudProject,
  googleCloudRegion,
}: {
  agentName: string;
  model?: string;
  googleApiKey?: string;
  googleCloudProject?: string;
  googleCloudRegion?: string;
}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (!model) {
    model = await promptForModel(rl);
  }
  const backend = await promptToChooseBackend(rl, googleApiKey, googleCloudProject, googleCloudRegion);
  await generateFiles(agentName, {
    googleApiKey: backend.googleApiKey,
    googleCloudProject: backend.googleCloudProject,
    googleCloudRegion: backend.googleCloudRegion,
    model,
    agentName,
  });
  rl.close();
} 