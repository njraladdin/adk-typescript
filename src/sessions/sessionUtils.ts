import { Content, Part } from './types';

/**
 * Encodes content for storage in the database
 * Converts binary data to base64 strings for JSON serialization
 */
export function encodeContent(content: Content): Record<string, any> {
  if (!content || !content.parts) {
    return content as unknown as Record<string, any>;
  }

  const encodedContent: Record<string, any> = {
    role: content.role,
    parts: []
  };
  
  // Deep copy the parts array to avoid modifying the original
  encodedContent.parts = content.parts.map(part => {
    const encodedPart: Record<string, any> = { ...part };
    
    if (encodedPart.data && encodedPart.mimeType) {
      // Ensure data is a Uint8Array before encoding
      const dataArray = encodedPart.data instanceof Uint8Array 
        ? encodedPart.data 
        : new Uint8Array(encodedPart.data as any);
      
      // Convert Uint8Array to base64 string for storage
      encodedPart.data = Buffer.from(dataArray).toString('base64');
    }
    
    return encodedPart;
  });
  
  return encodedContent;
}

/**
 * Decodes content from the database
 * Converts base64 strings back to binary data
 */
export function decodeContent(content: Record<string, any> | null | undefined): Content {
  if (!content || !content.parts) {
    // Return default Content structure if content is missing required properties
    return {
      role: 'user',
      parts: []
    };
  }

  const decodedContent: Content = {
    role: content.role,
    parts: []
  };
  
  if (Array.isArray(content.parts)) {
    decodedContent.parts = content.parts.map(part => {
      const decodedPart: Part = {};
      
      if (part.text !== undefined) {
        decodedPart.text = part.text;
      }
      
      if (part.data && part.mimeType) {
        // If data is a string (base64 encoded), convert it to Uint8Array
        if (typeof part.data === 'string') {
          decodedPart.data = new Uint8Array(Buffer.from(part.data, 'base64'));
          decodedPart.mimeType = part.mimeType;
        } 
        // If data is a Buffer object from JSON serialization
        else if (typeof part.data === 'object' && part.data.type === 'Buffer' && Array.isArray(part.data.data)) {
          decodedPart.data = new Uint8Array(part.data.data);
          decodedPart.mimeType = part.mimeType;
        }
      }
      
      return decodedPart;
    });
  }
  
  return decodedContent;
} 