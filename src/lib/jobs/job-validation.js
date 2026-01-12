/**
 * Job Validation Service
 * Handles input validation and sanitization for job postings
 */

/**
 * Department options (must match frontend form)
 */
export const DEPARTMENTS = ['engineering', 'design', 'marketing', 'product', 'sales'];

/**
 * Employment type options (must match frontend form)
 */
export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship'];

/**
 * Job status options
 */
export const JOB_STATUS = ['active', 'inactive', 'closed'];

/**
 * Validation constants
 */
const VALIDATION_RULES = {
  title: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  department: {
    required: true,
    enum: DEPARTMENTS
  },
  type: {
    required: true,
    enum: EMPLOYMENT_TYPES
  },
  location: {
    minLength: 2,
    maxLength: 100,
    required: true
  },
  salary: {
    maxLength: 50,
    required: false
  },
  description: {
    minLength: 50,
    maxLength: 2000,
    required: true
  },
  requirements: {
    minLength: 50,
    maxLength: 2000,
    required: true
  }
};

/**
 * Validates job posting data
 * @param {Object} jobData - Job data to validate
 * @returns {Object} Validation result with errors array
 */
export function validateJobData(jobData) {
  const errors = [];

  if (!jobData || typeof jobData !== 'object') {
    return {
      isValid: false,
      errors: [{
        field: 'jobData',
        message: 'Job data is required',
        code: 'DATA_REQUIRED'
      }]
    };
  }

  // Validate title
  const titleValidation = validateField('title', jobData.title, VALIDATION_RULES.title);
  if (!titleValidation.isValid) {
    errors.push(...titleValidation.errors);
  }

  // Validate department
  const departmentValidation = validateField('department', jobData.department, VALIDATION_RULES.department);
  if (!departmentValidation.isValid) {
    errors.push(...departmentValidation.errors);
  }

  // Validate employment type
  const typeValidation = validateField('type', jobData.type, VALIDATION_RULES.type);
  if (!typeValidation.isValid) {
    errors.push(...typeValidation.errors);
  }

  // Validate location
  const locationValidation = validateField('location', jobData.location, VALIDATION_RULES.location);
  if (!locationValidation.isValid) {
    errors.push(...locationValidation.errors);
  }

  // Validate salary (optional)
  if (jobData.salary !== undefined && jobData.salary !== null && jobData.salary !== '') {
    const salaryValidation = validateField('salary', jobData.salary, VALIDATION_RULES.salary);
    if (!salaryValidation.isValid) {
      errors.push(...salaryValidation.errors);
    }
  }

  // Validate description
  const descriptionValidation = validateField('description', jobData.description, VALIDATION_RULES.description);
  if (!descriptionValidation.isValid) {
    errors.push(...descriptionValidation.errors);
  }

  // Validate requirements
  const requirementsValidation = validateField('requirements', jobData.requirements, VALIDATION_RULES.requirements);
  if (!requirementsValidation.isValid) {
    errors.push(...requirementsValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a single field against its rules
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @param {Object} rules - Validation rules for the field
 * @returns {Object} Validation result
 */
function validateField(fieldName, value, rules) {
  const errors = [];

  // Check if required field is missing
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push({
      field: fieldName,
      message: `${capitalizeFirst(fieldName)} is required`,
      code: `${fieldName.toUpperCase()}_REQUIRED`
    });
    return { isValid: false, errors };
  }

  // Skip further validation if field is not required and empty
  if (!rules.required && (value === undefined || value === null || value === '')) {
    return { isValid: true, errors: [] };
  }

  // Type validation
  if (typeof value !== 'string') {
    errors.push({
      field: fieldName,
      message: `${capitalizeFirst(fieldName)} must be a string`,
      code: `${fieldName.toUpperCase()}_INVALID_TYPE`
    });
    return { isValid: false, errors };
  }

  const trimmedValue = value.trim();

  // Length validation
  if (rules.minLength && trimmedValue.length < rules.minLength) {
    errors.push({
      field: fieldName,
      message: `${capitalizeFirst(fieldName)} must be at least ${rules.minLength} characters long`,
      code: `${fieldName.toUpperCase()}_TOO_SHORT`
    });
  }

  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    errors.push({
      field: fieldName,
      message: `${capitalizeFirst(fieldName)} must be no more than ${rules.maxLength} characters long`,
      code: `${fieldName.toUpperCase()}_TOO_LONG`
    });
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(trimmedValue)) {
    errors.push({
      field: fieldName,
      message: `${capitalizeFirst(fieldName)} must be one of: ${rules.enum.join(', ')}`,
      code: `${fieldName.toUpperCase()}_INVALID_VALUE`
    });
  }

  // Content validation for text fields
  if (fieldName === 'title' && !isValidTitle(trimmedValue)) {
    errors.push({
      field: fieldName,
      message: 'Job title contains invalid characters',
      code: 'TITLE_INVALID_CHARACTERS'
    });
  }

  if (fieldName === 'location' && !isValidLocation(trimmedValue)) {
    errors.push({
      field: fieldName,
      message: 'Location contains invalid characters',
      code: 'LOCATION_INVALID_CHARACTERS'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates job title format
 * @param {string} title - Title to validate
 * @returns {boolean} True if valid
 */
function isValidTitle(title) {
  // Allow letters, numbers, spaces, hyphens, parentheses, and common punctuation
  const titleRegex = /^[a-zA-Z0-9\s\-\(\)\.\,\/&]+$/;
  return titleRegex.test(title);
}

/**
 * Validates location format
 * @param {string} location - Location to validate
 * @returns {boolean} True if valid
 */
function isValidLocation(location) {
  // Allow letters, numbers, spaces, hyphens, slashes, commas, and parentheses
  const locationRegex = /^[a-zA-Z0-9\s\-\/\,\(\)]+$/;
  return locationRegex.test(location);
}

/**
 * Sanitizes job input data to prevent injection attacks
 * @param {Object} jobData - Raw job data from request
 * @returns {Object} Sanitized job data
 */
export function sanitizeJobInput(jobData) {
  if (!jobData || typeof jobData !== 'object') {
    return {};
  }

  const sanitized = {};

  // Sanitize each field
  if (jobData.title !== undefined) {
    sanitized.title = sanitizeString(jobData.title);
  }

  if (jobData.department !== undefined) {
    sanitized.department = sanitizeString(jobData.department);
  }

  if (jobData.type !== undefined) {
    sanitized.type = sanitizeString(jobData.type);
  }

  if (jobData.location !== undefined) {
    sanitized.location = sanitizeString(jobData.location);
  }

  if (jobData.salary !== undefined && jobData.salary !== null && jobData.salary !== '') {
    sanitized.salary = sanitizeString(jobData.salary);
  }

  if (jobData.description !== undefined) {
    sanitized.description = sanitizeText(jobData.description);
  }

  if (jobData.requirements !== undefined) {
    sanitized.requirements = sanitizeText(jobData.requirements);
  }

  return sanitized;
}

/**
 * Sanitizes a string field
 * @param {any} input - Input to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length for safety
}

/**
 * Sanitizes a text field (allows more characters)
 * @param {any} input - Input to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 5000); // Limit length for safety
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Validates job status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid status
 */
export function isValidJobStatus(status) {
  return JOB_STATUS.includes(status);
}

/**
 * Gets validation rules for a specific field
 * @param {string} fieldName - Name of the field
 * @returns {Object|null} Validation rules or null if field not found
 */
export function getFieldValidationRules(fieldName) {
  return VALIDATION_RULES[fieldName] || null;
}