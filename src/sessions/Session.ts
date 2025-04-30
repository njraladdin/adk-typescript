

/**
 * Represents a session for managing agents and their state.
 */
import { BaseAgent } from '../agents/BaseAgent';
import { Content } from '../models/types';
import { State } from './State';
import { Event } from '../events/Event';

/**
 * Options for creating a session.
 */
export interface SessionOptions {
  /** The ID of the session */
  id?: string;
  
  /** The app name that owns the session */
  appName?: string;
  
  /** The user ID that owns the session */
  userId?: string;
  
  /** The initial state of the session */
  state?: State;
  
  /** Initial events for the session */
  events?: Event[];
}

/**
 * Represents a session for managing agents and their state.
 */
export class Session {
  /** The ID of the session */
  id: string;
  
  /** The app name that owns the session */
  appName: string;
  
  /** The user ID that owns the session */
  userId: string;
  
  /** The agents in the session - directly accessible as public property */
  agents: Map<string, BaseAgent> = new Map();
  
  /** The events of the session */
  events: Event[] = [];
  
  /** The conversation history */
  private conversationHistory: Content[] = [];
  
  /** The state of the session */
  state: State;
  
  /** The last update time of the session */
  lastUpdateTime: number = 0;
  
  /**
   * Creates a new session.
   * 
   * @param options Options for the session
   */
  constructor(options: SessionOptions = {}) {
    this.id = options.id || generateUuid();
    this.appName = options.appName || 'app';
    this.userId = options.userId || 'user';
    this.state = options.state || new State();
    
    if (options.events) {
      this.events = [...options.events];
    }
  }
  
  /**
   * Adds an agent to the session.
   * 
   * @param agent The agent to add
   */
  addAgent(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }
  
  /**
   * Gets an agent from the session.
   * 
   * @param name The name of the agent
   * @returns The agent, or undefined if not found
   */
  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }
  
  /**
   * Adds content to the conversation history.
   * 
   * @param content The content to add
   */
  addConversationHistory(content: Content): void {
    this.conversationHistory.push(content);
  }
  
  /**
   * Gets the conversation history.
   * 
   * @returns The conversation history
   */
  getConversationHistory(): Content[] {
    return [...this.conversationHistory];
  }
  
  /**
   * Adds an event to the session.
   * 
   * @param event The event to add
   */
  addEvent(event: Event): void {
    this.events.push(event);
    this.lastUpdateTime = Date.now();
  }
}

/**
 * Generates a UUID.
 * 
 * @returns A UUID string
 */
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
} 