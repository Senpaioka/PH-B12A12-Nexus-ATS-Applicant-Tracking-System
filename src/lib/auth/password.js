/**
 * Password Security Service
 * Handles password hashing, verification, and strength validation using bcrypt
 */

import bcrypt from 'bcryptjs';

// Salt rounds for bcrypt hashing (12 is a good balance of security and performance)
const SALT_ROUNDS = 12;

/**
 * Password strength requirements
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional for better UX
  forbiddenPatterns: [
    /(.)\1{3,}/, // No more than 3 consecutive identical characters
    /^(password|123456|qwerty|admin|user)/i, // Common weak passwords
  ]
};

/**
 * Hashes a password using bcrypt with salt
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }
    
    if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
      throw new Error(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
    }
    
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    return hashedPassword;
    
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error(`Password hashing failed: ${error.message}`);
  }
}

/**
 * Verifies a password against its hash
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Hashed password to compare against
 * @returns {Promise<boolean>} True if password matches hash
 */
export async function verifyPassword(password, hashedPassword) {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }
    
    if (!hashedPassword || typeof hashedPassword !== 'string') {
      throw new Error('Hashed password must be a non-empty string');
    }
    
    // Verify password against hash
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    return isValid;
    
  } catch (error) {
    console.error('Password verification failed:', error);
    // Return false instead of throwing to prevent information leakage
    return false;
  }
}

/**
 * Validates password strength according to security requirements
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid flag and detailed feedback
 */
export function validatePasswordStrength(password) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    strength: 'weak',
    score: 0
  };
  
  if (!password || typeof password !== 'string') {
    result.isValid = false;
    result.errors.push('Password is required');
    return result;
  }
  
  let score = 0;
  
  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    result.isValid = false;
    result.errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else {
    score += 1;
  }
  
  // Check maximum length
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    result.isValid = false;
    result.errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }
  
  // Check for uppercase letters
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }
  
  // Check for lowercase letters
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }
  
  // Check for numbers
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 1;
  }
  
  // Check for special characters (optional but recommended)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
    result.warnings.push('Great! Your password includes special characters for extra security');
  } else if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
    result.isValid = false;
    result.errors.push('Password must contain at least one special character');
  }
  
  // Check for forbidden patterns
  for (const pattern of PASSWORD_REQUIREMENTS.forbiddenPatterns) {
    if (pattern.test(password)) {
      result.isValid = false;
      result.errors.push('Password contains common patterns that make it weak');
      break;
    }
  }
  
  // Additional strength checks
  if (password.length >= 12) {
    score += 1;
  }
  
  if (/[A-Z].*[A-Z]/.test(password)) { // Multiple uppercase
    score += 0.5;
  }
  
  if (/\d.*\d/.test(password)) { // Multiple numbers
    score += 0.5;
  }
  
  // Determine strength level
  result.score = Math.min(score, 5);
  
  if (result.score >= 4.5) {
    result.strength = 'very strong';
  } else if (result.score >= 3.5) {
    result.strength = 'strong';
  } else if (result.score >= 2.5) {
    result.strength = 'medium';
  } else if (result.score >= 1.5) {
    result.strength = 'weak';
  } else {
    result.strength = 'very weak';
  }
  
  return result;
}

/**
 * Generates a secure random password
 * @param {number} length - Desired password length (default: 16)
 * @param {Object} options - Password generation options
 * @returns {string} Generated password
 */
export function generateSecurePassword(length = 16, options = {}) {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSpecialChars = true,
    excludeSimilar = true // Exclude similar looking characters (0, O, l, 1, etc.)
  } = options;
  
  let charset = '';
  
  if (includeUppercase) {
    charset += excludeSimilar ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  if (includeLowercase) {
    charset += excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  }
  
  if (includeNumbers) {
    charset += excludeSimilar ? '23456789' : '0123456789';
  }
  
  if (includeSpecialChars) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  }
  
  if (!charset) {
    throw new Error('At least one character type must be included');
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

/**
 * Checks if a password has been compromised in known data breaches
 * This is a placeholder for integration with services like HaveIBeenPwned
 * @param {string} password - Password to check
 * @returns {Promise<boolean>} True if password is compromised
 */
export async function isPasswordCompromised(password) {
  // Placeholder implementation
  // In production, you might integrate with HaveIBeenPwned API
  // For now, just check against a small list of common passwords
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
}

/**
 * Gets password requirements for display to users
 * @returns {Object} Password requirements object
 */
export function getPasswordRequirements() {
  return {
    minLength: PASSWORD_REQUIREMENTS.minLength,
    maxLength: PASSWORD_REQUIREMENTS.maxLength,
    requireUppercase: PASSWORD_REQUIREMENTS.requireUppercase,
    requireLowercase: PASSWORD_REQUIREMENTS.requireLowercase,
    requireNumbers: PASSWORD_REQUIREMENTS.requireNumbers,
    requireSpecialChars: PASSWORD_REQUIREMENTS.requireSpecialChars,
    description: [
      `At least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
      'Contains uppercase and lowercase letters',
      'Contains at least one number',
      'Avoid common patterns and dictionary words'
    ]
  };
}