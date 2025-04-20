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

import { GoogleApiToolSet } from './GoogleApiToolSet';

/**
 * This module provides access to GoogleApiToolSet instances for various Google APIs.
 * Each tool set is loaded lazily when first requested to avoid unnecessary initialization.
 */

// Tool set instances
let _bigqueryToolSet: GoogleApiToolSet | null = null;
let _calendarToolSet: GoogleApiToolSet | null = null;
let _gmailToolSet: GoogleApiToolSet | null = null;
let _youtubeToolSet: GoogleApiToolSet | null = null;
let _slidesToolSet: GoogleApiToolSet | null = null;
let _sheetsToolSet: GoogleApiToolSet | null = null;
let _docsToolSet: GoogleApiToolSet | null = null;

/**
 * Get the BigQuery tool set
 * @returns The BigQuery tool set
 */
export function getBigqueryToolSet(): GoogleApiToolSet {
  if (_bigqueryToolSet === null) {
    _bigqueryToolSet = GoogleApiToolSet.loadToolSet('bigquery', 'v2');
  }
  return _bigqueryToolSet;
}

/**
 * Get the Calendar tool set
 * @returns The Calendar tool set
 */
export function getCalendarToolSet(): GoogleApiToolSet {
  if (_calendarToolSet === null) {
    _calendarToolSet = GoogleApiToolSet.loadToolSet('calendar', 'v3');
  }
  return _calendarToolSet;
}

/**
 * Get the Gmail tool set
 * @returns The Gmail tool set
 */
export function getGmailToolSet(): GoogleApiToolSet {
  if (_gmailToolSet === null) {
    _gmailToolSet = GoogleApiToolSet.loadToolSet('gmail', 'v1');
  }
  return _gmailToolSet;
}

/**
 * Get the YouTube tool set
 * @returns The YouTube tool set
 */
export function getYoutubeToolSet(): GoogleApiToolSet {
  if (_youtubeToolSet === null) {
    _youtubeToolSet = GoogleApiToolSet.loadToolSet('youtube', 'v3');
  }
  return _youtubeToolSet;
}

/**
 * Get the Slides tool set
 * @returns The Slides tool set
 */
export function getSlidesToolSet(): GoogleApiToolSet {
  if (_slidesToolSet === null) {
    _slidesToolSet = GoogleApiToolSet.loadToolSet('slides', 'v1');
  }
  return _slidesToolSet;
}

/**
 * Get the Sheets tool set
 * @returns The Sheets tool set
 */
export function getSheetsToolSet(): GoogleApiToolSet {
  if (_sheetsToolSet === null) {
    _sheetsToolSet = GoogleApiToolSet.loadToolSet('sheets', 'v4');
  }
  return _sheetsToolSet;
}

/**
 * Get the Docs tool set
 * @returns The Docs tool set
 */
export function getDocsToolSet(): GoogleApiToolSet {
  if (_docsToolSet === null) {
    _docsToolSet = GoogleApiToolSet.loadToolSet('docs', 'v1');
  }
  return _docsToolSet;
} 