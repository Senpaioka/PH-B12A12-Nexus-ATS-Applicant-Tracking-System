/**
 * Application Service
 * Handles job application operations with validation and MongoDB integration
 */

import { getCollection } from '../mongodb.js';
import { validateApplicationData, sanitizeApplicationInput, APPLICATION_STATUSES } from './application-validation.js';
import { ObjectId } from 'mongodb';

/**
 * Application creation errors
 */
export class ApplicationError extends Error {
  constructor(message, field = null, code = 'APPLICATION_ERROR') {
    super(message);
    this.name = 'ApplicationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * Gets the applications collection with proper error handling
 * @returns {Promise<Collection>} MongoDB applications collection
 */
export async function getApplicationsCollection() {
  try {
    return await getCollection('applications');
  } catch (error) {
    console.error('Failed to get applications collection:', error);
    throw new ApplicationError(
      'Unable to access applications database. Please try again.',
      null,
      'DATABASE_ERROR'
    );
  }
}

/**
 * Creates a new job application
 * @param {Object} applicationData - Application data
 * @param {string} jobId - ID of the job being applied to
 * @param {string} userId - ID of the user applying
 * @returns {Promise<Object>} Created application object
 */
export async function createApplication(applicationData, jobId, userId) {
  try {
    // Validate inputs
    if (!jobId || typeof jobId !== 'string') {
      throw new ApplicationError(
        'Job ID is required',
        'jobId',
        'JOB_ID_REQUIRED'
      );
    }

    if (!ObjectId.isValid(jobId)) {
      throw new ApplicationError(
        'Invalid job ID format',
        'jobId',
        'JOB_ID_INVALID'
      );
    }

    if (!userId || typeof userId !== 'string') {
      throw new ApplicationError(
        'User authentication required to apply for jobs',
        null,
        'AUTH_REQUIRED'
      );
    }

    // Check if user already applied for this job
    const applicationsCollection = await getApplicationsCollection();
    const existingApplication = await applicationsCollection.findOne({
      jobId: new ObjectId(jobId),
      applicantId: new ObjectId(userId)
    });

    if (existingApplication) {
      throw new ApplicationError(
        'You have already applied for this job',
        null,
        'ALREADY_APPLIED'
      );
    }

    // Sanitize input data
    const sanitizedData = sanitizeApplicationInput(applicationData);
    
    // Validate application data
    const validation = validateApplicationData(sanitizedData);
    if (!validation.isValid) {
      const firstError = validation.errors[0];
      throw new ApplicationError(firstError.message, firstError.field, firstError.code);
    }

    // Prepare application document
    const now = new Date();
    const applicationDocument = {
      jobId: new ObjectId(jobId),
      applicantId: new ObjectId(userId),
      coverLetter: sanitizedData.coverLetter,
      resumeUrl: sanitizedData.resumeUrl || null,
      phone: sanitizedData.phone || null,
      linkedinUrl: sanitizedData.linkedinUrl || null,
      status: APPLICATION_STATUSES.APPLIED,
      appliedAt: now,
      updatedAt: now
    };

    // Insert application into database
    const result = await applicationsCollection.insertOne(applicationDocument);

    if (!result.insertedId) {
      throw new ApplicationError(
        'Failed to submit application. Please try again.',
        null,
        'INSERT_FAILED'
      );
    }

    console.log(`New application submitted: Job ${jobId} by user ${userId}`);

    // Update job application count
    try {
      const jobsCollection = await getCollection('jobs');
      await jobsCollection.updateOne(
        { _id: new ObjectId(jobId) },
        { $inc: { applicationCount: 1 } }
      );
    } catch (updateError) {
      console.warn('Failed to update job application count:', updateError);
      // Don't fail the application if count update fails
    }

    // Return created application with string ID
    return {
      id: result.insertedId.toString(),
      ...applicationDocument,
      jobId: jobId,
      applicantId: userId
    };

  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }

    console.error('Application creation failed:', error);
    throw new ApplicationError(
      'Application submission failed due to a server error. Please try again.',
      null,
      'SERVER_ERROR'
    );
  }
}

/**
 * Gets applications for a specific job
 * @param {string} jobId - Job ID
 * @param {Object} options - Query options (limit, skip, sort)
 * @returns {Promise<Array>} Array of application objects
 */
export async function getApplicationsByJob(jobId, options = {}) {
  try {
    if (!jobId || typeof jobId !== 'string') {
      throw new ApplicationError('Job ID is required', 'jobId', 'JOB_ID_REQUIRED');
    }

    if (!ObjectId.isValid(jobId)) {
      throw new ApplicationError('Invalid job ID format', 'jobId', 'JOB_ID_INVALID');
    }

    const applicationsCollection = await getApplicationsCollection();
    
    const query = { jobId: new ObjectId(jobId) };
    const { limit = 50, skip = 0, sort = { appliedAt: -1 } } = options;

    const applications = await applicationsCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Convert ObjectIds to strings for API response
    return applications.map(app => ({
      id: app._id.toString(),
      ...app,
      _id: undefined,
      jobId: app.jobId.toString(),
      applicantId: app.applicantId.toString()
    }));

  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }

    console.error('Failed to retrieve job applications:', error);
    throw new ApplicationError(
      'Unable to retrieve applications. Please try again.',
      null,
      'RETRIEVAL_ERROR'
    );
  }
}

/**
 * Gets applications by a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, skip, sort)
 * @returns {Promise<Array>} Array of application objects
 */
export async function getApplicationsByUser(userId, options = {}) {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new ApplicationError('User ID is required', 'userId', 'USER_ID_REQUIRED');
    }

    if (!ObjectId.isValid(userId)) {
      throw new ApplicationError('Invalid user ID format', 'userId', 'USER_ID_INVALID');
    }

    const applicationsCollection = await getApplicationsCollection();
    
    const query = { applicantId: new ObjectId(userId) };
    const { limit = 50, skip = 0, sort = { appliedAt: -1 } } = options;

    const applications = await applicationsCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Convert ObjectIds to strings for API response
    return applications.map(app => ({
      id: app._id.toString(),
      ...app,
      _id: undefined,
      jobId: app.jobId.toString(),
      applicantId: app.applicantId.toString()
    }));

  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }

    console.error('Failed to retrieve user applications:', error);
    throw new ApplicationError(
      'Unable to retrieve applications. Please try again.',
      null,
      'RETRIEVAL_ERROR'
    );
  }
}

/**
 * Formats application error for API response
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error response
 */
export function formatApplicationError(error) {
  if (error instanceof ApplicationError) {
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
      message: 'Application operation failed. Please try again.',
      code: 'UNKNOWN_ERROR'
    }
  };
}