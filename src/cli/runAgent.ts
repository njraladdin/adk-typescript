import * as readline from 'readline';
import { config } from 'dotenv';
import { LlmAgent } from '../agents/LlmAgent';
import { Runner } from '../runners';
import { InMemorySessionService } from '../sessions/InMemorySessionService';
import { InMemoryArtifactService } from '../artifacts/InMemoryArtifactService';
import { Content, Part } from '../models/types';

// Load environment variables from .env file
config();

/**
 * Run an agent interactively from any file
 *
 * Usage in your agent file:
 * ```typescript
 * import { runAgent } from '../src/cli/runAgent';
 *
 * export const rootAgent = new LlmAgent({ ... });
 *
 * if (require.main === module) {
 *   runAgent(rootAgent);
 * }
 * ```
 *
 * @param agent The agent to run
 * @param options Optional configuration
 */
export async function runAgent(
  agent: LlmAgent,
  options: {
    appName?: string;
    userId?: string;
    initialState?: Record<string, any>;
  } = {}
): Promise<void> {
  const {
    appName = 'test-agent',
    userId = 'test-user',
    initialState = {}
  } = options;
console.log('running agent')
  const sessionService = new InMemorySessionService();
  const artifactService = new InMemoryArtifactService();

  const session = await sessionService.createSession({
    appName,
    userId,
    state: initialState,
  });

  const runner = new Runner({
    appName,
    agent,
    artifactService,
    sessionService,
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));

  console.log(`Agent "${agent.name}" started! Type "exit" to quit.\n`);

  let isRunning = true;
  while (isRunning) {
    const query = (await ask('[user]: ')).trim();
    if (!query) continue;
    if (query === 'exit') {
      isRunning = false;
      break;
    }

    const content: Content = {
      role: 'user',
      parts: [{ text: query } as Part]
    };

    for await (const event of runner.runAsync({
      userId: session.userId,
      sessionId: session.id,
      newMessage: content,
    })) {
      if (event.content && event.content.parts) {
        const text = event.content.parts
          .map((part: Part) => part.text || '')
          .join('');

        if (text) {
          console.log(`[${event.author}]: ${text}`);
        }
      }
    }
  }

  rl.close();
}
