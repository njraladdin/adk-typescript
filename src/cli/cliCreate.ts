import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { promisify } from 'util';
import { VERSION } from '../index';

const AGENT_TS_TEMPLATE = `import { LlmAgent as Agent } from 'adk-typescript/agents';
import { LlmRegistry } from 'adk-typescript/models';
import { FunctionTool, ToolContext } from 'adk-typescript/tools';

// --- Tool Functions ---

/**
 * Returns current weather information for a specified city
 * @param params Object containing city name
 * @param context Optional ToolContext
 * @returns Promise resolving to weather information or error
 */
async function getWeather(
  params: Record<string, any>,
  context?: ToolContext
): Promise<{ status: string; report?: string; error_message?: string }> {
  const city = params.city;
  console.log(\`--- Tool: getWeather called for city: \${city} ---\`);
  const cityNormalized = city.toLowerCase().trim();
  const mockWeatherDb: Record<string, { status: string; report: string }> = {
    "newyork": {status: "success", report: "The weather in New York is sunny with a temperature of 25°C."},
    "london": {status: "success", report: "It's cloudy in London with a temperature of 15°C."},
    "tokyo": {status: "success", report: "Tokyo is experiencing light rain and a temperature of 18°C."},
  };
  if (mockWeatherDb[cityNormalized]) { return mockWeatherDb[cityNormalized]; }
  else { return {status: "error", error_message: \`Sorry, I don't have weather information for '\${city}'.\`}; }
}

/**
 * Gets the current local time and timezone.
 * @param params Empty object (no parameters needed)
 * @param context Optional ToolContext
 * @returns Promise resolving to time information
 */
async function getCurrentTime(
  params: Record<string, any>, 
  context?: ToolContext
): Promise<{ currentTime: string; timezone: string; }> {
    console.log(\`--- Tool: getCurrentTime called ---\`);
    const now = new Date();
    return {
        currentTime: now.toLocaleTimeString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}

// --- Tool Wrappers ---

const getWeatherTool = new FunctionTool({
  name: "getWeather",
  description: "Returns current weather information for a specified city",
  fn: getWeather,
  functionDeclaration: {
    name: "getWeather",
    description: "Returns current weather information for a specified city",
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'The name of the city (e.g., "New York")'}
      },
      required: ['city']
    }
  }
});

const getCurrentTimeTool = new FunctionTool({
    name: "getCurrentTime",
    description: "Gets the current local time and timezone.",
    fn: getCurrentTime,
    functionDeclaration: {
        name: "getCurrentTime",
        description: "Gets the current local time and timezone.",
        parameters: { type: 'object', properties: {} } // No parameters
    }
});


// --- Agent Definition ---

// Use LlmRegistry to get a model instance
const agentLlm = LlmRegistry.newLlm("{model_name}"); // Or another compatible model

// Export the root agent for ADK tools to find
export const rootAgent = new Agent({
  name: "{agent_name}", // Unique agent name
  model: agentLlm,       // LLM instance
  description: "Provides current weather and time information for cities.",
  instruction: "You are a helpful assistant. Use the 'getWeather' tool for weather queries " +
               "and the 'getCurrentTime' tool for time queries. Provide clear answers based on tool results. " +
               "If asked for weather AND time, use both tools.",
  tools: [getWeatherTool, getCurrentTimeTool], // List of available tools
});
`;

const PACKAGE_JSON_TEMPLATE = `{
  "name": "{agent_name}",
  "version": "1.0.0",
  "description": "Agent created with ADK TypeScript",
  "main": "dist/agent.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/agent.js"
  },
  "dependencies": {
    "adk-typescript": "^${VERSION}",
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
    "module": "Node16",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node16",
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
`;

const GOOGLE_API_MSG = `\nDon't have API Key? Create one in AI Studio: https://aistudio.google.com/apikey\n`;
const GOOGLE_CLOUD_SETUP_MSG = `\nYou need an existing Google Cloud account and project, check out this link for details:\nhttps://google.github.io/adk-docs/get-started/quickstart/#gemini---google-cloud-vertex-ai\n`;
const OTHER_MODEL_MSG = `\nPlease see below guide to configure other models:\nhttps://google.github.io/adk-docs/agents/models\n`;
const SUCCESS_MSG = `\nAgent created in {agent_folder}:\n- .env\n- package.json\n- tsconfig.json\n- agent.ts\n- README.md\n
Next steps:
1. cd {agent_folder}
2. npm install              # Install dependencies
3. npx adk-ts run .         # Run your agent in terminal (use '.' when inside the agent directory)
4. npx adk-ts web .         # OR try the dev UI in browser

`;

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
  const modelChoice = await askQuestion(rl, `Choose a model for the root agent:\n1. gemini-2.0-flash (recommended)\n2. gemini-2.5-pro\n3. Other models (fill later)\nChoose model`, '1');
  
  if (modelChoice === '1') {
    return 'gemini-2.0-flash';
  } else if (modelChoice === '2') {
    return 'gemini-2.5-pro';
  } else if (modelChoice === '3') {
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

/**
 * Sanitizes an agent name to use only alphanumeric characters and underscores
 * @param name The original agent name
 * @returns Sanitized name with non-alphanumeric characters replaced with underscores
 */
function sanitizeAgentName(name: string): string {
  // Replace any non-alphanumeric character (except underscores) with underscores
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
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
  
  const dotenvFilePath = path.join(agentFolder, '.env');
  const packageJsonFilePath = path.join(agentFolder, 'package.json');
  const tsconfigFilePath = path.join(agentFolder, 'tsconfig.json');
  const agentFilePath = path.join(agentFolder, 'agent.ts');
  const readmeFilePath = path.join(agentFolder, 'README.md');
  
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
  await fs.promises.writeFile(packageJsonFilePath, PACKAGE_JSON_TEMPLATE.replace(/{agent_name}/g, opts.agentName), 'utf-8');
  await fs.promises.writeFile(tsconfigFilePath, TSCONFIG_JSON_TEMPLATE, 'utf-8');
  
  // Ensure both curly and non-curly braces templates are replaced for agent name
  const agentCode = AGENT_TS_TEMPLATE
    .replace(/{model_name}/g, opts.model || 'gemini-2.0-flash')
    .replace(/{agent_name}/g, opts.agentName)
    .replace(/"{agent_name}"/g, `"${opts.agentName}"`)
    .replace(/'{agent_name}'/g, `'${opts.agentName}'`);
  
  await fs.promises.writeFile(agentFilePath, agentCode, 'utf-8');
  
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
  
  // Sanitize the agent name
  const sanitizedAgentName = sanitizeAgentName(agentName);
  if (sanitizedAgentName !== agentName) {
    console.log(`Agent name has been sanitized from "${agentName}" to "${sanitizedAgentName}" (only alphanumeric characters and underscores allowed)`);
  }
  
  if (!model) {
    model = await promptForModel(rl);
  }
  const backend = await promptToChooseBackend(rl, googleApiKey, googleCloudProject, googleCloudRegion);
  await generateFiles(sanitizedAgentName, {
    googleApiKey: backend.googleApiKey,
    googleCloudProject: backend.googleCloudProject,
    googleCloudRegion: backend.googleCloudRegion,
    model,
    agentName: sanitizedAgentName,
  });
  rl.close();
} 