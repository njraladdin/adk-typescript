 

/**
 * A transcription entry represents audio or text content that needs to be transcribed.
 */
export class TranscriptionEntry {
  /** Audio data as a binary buffer or a string */
  audioData?: ArrayBuffer | string;
  
  /** Text content */
  textContent?: string;
  
  /** Metadata for the transcription */
  metadata?: Record<string, any>;

  /**
   * Creates a new instance of TranscriptionEntry.
   * 
   * @param params The parameters for the transcription entry.
   */
  constructor(params: {
    audioData?: ArrayBuffer | string;
    textContent?: string;
    metadata?: Record<string, any>;
  }) {
    this.audioData = params.audioData;
    this.textContent = params.textContent;
    this.metadata = params.metadata;
  }
} 