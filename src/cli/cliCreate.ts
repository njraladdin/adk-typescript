// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { promisify } from 'util';

const INIT_PY_TEMPLATE = `from . import agent\n`;
const AGENT_PY_TEMPLATE = `from google.adk.agents import Agent\n\nroot_agent = Agent(\n    model='{model_name}',\n    name='root_agent',\n    description='A helpful assistant for user questions.',\n    instruction='Answer user questions to the best of your knowledge',\n)\n`;

const GOOGLE_API_MSG = `\nDon't have API Key? Create one in AI Studio: https://aistudio.google.com/apikey\n`;
const GOOGLE_CLOUD_SETUP_MSG = `\nYou need an existing Google Cloud account and project, check out this link for details:\nhttps://google.github.io/adk-docs/get-started/quickstart/#gemini---google-cloud-vertex-ai\n`;
const OTHER_MODEL_MSG = `\nPlease see below guide to configure other models:\nhttps://google.github.io/adk-docs/agents/models\n`;
const SUCCESS_MSG = `\nAgent created in {agent_folder}:\n- .env\n- __init__.py\n- agent.py\n`;

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
  while (true) {
    const value = await askQuestion(rl, promptPrefix, defaultValue);
    if (value && value.trim()) return value.trim();
  }
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
  while (true) {
    const modelChoice = await askQuestion(rl, `Choose a model for the root agent:\n1. gemini-1.5-flash\n2. Other models (fill later)\nChoose model`, '1');
    if (modelChoice === '1') return 'gemini-1.5-flash';
    if (modelChoice === '2') {
      console.log(OTHER_MODEL_MSG);
      return '<FILL_IN_MODEL>';
    }
  }
}

async function promptToChooseBackend(
  rl: readline.Interface,
  googleApiKey?: string,
  googleCloudProject?: string,
  googleCloudRegion?: string
): Promise<{ googleApiKey?: string; googleCloudProject?: string; googleCloudRegion?: string }> {
  while (true) {
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
  }
}

async function generateFiles(
  agentFolder: string,
  opts: {
    googleApiKey?: string;
    googleCloudProject?: string;
    googleCloudRegion?: string;
    model?: string;
  }
) {
  await fs.promises.mkdir(agentFolder, { recursive: true });
  const dotenvFilePath = path.join(agentFolder, '.env');
  const initFilePath = path.join(agentFolder, '__init__.py');
  const agentFilePath = path.join(agentFolder, 'agent.py');
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
  await fs.promises.writeFile(initFilePath, INIT_PY_TEMPLATE, 'utf-8');
  await fs.promises.writeFile(agentFilePath, AGENT_PY_TEMPLATE.replace('{model_name}', opts.model || '<FILL_IN_MODEL>'), 'utf-8');
  console.log(SUCCESS_MSG.replace('{agent_folder}', agentFolder));
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
  });
  rl.close();
} 