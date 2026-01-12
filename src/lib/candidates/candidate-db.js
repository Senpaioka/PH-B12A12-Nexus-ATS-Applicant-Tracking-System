/**
 * Candidate Database Operations
 * Handles MongoDB operations for candidate management
 */

import { getCollection } from '../mongodb.js';
import { CANDIDATE_INDEXES } from './candidate-models.js';

/**
 * Collection name for candidates
 */
export const CANDIDATES_COLLECTION = 'candidates';

/**
 * Gets the candidates collection
 * @returns {Promise<Collection>} MongoDB candidates collection
 */
export async function getCandidatesCollection() {
  try {
    return await getCollection(CANDIDATES_COLLECTION);
  } catch (error) {
    console.error('Failed to get candidates collection:', error);
    throw new Error(`Failed to access candidates collection: ${error.message}`);
  }
}

/**
 * Initializes the candidates collection with proper indexes
 * @returns {Promise<void>}
 */
export async function initializeCandidatesCollection() {
  try {
    console.log('Initializing candidates collection...');
    
    const collection = await getCandidatesCollection();
    
    // Create indexes for optimal performance
    for (const indexSpec of CANDIDATE_INDEXES) {
      try {
        await collection.createIndex(indexSpec.key, indexSpec.options || {});
        console.log(`Created index: ${JSON.stringify(indexSpec.key)}`);
      } catch (error) {
        // Index might already exist, log but don't fail
        if (error.code !== 85) { // Index already exists error code
          console.warn(`Failed to create index ${JSON.stringify(indexSpec.key)}:`, error.message);
        }
      }
    }
    
    console.log('Candidates collection initialized successfully');
  } catch (error) {
    console.error('Failed to initialize candidates collection:', error);
    throw new Error(`Failed to initialize candidates collection: ${error.message}`);
  }
}

/**
 * Checks if a candidate with the given email already exists
 * @param {string} email - Email to check
 * @param {string} excludeId - Optional ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if email exists
 */
export async function emailExists(email, excludeId = null) {
  try {
    const collection = await getCandidatesCollection();
    
    const query = { 
      'personalInfo.email': email.toLowerCase().trim(),
      'metadata.isActive': true
    };
    
    // Exclude specific ID if provided (for updates)
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await collection.countDocuments(query);
    return count > 0;
  } catch (error) {
    console.error('Failed to check email existence:', error);
    throw new Error(`Failed to check email existence: ${error.message}`);
  }
}

/**
 * Gets collection statistics
 * @returns {Promise<Object>} Collection statistics
 */
export async function getCandidatesStats() {
  try {
    const collection = await getCandidatesCollection();
    
    const [totalCount, activeCount, stageStats] = await Promise.all([
      collection.countDocuments({}),
      collection.countDocuments({ 'metadata.isActive': true }),
      collection.aggregate([
        { $match: { 'metadata.isActive': true } },
        { $group: { 
          _id: '$pipelineInfo.currentStage', 
          count: { $sum: 1 } 
        }}
      ]).toArray()
    ]);
    
    return {
      total: totalCount,
      active: activeCount,
      byStage: stageStats.reduce((acc, stage) => {
        acc[stage._id] = stage.count;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Failed to get candidates statistics:', error);
    throw new Error(`Failed to get candidates statistics: ${error.message}`);
  }
}

/**
 * Performs database health check for candidates collection
 * @returns {Promise<Object>} Health check results
 */
export async function performHealthCheck() {
  try {
    const collection = await getCandidatesCollection();
    
    // Test basic operations
    const testQuery = await collection.findOne({}, { projection: { _id: 1 } });
    const indexInfo = await collection.indexes();
    
    return {
      status: 'healthy',
      collection: CANDIDATES_COLLECTION,
      indexCount: indexInfo.length,
      canQuery: true,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      collection: CANDIDATES_COLLECTION,
      error: error.message,
      timestamp: new Date()
    };
  }
}