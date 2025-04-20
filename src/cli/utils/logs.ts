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
import * as os from 'os';
import * as path from 'path';
import * as winston from 'winston';

/**
 * Format string for logs
 */
const LOGGING_FORMAT = '%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s';

/**
 * Log levels enum
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

/**
 * Configure logging to stderr
 * 
 * @param level The log level (default: info)
 * @returns The configured logger
 */
export function logToStderr(level: LogLevel = LogLevel.INFO): winston.Logger {
  const logger = winston.createLogger({
    level: level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(info => 
        `${info.timestamp} - ${info.level} - ${info.filename || 'unknown'}:${info.lineno || '?'} - ${info.message}`
      )
    ),
    transports: [
      new winston.transports.Console()
    ]
  });
  
  return logger;
}

/**
 * Configure logging to a temporary folder
 * 
 * @param level The log level (default: info)
 * @param subFolder Subfolder name in the temp directory (default: agents_log)
 * @param logFilePrefix Prefix for log file names (default: agent)
 * @param logFileTimestamp Timestamp for the log file name (default: current time in YYYYMMdd_HHmmss format)
 * @returns The log file path and configured logger
 */
export function logToTmpFolder(
  level: LogLevel = LogLevel.INFO,
  subFolder: string = 'agents_log',
  logFilePrefix: string = 'agent',
  logFileTimestamp: string = getTimestamp()
): { logFilePath: string; logger: winston.Logger } {
  // Create the log directory in the system temp folder
  const logDir = path.join(os.tmpdir(), subFolder);
  const logFilename = `${logFilePrefix}.${logFileTimestamp}.log`;
  const logFilePath = path.join(logDir, logFilename);
  
  // Ensure the log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Create the logger
  const logger = winston.createLogger({
    level: level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(info => 
        `${info.timestamp} - ${info.level} - ${info.filename || 'unknown'}:${info.lineno || '?'} - ${info.message}`
      )
    ),
    transports: [
      new winston.transports.File({ 
        filename: logFilePath 
      })
    ]
  });
  
  console.log(`Log setup complete: ${logFilePath}`);
  
  // Create a symbolic link to the latest log file
  const latestLogLink = path.join(logDir, `${logFilePrefix}.latest.log`);
  
  try {
    // Remove existing symlink if it exists
    if (fs.existsSync(latestLogLink)) {
      fs.unlinkSync(latestLogLink);
    }
    
    // Create new symlink
    if (process.platform === 'win32') {
      // On Windows, we need admin rights for symlinks, so just copy the file instead
      fs.copyFileSync(logFilePath, latestLogLink);
    } else {
      // On Unix systems, create a proper symlink
      fs.symlinkSync(logFilePath, latestLogLink);
    }
    
    console.log(`To access latest log: tail -F ${latestLogLink}`);
  } catch (error) {
    console.warn(`Could not create link to latest log: ${error}`);
  }
  
  return { logFilePath, logger };
}

/**
 * Get current timestamp in YYYYMMdd_HHmmss format
 * 
 * @returns Formatted timestamp
 */
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}