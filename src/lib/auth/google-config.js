/**
 * Google OAuth Configuration Utility
 * Checks if Google OAuth is properly configured
 */

/**
 * Checks if Google OAuth is configured
 * @returns {boolean} True if Google OAuth is available
 */
export function isGoogleOAuthConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Gets Google OAuth configuration status for client-side
 * This should be called from an API route to avoid exposing env vars to client
 * @returns {Object} Configuration status
 */
export function getGoogleOAuthStatus() {
  return {
    isConfigured: isGoogleOAuthConfigured(),
    message: isGoogleOAuthConfigured() 
      ? 'Google OAuth is configured' 
      : 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
  };
}