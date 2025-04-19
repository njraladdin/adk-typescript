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
import { LlmAgent } from '../agents/LlmAgent';
// TODO: Import or define types: BaseArtifactService, InMemoryArtifactService, Runner, BaseSessionService, InMemorySessionService, Session, envs

interface InputFile {
  state: Record<string, any>;
  queries: string[];
}

export async function runInputFile(
  appName: string,
  rootAgent: LlmAgent,
  artifactService: any, // BaseArtifactService
  session: any, // Session
  sessionService: any, // BaseSessionService
  inputPath: string
): Promise<void> {
  const Runner = require('../runners/Runner').Runner;
  const inputFileRaw = await promisify(fs.readFile)(inputPath, 'utf-8');
  const inputFile: InputFile = JSON.parse(inputFileRaw);
  inputFile.state['_time'] = new Date().toISOString();
  session.state = inputFile.state;
  const runner = new Runner({
    appName,
    agent: rootAgent,
    artifactService,
    sessionService,
  });
  for (const query of inputFile.queries) {
    console.log(`user: ${query}`);
    const content = { role: 'user', parts: [{ text: query }] };
    for await (const event of runner.runAsync({
      userId: session.userId,
      sessionId: session.id,
      newMessage: content,
    })) {
      if (event.content && event.content.parts) {
        const text = event.content.parts.map((part: any) => part.text || '').join('');
        if (text) {
          console.log(`[${event.author}]: ${text}`);
        }
      }
    }
  }
}

export async function runInteractively(
  appName: string,
  rootAgent: LlmAgent,
  artifactService: any, // BaseArtifactService
  session: any, // Session
  sessionService: any // BaseSessionService
): Promise<void> {
  const Runner = require('../runners/Runner').Runner;
  const runner = new Runner({
    appName,
    agent: rootAgent,
    artifactService,
    sessionService,
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));
  while (true) {
    const query = (await ask('user: ')).trim();
    if (!query) continue;
    if (query === 'exit') break;
    for await (const event of runner.runAsync({
      userId: session.userId,
      sessionId: session.id,
      newMessage: { role: 'user', parts: [{ text: query }] },
    })) {
      if (event.content && event.content.parts) {
        const text = event.content.parts.map((part: any) => part.text || '').join('');
        if (text) {
          console.log(`[${event.author}]: ${text}`);
        }
      }
    }
  }
  rl.close();
}

export async function runCli({
  agentParentDir,
  agentFolderName,
  jsonFilePath,
  saveSession,
}: {
  agentParentDir: string;
  agentFolderName: string;
  jsonFilePath?: string;
  saveSession: boolean;
}): Promise<void> {
  // Dynamically import services and envs
  const { InMemoryArtifactService } = require('../artifacts/InMemoryArtifactService');
  const { InMemorySessionService } = require('../sessions/InMemorySessionService');
  const { Session } = require('../sessions/Session');
  const envs = require('./utils/envs');
  if (!process.env.PYTHONPATH?.includes(agentParentDir)) {
    process.env.PYTHONPATH = (process.env.PYTHONPATH || '') + path.delimiter + agentParentDir;
  }
  const artifactService = new InMemoryArtifactService();
  const sessionService = new InMemorySessionService();
  let session = sessionService.createSession({
    appName: agentFolderName,
    userId: 'test_user',
  });
  const agentModulePath = path.join(agentParentDir, agentFolderName);
  const agentModule = await import(path.join(agentParentDir, agentFolderName));
  const rootAgent = agentModule.agent.rootAgent;
  envs.loadDotenvForAgent(agentFolderName, agentParentDir);
  if (jsonFilePath) {
    if (jsonFilePath.endsWith('.input.json')) {
      await runInputFile(
        agentFolderName,
        rootAgent,
        artifactService,
        session,
        sessionService,
        jsonFilePath
      );
    } else if (jsonFilePath.endsWith('.session.json')) {
      const sessionRaw = await promisify(fs.readFile)(jsonFilePath, 'utf-8');
      session = Session.modelValidateJson(sessionRaw);
      for (const content of session.getContents()) {
        if (content.role === 'user') {
          console.log('user: ', content.parts[0].text);
        } else {
          console.log(content.parts[0].text);
        }
      }
      await runInteractively(
        agentFolderName,
        rootAgent,
        artifactService,
        session,
        sessionService
      );
    } else {
      console.error(`Unsupported file type: ${jsonFilePath}`);
      process.exit(1);
    }
  } else {
    console.log(`Running agent ${rootAgent.name}, type exit to exit.`);
    await runInteractively(
      agentFolderName,
      rootAgent,
      artifactService,
      session,
      sessionService
    );
  }
  if (saveSession) {
    let sessionPath;
    if (jsonFilePath) {
      sessionPath = jsonFilePath.replace('.input.json', '.session.json');
    } else {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      sessionPath = await new Promise<string>(resolve => rl.question('Session ID to save: ', resolve));
      rl.close();
      sessionPath = path.join(agentModulePath, `${sessionPath}.session.json`);
    }
    // Fetch the session again to get all the details.
    session = sessionService.getSession({
      appName: session.appName,
      userId: session.userId,
      sessionId: session.id,
    });
    await promisify(fs.writeFile)(sessionPath, session.modelDumpJson({ indent: 2, excludeNone: true }));
    console.log('Session saved to', sessionPath);
  }
} 