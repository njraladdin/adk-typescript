import { Content, Part } from '../models/types';
import { InvocationContext } from './InvocationContext';
import { ReadonlyContext } from './ReadonlyContext';
import { EventActions } from '../events/EventActions';
import { State } from '../sessions/State';

/**
 * Callback context for agent invocations.
 * Provides mutable access to the agent's state and context.
 */
export class CallbackContext extends ReadonlyContext {
  private eventActions: EventActions;
  private mutableState: State;

  constructor(
    invocationContext: InvocationContext,
    eventActions?: EventActions
  ) {
    super(invocationContext);
    this.eventActions = eventActions || new EventActions();
    
    // Merge the session state and event actions delta into a new State instance
    const baseState = invocationContext.session.state.getAll ? invocationContext.session.state.getAll() : {};
    const delta = this.eventActions.stateDelta || {};
    this.mutableState = new State({
      ...baseState,
      ...delta
    });
  }

  /**
   * The delta-aware state of the current session.
   * 
   * For any state change, you can mutate this object directly,
   * e.g. `ctx.state['foo'] = 'bar'`
   */
  override get state(): State {
    return this.mutableState;
  }

  /**
   * Loads an artifact attached to the current session.
   * 
   * @param filename The filename of the artifact.
   * @param version The version of the artifact. If undefined, the latest version will be returned.
   * @returns The artifact, or undefined if not found.
   */
  async loadArtifact(filename: string, version?: number): Promise<Part | undefined> {
    if (!this.invocationContext.artifactService) {
      throw new Error("Artifact service is not initialized.");
    }
    
    return await this.invocationContext.artifactService.loadArtifact({
      appName: this.invocationContext.appName,
      userId: this.invocationContext.userId,
      sessionId: this.invocationContext.session.id,
      filename,
      version
    });
  }

  /**
   * Saves an artifact and records it as delta for the current session.
   * 
   * @param filename The filename of the artifact.
   * @param artifact The artifact to save.
   * @returns The version of the artifact.
   */
  async saveArtifact(filename: string, artifact: Part): Promise<number> {
    if (!this.invocationContext.artifactService) {
      throw new Error("Artifact service is not initialized.");
    }
    
    const version = await this.invocationContext.artifactService.saveArtifact({
      appName: this.invocationContext.appName,
      userId: this.invocationContext.userId,
      sessionId: this.invocationContext.session.id,
      filename,
      artifact
    });
    
    this.eventActions.artifactDelta[filename] = version;
    return version;
  }
} 