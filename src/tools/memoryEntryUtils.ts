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

import { MemoryEntry } from '../memory/MemoryEntry';

/**
 * Extracts the text from the memory entry.
 * @param memory The memory entry to extract text from
 * @param splitter The string to use to join text parts (default: ' ')
 * @returns The extracted text content
 */
export function extractText(memory: MemoryEntry, splitter: string = ' '): string {
  if (!memory.content.parts) {
    return '';
  }
  
  return memory.content.parts
    .filter(part => part.text)
    .map(part => part.text!)
    .join(splitter);
} 