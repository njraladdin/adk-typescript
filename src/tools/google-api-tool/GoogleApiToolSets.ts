import { GoogleApiToolset } from './GoogleApiToolSet';

/**
 * This module provides access to GoogleApiToolset instances for various Google APIs.
 * Each tool set is loaded lazily when first requested to avoid unnecessary initialization.
 */

// Tool set instances and promises
let _bigqueryToolSet: GoogleApiToolset | null = null;
let _calendarToolSet: GoogleApiToolset | null = null;
let _gmailToolSet: GoogleApiToolset | null = null;
let _youtubeToolSet: GoogleApiToolset | null = null;
let _slidesToolSet: GoogleApiToolset | null = null;
let _sheetsToolSet: GoogleApiToolset | null = null;
let _docsToolSet: GoogleApiToolset | null = null;

// Loading promises
let _bigqueryToolSetPromise: Promise<GoogleApiToolset> | null = null;
let _calendarToolSetPromise: Promise<GoogleApiToolset> | null = null;
let _gmailToolSetPromise: Promise<GoogleApiToolset> | null = null;
let _youtubeToolSetPromise: Promise<GoogleApiToolset> | null = null;
let _slidesToolSetPromise: Promise<GoogleApiToolset> | null = null;
let _sheetsToolSetPromise: Promise<GoogleApiToolset> | null = null;
let _docsToolSetPromise: Promise<GoogleApiToolset> | null = null;

/**
 * Get the BigQuery tool set
 * @returns A promise that resolves to the BigQuery tool set
 */
export async function getBigqueryToolSet(): Promise<GoogleApiToolset> {
  if (_bigqueryToolSet === null) {
    if (_bigqueryToolSetPromise === null) {
      _bigqueryToolSetPromise = GoogleApiToolset.loadToolset('bigquery', 'v2');
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
export async function getCalendarToolSet(): Promise<GoogleApiToolset> {
  if (_calendarToolSet === null) {
    if (_calendarToolSetPromise === null) {
      _calendarToolSetPromise = GoogleApiToolset.loadToolset('calendar', 'v3');
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
export async function getGmailToolSet(): Promise<GoogleApiToolset> {
  if (_gmailToolSet === null) {
    if (_gmailToolSetPromise === null) {
      _gmailToolSetPromise = GoogleApiToolset.loadToolset('gmail', 'v1');
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
export async function getYoutubeToolSet(): Promise<GoogleApiToolset> {
  if (_youtubeToolSet === null) {
    if (_youtubeToolSetPromise === null) {
      _youtubeToolSetPromise = GoogleApiToolset.loadToolset('youtube', 'v3');
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
export async function getSlidesToolSet(): Promise<GoogleApiToolset> {
  if (_slidesToolSet === null) {
    if (_slidesToolSetPromise === null) {
      _slidesToolSetPromise = GoogleApiToolset.loadToolset('slides', 'v1');
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
export async function getSheetsToolSet(): Promise<GoogleApiToolset> {
  if (_sheetsToolSet === null) {
    if (_sheetsToolSetPromise === null) {
      _sheetsToolSetPromise = GoogleApiToolset.loadToolset('sheets', 'v4');
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
export async function getDocsToolSet(): Promise<GoogleApiToolset> {
  if (_docsToolSet === null) {
    if (_docsToolSetPromise === null) {
      _docsToolSetPromise = GoogleApiToolset.loadToolset('docs', 'v1');
      _docsToolSet = await _docsToolSetPromise;
    } else {
      _docsToolSet = await _docsToolSetPromise;
    }
  }
  return _docsToolSet;
} 