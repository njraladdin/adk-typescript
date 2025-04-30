

/**
 * Auth module - Provides interfaces and implementations for authentication
 */

// We'll use named exports to avoid ambiguities with existing exports
// Export from original credential/scheme files (different naming to avoid conflicts)
export {
  AuthCredential as SimpleAuthCredential,
  ApiKeyCredential,
  BearerCredential,
  BasicCredential
} from './AuthCredential';

export {
  AuthScheme as SimpleAuthScheme,
  ApiKeyAuthScheme,
  BearerAuthScheme,
  BasicAuthScheme
} from './AuthSchemes';

// Export auth components - consolidate exports to avoid naming conflicts
export * from './AuthCredential';
export * from './AuthHandler';
export * from './AuthSchemes'; // This includes AuthScheme enum

// Export from AuthTool with renamed AuthConfig to avoid ambiguity
import * as AuthToolExports from './AuthTool';
export { 
  AuthToolExports as AuthToolModule
};

export * from './AuthPreprocessor';
export * from './AuthConfig'; 