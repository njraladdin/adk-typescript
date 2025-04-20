import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Load environment variables for tests
 */
export function loadEnvForTests(): void {
  const dotenvPath = path.join(__dirname, '.env');
  
  try {
    dotenv.config({ path: dotenvPath });
  } catch (error) {
    console.warn(`Missing .env file at ${dotenvPath}. See .env.example for an example.`);
  }
  
  // Check for required environment variables
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('Missing GOOGLE_API_KEY in the environment variables. GOOGLE_AI backend integration tests will fail.');
  }
  
  const requiredCloudVars = [
    'GOOGLE_CLOUD_PROJECT',
    'GOOGLE_CLOUD_LOCATION'
  ];
  
  for (const envVar of requiredCloudVars) {
    if (!process.env[envVar]) {
      console.warn(`Missing ${envVar} in the environment variables. Vertex backend integration tests will fail.`);
    }
  }
}

/**
 * Get the backend type for tests
 * @returns The backend type (GOOGLE_AI or VERTEX)
 */
export function getBackendType(): 'GOOGLE_AI' | 'VERTEX' | 'BOTH' {
  const testBackend = process.env.TEST_BACKEND || 'BOTH';
  
  if (testBackend === 'GOOGLE_AI_ONLY') {
    return 'GOOGLE_AI';
  } else if (testBackend === 'VERTEX_ONLY') {
    return 'VERTEX';
  } else if (testBackend === 'BOTH') {
    return 'BOTH';
  } else {
    throw new Error(`Invalid TEST_BACKEND value: ${testBackend}, should be one of [GOOGLE_AI_ONLY, VERTEX_ONLY, BOTH]`);
  }
}

/**
 * Set the backend environment variable
 * @param backendType The backend type to set
 * @returns The original backend setting
 */
export function setBackendEnvironment(backendType: 'GOOGLE_AI' | 'VERTEX'): string | undefined {
  const originalVal = process.env.GOOGLE_GENAI_USE_VERTEXAI;
  
  if (backendType === 'GOOGLE_AI') {
    process.env.GOOGLE_GENAI_USE_VERTEXAI = '0';
  } else {
    process.env.GOOGLE_GENAI_USE_VERTEXAI = '1';
  }
  
  return originalVal;
}

/**
 * Restore the backend environment variable
 * @param originalVal The original value to restore
 */
export function restoreBackendEnvironment(originalVal: string | undefined): void {
  if (originalVal === undefined) {
    delete process.env.GOOGLE_GENAI_USE_VERTEXAI;
  } else {
    process.env.GOOGLE_GENAI_USE_VERTEXAI = originalVal;
  }
}

// Initialize environment variables
loadEnvForTests(); 