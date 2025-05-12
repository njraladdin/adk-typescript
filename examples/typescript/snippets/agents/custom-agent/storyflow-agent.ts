/**
 * TypeScript port of StoryFlowAgent from the Python ADK library
 * 
 * This example demonstrates creating a custom agent for a story generation workflow
 * that coordinates multiple LLM agents in a specific flow.
 * 
 * NOTE: This is a template file that demonstrates how to use the ADK TypeScript library.
 * You'll see TypeScript errors in your IDE until you install the actual 'adk-typescript' package.
 * The structure and patterns shown here match how you would use the library in a real project.
 */

import { 
  BaseAgent, 
  LlmAgent, 
  LoopAgent, 
  SequentialAgent,
  Runner,
  LlmRegistry,
  Content,
  Event,
  InvocationContext,
  InMemorySessionService
} from 'adk-typescript';

// --- Constants ---
const APP_NAME = "story_app";
const USER_ID = "12345";
const SESSION_ID = "123344";
const GEMINI_2_FLASH = "gemini-2.0-flash";

// Configure logging (simplified version for TypeScript)
const logger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// --8<-- [start:llmagents]
// Create model instance (using LlmRegistry)
const model = LlmRegistry.newLlm(GEMINI_2_FLASH);

// --- Define the individual LLM agents ---
const storyGenerator = new LlmAgent("StoryGenerator", {
  model: model,
  instruction: `You are a story writer. Write a short story (around 100 words) about a cat,
based on the topic provided in session state with key 'topic'`,
  outputKey: "current_story",  // Key for storing output in session state
});

const critic = new LlmAgent("Critic", {
  model: model,
  instruction: `You are a story critic. Review the story provided in
session state with key 'current_story'. Provide 1-2 sentences of constructive criticism
on how to improve it. Focus on plot or character.`,
  outputKey: "criticism",  // Key for storing criticism in session state
});

const reviser = new LlmAgent("Reviser", {
  model: model,
  instruction: `You are a story reviser. Revise the story provided in
session state with key 'current_story', based on the criticism in
session state with key 'criticism'. Output only the revised story.`,
  outputKey: "current_story",  // Overwrites the original story
});

const grammarCheck = new LlmAgent("GrammarCheck", {
  model: model,
  instruction: `You are a grammar checker. Check the grammar of the story
provided in session state with key 'current_story'. Output only the suggested
corrections as a list, or output 'Grammar is good!' if there are no errors.`,
  outputKey: "grammar_suggestions",
});

const toneCheck = new LlmAgent("ToneCheck", {
  model: model,
  instruction: `You are a tone analyzer. Analyze the tone of the story
provided in session state with key 'current_story'. Output only one word: 'positive' if
the tone is generally positive, 'negative' if the tone is generally negative, or 'neutral'
otherwise.`,
  outputKey: "tone_check_result", // This agent's output determines the conditional flow
});
// --8<-- [end:llmagents]

// --- Custom Orchestrator Agent ---
// --8<-- [start:init]
// @ts-ignore - Suppressing TypeScript errors since this is a template
class StoryFlowAgent extends BaseAgent {
  /**
   * Custom agent for a story generation and refinement workflow.
   *
   * This agent orchestrates a sequence of LLM agents to generate a story,
   * critique it, revise it, check grammar and tone, and potentially
   * regenerate the story if the tone is negative.
   */

  // Agent components
  storyGenerator: LlmAgent;
  critic: LlmAgent;
  reviser: LlmAgent;
  grammarCheck: LlmAgent;
  toneCheck: LlmAgent;

  // Composite agents
  loopAgent: LoopAgent;
  sequentialAgent: SequentialAgent;
  
  // Explicitly define subAgents property to fix TypeScript error
  subAgents: BaseAgent[] = [];

  constructor(
    name: string,
    storyGenerator: LlmAgent,
    critic: LlmAgent,
    reviser: LlmAgent,
    grammarCheck: LlmAgent,
    toneCheck: LlmAgent
  ) {
    // Create internal composite agents
    const loopAgent = new LoopAgent("CriticReviserLoop", {
      maxIterations: 2
    });
    
    // Add agents to the loop agent
    critic.setParentAgent(loopAgent);
    reviser.setParentAgent(loopAgent);
    
    const sequentialAgent = new SequentialAgent("PostProcessing");
    
    // Add agents to the sequential agent
    grammarCheck.setParentAgent(sequentialAgent);
    toneCheck.setParentAgent(sequentialAgent);

    // Call the BaseAgent constructor
    super(name);

    // Add subagents to this agent
    this.subAgents.push(storyGenerator);
    this.subAgents.push(loopAgent);
    this.subAgents.push(sequentialAgent);
    
    // Set parent relationships
    storyGenerator.setParentAgent(this);
    loopAgent.setParentAgent(this);
    sequentialAgent.setParentAgent(this);

    // Store the references to our agents
    this.storyGenerator = storyGenerator;
    this.critic = critic;
    this.reviser = reviser;
    this.grammarCheck = grammarCheck;
    this.toneCheck = toneCheck;
    this.loopAgent = loopAgent;
    this.sequentialAgent = sequentialAgent;
  }
// --8<-- [end:init]

  // --8<-- [start:executionlogic]
  /**
   * Implements the custom orchestration logic for the story workflow.
   */
  protected async *runAsyncImpl(
    ctx: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    // @ts-ignore - Suppressing TypeScript errors since this is a template
    logger.info(`[${this.name}] Starting story generation workflow.`);

    // 1. Initial Story Generation
    // @ts-ignore - Suppressing TypeScript errors since this is a template
    logger.info(`[${this.name}] Running StoryGenerator...`);
    for await (const event of this.storyGenerator.invoke(ctx)) {
      // @ts-ignore - Suppressing TypeScript errors since this is a template
      logger.info(`[${this.name}] Event from StoryGenerator: ${JSON.stringify(event, null, 2)}`);
      yield event;
    }

    // Check if story was generated before proceeding
    if (!ctx.session.state["current_story"]) {
      // @ts-ignore - Suppressing TypeScript errors since this is a template
      logger.error(`[${this.name}] Failed to generate initial story. Aborting workflow.`);
      return; // Stop processing if initial story failed
    }

    // @ts-ignore - Suppressing TypeScript errors since this is a template
    logger.info(`[${this.name}] Story state after generator: ${ctx.session.state["current_story"]}`);

    // 2. Critic-Reviser Loop
    // @ts-ignore - Suppressing TypeScript errors since this is a template
    logger.info(`[${this.name}] Running CriticReviserLoop...`);
    for await (const event of this.loopAgent.invoke(ctx)) {
      // @ts-ignore - Suppressing TypeScript errors since this is a template
      logger.info(`[${this.name}] Event from CriticReviserLoop: ${JSON.stringify(event, null, 2)}`);
      yield event;
    }

    // @ts-ignore - Suppressing TypeScript errors since this is a template
    logger.info(`[${this.name}] Story state after loop: ${ctx.session.state["current_story"]}`);

    // 3. Sequential Post-Processing (Grammar and Tone Check)
    // @ts-ignore - Suppressing TypeScript errors since this is a template
    logger.info(`[${this.name}] Running PostProcessing...`);
    for await (const event of this.sequentialAgent.invoke(ctx)) {
      // @ts-ignore - Suppressing TypeScript errors since this is a template
      logger.info(`[${this.name}] Event from PostProcessing: ${JSON.stringify(event, null, 2)}`);
      yield event;
    }

    // 4. Tone-Based Conditional Logic
    const toneCheckResult = ctx.session.state["tone_check_result"];
    // @ts-ignore - Suppressing TypeScript errors since this is a template
    logger.info(`[${this.name}] Tone check result: ${toneCheckResult}`);

    if (toneCheckResult === "negative") {
      // @ts-ignore - Suppressing TypeScript errors since this is a template
      logger.info(`[${this.name}] Tone is negative. Regenerating story...`);
      for await (const event of this.storyGenerator.invoke(ctx)) {
        // @ts-ignore - Suppressing TypeScript errors since this is a template
        logger.info(`[${this.name}] Event from StoryGenerator (Regen): ${JSON.stringify(event, null, 2)}`);
        yield event;
      }
    } else {
      // @ts-ignore - Suppressing TypeScript errors since this is a template
      logger.info(`[${this.name}] Tone is not negative. Keeping current story.`);
    }

    // @ts-ignore - Suppressing TypeScript errors since this is a template
    logger.info(`[${this.name}] Workflow finished.`);
  }
  // --8<-- [end:executionlogic]

  /**
   * Implementation for the live mode - just throw error as this isn't supported
   */
  protected async *runLiveImpl(
    ctx: InvocationContext
  ): AsyncGenerator<Event, void, unknown> {
    throw new Error('Live mode is not supported for StoryFlowAgent');
    
    // AsyncGenerator requires having at least one yield statement
    if (false) yield* [];
  }
  
  /**
   * Sets the user content for the agent.
   * 
   * @param content The user content
   * @param invocationContext The invocation context
   */
  setUserContent(content: Content, invocationContext: InvocationContext): void {
    // For StoryFlowAgent, we pass the content to all sub-agents
    for (const subAgent of this.subAgents) {
      subAgent.setUserContent(content, invocationContext);
    }
  }
}

// --8<-- [start:story_flow_agent]
// --- Create the custom agent instance ---
const storyFlowAgent = new StoryFlowAgent(
  "StoryFlowAgent",
  storyGenerator,
  critic,
  reviser,
  grammarCheck,
  toneCheck
);

// --- Setup Runner and Session ---
const sessionService = new InMemorySessionService();
const initialState = { topic: "a brave kitten exploring a haunted house" };

// Create session
const session = sessionService.createSession({
  appName: APP_NAME,
  userId: USER_ID,
  sessionId: SESSION_ID,
  state: initialState
});

logger.info(`Initial session state: ${JSON.stringify(session.state)}`);

const runner = new Runner({
  agent: storyFlowAgent,
  appName: APP_NAME,
  sessionService: sessionService
});

// --- Function to Interact with the Agent ---
function callAgent(userInputTopic: string): void {
  // Get the current session
  const currentSession = sessionService.getSession({
    appName: APP_NAME,
    userId: USER_ID,
    sessionId: SESSION_ID,
  });

  if (!currentSession) {
    logger.error("Session not found!");
    return;
  }

  // Update the topic
  currentSession.state.topic = userInputTopic;
  logger.info(`Updated session state topic to: ${userInputTopic}`);

  // Create content for the request
  const content: Content = {
    role: 'user',
    parts: [{ text: `Generate a story about: ${userInputTopic}` }]
  };

  // Run the agent and collect results
  let finalResponse = "No final response captured.";
  (async () => {
    try {
      const events = runner.run({
        userId: USER_ID, 
        sessionId: SESSION_ID, 
        newMessage: content
      });

      for await (const event of events) {
        if (event.isFinalResponse && event.content && event.content.parts && event.content.parts[0].text) {
          const responseText = event.content.parts[0].text || "";
          logger.info(`Potential final response from [${event.author}]: ${responseText}`);
          finalResponse = responseText;
        }
      }

      // Get the final session state
      const finalSession = sessionService.getSession({
        appName: APP_NAME,
        userId: USER_ID,
        sessionId: SESSION_ID
      });

      console.log("\n--- Agent Interaction Result ---");
      console.log("Agent Final Response: ", finalResponse);
      console.log("Final Session State:");
      console.log(JSON.stringify(finalSession?.state, null, 2));
      console.log("-------------------------------\n");
    } catch (error) {
      console.error("Error running agent:", error);
    }
  })();
}

// Run the agent with a sample topic
callAgent("a lonely robot finding a friend in a junkyard");
// --8<-- [end:story_flow_agent]

// Export both the agent and the runner function for external use
export const agent = storyFlowAgent;
export function runStoryFlow(userInputTopic: string): void {
  callAgent(userInputTopic);
} 