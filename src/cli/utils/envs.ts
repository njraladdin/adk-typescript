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

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Walk up directory structure until the specified file is found
 * 
 * @param folder Starting folder to search from
 * @param filename Filename to look for
 * @returns Path to the file if found, empty string if not found
 */
function walkToRootUntilFound(folder: string, filename: string): string {
  const checkpath = path.join(folder, filename);
  if (fs.existsSync(checkpath) && fs.statSync(checkpath).isFile()) {
    return checkpath;
  }

  const parentFolder = path.dirname(folder);
  if (parentFolder === folder) {  // reached the root
    return '';
  }

  return walkToRootUntilFound(parentFolder, filename);
}

/**
 * Loads the .env file for the agent module
 * 
 * @param agentName Name of the agent
 * @param agentParentFolder Parent folder of the agent
 * @param filename Name of the environment file, defaults to .env
 */
export function loadDotenvForAgent(
  agentName: string,
  agentParentFolder: string,
  filename: string = '.env'
): void {
  // Get the absolute path of the agent folder as starting point
  const startingFolder = path.resolve(
    path.join(agentParentFolder, agentName)
  );
  
  const dotenvFilePath = walkToRootUntilFound(startingFolder, filename);
  
  if (dotenvFilePath) {
    dotenv.config({ path: dotenvFilePath, override: true });
    console.log(
      `Loaded ${filename} file for ${agentName} at ${dotenvFilePath}`
    );
  } else {
    console.log(`No ${filename} file found for ${agentName}`);
  }
} 