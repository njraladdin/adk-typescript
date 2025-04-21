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

import { InvocationContext } from '../../agents/InvocationContext';
import { TranscriptionEntry } from '../../agents/TranscriptionEntry';
import { Content } from '../../models/types';

/**
 * A class to handle audio transcription.
 */
export class AudioTranscriber {
  /**
   * Transcribe the audio data from the invocation context.
   * 
   * @param invocationContext The invocation context containing transcription cache
   * @returns Transcribed content suitable for sending to the model
   */
  transcribeFile(invocationContext: InvocationContext): Content[] {
    if (!invocationContext.transcriptionCache || invocationContext.transcriptionCache.length === 0) {
      return [];
    }

    // Map transcription entries to Content objects
    const contents: Content[] = [];
    
    // Group entries by role
    const userEntries: TranscriptionEntry[] = [];
    const modelEntries: TranscriptionEntry[] = [];
    
    for (const entry of invocationContext.transcriptionCache) {
      if (entry.metadata?.type === 'user') {
        userEntries.push(entry);
      } else if (entry.metadata?.type === 'model') {
        modelEntries.push(entry);
      }
    }
    
    // Create content objects for user entries
    if (userEntries.length > 0) {
      const userParts = userEntries.map(entry => {
        if (entry.textContent) {
          try {
            const parsedContent = JSON.parse(entry.textContent);
            if (parsedContent.parts) {
              return parsedContent.parts;
            }
          } catch (e) {
            // If parsing fails, just use the text
            return { text: entry.textContent };
          }
        }
        return { text: '[User Audio Data]' };
      }).flat();
      
      contents.push({
        role: 'user',
        parts: userParts
      });
    }
    
    // Create content objects for model entries
    if (modelEntries.length > 0) {
      const modelParts = modelEntries.map(entry => {
        if (entry.textContent) {
          try {
            const parsedContent = JSON.parse(entry.textContent);
            if (parsedContent.parts) {
              return parsedContent.parts;
            }
          } catch (e) {
            // If parsing fails, just use the text
            return { text: entry.textContent };
          }
        }
        return { text: '[Model Response]' };
      }).flat();
      
      contents.push({
        role: 'model',
        parts: modelParts
      });
    }
    
    return contents;
  }
} 