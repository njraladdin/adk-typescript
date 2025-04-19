/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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