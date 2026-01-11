/**
 * Email Configuration Utilities
 * Helper functions to check email configuration status
 */

import { getEnvConfig } from '../env.js';

/**
 * Checks if email is properly configured
 * @returns {Object} Configuration status
 */
export function getEmailConfigStatus() {
  try {
    const config = getEnvConfig();
    
    const hasSmtpConfig = !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      isConfigured: hasSmtpConfig,
      isDevelopment,
      mode: hasSmtpConfig ? 'production' : (isDevelopment ? 'development' : 'unconfigured'),
      config: hasSmtpConfig ? {
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        user: config.SMTP_USER,
        from: config.SMTP_FROM
      } : null,
      message: getConfigMessage(hasSmtpConfig, isDevelopment)
    };
  } catch (error) {
    return {
      isConfigured: false,
      isDevelopment: process.env.NODE_ENV === 'development',
      mode: 'error',
      config: null,
      message: 'Error checking email configuration: ' + error.message
    };
  }
}

/**
 * Gets appropriate configuration message
 * @param {boolean} hasSmtpConfig - Whether SMTP is configured
 * @param {boolean} isDevelopment - Whether in development mode
 * @returns {string} Configuration message
 */
function getConfigMessage(hasSmtpConfig, isDevelopment) {
  if (hasSmtpConfig) {
    return 'Email is configured and ready to send real emails';
  }
  
  if (isDevelopment) {
    return 'Development mode: Emails will be logged to console (no real emails sent)';
  }
  
  return 'Email not configured: Please set SMTP environment variables for production';
}

/**
 * Logs email configuration status to console
 */
export function logEmailConfigStatus() {
  const status = getEmailConfigStatus();
  
  console.log('\n📧 Email Configuration Status:');
  console.log('Mode:', status.mode);
  console.log('Message:', status.message);
  
  if (status.config) {
    console.log('SMTP Host:', status.config.host);
    console.log('SMTP Port:', status.config.port);
    console.log('SMTP User:', status.config.user);
    console.log('From Address:', status.config.from);
  }
  
  console.log('');
}