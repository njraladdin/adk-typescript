

import { FunctionTool } from './FunctionTool';
import { ToolContext } from './ToolContext';
import axios from 'axios';

/**
 * Tool for loading web page content
 */
export class LoadWebPageTool extends FunctionTool {
  /**
   * Creates a new load web page tool
   */
  constructor() {
    super({
      name: 'load_web_page',
      description: 'Fetches the content from a URL and returns the text content',
      fn: loadWebPage,
      functionDeclaration: {
        name: 'load_web_page',
        description: 'Fetches the content from a URL and returns the text content',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to browse'
            }
          },
          required: ['url']
        }
      }
    });
  }
}

/**
 * Fetches content from a URL and returns the text content
 * 
 * @param params Parameters for the function
 * @param params.url URL to load content from
 * @param context The tool context
 * @returns The text content of the web page
 */
export async function loadWebPage(
  params: Record<string, any>,
  context: ToolContext
): Promise<string> {
  const url = params.url;
  
  // Validate URL
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return `Invalid URL: ${url}. Must start with http:// or https://`;
  }
  
  try {
    // Fetch the web page content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 seconds timeout
    });
    
    // Extract the text from the HTML
    const html = response.data;
    const text = extractTextFromHtml(html);
    
    // Filter out very short lines (like in the Python implementation)
    const filteredLines = text.split('\n')
      .filter(line => line.split(/\s+/).filter(Boolean).length > 3)
      .join('\n');
    
    return filteredLines;
  } catch (error: any) {
    return `Failed to fetch URL: ${url}. Error: ${error.message}`;
  }
}

/**
 * Extract text from HTML content
 * 
 * @param html HTML content to extract text from
 * @returns The extracted text content
 */
function extractTextFromHtml(html: string): string {
  // This is a simple implementation without using a full HTML parser
  // In a real implementation, we would use a library like cheerio (similar to BeautifulSoup in Python)
  let text = html
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and their content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Replace all HTML tags with newlines
    .replace(/<[^>]*>/g, '\n')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Decode other HTML entities
  text = decodeHtmlEntities(text);
  
  // Clean up excessive whitespace
  return text
    .replace(/\n\s*\n/g, '\n\n')  // Replace multiple blank lines with a single one
    .replace(/[ \t]+/g, ' ')      // Replace multiple spaces with a single space
    .trim();                      // Remove leading/trailing whitespace
}

/**
 * Decode HTML entities in a string
 * 
 * @param html HTML string with entities to decode
 * @returns Decoded string
 */
function decodeHtmlEntities(html: string): string {
  // For Node.js environment, use a simple implementation:
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'")
    .replace(/&#47;/g, '/')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '--')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
}

/**
 * Singleton instance of the Load Web Page tool
 */
export const loadWebPageTool = new LoadWebPageTool(); 