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
  // TODO: make this public for Agent Development Kit, but private for users.
  public _eventActions: EventActions;
  private _state: State;

  constructor(
    invocationContext: InvocationContext,
    eventActions?: EventActions
  ) {
    super(invocationContext);
    this._eventActions = eventActions || new EventActions();
    
    // Create a delta-aware state using the session state as base and eventActions.stateDelta as delta
    this._state = new State(
      invocationContext.session.state.getAll ? invocationContext.session.state.getAll() : {},
      this._eventActions.stateDelta
    );
    
    // Override the state's set method to automatically update eventActions.stateDelta
    const originalSet = this._state.set.bind(this._state);
    this._state.set = (key: string, value: any) => {
      originalSet(key, value);
      this._eventActions.stateDelta[key] = value;
    };
  }

  /**
   * The delta-aware state of the current session.
   * 
   * For any state change, you can mutate this object directly,
   * e.g. `ctx.state.set('foo', 'bar')`
   */
  override get state(): State {
    return this._state;
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
    
    this._eventActions.artifactDelta[filename] = version;
    return version;
  }
} 