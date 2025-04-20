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

// Tool set instances and promises
let _bigqueryToolSet: GoogleApiToolSet | null = null;
let _calendarToolSet: GoogleApiToolSet | null = null;
let _gmailToolSet: GoogleApiToolSet | null = null;
let _youtubeToolSet: GoogleApiToolSet | null = null;
let _slidesToolSet: GoogleApiToolSet | null = null;
let _sheetsToolSet: GoogleApiToolSet | null = null;
let _docsToolSet: GoogleApiToolSet | null = null;

// Loading promises
let _bigqueryToolSetPromise: Promise<GoogleApiToolSet> | null = null;
let _calendarToolSetPromise: Promise<GoogleApiToolSet> | null = null;
let _gmailToolSetPromise: Promise<GoogleApiToolSet> | null = null;
let _youtubeToolSetPromise: Promise<GoogleApiToolSet> | null = null;
let _slidesToolSetPromise: Promise<GoogleApiToolSet> | null = null;
let _sheetsToolSetPromise: Promise<GoogleApiToolSet> | null = null;
let _docsToolSetPromise: Promise<GoogleApiToolSet> | null = null;

/**
 * Get the BigQuery tool set
 * @returns A promise that resolves to the BigQuery tool set
 */
export async function getBigqueryToolSet(): Promise<GoogleApiToolSet> {
  if (_bigqueryToolSet === null) {
    if (_bigqueryToolSetPromise === null) {
      _bigqueryToolSetPromise = GoogleApiToolSet.loadToolSet('bigquery', 'v2');
      _bigqueryToolSet = await _bigqueryToolSetPromise;
    } else {
      _bigqueryToolSet = await _bigqueryToolSetPromise;
    }
  }
  return _bigqueryToolSet;
}

/**
 * Get the Calendar tool set
 * @returns A promise that resolves to the Calendar tool set
 */
export async function getCalendarToolSet(): Promise<GoogleApiToolSet> {
  if (_calendarToolSet === null) {
    if (_calendarToolSetPromise === null) {
      _calendarToolSetPromise = GoogleApiToolSet.loadToolSet('calendar', 'v3');
      _calendarToolSet = await _calendarToolSetPromise;
    } else {
      _calendarToolSet = await _calendarToolSetPromise;
    }
  }
  return _calendarToolSet;
}

/**
 * Get the Gmail tool set
 * @returns A promise that resolves to the Gmail tool set
 */
export async function getGmailToolSet(): Promise<GoogleApiToolSet> {
  if (_gmailToolSet === null) {
    if (_gmailToolSetPromise === null) {
      _gmailToolSetPromise = GoogleApiToolSet.loadToolSet('gmail', 'v1');
      _gmailToolSet = await _gmailToolSetPromise;
    } else {
      _gmailToolSet = await _gmailToolSetPromise;
    }
  }
  return _gmailToolSet;
}

/**
 * Get the YouTube tool set
 * @returns A promise that resolves to the YouTube tool set
 */
export async function getYoutubeToolSet(): Promise<GoogleApiToolSet> {
  if (_youtubeToolSet === null) {
    if (_youtubeToolSetPromise === null) {
      _youtubeToolSetPromise = GoogleApiToolSet.loadToolSet('youtube', 'v3');
      _youtubeToolSet = await _youtubeToolSetPromise;
    } else {
      _youtubeToolSet = await _youtubeToolSetPromise;
    }
  }
  return _youtubeToolSet;
}

/**
 * Get the Slides tool set
 * @returns A promise that resolves to the Slides tool set
 */
export async function getSlidesToolSet(): Promise<GoogleApiToolSet> {
  if (_slidesToolSet === null) {
    if (_slidesToolSetPromise === null) {
      _slidesToolSetPromise = GoogleApiToolSet.loadToolSet('slides', 'v1');
      _slidesToolSet = await _slidesToolSetPromise;
    } else {
      _slidesToolSet = await _slidesToolSetPromise;
    }
  }
  return _slidesToolSet;
}

/**
 * Get the Sheets tool set
 * @returns A promise that resolves to the Sheets tool set
 */
export async function getSheetsToolSet(): Promise<GoogleApiToolSet> {
  if (_sheetsToolSet === null) {
    if (_sheetsToolSetPromise === null) {
      _sheetsToolSetPromise = GoogleApiToolSet.loadToolSet('sheets', 'v4');
      _sheetsToolSet = await _sheetsToolSetPromise;
    } else {
      _sheetsToolSet = await _sheetsToolSetPromise;
    }
  }
  return _sheetsToolSet;
}

/**
 * Get the Docs tool set
 * @returns A promise that resolves to the Docs tool set
 */
export async function getDocsToolSet(): Promise<GoogleApiToolSet> {
  if (_docsToolSet === null) {
    if (_docsToolSetPromise === null) {
      _docsToolSetPromise = GoogleApiToolSet.loadToolSet('docs', 'v1');
      _docsToolSet = await _docsToolSetPromise;
    } else {
      _docsToolSet = await _docsToolSetPromise;
    }
  }
  return _docsToolSet;
} 