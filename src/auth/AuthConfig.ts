 

import { AuthCredential } from './AuthCredential';
import { AuthScheme } from './AuthSchemes';

/**
 * The auth config sent by tool asking client to collect auth credentials and
 * adk and client will help to fill in the response
 */
export interface AuthConfig {
  /** The auth scheme used to collect credentials */
  authScheme: AuthScheme;
  /**
   * The raw auth credential used to collect credentials. The raw auth
   * credentials are used in some auth scheme that needs to exchange auth
   * credentials. e.g. OAuth2 and OIDC. For other auth scheme, it could be None.
   */
  rawAuthCredential?: AuthCredential | null;
  /**
   * The exchanged auth credential used to collect credentials. adk and client
   * will work together to fill it. For those auth scheme that doesn't need to
   * exchange auth credentials, e.g. API key, service account etc. It's filled by
   * client directly. For those auth scheme that need to exchange auth credentials,
   * e.g. OAuth2 and OIDC, it's first filled by adk. If the raw credentials
   * passed by tool only has client id and client credential, adk will help to
   * generate the corresponding authorization uri and state and store the processed
   * credential in this field. If the raw credentials passed by tool already has
   * authorization uri, state, etc. then it's copied to this field. Client will use
   * this field to guide the user through the OAuth2 flow and fill auth response in
   * this field
   */
  exchangedAuthCredential?: AuthCredential | null;
} 