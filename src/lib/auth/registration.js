/**
 * User Registration Service
 * Handles user account creation with validation and password hashing
 */

import { getUsersCollection } from '../mongodb.js';
import { hashPassword, validatePasswordStrength } from './password.js';
import { validateUserDocument } from '../db-init.js';
import { createVerificationToken } from './verification.js';
import { sendVerificationEmail } from '../email/email-service.js';

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Registration validation errors
 */
export class RegistrationError extends Error {
  constructor(message, field = null, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'RegistrationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * Validates registration data before processing
 * @param {string} email - User email address
 * @param {string} password - User password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Object} Validation result with errors array
 */
export function validateRegistrationData(email, password, confirmPassword) {
  const errors = [];
  
  // Email validation
  if (!email || typeof email !== 'string') {
    errors.push({
      field: 'email',
      message: 'Email is required',
      code: 'EMAIL_REQUIRED'
    });
  } else {
    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.push({
        field: 'email',
        message: 'Please enter a valid email address',
        code: 'EMAIL_INVALID'
      });
    } else if (trimmedEmail.length > 254) {
      errors.push({
        field: 'email',
        message: 'Email address is too long',
        code: 'EMAIL_TOO_LONG'
      });
    }
  }
  
  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push({
      field: 'password',
      message: 'Password is required',
      code: 'PASSWORD_REQUIRED'
    });
  } else {
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors.map(error => ({
        field: 'password',
        message: error,
        code: 'PASSWORD_WEAK'
      })));
    }
  }
  
  // Password confirmation validation
  if (!confirmPassword || typeof confirmPassword !== 'string') {
    errors.push({
      field: 'confirmPassword',
      message: 'Password confirmation is required',
      code: 'CONFIRM_PASSWORD_REQUIRED'
    });
  } else if (password !== confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: 'Passwords do not match',
      code: 'PASSWORDS_MISMATCH'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a user with the given email already exists
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} True if user exists
 */
export async function checkUserExists(email) {
  try {
    if (!email || typeof email !== 'string') {
      throw new RegistrationError('Email is required for user lookup', 'email');
    }
    
    const usersCollection = await getUsersCollection();
    const normalizedEmail = email.toLowerCase().trim();
    
    const existingUser = await usersCollection.findOne(
      { email: normalizedEmail },
      { projection: { _id: 1 } } // Only return _id for efficiency
    );
    
    return !!existingUser;
    
  } catch (error) {
    if (error instanceof RegistrationError) {
      throw error;
    }
    
    console.error('Error checking user existence:', error);
    throw new RegistrationError(
      'Unable to verify email availability. Please try again.',
      'email',
      'DATABASE_ERROR'
    );
  }
}

/**
 * Creates a new user account with validation and security measures
 * @param {string} email - User email address
 * @param {string} password - User password (plain text)
 * @param {Object} additionalData - Optional additional user data
 * @returns {Promise<Object>} Created user object (without password)
 */
export async function registerUser(email, password, additionalData = {}) {
  try {
    // Validate input data
    const validation = validateRegistrationData(email, password, password);
    if (!validation.isValid) {
      const firstError = validation.errors[0];
      throw new RegistrationError(firstError.message, firstError.field, firstError.code);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const userExists = await checkUserExists(normalizedEmail);
    if (userExists) {
      throw new RegistrationError(
        'An account with this email address already exists',
        'email',
        'EMAIL_EXISTS'
      );
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Prepare user document
    const now = new Date();
    const userData = {
      email: normalizedEmail,
      password: hashedPassword,
      name: additionalData.name || null,
      bio: null, // Will be set later in settings
      photoURL: null, // Will be set later in settings
      role: additionalData.role || 'user',
      createdAt: now,
      updatedAt: now,
      isActive: true,
      emailVerified: false,
      ...additionalData
    };
    
    // Validate user document structure
    const validatedUserData = validateUserDocument(userData);
    
    // Insert user into database
    const usersCollection = await getUsersCollection();
    const result = await usersCollection.insertOne(validatedUserData);
    
    if (!result.insertedId) {
      throw new RegistrationError(
        'Failed to create user account. Please try again.',
        null,
        'INSERT_FAILED'
      );
    }
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = validatedUserData;
    
    console.log(`New user registered: ${normalizedEmail}`);
    
    const userId = result.insertedId.toString();
    
    // Create verification token and send email
    let emailVerificationSent = false;
    try {
      const verificationToken = await createVerificationToken(userId, normalizedEmail);
      await sendVerificationEmail(normalizedEmail, verificationToken, validatedUserData.name);
      console.log(`✅ Verification email sent to: ${normalizedEmail}`);
      emailVerificationSent = true;
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', emailError);
      // Don't fail registration if email fails, just log the error
      // User can still register and request verification email later
    }
    
    return {
      id: userId,
      ...userWithoutPassword,
      emailVerificationSent
    };
    
  } catch (error) {
    if (error instanceof RegistrationError) {
      throw error;
    }
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      throw new RegistrationError(
        'An account with this email address already exists',
        'email',
        'EMAIL_EXISTS'
      );
    }
    
    console.error('User registration failed:', error);
    throw new RegistrationError(
      'Registration failed due to a server error. Please try again.',
      null,
      'SERVER_ERROR'
    );
  }
}

/**
 * Validates email format and availability
 * @param {string} email - Email to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateEmail(email) {
  try {
    const result = {
      isValid: true,
      isAvailable: true,
      errors: []
    };
    
    if (!email || typeof email !== 'string') {
      result.isValid = false;
      result.errors.push('Email is required');
      return result;
    }
    
    const trimmedEmail = email.trim();
    
    // Format validation
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      result.isValid = false;
      result.errors.push('Please enter a valid email address');
      return result;
    }
    
    if (trimmedEmail.length > 254) {
      result.isValid = false;
      result.errors.push('Email address is too long');
      return result;
    }
    
    // Availability check
    const exists = await checkUserExists(trimmedEmail);
    if (exists) {
      result.isAvailable = false;
      result.errors.push('An account with this email address already exists');
    }
    
    return result;
    
  } catch (error) {
    console.error('Email validation failed:', error);
    return {
      isValid: false,
      isAvailable: false,
      errors: ['Unable to validate email. Please try again.']
    };
  }
}

/**
 * Gets user registration statistics
 * @returns {Promise<Object>} Registration statistics
 */
export async function getRegistrationStats() {
  try {
    const usersCollection = await getUsersCollection();
    
    const [totalUsers, activeUsers, recentUsers] = await Promise.all([
      usersCollection.countDocuments(),
      usersCollection.countDocuments({ isActive: true }),
      usersCollection.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })
    ]);
    
    return {
      totalUsers,
      activeUsers,
      recentUsers,
      inactiveUsers: totalUsers - activeUsers
    };
    
  } catch (error) {
    console.error('Failed to get registration stats:', error);
    throw new Error('Unable to retrieve registration statistics');
  }
}

/**
 * Sanitizes user input to prevent injection attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Formats registration error for API response
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error response
 */
export function formatRegistrationError(error) {
  if (error instanceof RegistrationError) {
    return {
      success: false,
      error: {
        message: error.message,
        field: error.field,
        code: error.code
      }
    };
  }
  
  // Generic error response (don't expose internal details)
  return {
    success: false,
    error: {
      message: 'Registration failed. Please try again.',
      code: 'UNKNOWN_ERROR'
    }
  };
}