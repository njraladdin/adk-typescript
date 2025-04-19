// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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