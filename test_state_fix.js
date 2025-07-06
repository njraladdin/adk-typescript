const { LlmAgent, runners } = require('./src');
const { InMemorySessionService } = require('./src/sessions');
const { ToolContext } = require('./src/tools');
const { ReadonlyContext } = require('./src/agents');

// Test tool that updates state
async function updateStateValue(newValue, context) {
  if (!context) {
    return { status: "error", message: "Tool context not available" };
  }
  
  console.log(`[updateStateValue] Setting test_value to: ${newValue}`);
  context.state.set('test_value', newValue);
  return { status: "success", message: `Successfully set test_value to ${newValue}` };
}

// Instruction builder that reads state
function buildTestInstruction(readonlyContext) {
  const testValue = readonlyContext.state.get('test_value');
  console.log(`[buildTestInstruction] Current test_value in readonlyContext: ${testValue}`);
  
  return `
You are a test agent. Your current test value is: ${testValue || 'not set'}

You can:
1. Use updateStateValue tool to change the test value
2. Report the current test value

Remember to check if the value you see matches what was last set.
`;
}

// Test agent
const testAgent = new LlmAgent({
  name: "test_agent",
  model: "gemini-2.0-flash",
  description: "A test agent that verifies state updates are reflected in instruction building",
  tools: [updateStateValue],
  instruction: buildTestInstruction,
});

async function runTest() {
  // Setup test session
  const sessionService = new InMemorySessionService();
  const APP_NAME = "test_app";
  const USER_ID = "test_user";
  const SESSION_ID = "test_session";

  sessionService.createSession({
    appName: APP_NAME,
    userId: USER_ID,
    sessionId: SESSION_ID,
    state: { test_value: 'initial' }
  });

  // Create runner
  const runner = new runners.Runner({
    agent: testAgent,
    appName: APP_NAME,
    sessionService: sessionService
  });

  // Test sequence - just one call to see if state is updated
  const query = "Set the value to 'updated_value'";
  
  console.log(`\n=== Running test with query: "${query}" ===`);
  
  const events = runner.run({
    userId: USER_ID,
    sessionId: SESSION_ID,
    newMessage: {
      role: 'user',
      parts: [{ text: query }]
    }
  });

  let eventCount = 0;
  for await (const event of events) {
    eventCount++;
    console.log(`Test - Event ${eventCount}: author=${event.author}, functionCalls=${event.getFunctionCalls().length}, functionResponses=${event.getFunctionResponses().length}`);
    
    if (event.isFinalResponse() && event.content && event.content.parts) {
      console.log("Agent Response:", event.content.parts[0].text);
      break; // Stop after final response
    } else if (event.errorCode) {
      console.log(`Error Event: [${event.errorCode}] ${event.errorMessage}`);
      break;
    }
    
    // Stop after 5 events to prevent infinite loop
    if (eventCount >= 5) {
      console.log("Stopping after 5 events to prevent infinite loop");
      break;
    }
  }
  
  console.log(`Test completed after ${eventCount} events`);
}

if (require.main === module) {
  console.log("Starting state update test...");
  runTest().catch(console.error);
}

module.exports = { runTest }; 