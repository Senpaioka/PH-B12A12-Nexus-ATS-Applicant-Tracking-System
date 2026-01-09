/**
 * User Profile Service
 * Handles user profile updates including bio and photoURL
 */

import { getUsersCollection } from '../mongodb.js';
import { validateBioLength, validateImageUrl } from '../utils/text-utils.js';
import { ObjectId } from 'mongodb';

/**
 * Profile update errors
 */
export class ProfileError extends Error {
  constructor(message, field = null, code = 'PROFILE_ERROR') {
    super(message);
    this.name = 'ProfileError';
    this.field = field;
    this.code = code;
  }
}

/**
 * Updates user profile information
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated user profile
 */
export async function updateUserProfile(userId, profileData) {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new ProfileError('User ID is required', null, 'USER_ID_REQUIRED');
    }

    const usersCollection = await getUsersCollection();
    
    // Get current user data
    const currentUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!currentUser) {
      throw new ProfileError('User not found', null, 'USER_NOT_FOUND');
    }

    // Validate profile data
    const validation = validateProfileData(profileData);
    if (!validation.isValid) {
      const firstError = validation.errors[0];
      throw new ProfileError(firstError.message, firstError.field, firstError.code);
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    // Add fields that are being updated
    if (profileData.name !== undefined) {
      updateData.name = profileData.name?.trim() || null;
    }
    
    if (profileData.bio !== undefined) {
      updateData.bio = profileData.bio?.trim() || null;
    }
    
    if (profileData.photoURL !== undefined) {
      updateData.photoURL = profileData.photoURL?.trim() || null;
    }

    // Update user in database
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new ProfileError('User not found', null, 'USER_NOT_FOUND');
    }

    if (result.modifiedCount === 0) {
      throw new ProfileError('No changes were made', null, 'NO_CHANGES');
    }

    // Get updated user data
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    console.log(`User profile updated: ${updatedUser.email}`);
    
    return {
      id: updatedUser._id.toString(),
      ...userWithoutPassword
    };

  } catch (error) {
    if (error instanceof ProfileError) {
      throw error;
    }
    
    console.error('Profile update failed:', error);
    throw new ProfileError(
      'Profile update failed due to a server error. Please try again.',
      null,
      'SERVER_ERROR'
    );
  }
}

/**
 * Validates profile update data
 * @param {Object} profileData - Profile data to validate
 * @returns {Object} Validation result
 */
export function validateProfileData(profileData) {
  const errors = [];

  // Name validation (optional)
  if (profileData.name !== undefined) {
    if (profileData.name && typeof profileData.name !== 'string') {
      errors.push({
        field: 'name',
        message: 'Name must be a string',
        code: 'NAME_INVALID_TYPE'
      });
    } else if (profileData.name && profileData.name.trim().length > 100) {
      errors.push({
        field: 'name',
        message: 'Name must not exceed 100 characters',
        code: 'NAME_TOO_LONG'
      });
    }
  }

  // Bio validation (optional)
  if (profileData.bio !== undefined && profileData.bio !== null && profileData.bio.trim()) {
    const bioValidation = validateBioLength(profileData.bio);
    if (!bioValidation.isValid) {
      if (bioValidation.isTooShort) {
        errors.push({
          field: 'bio',
          message: `Bio must be at least 300 words (currently ${bioValidation.wordCount} words)`,
          code: 'BIO_TOO_SHORT'
        });
      } else if (bioValidation.isTooLong) {
        errors.push({
          field: 'bio',
          message: `Bio must not exceed 500 words (currently ${bioValidation.wordCount} words)`,
          code: 'BIO_TOO_LONG'
        });
      }
    }
  }

  // Photo URL validation (optional)
  if (profileData.photoURL !== undefined && profileData.photoURL !== null && profileData.photoURL.trim()) {
    const urlValidation = validateImageUrl(profileData.photoURL);
    if (!urlValidation.isValid) {
      errors.push({
        field: 'photoURL',
        message: urlValidation.error,
        code: 'PHOTO_URL_INVALID'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
export async function getUserProfile(userId) {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new ProfileError('User ID is required', null, 'USER_ID_REQUIRED');
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new ProfileError('User not found', null, 'USER_NOT_FOUND');
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      id: user._id.toString(),
      ...userWithoutPassword
    };

  } catch (error) {
    if (error instanceof ProfileError) {
      throw error;
    }
    
    console.error('Get profile failed:', error);
    throw new ProfileError(
      'Failed to retrieve user profile. Please try again.',
      null,
      'SERVER_ERROR'
    );
  }
}

/**
 * Formats profile error for API response
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error response
 */
export function formatProfileError(error) {
  if (error instanceof ProfileError) {
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
      message: 'Profile operation failed. Please try again.',
      code: 'UNKNOWN_ERROR'
    }
  };
}