/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

import nodemailer from 'nodemailer';
import { getEnvConfig } from '../env.js';
import { logEmailConfigStatus } from './email-config.js';

/**
 * Email service errors
 */
export class EmailError extends Error {
  constructor(message, code = 'EMAIL_ERROR') {
    super(message);
    this.name = 'EmailError';
    this.code = code;
  }
}

/**
 * Creates and configures email transporter
 * @returns {Object} Nodemailer transporter
 */
async function createEmailTransporter() {
  const config = getEnvConfig();
  
  // Log configuration status on first use
  if (!createEmailTransporter._logged) {
    logEmailConfigStatus();
    createEmailTransporter._logged = true;
  }
  
  // For development, use Ethereal Email (fake SMTP service) if no SMTP config is provided
  if (process.env.NODE_ENV === 'development' && !config.SMTP_HOST) {
    console.log('📧 Using Ethereal Email for development (fake SMTP)');
    
    try {
      // Create test account for Ethereal Email
      const testAccount = await nodemailer.createTestAccount();
      
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (error) {
      console.error('Failed to create Ethereal Email account:', error);
      // Fallback to console logging in development
      return createConsoleTransporter();
    }
  }
  
  // Production SMTP configuration
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 No SMTP config found, using console logging for development');
      return createConsoleTransporter();
    }
    
    throw new EmailError(
      'Email configuration missing. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.',
      'MISSING_CONFIG'
    );
  }
  
  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT || 587,
    secure: config.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });
}

/**
 * Creates a console-only transporter for development
 * @returns {Object} Console transporter
 */
function createConsoleTransporter() {
  return {
    sendMail: async (mailOptions) => {
      console.log('\n📧 EMAIL WOULD BE SENT (Development Mode):');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('From:', mailOptions.from);
      console.log('HTML Content Preview:', mailOptions.html.substring(0, 200) + '...');
      
      return {
        messageId: 'dev-' + Date.now(),
        response: 'Development mode - email logged to console'
      };
    }
  };
}

/**
 * Sends an email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const config = getEnvConfig();
    const transporter = await createEmailTransporter();
    
    const mailOptions = {
      from: config.SMTP_FROM || config.SMTP_USER || 'noreply@nexusats.com',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('📧 Email sent successfully:', {
      to,
      subject,
      messageId: result.messageId
    });
    
    // For Ethereal Email, provide preview URL
    const previewUrl = nodemailer.getTestMessageUrl(result);
    if (previewUrl) {
      console.log('📧 Preview URL:', previewUrl);
    }
    
    return {
      success: true,
      messageId: result.messageId,
      previewUrl: previewUrl
    };
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new EmailError(
      'Failed to send email. Please try again later.',
      'SEND_FAILED'
    );
  }
}

/**
 * Sends email verification email
 * @param {string} email - User email address
 * @param {string} verificationToken - Verification token
 * @param {string} userName - User name
 * @returns {Promise<Object>} Send result
 */
export async function sendVerificationEmail(email, verificationToken, userName = 'User') {
  const config = getEnvConfig();
  const verificationUrl = `${config.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
  
  const subject = 'Verify Your Email Address - Nexus ATS';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { 
          display: inline-block; 
          background: #2563eb; 
          color: white !important; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0; 
          font-weight: bold;
          border: none;
          cursor: pointer;
        }
        .button:hover { background: #1d4ed8; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; }
        .url-box { 
          word-break: break-all; 
          background: #e2e8f0; 
          padding: 15px; 
          border-radius: 4px; 
          font-family: monospace; 
          font-size: 14px;
          border: 1px solid #cbd5e1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📋 Nexus ATS</div>
          <h1>Welcome to Nexus ATS!</h1>
        </div>
        <div class="content">
          <h2>Hi ${userName},</h2>
          <p>Thank you for registering with Nexus ATS! To complete your account setup, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="button" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p><strong>Alternative method:</strong> If the button above doesn't work, copy and paste this link into your browser:</p>
          <div class="url-box">
            ${verificationUrl}
          </div>
          
          <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
          
          <p>If you didn't create an account with Nexus ATS, you can safely ignore this email.</p>
          
          <p>Best regards,<br>The Nexus ATS Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>If you're having trouble with the verification link, please contact support.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Sends password reset email
 * @param {string} email - User email address
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User name
 * @returns {Promise<Object>} Send result
 */
export async function sendPasswordResetEmail(email, resetToken, userName = 'User') {
  const config = getEnvConfig();
  const resetUrl = `${config.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
  
  const subject = 'Reset Your Password - Nexus ATS';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📋 Nexus ATS</div>
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${userName},</h2>
          <p>We received a request to reset your password for your Nexus ATS account. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e2e8f0; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${resetUrl}
          </p>
          
          <p><strong>Important:</strong> This reset link will expire in 1 hour for security reasons.</p>
          
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          
          <p>Best regards,<br>The Nexus ATS Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Formats email error for API response
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error response
 */
export function formatEmailError(error) {
  if (error instanceof EmailError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code
      }
    };
  }
  
  return {
    success: false,
    error: {
      message: 'Email service error. Please try again.',
      code: 'UNKNOWN_ERROR'
    }
  };
}