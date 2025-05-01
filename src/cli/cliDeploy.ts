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
import * as child_process from 'child_process';
import * as os from 'os';
import { promisify } from 'util';

const DOCKERFILE_TEMPLATE = `
FROM python:3.11-slim
WORKDIR /app

# Create a non-root user
RUN adduser --disabled-password --gecos "" myuser

# Change ownership of /app to myuser
RUN chown -R myuser:myuser /app

# Switch to the non-root user
USER myuser

# Set up environment variables - Start
ENV PATH="/home/myuser/.local/bin:$PATH"

ENV GOOGLE_GENAI_USE_VERTEXAI=1
ENV GOOGLE_CLOUD_PROJECT={gcp_project_id}
ENV GOOGLE_CLOUD_LOCATION={gcp_region}

# Set up environment variables - End

# Install ADK - Start
RUN pip install google-adk
# Install ADK - End

# Copy agent - Start

COPY "agents/{app_name}/" "/app/agents/{app_name}/"
{install_agent_deps}

# Copy agent - End

EXPOSE {port}

CMD adk {command} --port={port} {trace_to_cloud_option} "/app/agents"
`;

async function resolveProject(projectInOption?: string): Promise<string> {
  if (projectInOption) return projectInOption;
  try {
    const result = child_process.spawnSync('gcloud', ['config', 'get-value', 'project'], {
      encoding: 'utf-8',
    });
    if (result.status === 0 && result.stdout) {
      const project = result.stdout.trim();
      console.log(`Use default project: ${project}`);
      return project;
    }
  } catch (e) {
    console.log('Error getting default project:', e);
  }
  throw new Error('Could not resolve Google Cloud project.');
}

export async function toCloudRun({
  agentFolder,
  project,
  region,
  serviceName,
  appName,
  tempFolder,
  port,
  traceToCloud,
  withUi,
  verbosity,
}: {
  agentFolder: string;
  project?: string;
  region?: string;
  serviceName: string;
  appName: string;
  tempFolder: string;
  port: number;
  traceToCloud: boolean;
  withUi: boolean;
  verbosity: string;
}) {
  appName = appName || path.basename(agentFolder);
  console.log(`Start generating Cloud Run source files in ${tempFolder}`);
  // Remove tempFolder if exists
  if (fs.existsSync(tempFolder)) {
    console.log('Removing existing files');
    fs.rmSync(tempFolder, { recursive: true, force: true });
  }
  try {
    // Copy agent source code
    console.log('Copying agent source code...');
    const agentSrcPath = path.join(tempFolder, 'agents', appName);
    fs.mkdirSync(path.dirname(agentSrcPath), { recursive: true });
    copyDir(agentFolder, agentSrcPath);
    const requirementsTxtPath = path.join(agentSrcPath, 'requirements.txt');
    const installAgentDeps = fs.existsSync(requirementsTxtPath)
      ? `RUN pip install -r "/app/agents/${appName}/requirements.txt"`
      : '';
    console.log('Copying agent source code complete.');
    // Create Dockerfile
    console.log('Creating Dockerfile...');
    const dockerfileContent = DOCKERFILE_TEMPLATE
      .replace(/{gcp_project_id}/g, project || '')
      .replace(/{gcp_region}/g, region || '')
      .replace(/{app_name}/g, appName)
      .replace(/{port}/g, String(port))
      .replace(/{command}/g, withUi ? 'web' : 'api_server')
      .replace(/{install_agent_deps}/g, installAgentDeps)
      .replace(/{trace_to_cloud_option}/g, traceToCloud ? '--trace_to_cloud' : '');
    const dockerfilePath = path.join(tempFolder, 'Dockerfile');
    fs.mkdirSync(tempFolder, { recursive: true });
    await fs.promises.writeFile(dockerfilePath, dockerfileContent, 'utf-8');
    console.log(`Creating Dockerfile complete: ${dockerfilePath}`);
    // Deploy to Cloud Run
    console.log('Deploying to Cloud Run...');
    const regionOptions = region ? ['--region', region] : [];
    const resolvedProject = await resolveProject(project);
    child_process.execFileSync(
      'gcloud',
      [
        'run',
        'deploy',
        serviceName,
        '--source',
        tempFolder,
        '--project',
        resolvedProject,
        ...regionOptions,
        '--port',
        String(port),
        '--verbosity',
        verbosity,
        '--labels',
        'created-by=adk',
      ],
      { stdio: 'inherit' }
    );
  } finally {
    console.log(`Cleaning up the temp folder: ${tempFolder}`);
    fs.rmSync(tempFolder, { recursive: true, force: true });
  }
}

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
} 