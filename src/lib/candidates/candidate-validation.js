/**
 * Candidate Data Validation
 * Provides validation functions for candidate data integrity
 */

import { PIPELINE_STAGES, APPLICATION_SOURCES, DOCUMENT_TYPES, NOTE_TYPES, VALID_STAGE_TRANSITIONS } from './candidate-models.js';

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone number validation regex (supports various formats)
 */
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validates candidate personal information
 * @param {Object} personalInfo - Personal information object
 * @throws {ValidationError} If validation fails
 */
export function validatePersonalInfo(personalInfo) {
  const errors = [];

  // First name validation
  if (!personalInfo.firstName || typeof personalInfo.firstName !== 'string') {
    errors.push({ field: 'firstName', message: 'First name is required and must be a string' });
  } else if (personalInfo.firstName.trim().length < 1) {
    errors.push({ field: 'firstName', message: 'First name cannot be empty' });
  } else if (personalInfo.firstName.trim().length > 50) {
    errors.push({ field: 'firstName', message: 'First name cannot exceed 50 characters' });
  }

  // Last name validation
  if (!personalInfo.lastName || typeof personalInfo.lastName !== 'string') {
    errors.push({ field: 'lastName', message: 'Last name is required and must be a string' });
  } else if (personalInfo.lastName.trim().length < 1) {
    errors.push({ field: 'lastName', message: 'Last name cannot be empty' });
  } else if (personalInfo.lastName.trim().length > 50) {
    errors.push({ field: 'lastName', message: 'Last name cannot exceed 50 characters' });
  }

  // Email validation
  if (!personalInfo.email || typeof personalInfo.email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required and must be a string' });
  } else if (!EMAIL_REGEX.test(personalInfo.email.trim())) {
    errors.push({ field: 'email', message: 'Email must be a valid email address' });
  } else if (personalInfo.email.trim().length > 100) {
    errors.push({ field: 'email', message: 'Email cannot exceed 100 characters' });
  }

  // Phone validation (optional)
  if (personalInfo.phone) {
    if (typeof personalInfo.phone !== 'string') {
      errors.push({ field: 'phone', message: 'Phone must be a string' });
    } else {
      const normalizedPhone = normalizePhoneNumber(personalInfo.phone);
      if (!PHONE_REGEX.test(normalizedPhone)) {
        errors.push({ field: 'phone', message: 'Phone must be a valid phone number' });
      }
    }
  }

  // Location validation (optional)
  if (personalInfo.location) {
    if (typeof personalInfo.location !== 'string') {
      errors.push({ field: 'location', message: 'Location must be a string' });
    } else if (personalInfo.location.trim().length > 100) {
      errors.push({ field: 'location', message: 'Location cannot exceed 100 characters' });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Personal information validation failed', errors);
  }
}

/**
 * Validates candidate professional information
 * @param {Object} professionalInfo - Professional information object
 * @throws {ValidationError} If validation fails
 */
export function validateProfessionalInfo(professionalInfo) {
  const errors = [];

  // Current role validation (optional)
  if (professionalInfo.currentRole) {
    if (typeof professionalInfo.currentRole !== 'string') {
      errors.push({ field: 'currentRole', message: 'Current role must be a string' });
    } else if (professionalInfo.currentRole.trim().length > 100) {
      errors.push({ field: 'currentRole', message: 'Current role cannot exceed 100 characters' });
    }
  }

  // Experience validation (optional)
  if (professionalInfo.experience) {
    if (typeof professionalInfo.experience !== 'string') {
      errors.push({ field: 'experience', message: 'Experience must be a string' });
    } else if (professionalInfo.experience.trim().length > 50) {
      errors.push({ field: 'experience', message: 'Experience cannot exceed 50 characters' });
    }
  }

  // Skills validation (optional)
  if (professionalInfo.skills) {
    if (!Array.isArray(professionalInfo.skills)) {
      errors.push({ field: 'skills', message: 'Skills must be an array' });
    } else {
      professionalInfo.skills.forEach((skill, index) => {
        if (typeof skill !== 'string') {
          errors.push({ field: `skills[${index}]`, message: 'Each skill must be a string' });
        } else if (skill.trim().length > 50) {
          errors.push({ field: `skills[${index}]`, message: 'Each skill cannot exceed 50 characters' });
        }
      });
      
      if (professionalInfo.skills.length > 20) {
        errors.push({ field: 'skills', message: 'Cannot have more than 20 skills' });
      }
    }
  }

  // Applied for role validation (optional)
  if (professionalInfo.appliedForRole) {
    if (typeof professionalInfo.appliedForRole !== 'string') {
      errors.push({ field: 'appliedForRole', message: 'Applied for role must be a string' });
    } else if (professionalInfo.appliedForRole.trim().length > 100) {
      errors.push({ field: 'appliedForRole', message: 'Applied for role cannot exceed 100 characters' });
    }
  }

  // Source validation
  if (professionalInfo.source && !Object.values(APPLICATION_SOURCES).includes(professionalInfo.source)) {
    errors.push({ 
      field: 'source', 
      message: `Source must be one of: ${Object.values(APPLICATION_SOURCES).join(', ')}` 
    });
  }

  if (errors.length > 0) {
    throw new ValidationError('Professional information validation failed', errors);
  }
}

/**
 * Validates pipeline stage
 * @param {string} stage - Pipeline stage
 * @throws {ValidationError} If validation fails
 */
export function validatePipelineStage(stage) {
  if (!stage || typeof stage !== 'string') {
    throw new ValidationError('Pipeline stage is required and must be a string', 'stage');
  }

  if (!Object.values(PIPELINE_STAGES).includes(stage)) {
    throw new ValidationError(
      `Pipeline stage must be one of: ${Object.values(PIPELINE_STAGES).join(', ')}`,
      'stage'
    );
  }
}

/**
 * Validates stage transition
 * @param {string} fromStage - Current stage
 * @param {string} toStage - Target stage
 * @throws {ValidationError} If transition is invalid
 */
export function validateStageTransition(fromStage, toStage) {
  validatePipelineStage(fromStage);
  validatePipelineStage(toStage);

  if (fromStage === toStage) {
    return; // Same stage is allowed
  }

  const validTransitions = VALID_STAGE_TRANSITIONS[fromStage] || [];
  if (!validTransitions.includes(toStage)) {
    throw new ValidationError(
      `Invalid stage transition from ${fromStage} to ${toStage}. Valid transitions: ${validTransitions.join(', ')}`,
      'stageTransition'
    );
  }
}

/**
 * Validates document metadata
 * @param {Object} documentData - Document metadata
 * @throws {ValidationError} If validation fails
 */
export function validateDocumentMetadata(documentData) {
  const errors = [];

  // Filename validation
  if (!documentData.filename || typeof documentData.filename !== 'string') {
    errors.push({ field: 'filename', message: 'Filename is required and must be a string' });
  }

  // Original name validation
  if (!documentData.originalName || typeof documentData.originalName !== 'string') {
    errors.push({ field: 'originalName', message: 'Original name is required and must be a string' });
  }

  // MIME type validation
  if (!documentData.mimeType || typeof documentData.mimeType !== 'string') {
    errors.push({ field: 'mimeType', message: 'MIME type is required and must be a string' });
  } else {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedMimeTypes.includes(documentData.mimeType)) {
      errors.push({ 
        field: 'mimeType', 
        message: 'Only PDF, DOC, and DOCX files are allowed' 
      });
    }
  }

  // Size validation
  if (typeof documentData.size !== 'number' || documentData.size <= 0) {
    errors.push({ field: 'size', message: 'Size must be a positive number' });
  } else if (documentData.size > 10 * 1024 * 1024) { // 10MB limit
    errors.push({ field: 'size', message: 'File size cannot exceed 10MB' });
  }

  // Document type validation
  if (documentData.documentType && !Object.values(DOCUMENT_TYPES).includes(documentData.documentType)) {
    errors.push({ 
      field: 'documentType', 
      message: `Document type must be one of: ${Object.values(DOCUMENT_TYPES).join(', ')}` 
    });
  }

  if (errors.length > 0) {
    throw new ValidationError('Document metadata validation failed', errors);
  }
}

/**
 * Validates note data
 * @param {Object} noteData - Note data
 * @throws {ValidationError} If validation fails
 */
export function validateNoteData(noteData) {
  const errors = [];

  // Content validation
  if (!noteData.content || typeof noteData.content !== 'string') {
    errors.push({ field: 'content', message: 'Note content is required and must be a string' });
  } else if (noteData.content.trim().length < 1) {
    errors.push({ field: 'content', message: 'Note content cannot be empty' });
  } else if (noteData.content.trim().length > 1000) {
    errors.push({ field: 'content', message: 'Note content cannot exceed 1000 characters' });
  }

  // Type validation
  if (noteData.type && !Object.values(NOTE_TYPES).includes(noteData.type)) {
    errors.push({ 
      field: 'type', 
      message: `Note type must be one of: ${Object.values(NOTE_TYPES).join(', ')}` 
    });
  }

  if (errors.length > 0) {
    throw new ValidationError('Note data validation failed', errors);
  }
}

/**
 * Validates complete candidate data
 * @param {Object} candidateData - Complete candidate data
 * @throws {ValidationError} If validation fails
 */
export function validateCandidateData(candidateData) {
  if (!candidateData || typeof candidateData !== 'object') {
    throw new ValidationError('Candidate data is required and must be an object');
  }

  // Validate personal info
  if (candidateData.personalInfo) {
    validatePersonalInfo(candidateData.personalInfo);
  } else {
    // For new candidates, we need at least basic personal info
    validatePersonalInfo({
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      email: candidateData.email,
      phone: candidateData.phone,
      location: candidateData.location
    });
  }

  // Validate professional info if provided
  if (candidateData.professionalInfo) {
    validateProfessionalInfo(candidateData.professionalInfo);
  }

  // Validate pipeline stage if provided
  if (candidateData.currentStage || (candidateData.pipelineInfo && candidateData.pipelineInfo.currentStage)) {
    const stage = candidateData.currentStage || candidateData.pipelineInfo.currentStage;
    validatePipelineStage(stage);
  }
}

/**
 * Normalizes phone number to a consistent format
 * @param {string} phone - Raw phone number
 * @returns {string} Normalized phone number
 */
export function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +1, keep it; if it starts with 1 and has 11 digits, add +
  if (normalized.startsWith('+1')) {
    return normalized;
  } else if (normalized.startsWith('1') && normalized.length === 11) {
    return '+' + normalized;
  } else if (!normalized.startsWith('+') && normalized.length === 10) {
    return '+1' + normalized;
  }
  
  return normalized;
}

/**
 * Sanitizes string input
 * @param {string} input - Raw string input
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validates pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validated pagination parameters
 */
export function validatePaginationParams(params = {}) {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
/**
 * Validates document upload data
 * @param {Object} fileData - File upload data
 * @throws {ValidationError} If validation fails
 */
export function validateDocumentUpload(fileData) {
  const errors = [];

  // Check if fileData exists
  if (!fileData || typeof fileData !== 'object') {
    throw new ValidationError('File data is required and must be an object', 'fileData');
  }

  // Original name validation
  if (!fileData.originalName || typeof fileData.originalName !== 'string') {
    errors.push({ field: 'originalName', message: 'Original filename is required and must be a string' });
  } else if (fileData.originalName.trim().length < 1) {
    errors.push({ field: 'originalName', message: 'Original filename cannot be empty' });
  } else if (fileData.originalName.length > 255) {
    errors.push({ field: 'originalName', message: 'Original filename cannot exceed 255 characters' });
  }

  // MIME type validation
  if (!fileData.mimeType || typeof fileData.mimeType !== 'string') {
    errors.push({ field: 'mimeType', message: 'MIME type is required and must be a string' });
  }

  // Size validation
  if (typeof fileData.size !== 'number' || fileData.size <= 0) {
    errors.push({ field: 'size', message: 'File size must be a positive number' });
  }

  // Buffer validation
  if (!fileData.buffer || !Buffer.isBuffer(fileData.buffer)) {
    errors.push({ field: 'buffer', message: 'File buffer is required and must be a Buffer' });
  } else if (fileData.buffer.length !== fileData.size) {
    errors.push({ field: 'buffer', message: 'Buffer size does not match declared file size' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Document upload validation failed', errors);
  }
}

/**
 * Validates document type
 * @param {string} documentType - Document type
 * @throws {ValidationError} If validation fails
 */
export function validateDocumentType(documentType) {
  if (!documentType || typeof documentType !== 'string') {
    throw new ValidationError('Document type is required and must be a string', 'documentType');
  }

  if (!Object.values(DOCUMENT_TYPES).includes(documentType)) {
    throw new ValidationError(
      `Document type must be one of: ${Object.values(DOCUMENT_TYPES).join(', ')}`,
      'documentType'
    );
  }
}