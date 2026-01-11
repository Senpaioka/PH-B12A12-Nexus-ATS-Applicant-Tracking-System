/**
 * Email Verification Service
 * Handles email verification tokens and verification process
 */

import { getUsersCollection } from '../mongodb.js';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * Verification errors
 */
export class VerificationError extends Error {
  constructor(message, code = 'VERIFICATION_ERROR') {
    super(message);
    this.name = 'VerificationError';
    this.code = code;
  }
}

/**
 * Generates a secure verification token
 * @returns {string} Verification token
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a verification token for a user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Promise<string>} Verification token
 */
export async function createVerificationToken(userId, email) {
  try {
    const usersCollection = await getUsersCollection();
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const now = new Date();
    
    // Store verification token in user document
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          verificationToken: token,
          verificationTokenExpires: expiresAt,
          lastVerificationEmailSent: now,
          updatedAt: now
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new VerificationError('User not found', 'USER_NOT_FOUND');
    }
    
    console.log(`Verification token created for user: ${email}`);
    return token;
    
  } catch (error) {
    if (error instanceof VerificationError) {
      throw error;
    }
    
    console.error('Failed to create verification token:', error);
    throw new VerificationError(
      'Failed to create verification token. Please try again.',
      'TOKEN_CREATION_FAILED'
    );
  }
}

/**
 * Verifies an email using verification token
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Verification result
 */
export async function verifyEmail(token) {
  try {
    if (!token || typeof token !== 'string') {
      throw new VerificationError('Verification token is required', 'TOKEN_REQUIRED');
    }
    
    const usersCollection = await getUsersCollection();
    
    // Find user with matching token
    const user = await usersCollection.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() } // Token not expired
    });
    
    if (!user) {
      throw new VerificationError(
        'Invalid or expired verification token. Please request a new verification email.',
        'TOKEN_INVALID'
      );
    }
    
    // Update user as verified and remove token
    const result = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          updatedAt: new Date()
        },
        $unset: {
          verificationToken: '',
          verificationTokenExpires: ''
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      throw new VerificationError(
        'Failed to verify email. Please try again.',
        'VERIFICATION_FAILED'
      );
    }
    
    console.log(`Email verified for user: ${user.email}`);
    
    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        emailVerified: true
      }
    };
    
  } catch (error) {
    if (error instanceof VerificationError) {
      throw error;
    }
    
    console.error('Email verification failed:', error);
    throw new VerificationError(
      'Email verification failed. Please try again.',
      'VERIFICATION_ERROR'
    );
  }
}

/**
 * Resends verification email for a user
 * @param {string} email - User email
 * @returns {Promise<Object>} Resend result
 */
export async function resendVerificationEmail(email) {
  try {
    if (!email || typeof email !== 'string') {
      throw new VerificationError('Email is required', 'EMAIL_REQUIRED');
    }
    
    const usersCollection = await getUsersCollection();
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email
    const user = await usersCollection.findOne({ 
      email: normalizedEmail 
    }, {
      projection: {
        _id: 1,
        email: 1,
        name: 1,
        emailVerified: 1,
        lastVerificationEmailSent: 1,
        verificationTokenExpires: 1
      }
    });
    
    if (!user) {
      throw new VerificationError('User not found', 'USER_NOT_FOUND');
    }
    
    if (user.emailVerified) {
      throw new VerificationError(
        'Email is already verified',
        'ALREADY_VERIFIED'
      );
    }
    
    // Check if user has requested verification recently (rate limiting)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (user.lastVerificationEmailSent && user.lastVerificationEmailSent > fiveMinutesAgo) {
      const timeLeft = Math.ceil((user.lastVerificationEmailSent.getTime() + 5 * 60 * 1000 - Date.now()) / 1000 / 60);
      throw new VerificationError(
        `Please wait ${timeLeft} minutes before requesting another verification email`,
        'RATE_LIMITED'
      );
    }
    
    // Create new verification token
    const token = await createVerificationToken(user._id.toString(), user.email);
    
    return {
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    };
    
  } catch (error) {
    if (error instanceof VerificationError) {
      throw error;
    }
    
    console.error('Failed to resend verification email:', error);
    throw new VerificationError(
      'Failed to resend verification email. Please try again.',
      'RESEND_FAILED'
    );
  }
}

/**
 * Checks if a user's email is verified
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if email is verified
 */
export async function isEmailVerified(userId) {
  try {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { emailVerified: 1 } }
    );
    
    return user?.emailVerified || false;
    
  } catch (error) {
    console.error('Failed to check email verification status:', error);
    return false;
  }
}

/**
 * Gets verification status for a user
 * @param {string} email - User email
 * @returns {Promise<Object>} Verification status
 */
export async function getVerificationStatus(email) {
  try {
    const usersCollection = await getUsersCollection();
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = await usersCollection.findOne(
      { email: normalizedEmail },
      { 
        projection: { 
          emailVerified: 1, 
          verificationToken: 1, 
          verificationTokenExpires: 1 
        } 
      }
    );
    
    if (!user) {
      throw new VerificationError('User not found', 'USER_NOT_FOUND');
    }
    
    return {
      emailVerified: user.emailVerified || false,
      hasPendingToken: !!(user.verificationToken && user.verificationTokenExpires > new Date()),
      tokenExpires: user.verificationTokenExpires
    };
    
  } catch (error) {
    if (error instanceof VerificationError) {
      throw error;
    }
    
    console.error('Failed to get verification status:', error);
    throw new VerificationError(
      'Failed to get verification status',
      'STATUS_ERROR'
    );
  }
}

/**
 * Cleans up expired verification tokens
 * @returns {Promise<number>} Number of tokens cleaned up
 */
export async function cleanupExpiredTokens() {
  try {
    const usersCollection = await getUsersCollection();
    
    const result = await usersCollection.updateMany(
      { verificationTokenExpires: { $lt: new Date() } },
      {
        $unset: {
          verificationToken: '',
          verificationTokenExpires: ''
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`Cleaned up ${result.modifiedCount} expired verification tokens`);
    return result.modifiedCount;
    
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
    return 0;
  }
}

/**
 * Formats verification error for API response
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error response
 */
export function formatVerificationError(error) {
  if (error instanceof VerificationError) {
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
      message: 'Verification failed. Please try again.',
      code: 'UNKNOWN_ERROR'
    }
  };
}