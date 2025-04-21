

/**
 * Implementation of AutoFlow.
 */
import * as agentTransfer from './agentTransfer';
import { SingleFlow } from './SingleFlow';
import { BaseLlmRequestProcessor } from './BaseLlmProcessor';

/**
 * AutoFlow is SingleFlow with agent transfer capability.
 *
 * Agent transfer is allowed in the following directions:
 * 
 * 1. from parent to sub-agent;
 * 2. from sub-agent to parent;
 * 3. from sub-agent to its peer agents;
 *
 * For peer-agent transfers, it's only enabled when all below conditions are met:
 * 
 * - The parent agent is also of AutoFlow;
 * - `allowTransferToPeer` option of this agent is not set to false (default is true).
 *
 * Depending on the target agent flow type, the transfer may be automatically
 * reversed. The condition is as below:
 *
 * - If the flow type of the transferee agent is also auto, transferee agent will
 *   remain as the active agent. The transferee agent will respond to the user's
 *   next message directly.
 * - If the flow type of the transferee agent is not auto, the active agent will
 *   be reversed back to previous agent.
 */
export class AutoFlow extends SingleFlow {
  /**
   * Creates a new AutoFlow instance with agent transfer capability.
   * 
   * @param requestProcessors Additional request processors to use
   */
  constructor(requestProcessors: BaseLlmRequestProcessor[] = []) {
    super(requestProcessors);
    
    // Add the agent transfer processor to enable transfer capabilities
    this.requestProcessors.push(agentTransfer.requestProcessor);
  }
} 