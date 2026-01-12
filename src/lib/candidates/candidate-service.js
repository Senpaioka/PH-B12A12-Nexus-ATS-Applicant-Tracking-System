/**
 * Candidate Service
 * Core business logic for candidate management operations
 */

import { ObjectId } from 'mongodb';
import { getCandidatesCollection, emailExists, initializeCandidatesCollection } from './candidate-db.js';
import { 
  createCandidateDocument, 
  createStageHistoryEntry, 
  createDocumentMetadata, 
  createNoteEntry,
  PIPELINE_STAGES 
} from './candidate-models.js';
import { 
  validateCandidateData, 
  validatePaginationParams, 
  ValidationError,
  normalizePhoneNumber,
  sanitizeString
} from './candidate-validation.js';

/**
 * Service error class
 */
export class CandidateServiceError extends Error {
  constructor(message, code = 'CANDIDATE_SERVICE_ERROR', statusCode = 500) {
    super(message);
    this.name = 'CandidateServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Candidate Service Class
 */
export class CandidateService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the service and database
   */
  async initialize() {
    if (!this.initialized) {
      try {
        await initializeCandidatesCollection();
        this.initialized = true;
        console.log('Candidate service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize candidate service:', error);
        throw new CandidateServiceError(
          'Failed to initialize candidate service',
          'INITIALIZATION_ERROR',
          500
        );
      }
    }
  }

  /**
   * Creates a new candidate
   * @param {Object} candidateData - Candidate data
   * @param {string} userId - ID of user creating the candidate
   * @returns {Promise<Object>} Created candidate
   */
  async createCandidate(candidateData, userId = null) {
    try {
      await this.initialize();

      // Validate input data
      validateCandidateData(candidateData);

      // Check for duplicate email
      const email = candidateData.email || candidateData.personalInfo?.email;
      if (email && await emailExists(email)) {
        throw new CandidateServiceError(
          'A candidate with this email address already exists',
          'DUPLICATE_EMAIL',
          409
        );
      }

      // Normalize and sanitize data
      const normalizedData = this._normalizeData(candidateData);
      normalizedData.createdBy = userId;

      // Create candidate document
      const candidateDoc = createCandidateDocument(normalizedData);
      
      const collection = await getCandidatesCollection();
      const result = await collection.insertOne(candidateDoc);

      if (!result.insertedId) {
        throw new CandidateServiceError(
          'Failed to create candidate',
          'INSERT_FAILED',
          500
        );
      }

      // Return the created candidate
      const createdCandidate = await collection.findOne({ _id: result.insertedId });
      
      console.log(`Created candidate: ${createdCandidate.personalInfo.email}`);
      return createdCandidate;

    } catch (error) {
      if (error instanceof ValidationError) {
        throw new CandidateServiceError(
          error.message,
          'VALIDATION_ERROR',
          400
        );
      }
      if (error instanceof CandidateServiceError) {
        throw error;
      }
      
      console.error('Failed to create candidate:', error);
      throw new CandidateServiceError(
        'Failed to create candidate',
        'CREATE_ERROR',
        500
      );
    }
  }

  /**
   * Gets a candidate by ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object|null>} Candidate or null if not found
   */
  async getCandidateById(candidateId) {
    try {
      await this.initialize();

      if (!ObjectId.isValid(candidateId)) {
        throw new CandidateServiceError(
          'Invalid candidate ID format',
          'INVALID_ID',
          400
        );
      }

      const collection = await getCandidatesCollection();
      const candidate = await collection.findOne({ 
        _id: new ObjectId(candidateId),
        'metadata.isActive': true
      });

      return candidate;

    } catch (error) {
      if (error instanceof CandidateServiceError) {
        throw error;
      }
      
      console.error('Failed to get candidate:', error);
      throw new CandidateServiceError(
        'Failed to retrieve candidate',
        'GET_ERROR',
        500
      );
    }
  }

  /**
   * Updates a candidate
   * @param {string} candidateId - Candidate ID
   * @param {Object} updates - Update data
   * @param {string} userId - ID of user making the update
   * @returns {Promise<Object>} Updated candidate
   */
  async updateCandidate(candidateId, updates, userId = null) {
    try {
      await this.initialize();

      if (!ObjectId.isValid(candidateId)) {
        throw new CandidateServiceError(
          'Invalid candidate ID format',
          'INVALID_ID',
          400
        );
      }

      // Get existing candidate
      const existingCandidate = await this.getCandidateById(candidateId);
      if (!existingCandidate) {
        throw new CandidateServiceError(
          'Candidate not found',
          'NOT_FOUND',
          404
        );
      }

      // Check for email conflicts if email is being updated
      const newEmail = updates.email || updates.personalInfo?.email;
      if (newEmail && newEmail !== existingCandidate.personalInfo.email) {
        if (await emailExists(newEmail, new ObjectId(candidateId))) {
          throw new CandidateServiceError(
            'A candidate with this email address already exists',
            'DUPLICATE_EMAIL',
            409
          );
        }
      }

      // Normalize and sanitize update data
      const normalizedUpdates = this._normalizeUpdateData(updates);
      
      // Build update document
      const updateDoc = {
        $set: {
          'metadata.updatedAt': new Date()
        }
      };

      // Update personal info
      if (normalizedUpdates.personalInfo) {
        Object.keys(normalizedUpdates.personalInfo).forEach(key => {
          updateDoc.$set[`personalInfo.${key}`] = normalizedUpdates.personalInfo[key];
        });
      }

      // Update professional info
      if (normalizedUpdates.professionalInfo) {
        Object.keys(normalizedUpdates.professionalInfo).forEach(key => {
          updateDoc.$set[`professionalInfo.${key}`] = normalizedUpdates.professionalInfo[key];
        });
      }

      // Handle direct field updates (for backward compatibility)
      const directFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'currentRole', 'experience', 'skills', 'appliedForRole', 'source'];
      directFields.forEach(field => {
        if (normalizedUpdates[field] !== undefined) {
          const targetPath = this._getFieldPath(field);
          updateDoc.$set[targetPath] = normalizedUpdates[field];
        }
      });

      const collection = await getCandidatesCollection();
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(candidateId), 'metadata.isActive': true },
        updateDoc,
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new CandidateServiceError(
          'Failed to update candidate',
          'UPDATE_FAILED',
          500
        );
      }

      console.log(`Updated candidate: ${candidateId}`);
      return result;

    } catch (error) {
      if (error instanceof ValidationError) {
        throw new CandidateServiceError(
          error.message,
          'VALIDATION_ERROR',
          400
        );
      }
      if (error instanceof CandidateServiceError) {
        throw error;
      }
      
      console.error('Failed to update candidate:', error);
      throw new CandidateServiceError(
        'Failed to update candidate',
        'UPDATE_ERROR',
        500
      );
    }
  }

  /**
   * Deletes a candidate (soft delete)
   * @param {string} candidateId - Candidate ID
   * @param {string} userId - ID of user deleting the candidate
   * @returns {Promise<boolean>} Success status
   */
  async deleteCandidate(candidateId, userId = null) {
    try {
      await this.initialize();

      if (!ObjectId.isValid(candidateId)) {
        throw new CandidateServiceError(
          'Invalid candidate ID format',
          'INVALID_ID',
          400
        );
      }

      const collection = await getCandidatesCollection();
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(candidateId), 'metadata.isActive': true },
        {
          $set: {
            'metadata.isActive': false,
            'metadata.deletedAt': new Date(),
            'metadata.deletedBy': userId ? new ObjectId(userId) : null
          }
        }
      );

      if (!result) {
        throw new CandidateServiceError(
          'Candidate not found',
          'NOT_FOUND',
          404
        );
      }

      console.log(`Deleted candidate: ${candidateId}`);
      return true;

    } catch (error) {
      if (error instanceof CandidateServiceError) {
        throw error;
      }
      
      console.error('Failed to delete candidate:', error);
      throw new CandidateServiceError(
        'Failed to delete candidate',
        'DELETE_ERROR',
        500
      );
    }
  }

  /**
   * Lists candidates with pagination and filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination parameters
   * @returns {Promise<Object>} Paginated candidates list
   */
  async listCandidates(filters = {}, pagination = {}) {
    try {
      await this.initialize();

      const { page, limit, skip } = validatePaginationParams(pagination);
      
      // Build query
      const query = { 'metadata.isActive': true };
      
      // Apply filters
      if (filters.stage) {
        query['pipelineInfo.currentStage'] = filters.stage;
      }
      
      if (filters.skills && Array.isArray(filters.skills)) {
        query['professionalInfo.skills'] = { $in: filters.skills };
      }
      
      if (filters.location) {
        query['personalInfo.location'] = new RegExp(filters.location, 'i');
      }
      
      if (filters.experience) {
        query['professionalInfo.experience'] = new RegExp(filters.experience, 'i');
      }

      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      const collection = await getCandidatesCollection();
      
      // Get total count and candidates
      const [total, candidates] = await Promise.all([
        collection.countDocuments(query),
        collection
          .find(query)
          .sort({ 'metadata.createdAt': -1 })
          .skip(skip)
          .limit(limit)
          .toArray()
      ]);

      return {
        candidates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('Failed to list candidates:', error);
      throw new CandidateServiceError(
        'Failed to list candidates',
        'LIST_ERROR',
        500
      );
    }
  }

  /**
   * Searches candidates
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @param {Object} pagination - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchCandidates(query, filters = {}, pagination = {}) {
    try {
      const searchFilters = { ...filters, search: query };
      return await this.listCandidates(searchFilters, pagination);
    } catch (error) {
      console.error('Failed to search candidates:', error);
      throw new CandidateServiceError(
        'Failed to search candidates',
        'SEARCH_ERROR',
        500
      );
    }
  }

  /**
   * Normalizes candidate data
   * @private
   */
  _normalizeData(data) {
    const normalized = { ...data };

    // Normalize personal info
    if (normalized.firstName) normalized.firstName = sanitizeString(normalized.firstName);
    if (normalized.lastName) normalized.lastName = sanitizeString(normalized.lastName);
    if (normalized.email) normalized.email = normalized.email.toLowerCase().trim();
    if (normalized.phone) normalized.phone = normalizePhoneNumber(normalized.phone);
    if (normalized.location) normalized.location = sanitizeString(normalized.location);

    // Normalize professional info
    if (normalized.currentRole) normalized.currentRole = sanitizeString(normalized.currentRole);
    if (normalized.experience) normalized.experience = sanitizeString(normalized.experience);
    if (normalized.appliedForRole) normalized.appliedForRole = sanitizeString(normalized.appliedForRole);
    
    if (normalized.skills && Array.isArray(normalized.skills)) {
      normalized.skills = normalized.skills
        .map(skill => sanitizeString(skill))
        .filter(Boolean);
    }

    return normalized;
  }

  /**
   * Normalizes update data
   * @private
   */
  _normalizeUpdateData(updates) {
    const normalized = { ...updates };

    // Handle nested personal info
    if (normalized.personalInfo) {
      Object.keys(normalized.personalInfo).forEach(key => {
        if (key === 'email') {
          normalized.personalInfo[key] = normalized.personalInfo[key].toLowerCase().trim();
        } else if (key === 'phone') {
          normalized.personalInfo[key] = normalizePhoneNumber(normalized.personalInfo[key]);
        } else if (typeof normalized.personalInfo[key] === 'string') {
          normalized.personalInfo[key] = sanitizeString(normalized.personalInfo[key]);
        }
      });
    }

    // Handle nested professional info
    if (normalized.professionalInfo) {
      Object.keys(normalized.professionalInfo).forEach(key => {
        if (key === 'skills' && Array.isArray(normalized.professionalInfo[key])) {
          normalized.professionalInfo[key] = normalized.professionalInfo[key]
            .map(skill => sanitizeString(skill))
            .filter(Boolean);
        } else if (typeof normalized.professionalInfo[key] === 'string') {
          normalized.professionalInfo[key] = sanitizeString(normalized.professionalInfo[key]);
        }
      });
    }

    return this._normalizeData(normalized);
  }

  /**
   * Gets the MongoDB field path for a given field
   * @private
   */
  _getFieldPath(field) {
    const fieldMap = {
      firstName: 'personalInfo.firstName',
      lastName: 'personalInfo.lastName',
      email: 'personalInfo.email',
      phone: 'personalInfo.phone',
      location: 'personalInfo.location',
      currentRole: 'professionalInfo.currentRole',
      experience: 'professionalInfo.experience',
      skills: 'professionalInfo.skills',
      appliedForRole: 'professionalInfo.appliedForRole',
      source: 'professionalInfo.source'
    };
    
    return fieldMap[field] || field;
  }
}

// Export singleton instance
export const candidateService = new CandidateService();