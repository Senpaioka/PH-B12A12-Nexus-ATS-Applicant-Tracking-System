/**
 * Job Service
 * Handles job posting operations with validation and MongoDB integration
 */

import { getCollection } from '../mongodb.js';
import { validateJobData, sanitizeJobInput } from './job-validation.js';
import { ensureJobIndexes } from './job-indexes.js';
import { ObjectId } from 'mongodb';

/**
 * Job creation errors
 */
export class JobError extends Error {
  constructor(message, field = null, code = 'JOB_ERROR') {
    super(message);
    this.name = 'JobError';
    this.field = field;
    this.code = code;
  }
}

// Track if indexes have been initialized
let indexesInitialized = false;

/**
 * Gets the jobs collection with proper error handling and index initialization
 * @returns {Promise<Collection>} MongoDB jobs collection
 */
export async function getJobsCollection() {
  try {
    const collection = await getCollection('jobs');
    
    // Ensure indexes are created (only runs once per application lifecycle)
    if (!indexesInitialized) {
      try {
        await ensureJobIndexes();
        indexesInitialized = true;
        console.log('Job collection indexes verified');
      } catch (indexError) {
        console.warn('Failed to ensure job indexes:', indexError.message);
        // Don't fail the operation if index creation fails
      }
    }
    
    return collection;
  } catch (error) {
    console.error('Failed to get jobs collection:', error);
    throw new JobError(
      'Unable to access job database. Please try again.',
      null,
      'DATABASE_ERROR'
    );
  }
}

/**
 * Creates a new job posting with validation and security measures
 * @param {Object} jobData - Job posting data
 * @param {string} userId - ID of the user creating the job
 * @returns {Promise<Object>} Created job object
 */
export async function createJob(jobData, userId) {
  try {
    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      throw new JobError(
        'User authentication required to create job posting',
        null,
        'AUTH_REQUIRED'
      );
    }

    // Sanitize input data
    const sanitizedData = sanitizeJobInput(jobData);
    
    // Validate job data
    const validation = validateJobData(sanitizedData);
    if (!validation.isValid) {
      const firstError = validation.errors[0];
      throw new JobError(firstError.message, firstError.field, firstError.code);
    }

    // Prepare job document
    const now = new Date();
    const jobDocument = {
      title: sanitizedData.title,
      department: sanitizedData.department,
      type: sanitizedData.type,
      location: sanitizedData.location,
      salary: sanitizedData.salary || null,
      description: sanitizedData.description,
      requirements: sanitizedData.requirements,
      createdBy: new ObjectId(userId),
      createdAt: now,
      updatedAt: now,
      status: 'active',
      applicationCount: 0
    };

    // Insert job into database
    const jobsCollection = await getJobsCollection();
    const result = await jobsCollection.insertOne(jobDocument);

    if (!result.insertedId) {
      throw new JobError(
        'Failed to create job posting. Please try again.',
        null,
        'INSERT_FAILED'
      );
    }

    console.log(`New job created: ${sanitizedData.title} by user ${userId}`);

    // Return created job with string ID
    return {
      id: result.insertedId.toString(),
      ...jobDocument,
      createdBy: userId
    };

  } catch (error) {
    if (error instanceof JobError) {
      throw error;
    }

    console.error('Job creation failed:', error);
    throw new JobError(
      'Job creation failed due to a server error. Please try again.',
      null,
      'SERVER_ERROR'
    );
  }
}

/**
 * Retrieves a job by ID
 * @param {string} jobId - Job ID to retrieve
 * @returns {Promise<Object|null>} Job object or null if not found
 */
export async function getJobById(jobId) {
  try {
    if (!jobId || typeof jobId !== 'string') {
      throw new JobError('Job ID is required', 'id', 'ID_REQUIRED');
    }

    if (!ObjectId.isValid(jobId)) {
      throw new JobError('Invalid job ID format', 'id', 'ID_INVALID');
    }

    const jobsCollection = await getJobsCollection();
    const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });

    if (!job) {
      return null;
    }

    // Convert ObjectId to string for API response
    return {
      id: job._id.toString(),
      ...job,
      _id: undefined,
      createdBy: job.createdBy.toString()
    };

  } catch (error) {
    if (error instanceof JobError) {
      throw error;
    }

    console.error('Failed to retrieve job:', error);
    throw new JobError(
      'Unable to retrieve job. Please try again.',
      null,
      'RETRIEVAL_ERROR'
    );
  }
}

/**
 * Gets jobs created by a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, skip, sort)
 * @returns {Promise<Array>} Array of job objects
 */
export async function getJobsByUser(userId, options = {}) {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new JobError('User ID is required', 'userId', 'USER_ID_REQUIRED');
    }

    if (!ObjectId.isValid(userId)) {
      throw new JobError('Invalid user ID format', 'userId', 'USER_ID_INVALID');
    }

    const jobsCollection = await getJobsCollection();
    
    const query = { createdBy: new ObjectId(userId) };
    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;

    const jobs = await jobsCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Convert ObjectIds to strings for API response
    return jobs.map(job => ({
      id: job._id.toString(),
      ...job,
      _id: undefined,
      createdBy: job.createdBy.toString()
    }));

  } catch (error) {
    if (error instanceof JobError) {
      throw error;
    }

    console.error('Failed to retrieve user jobs:', error);
    throw new JobError(
      'Unable to retrieve jobs. Please try again.',
      null,
      'RETRIEVAL_ERROR'
    );
  }
}

/**
 * Formats job error for API response
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error response
 */
export function formatJobError(error) {
  if (error instanceof JobError) {
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
      message: 'Job operation failed. Please try again.',
      code: 'UNKNOWN_ERROR'
    }
  };
}