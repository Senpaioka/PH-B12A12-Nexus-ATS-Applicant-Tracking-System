/**
 * Application Validation
 * Handles validation and sanitization for job applications
 */

/**
 * Application status constants
 */
export const APPLICATION_STATUSES = {
  APPLIED: 'applied',
  SCREENING: 'screening', 
  INTERVIEW: 'interview',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected'
};

/**
 * Validates application data
 * @param {Object} applicationData - Application data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateApplicationData(applicationData) {
  const errors = [];

  if (!applicationData || typeof applicationData !== 'object') {
    return {
      isValid: false,
      errors: [{ field: null, message: 'Application data is required', code: 'DATA_REQUIRED' }]
    };
  }

  // Validate cover letter
  if (!applicationData.coverLetter || typeof applicationData.coverLetter !== 'string') {
    errors.push({
      field: 'coverLetter',
      message: 'Cover letter is required',
      code: 'COVER_LETTER_REQUIRED'
    });
  } else if (applicationData.coverLetter.trim().length < 50) {
    errors.push({
      field: 'coverLetter',
      message: 'Cover letter must be at least 50 characters long',
      code: 'COVER_LETTER_TOO_SHORT'
    });
  } else if (applicationData.coverLetter.length > 5000) {
    errors.push({
      field: 'coverLetter',
      message: 'Cover letter must be less than 5000 characters',
      code: 'COVER_LETTER_TOO_LONG'
    });
  }

  // Validate resume URL (optional)
  if (applicationData.resumeUrl && typeof applicationData.resumeUrl !== 'string') {
    errors.push({
      field: 'resumeUrl',
      message: 'Resume URL must be a valid string',
      code: 'RESUME_URL_INVALID'
    });
  }

  // Validate phone (optional)
  if (applicationData.phone && typeof applicationData.phone !== 'string') {
    errors.push({
      field: 'phone',
      message: 'Phone number must be a valid string',
      code: 'PHONE_INVALID'
    });
  } else if (applicationData.phone && applicationData.phone.length > 20) {
    errors.push({
      field: 'phone',
      message: 'Phone number must be less than 20 characters',
      code: 'PHONE_TOO_LONG'
    });
  }

  // Validate LinkedIn URL (optional)
  if (applicationData.linkedinUrl && typeof applicationData.linkedinUrl !== 'string') {
    errors.push({
      field: 'linkedinUrl',
      message: 'LinkedIn URL must be a valid string',
      code: 'LINKEDIN_URL_INVALID'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes application input data
 * @param {Object} applicationData - Raw application data
 * @returns {Object} Sanitized application data
 */
export function sanitizeApplicationInput(applicationData) {
  if (!applicationData || typeof applicationData !== 'object') {
    return {};
  }

  const sanitized = {};

  // Sanitize cover letter
  if (applicationData.coverLetter && typeof applicationData.coverLetter === 'string') {
    sanitized.coverLetter = applicationData.coverLetter.trim().slice(0, 5000);
  }

  // Sanitize resume URL
  if (applicationData.resumeUrl && typeof applicationData.resumeUrl === 'string') {
    sanitized.resumeUrl = applicationData.resumeUrl.trim().slice(0, 500);
  }

  // Sanitize phone
  if (applicationData.phone && typeof applicationData.phone === 'string') {
    sanitized.phone = applicationData.phone.trim().slice(0, 20);
  }

  // Sanitize LinkedIn URL
  if (applicationData.linkedinUrl && typeof applicationData.linkedinUrl === 'string') {
    sanitized.linkedinUrl = applicationData.linkedinUrl.trim().slice(0, 500);
  }

  return sanitized;
}

/**
 * Validates application status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid status
 */
export function isValidApplicationStatus(status) {
  return Object.values(APPLICATION_STATUSES).includes(status);
}