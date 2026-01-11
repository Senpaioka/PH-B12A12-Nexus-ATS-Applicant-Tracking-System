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
  'PORT',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM'
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

  // Check email configuration (optional but recommended for production)
  if (process.env.NODE_ENV === 'production' && !process.env.SMTP_HOST) {
    warnings.push('SMTP configuration not found. Email functionality will be disabled.');
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
    PORT: process.env.PORT || 3000,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM
  };
}

/**
 * Get validated environment configuration
 * @returns {Object} Validated environment configuration
 */
export function getEnvConfig() {
  return validateEnvironmentVariables();
}