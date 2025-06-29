import { GoogleApiToolset } from './GoogleApiToolSet';
import { OpenAPIToolset as OpenAPIToolsetImpl } from '../openapi-tool';
import { ToolPredicate } from '../BaseToolset';

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

// Add class-based toolsets for direct use (Python-style)

export class BigQueryToolset extends GoogleApiToolset {
  constructor(openApiToolset: OpenAPIToolsetImpl, clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]) {
    super(openApiToolset, clientId, clientSecret, toolFilter);
  }
  static async create(clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]): Promise<BigQueryToolset> {
    const openApiToolset = await GoogleApiToolset._loadToolsetWithOidcAuth({ specDict: await new (require('./GoogleApiToOpenApiConverter').GoogleApiToOpenApiConverterImpl)('bigquery', 'v2').convert(), scopes: ['https://www.googleapis.com/auth/bigquery'] });
    return new BigQueryToolset(openApiToolset, clientId, clientSecret, toolFilter);
  }
}

export class CalendarToolset extends GoogleApiToolset {
  constructor(openApiToolset: OpenAPIToolsetImpl, clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]) {
    super(openApiToolset, clientId, clientSecret, toolFilter);
  }
  static async create(clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]): Promise<CalendarToolset> {
    const openApiToolset = await GoogleApiToolset._loadToolsetWithOidcAuth({ specDict: await new (require('./GoogleApiToOpenApiConverter').GoogleApiToOpenApiConverterImpl)('calendar', 'v3').convert(), scopes: ['https://www.googleapis.com/auth/calendar'] });
    return new CalendarToolset(openApiToolset, clientId, clientSecret, toolFilter);
  }
}

export class GmailToolset extends GoogleApiToolset {
  constructor(openApiToolset: OpenAPIToolsetImpl, clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]) {
    super(openApiToolset, clientId, clientSecret, toolFilter);
  }
  static async create(clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]): Promise<GmailToolset> {
    const openApiToolset = await GoogleApiToolset._loadToolsetWithOidcAuth({ specDict: await new (require('./GoogleApiToOpenApiConverter').GoogleApiToOpenApiConverterImpl)('gmail', 'v1').convert(), scopes: ['https://www.googleapis.com/auth/gmail.readonly'] });
    return new GmailToolset(openApiToolset, clientId, clientSecret, toolFilter);
  }
}

export class YoutubeToolset extends GoogleApiToolset {
  constructor(openApiToolset: OpenAPIToolsetImpl, clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]) {
    super(openApiToolset, clientId, clientSecret, toolFilter);
  }
  static async create(clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]): Promise<YoutubeToolset> {
    const openApiToolset = await GoogleApiToolset._loadToolsetWithOidcAuth({ specDict: await new (require('./GoogleApiToOpenApiConverter').GoogleApiToOpenApiConverterImpl)('youtube', 'v3').convert(), scopes: ['https://www.googleapis.com/auth/youtube.readonly'] });
    return new YoutubeToolset(openApiToolset, clientId, clientSecret, toolFilter);
  }
}

export class SlidesToolset extends GoogleApiToolset {
  constructor(openApiToolset: OpenAPIToolsetImpl, clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]) {
    super(openApiToolset, clientId, clientSecret, toolFilter);
  }
  static async create(clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]): Promise<SlidesToolset> {
    const openApiToolset = await GoogleApiToolset._loadToolsetWithOidcAuth({ specDict: await new (require('./GoogleApiToOpenApiConverter').GoogleApiToOpenApiConverterImpl)('slides', 'v1').convert(), scopes: ['https://www.googleapis.com/auth/presentations.readonly'] });
    return new SlidesToolset(openApiToolset, clientId, clientSecret, toolFilter);
  }
}

export class SheetsToolset extends GoogleApiToolset {
  constructor(openApiToolset: OpenAPIToolsetImpl, clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]) {
    super(openApiToolset, clientId, clientSecret, toolFilter);
  }
  static async create(clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]): Promise<SheetsToolset> {
    const openApiToolset = await GoogleApiToolset._loadToolsetWithOidcAuth({ specDict: await new (require('./GoogleApiToOpenApiConverter').GoogleApiToOpenApiConverterImpl)('sheets', 'v4').convert(), scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    return new SheetsToolset(openApiToolset, clientId, clientSecret, toolFilter);
  }
}

export class DocsToolset extends GoogleApiToolset {
  constructor(openApiToolset: OpenAPIToolsetImpl, clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]) {
    super(openApiToolset, clientId, clientSecret, toolFilter);
  }
  static async create(clientId?: string, clientSecret?: string, toolFilter?: ToolPredicate | string[]): Promise<DocsToolset> {
    const openApiToolset = await GoogleApiToolset._loadToolsetWithOidcAuth({ specDict: await new (require('./GoogleApiToOpenApiConverter').GoogleApiToOpenApiConverterImpl)('docs', 'v1').convert(), scopes: ['https://www.googleapis.com/auth/documents.readonly'] });
    return new DocsToolset(openApiToolset, clientId, clientSecret, toolFilter);
  }
} 