/**
 * Pipeline Service
 * Manages candidate pipeline stage transitions and history
 */

import { ObjectId } from 'mongodb';
import { getCandidatesCollection } from './candidate-db.js';
import { 
  PIPELINE_STAGES, 
  VALID_STAGE_TRANSITIONS, 
  createStageHistoryEntry 
} from './candidate-models.js';
import { 
  validatePipelineStage, 
  validateStageTransition 
} from './candidate-validation.js';

/**
 * Pipeline service error class
 */
export class PipelineServiceError extends Error {
  constructor(message, code = 'PIPELINE_SERVICE_ERROR', statusCode = 500) {
    super(message);
    this.name = 'PipelineServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Pipeline Service Class
 */
export class PipelineService {
  
  /**
   * Updates a candidate's pipeline stage
   * @param {string} candidateId - Candidate ID
   * @param {string} newStage - New pipeline stage
   * @param {string} userId - ID of user making the change
   * @param {string} notes - Optional notes about the stage change
   * @returns {Promise<Object>} Updated candidate
   */
  async updateCandidateStage(candidateId, newStage, userId = null, notes = '') {
    try {
      if (!ObjectId.isValid(candidateId)) {
        throw new PipelineServiceError(
          'Invalid candidate ID format',
          'INVALID_ID',
          400
        );
      }

      // Validate the new stage
      validatePipelineStage(newStage);

      const collection = await getCandidatesCollection();
      
      // Get current candidate
      const candidate = await collection.findOne({ 
        _id: new ObjectId(candidateId),
        'metadata.isActive': true
      });

      if (!candidate) {
        throw new PipelineServiceError(
          'Candidate not found',
          'NOT_FOUND',
          404
        );
      }

      const currentStage = candidate.pipelineInfo.currentStage;

      // Validate stage transition
      validateStageTransition(currentStage, newStage);

      // Create stage history entry
      const historyEntry = createStageHistoryEntry(currentStage, newStage, userId, notes);

      // Update candidate with new stage and history
      const updateDoc = {
        $set: {
          'pipelineInfo.currentStage': newStage,
          'metadata.updatedAt': new Date()
        },
        $push: {
          'pipelineInfo.stageHistory': historyEntry
        }
      };

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(candidateId), 'metadata.isActive': true },
        updateDoc,
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new PipelineServiceError(
          'Failed to update candidate stage',
          'UPDATE_FAILED',
          500
        );
      }

      console.log(`Updated candidate ${candidateId} from ${currentStage} to ${newStage}`);
      return result;

    } catch (error) {
      if (error instanceof PipelineServiceError) {
        throw error;
      }
      
      console.error('Failed to update candidate stage:', error);
      throw new PipelineServiceError(
        'Failed to update candidate stage',
        'STAGE_UPDATE_ERROR',
        500
      );
    }
  }

  /**
   * Gets candidates grouped by pipeline stage
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Candidates grouped by stage
   */
  async getCandidatesByStage(filters = {}) {
    try {
      const collection = await getCandidatesCollection();
      
      // Build base query
      const baseQuery = { 'metadata.isActive': true };
      
      // Apply additional filters
      if (filters.skills && Array.isArray(filters.skills)) {
        baseQuery['professionalInfo.skills'] = { $in: filters.skills };
      }
      
      if (filters.location) {
        baseQuery['personalInfo.location'] = new RegExp(filters.location, 'i');
      }
      
      if (filters.experience) {
        baseQuery['professionalInfo.experience'] = new RegExp(filters.experience, 'i');
      }

      if (filters.search) {
        baseQuery.$text = { $search: filters.search };
      }

      // Aggregate candidates by stage
      const pipeline = [
        { $match: baseQuery },
        {
          $group: {
            _id: '$pipelineInfo.currentStage',
            candidates: { $push: '$$ROOT' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ];

      const results = await collection.aggregate(pipeline).toArray();
      
      // Initialize all stages with empty arrays
      const groupedCandidates = {};
      Object.values(PIPELINE_STAGES).forEach(stage => {
        groupedCandidates[stage] = {
          candidates: [],
          count: 0
        };
      });

      // Populate with actual data
      results.forEach(result => {
        if (result._id && Object.values(PIPELINE_STAGES).includes(result._id)) {
          groupedCandidates[result._id] = {
            candidates: result.candidates,
            count: result.count
          };
        }
      });

      return groupedCandidates;

    } catch (error) {
      console.error('Failed to get candidates by stage:', error);
      throw new PipelineServiceError(
        'Failed to retrieve candidates by stage',
        'STAGE_RETRIEVAL_ERROR',
        500
      );
    }
  }

  /**
   * Gets stage history for a candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array>} Stage history
   */
  async getStageHistory(candidateId) {
    try {
      if (!ObjectId.isValid(candidateId)) {
        throw new PipelineServiceError(
          'Invalid candidate ID format',
          'INVALID_ID',
          400
        );
      }

      const collection = await getCandidatesCollection();
      
      const candidate = await collection.findOne(
        { _id: new ObjectId(candidateId), 'metadata.isActive': true },
        { projection: { 'pipelineInfo.stageHistory': 1 } }
      );

      if (!candidate) {
        throw new PipelineServiceError(
          'Candidate not found',
          'NOT_FOUND',
          404
        );
      }

      return candidate.pipelineInfo.stageHistory || [];

    } catch (error) {
      if (error instanceof PipelineServiceError) {
        throw error;
      }
      
      console.error('Failed to get stage history:', error);
      throw new PipelineServiceError(
        'Failed to retrieve stage history',
        'HISTORY_RETRIEVAL_ERROR',
        500
      );
    }
  }

  /**
   * Validates if a stage transition is allowed
   * @param {string} fromStage - Current stage
   * @param {string} toStage - Target stage
   * @returns {boolean} True if transition is valid
   */
  validateStageTransition(fromStage, toStage) {
    try {
      validateStageTransition(fromStage, toStage);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets valid next stages for a given stage
   * @param {string} currentStage - Current pipeline stage
   * @returns {Array} Array of valid next stages
   */
  getValidNextStages(currentStage) {
    if (!Object.values(PIPELINE_STAGES).includes(currentStage)) {
      return [];
    }
    
    return VALID_STAGE_TRANSITIONS[currentStage] || [];
  }

  /**
   * Gets pipeline statistics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Pipeline statistics
   */
  async getPipelineStats(filters = {}) {
    try {
      const collection = await getCandidatesCollection();
      
      // Build base query
      const baseQuery = { 'metadata.isActive': true };
      
      // Apply filters
      if (filters.dateFrom) {
        baseQuery['pipelineInfo.appliedDate'] = { 
          $gte: new Date(filters.dateFrom) 
        };
      }
      
      if (filters.dateTo) {
        baseQuery['pipelineInfo.appliedDate'] = { 
          ...baseQuery['pipelineInfo.appliedDate'],
          $lte: new Date(filters.dateTo) 
        };
      }

      // Get stage distribution
      const stageStats = await collection.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$pipelineInfo.currentStage',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      // Get conversion rates (candidates who moved beyond Applied stage)
      const conversionStats = await collection.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            beyondApplied: {
              $sum: {
                $cond: [
                  { $ne: ['$pipelineInfo.currentStage', PIPELINE_STAGES.APPLIED] },
                  1,
                  0
                ]
              }
            },
            hired: {
              $sum: {
                $cond: [
                  { $eq: ['$pipelineInfo.currentStage', PIPELINE_STAGES.HIRED] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]).toArray();

      const stats = {
        stageDistribution: {},
        totalCandidates: 0,
        conversionRate: 0,
        hireRate: 0
      };

      // Initialize all stages
      Object.values(PIPELINE_STAGES).forEach(stage => {
        stats.stageDistribution[stage] = 0;
      });

      // Populate stage distribution
      stageStats.forEach(stat => {
        if (stat._id && Object.values(PIPELINE_STAGES).includes(stat._id)) {
          stats.stageDistribution[stat._id] = stat.count;
          stats.totalCandidates += stat.count;
        }
      });

      // Calculate conversion rates
      if (conversionStats.length > 0) {
        const conversion = conversionStats[0];
        stats.totalCandidates = conversion.total;
        stats.conversionRate = conversion.total > 0 
          ? (conversion.beyondApplied / conversion.total) * 100 
          : 0;
        stats.hireRate = conversion.total > 0 
          ? (conversion.hired / conversion.total) * 100 
          : 0;
      }

      return stats;

    } catch (error) {
      console.error('Failed to get pipeline stats:', error);
      throw new PipelineServiceError(
        'Failed to retrieve pipeline statistics',
        'STATS_ERROR',
        500
      );
    }
  }

  /**
   * Bulk updates candidate stages
   * @param {Array} updates - Array of {candidateId, newStage, notes}
   * @param {string} userId - ID of user making the changes
   * @returns {Promise<Object>} Update results
   */
  async bulkUpdateStages(updates, userId = null) {
    try {
      const results = {
        successful: [],
        failed: []
      };

      for (const update of updates) {
        try {
          const result = await this.updateCandidateStage(
            update.candidateId,
            update.newStage,
            userId,
            update.notes || ''
          );
          
          results.successful.push({
            candidateId: update.candidateId,
            newStage: update.newStage,
            result: result
          });
        } catch (error) {
          results.failed.push({
            candidateId: update.candidateId,
            newStage: update.newStage,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Failed to bulk update stages:', error);
      throw new PipelineServiceError(
        'Failed to bulk update candidate stages',
        'BULK_UPDATE_ERROR',
        500
      );
    }
  }
}

// Export singleton instance
export const pipelineService = new PipelineService();