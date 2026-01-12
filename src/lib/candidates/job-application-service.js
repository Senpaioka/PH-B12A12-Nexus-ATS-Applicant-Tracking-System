/**
 * Job Application Integration Service
 * Manages the relationship between candidates and job applications
 */

import { ObjectId } from 'mongodb';
import { getCandidatesCollection } from './candidate-db.js';
import { APPLICATION_SOURCES } from './candidate-models.js';

/**
 * Job application service error class
 */
export class JobApplicationServiceError extends Error {
  constructor(message, code = 'JOB_APPLICATION_SERVICE_ERROR', statusCode = 500) {
    super(message);
    this.name = 'JobApplicationServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Job Application Service Class
 */
export class JobApplicationService {
  
  constructor() {
    // Configuration
    this.maxApplicationsPerCandidate = 50;
  }

  /**
   * Links a candidate to a job application
   * @param {string} candidateId - Candidate ID
   * @param {Object} applicationData - Job application data
   * @returns {Promise<Object>} Updated candidate with job application
   */
  async linkJobApplication(candidateId, applicationData) {
    try {
      // Validate inputs
      if (!ObjectId.isValid(candidateId)) {
        throw new JobApplicationServiceError(
          'Invalid candidate ID format',
          'INVALID_ID',
          400
        );
      }

      if (!ObjectId.isValid(applicationData.jobId)) {
        throw new JobApplicationServiceError(
          'Invalid job ID format',
          'INVALID_JOB_ID',
          400
        );
      }

      // Validate application data
      this.validateApplicationData(applicationData);

      const collection = await getCandidatesCollection();

      // Check if candidate exists and get current applications
      const candidate = await collection.findOne(
        { 
          _id: new ObjectId(candidateId),
          'metadata.isActive': true
        },
        {
          projection: {
            jobApplications: 1
          }
        }
      );

      if (!candidate) {
        throw new JobApplicationServiceError(
          'Candidate not found',
          'CANDIDATE_NOT_FOUND',
          404
        );
      }

      // Check application limit
      const currentApplications = candidate.jobApplications || [];
      if (currentApplications.length >= this.maxApplicationsPerCandidate) {
        throw new JobApplicationServiceError(
          `Candidate has reached maximum applications limit (${this.maxApplicationsPerCandidate})`,
          'APPLICATION_LIMIT_EXCEEDED',
          400
        );
      }

      // Check for duplicate job application
      const existingApplication = currentApplications.find(
        app => app.jobId.toString() === applicationData.jobId
      );

      if (existingApplication) {
        throw new JobApplicationServiceError(
          'Candidate has already applied for this job',
          'DUPLICATE_APPLICATION',
          409
        );
      }

      // Create job application entry
      const jobApplication = {
        _id: new ObjectId(),
        jobId: new ObjectId(applicationData.jobId),
        appliedDate: applicationData.appliedDate ? new Date(applicationData.appliedDate) : new Date(),
        status: applicationData.status || 'active',
        source: applicationData.source || APPLICATION_SOURCES.OTHER,
        notes: applicationData.notes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add job application to candidate
      const result = await collection.findOneAndUpdate(
        { 
          _id: new ObjectId(candidateId),
          'metadata.isActive': true
        },
        {
          $push: {
            jobApplications: jobApplication
          },
          $set: {
            'metadata.updatedAt': new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new JobApplicationServiceError(
          'Failed to link job application',
          'LINK_FAILED',
          500
        );
      }

      console.log(`Job application linked for candidate ${candidateId}: ${applicationData.jobId}`);
      return jobApplication;

    } catch (error) {
      if (error instanceof JobApplicationServiceError) {
        throw error;
      }
      
      console.error('Failed to link job application:', error);
      throw new JobApplicationServiceError(
        'Failed to link job application',
        'LINK_ERROR',
        500
      );
    }
  }

  /**
   * Updates a job application status
   * @param {string} candidateId - Candidate ID
   * @param {string} applicationId - Job application ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated job application
   */
  async updateJobApplication(candidateId, applicationId, updateData) {
    try {
      // Validate inputs
      if (!ObjectId.isValid(candidateId) || !ObjectId.isValid(applicationId)) {
        throw new JobApplicationServiceError(
          'Invalid ID format',
          'INVALID_ID',
          400
        );
      }

      // Validate update data
      this.validateUpdateData(updateData);

      const collection = await getCandidatesCollection();

      // Build update operations
      const updateOps = {
        'jobApplications.$.updatedAt': new Date(),
        'metadata.updatedAt': new Date()
      };

      if (updateData.status) {
        updateOps['jobApplications.$.status'] = updateData.status;
      }

      if (updateData.notes !== undefined) {
        updateOps['jobApplications.$.notes'] = updateData.notes;
      }

      // Update job application
      const result = await collection.findOneAndUpdate(
        { 
          _id: new ObjectId(candidateId),
          'metadata.isActive': true,
          'jobApplications._id': new ObjectId(applicationId)
        },
        {
          $set: updateOps
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new JobApplicationServiceError(
          'Job application not found',
          'APPLICATION_NOT_FOUND',
          404
        );
      }

      // Find and return the updated application
      const updatedApplication = result.jobApplications.find(
        app => app._id.toString() === applicationId
      );

      console.log(`Job application updated for candidate ${candidateId}: ${applicationId}`);
      return updatedApplication;

    } catch (error) {
      if (error instanceof JobApplicationServiceError) {
        throw error;
      }
      
      console.error('Failed to update job application:', error);
      throw new JobApplicationServiceError(
        'Failed to update job application',
        'UPDATE_ERROR',
        500
      );
    }
  }

  /**
   * Removes a job application link
   * @param {string} candidateId - Candidate ID
   * @param {string} applicationId - Job application ID
   * @returns {Promise<boolean>} Success status
   */
  async unlinkJobApplication(candidateId, applicationId) {
    try {
      // Validate inputs
      if (!ObjectId.isValid(candidateId) || !ObjectId.isValid(applicationId)) {
        throw new JobApplicationServiceError(
          'Invalid ID format',
          'INVALID_ID',
          400
        );
      }

      const collection = await getCandidatesCollection();

      // Remove job application
      const result = await collection.findOneAndUpdate(
        { 
          _id: new ObjectId(candidateId),
          'metadata.isActive': true
        },
        {
          $pull: {
            jobApplications: { _id: new ObjectId(applicationId) }
          },
          $set: {
            'metadata.updatedAt': new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new JobApplicationServiceError(
          'Candidate or job application not found',
          'NOT_FOUND',
          404
        );
      }

      console.log(`Job application unlinked for candidate ${candidateId}: ${applicationId}`);
      return true;

    } catch (error) {
      if (error instanceof JobApplicationServiceError) {
        throw error;
      }
      
      console.error('Failed to unlink job application:', error);
      throw new JobApplicationServiceError(
        'Failed to unlink job application',
        'UNLINK_ERROR',
        500
      );
    }
  }

  /**
   * Gets all job applications for a candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array>} Array of job applications
   */
  async getCandidateApplications(candidateId) {
    try {
      if (!ObjectId.isValid(candidateId)) {
        throw new JobApplicationServiceError(
          'Invalid candidate ID format',
          'INVALID_ID',
          400
        );
      }

      const collection = await getCandidatesCollection();
      
      const candidate = await collection.findOne(
        { 
          _id: new ObjectId(candidateId),
          'metadata.isActive': true
        },
        {
          projection: {
            jobApplications: 1
          }
        }
      );

      if (!candidate) {
        throw new JobApplicationServiceError(
          'Candidate not found',
          'CANDIDATE_NOT_FOUND',
          404
        );
      }

      return candidate.jobApplications || [];

    } catch (error) {
      if (error instanceof JobApplicationServiceError) {
        throw error;
      }
      
      console.error('Failed to get candidate applications:', error);
      throw new JobApplicationServiceError(
        'Failed to get candidate applications',
        'GET_ERROR',
        500
      );
    }
  }

  /**
   * Gets candidates who applied for a specific job
   * @param {string} jobId - Job ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of candidates
   */
  async getJobCandidates(jobId, options = {}) {
    try {
      if (!ObjectId.isValid(jobId)) {
        throw new JobApplicationServiceError(
          'Invalid job ID format',
          'INVALID_JOB_ID',
          400
        );
      }

      const collection = await getCandidatesCollection();
      
      const pipeline = [
        // Match candidates with applications for this job
        {
          $match: {
            'metadata.isActive': true,
            'jobApplications.jobId': new ObjectId(jobId)
          }
        },
        // Add application details
        {
          $addFields: {
            relevantApplication: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$jobApplications',
                    cond: { $eq: ['$$this.jobId', new ObjectId(jobId)] }
                  }
                },
                0
              ]
            }
          }
        },
        // Project relevant fields
        {
          $project: {
            personalInfo: 1,
            professionalInfo: 1,
            pipelineInfo: 1,
            'metadata.createdAt': 1,
            'metadata.updatedAt': 1,
            application: '$relevantApplication'
          }
        }
      ];

      // Add sorting
      if (options.sortBy) {
        const sortStage = {};
        const direction = options.sortOrder === 'desc' ? -1 : 1;
        
        switch (options.sortBy) {
          case 'appliedDate':
            sortStage['application.appliedDate'] = direction;
            break;
          case 'name':
            sortStage['personalInfo.firstName'] = direction;
            sortStage['personalInfo.lastName'] = direction;
            break;
          default:
            sortStage['application.appliedDate'] = -1;
        }
        
        pipeline.push({ $sort: sortStage });
      }

      // Add pagination
      if (options.limit) {
        const skip = ((options.page || 1) - 1) * options.limit;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: options.limit });
      }

      const candidates = await collection.aggregate(pipeline).toArray();
      return candidates;

    } catch (error) {
      if (error instanceof JobApplicationServiceError) {
        throw error;
      }
      
      console.error('Failed to get job candidates:', error);
      throw new JobApplicationServiceError(
        'Failed to get job candidates',
        'GET_JOB_CANDIDATES_ERROR',
        500
      );
    }
  }

  /**
   * Gets application statistics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Application statistics
   */
  async getApplicationStats(filters = {}) {
    try {
      const collection = await getCandidatesCollection();
      
      const pipeline = [
        // Match active candidates
        {
          $match: {
            'metadata.isActive': true
          }
        },
        // Unwind job applications
        {
          $unwind: {
            path: '$jobApplications',
            preserveNullAndEmptyArrays: false
          }
        }
      ];

      // Add date filter if provided
      if (filters.dateFrom || filters.dateTo) {
        const dateMatch = {};
        
        if (filters.dateFrom) {
          dateMatch['jobApplications.appliedDate'] = { $gte: new Date(filters.dateFrom) };
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          if (dateMatch['jobApplications.appliedDate']) {
            dateMatch['jobApplications.appliedDate'].$lte = toDate;
          } else {
            dateMatch['jobApplications.appliedDate'] = { $lte: toDate };
          }
        }
        
        pipeline.push({ $match: dateMatch });
      }

      // Aggregate statistics
      pipeline.push({
        $group: {
          _id: null,
          totalApplications: { $sum: 1 },
          uniqueCandidates: { $addToSet: '$_id' },
          uniqueJobs: { $addToSet: '$jobApplications.jobId' },
          statusDistribution: {
            $push: '$jobApplications.status'
          },
          sourceDistribution: {
            $push: '$jobApplications.source'
          },
          avgApplicationsPerCandidate: { $avg: 1 },
          earliestApplication: { $min: '$jobApplications.appliedDate' },
          latestApplication: { $max: '$jobApplications.appliedDate' }
        }
      });

      // Process distributions
      pipeline.push({
        $project: {
          totalApplications: 1,
          uniqueCandidates: { $size: '$uniqueCandidates' },
          uniqueJobs: { $size: '$uniqueJobs' },
          statusDistribution: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: '$statusDistribution' },
                as: 'status',
                in: {
                  k: '$$status',
                  v: {
                    $size: {
                      $filter: {
                        input: '$statusDistribution',
                        cond: { $eq: ['$$this', '$$status'] }
                      }
                    }
                  }
                }
              }
            }
          },
          sourceDistribution: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: '$sourceDistribution' },
                as: 'source',
                in: {
                  k: '$$source',
                  v: {
                    $size: {
                      $filter: {
                        input: '$sourceDistribution',
                        cond: { $eq: ['$$this', '$$source'] }
                      }
                    }
                  }
                }
              }
            }
          },
          avgApplicationsPerCandidate: 1,
          earliestApplication: 1,
          latestApplication: 1
        }
      });

      const result = await collection.aggregate(pipeline).toArray();
      
      if (result.length === 0) {
        return {
          totalApplications: 0,
          uniqueCandidates: 0,
          uniqueJobs: 0,
          statusDistribution: {},
          sourceDistribution: {},
          avgApplicationsPerCandidate: 0,
          earliestApplication: null,
          latestApplication: null
        };
      }

      return result[0];

    } catch (error) {
      console.error('Failed to get application stats:', error);
      throw new JobApplicationServiceError(
        'Failed to get application statistics',
        'STATS_ERROR',
        500
      );
    }
  }

  /**
   * Validates job application data
   * @param {Object} applicationData - Application data to validate
   * @throws {JobApplicationServiceError} If validation fails
   */
  validateApplicationData(applicationData) {
    const errors = [];

    // Job ID validation
    if (!applicationData.jobId) {
      errors.push({ field: 'jobId', message: 'Job ID is required' });
    }

    // Status validation
    if (applicationData.status !== undefined && applicationData.status !== null) {
      const validStatuses = ['active', 'withdrawn', 'rejected', 'hired'];
      if (!validStatuses.includes(applicationData.status)) {
        errors.push({ 
          field: 'status', 
          message: `Status must be one of: ${validStatuses.join(', ')}` 
        });
      }
    }

    // Source validation
    if (applicationData.source !== undefined && applicationData.source !== null && !Object.values(APPLICATION_SOURCES).includes(applicationData.source)) {
      errors.push({ 
        field: 'source', 
        message: `Source must be one of: ${Object.values(APPLICATION_SOURCES).join(', ')}` 
      });
    }

    // Applied date validation
    if (applicationData.appliedDate !== undefined && applicationData.appliedDate !== null) {
      const appliedDate = new Date(applicationData.appliedDate);
      if (isNaN(appliedDate.getTime())) {
        errors.push({ field: 'appliedDate', message: 'Applied date must be a valid date' });
      } else if (appliedDate > new Date()) {
        errors.push({ field: 'appliedDate', message: 'Applied date cannot be in the future' });
      }
    }

    // Notes validation
    if (applicationData.notes !== undefined && applicationData.notes !== null && typeof applicationData.notes !== 'string') {
      errors.push({ field: 'notes', message: 'Notes must be a string' });
    } else if (applicationData.notes && applicationData.notes.length > 1000) {
      errors.push({ field: 'notes', message: 'Notes cannot exceed 1000 characters' });
    }

    if (errors.length > 0) {
      throw new JobApplicationServiceError(
        'Job application validation failed',
        'VALIDATION_ERROR',
        400
      );
    }
  }

  /**
   * Validates update data
   * @param {Object} updateData - Update data to validate
   * @throws {JobApplicationServiceError} If validation fails
   */
  validateUpdateData(updateData) {
    const errors = [];

    // Status validation
    if (updateData.status !== undefined && updateData.status !== null) {
      const validStatuses = ['active', 'withdrawn', 'rejected', 'hired'];
      if (!validStatuses.includes(updateData.status)) {
        errors.push({ 
          field: 'status', 
          message: `Status must be one of: ${validStatuses.join(', ')}` 
        });
      }
    }

    // Notes validation
    if (updateData.notes !== undefined && updateData.notes !== null) {
      if (typeof updateData.notes !== 'string') {
        errors.push({ field: 'notes', message: 'Notes must be a string' });
      } else if (updateData.notes.length > 1000) {
        errors.push({ field: 'notes', message: 'Notes cannot exceed 1000 characters' });
      }
    }

    if (errors.length > 0) {
      throw new JobApplicationServiceError(
        'Update data validation failed',
        'VALIDATION_ERROR',
        400
      );
    }
  }
}

// Export singleton instance
export const jobApplicationService = new JobApplicationService();