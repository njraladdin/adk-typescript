/**
 * A transcription entry represents audio or text content that needs to be transcribed.
 */
export class TranscriptionEntry {
  /** Role of the transcription entry (e.g., 'user', 'model') */
  role?: string;
  
  /** Audio data as a binary buffer or a string */
  audioData?: ArrayBuffer | string;
  
  /** Text content */
  textContent?: string;
  
  /** Metadata for the transcription */
  metadata?: Record<string, any>;
  
  /** Data property for compatibility with Python implementation */
  data?: any;

  /**
   * Creates a new instance of TranscriptionEntry.
   * 
   * @param params The parameters for the transcription entry.
   */
  constructor(params: {
    role?: string;
    audioData?: ArrayBuffer | string;
    textContent?: string;
    metadata?: Record<string, any>;
    data?: any;
  }) {
    this.role = params.role;
    this.audioData = params.audioData;
    this.textContent = params.textContent;
    this.metadata = params.metadata;
    this.data = params.data;
  }
} 