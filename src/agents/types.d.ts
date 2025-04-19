// Type declarations for modules that don't exist yet or have casing issues

// For BaseAgent
declare module './BaseAgent' {
  import { Content } from '../models/types';
  
  export type BeforeAgentCallback = (callbackContext: any) => Content | undefined;
  export type AfterAgentCallback = (callbackContext: any) => Content | undefined;
  
  export class BaseAgent {
    name: string;
    description: string;
    parentAgent?: BaseAgent;
    subAgents: BaseAgent[];
    beforeAgentCallback?: BeforeAgentCallback;
    afterAgentCallback?: AfterAgentCallback;
    
    constructor(name: string, description?: string);
    
    async* runAsync(parentContext: any): AsyncGenerator<any, void, unknown>;
    async* runLive(parentContext: any): AsyncGenerator<any, void, unknown>;
    protected abstract runAsyncImpl(ctx: any): AsyncGenerator<any, void, unknown>;
    protected abstract runLiveImpl(ctx: any): AsyncGenerator<any, void, unknown>;
    
    get rootAgent(): BaseAgent;
    findAgent(name: string): BaseAgent | undefined;
    findSubAgent(name: string): BaseAgent | undefined;
    protected createInvocationContext(parentContext: any): any;
    addSubAgent(agent: BaseAgent): BaseAgent;
  }
}

// For RunConfig
declare module './RunConfig' {
  export class RunConfig {
    maxLlmCalls: number;
    constructor(params?: Partial<RunConfig>);
  }
}

// For Session
declare module '../sessions/Session' {
  export interface Session {
    id: string;
    appName: string;
    userId: string;
    state: Record<string, any>;
  }
} 