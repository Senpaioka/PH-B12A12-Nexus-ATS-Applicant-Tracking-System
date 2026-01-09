/**
 * Environment variable validation utility
 * Validates required environment variables on application startup
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'DB_NAME'
];

const optionalEnvVars = [
  'PORT'
];

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variable is missing
 */
export function validateEnvironmentVariables() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check for development warnings
  if (process.env.NEXTAUTH_SECRET === 'your-super-secret-key-change-this-in-production') {
    warnings.push('NEXTAUTH_SECRET is using the default value. Please generate a secure secret for production.');
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}\n\n` +
      'Please check your .env file and ensure all required variables are set.\n' +
      'See .env.example for reference.';
    throw new Error(errorMessage);
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('Environment warnings:', warnings.join('\n'));
  }

  return {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DB_NAME: process.env.DB_NAME || 'nexus_ats',
    PORT: process.env.PORT || 3000
  };
}

/**
 * Get validated environment configuration
 * @returns {Object} Validated environment configuration
 */
export function getEnvConfig() {
  return validateEnvironmentVariables();
}