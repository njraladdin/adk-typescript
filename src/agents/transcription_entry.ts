

/**
 * A class to represent an audio transcription entry.
 */

/**
 * Interface for TranscriptionEntry constructor parameters.
 */
export interface TranscriptionEntryParams {
  /** The role of the speaker (e.g., 'user', 'model') */
  role: string;
  
  /** The binary audio data */
  data: Uint8Array;
  
  /** Optional transcription text */
  text?: string;
}

/**
 * Represents an entry in a transcription, which includes the audio data and optional transcribed text.
 */
export class TranscriptionEntry {
  /** The role of the speaker (e.g., 'user', 'model') */
  role: string;
  
  /** The binary audio data */
  data: Uint8Array;
  
  /** Optional transcription text */
  text?: string;
  
  /**
   * Creates a new transcription entry.
   * 
   * @param params Parameters for the transcription entry
   */
  constructor(params: TranscriptionEntryParams) {
    this.role = params.role;
    this.data = params.data;
    this.text = params.text;
  }
} 