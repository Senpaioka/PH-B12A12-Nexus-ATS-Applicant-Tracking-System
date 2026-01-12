/**
 * Search Engine Service
 * Provides full-text search and filtering capabilities for candidates
 */

import { ObjectId } from 'mongodb';
import { getCandidatesCollection } from './candidate-db.js';
import { PIPELINE_STAGES } from './candidate-models.js';
import { validatePaginationParams } from './candidate-validation.js';

/**
 * Search service error class
 */
export class SearchServiceError extends Error {
  constructor(message, code = 'SEARCH_SERVICE_ERROR', statusCode = 500) {
    super(message);
    this.name = 'SearchServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Search Service Class
 */
export class SearchService {
  
  constructor() {
    this.defaultLimit = 20;
    this.maxLimit = 100;
  }

  /**
   * Performs full-text search on candidates
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results with pagination
   */
  async searchCandidates(query, options = {}) {
    try {
      const collection = await getCandidatesCollection();
      
      // Validate pagination parameters
      const { page, limit, skip } = validatePaginationParams({
        page: options.page,
        limit: options.limit || this.defaultLimit
      });

      // Build search pipeline
      const pipeline = [];

      // Match active candidates only
      pipeline.push({
        $match: {
          'metadata.isActive': true
        }
      });

      // Add text search if query provided
      if (query && query.trim()) {
        pipeline.unshift({
          $match: {
            $text: { 
              $search: query.trim(),
              $caseSensitive: false
            }
          }
        });

        // Add text score for ranking
        pipeline.push({
          $addFields: {
            searchScore: { $meta: 'textScore' }
          }
        });
      }

      // Apply filters
      const filters = this.buildFilters(options.filters || {});
      if (Object.keys(filters).length > 0) {
        pipeline.push({
          $match: filters
        });
      }

      // Add sorting
      const sortStage = this.buildSortStage(options.sort, query);
      pipeline.push({ $sort: sortStage });

      // Add pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Project fields for response
      pipeline.push({
        $project: {
          personalInfo: 1,
          professionalInfo: 1,
          pipelineInfo: 1,
          'metadata.createdAt': 1,
          'metadata.updatedAt': 1,
          searchScore: query ? 1 : 0
        }
      });

      // Execute search
      const results = await collection.aggregate(pipeline).toArray();

      // Get total count for pagination
      const totalCount = await this.getTotalCount(query, options.filters || {});

      return {
        results,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        query: query || '',
        filters: options.filters || {}
      };

    } catch (error) {
      console.error('Search error:', error);
      throw new SearchServiceError(
        'Failed to search candidates',
        'SEARCH_ERROR',
        500
      );
    }
  }

  /**
   * Builds MongoDB filters from search options
   * @param {Object} filters - Filter options
   * @returns {Object} MongoDB filter object
   */
  buildFilters(filters) {
    const mongoFilters = {};

    // Stage filter
    if (filters.stage && Object.values(PIPELINE_STAGES).includes(filters.stage)) {
      mongoFilters['pipelineInfo.currentStage'] = filters.stage;
    }

    // Skills filter (array contains any of the specified skills)
    if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
      mongoFilters['professionalInfo.skills'] = {
        $in: filters.skills.map(skill => {
          // Escape regex special characters
          const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(escapedSkill, 'i');
        })
      };
    }

    // Location filter (case-insensitive partial match)
    if (filters.location && typeof filters.location === 'string') {
      const escapedLocation = filters.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      mongoFilters['personalInfo.location'] = {
        $regex: escapedLocation,
        $options: 'i'
      };
    }

    // Experience filter (partial match)
    if (filters.experience && typeof filters.experience === 'string') {
      const escapedExperience = filters.experience.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      mongoFilters['professionalInfo.experience'] = {
        $regex: escapedExperience,
        $options: 'i'
      };
    }

    // Applied date range filter
    if (filters.appliedDateFrom || filters.appliedDateTo) {
      const dateFilter = {};
      
      if (filters.appliedDateFrom) {
        dateFilter.$gte = new Date(filters.appliedDateFrom);
      }
      
      if (filters.appliedDateTo) {
        dateFilter.$lte = new Date(filters.appliedDateTo);
      }
      
      mongoFilters['pipelineInfo.appliedDate'] = dateFilter;
    }

    // Source filter
    if (filters.source && typeof filters.source === 'string') {
      mongoFilters['professionalInfo.source'] = filters.source;
    }

    return mongoFilters;
  }

  /**
   * Builds sort stage for aggregation pipeline
   * @param {Object} sortOptions - Sort options
   * @param {string} query - Search query (for text score sorting)
   * @returns {Object} MongoDB sort object
   */
  buildSortStage(sortOptions = {}, query = '') {
    const sort = {};

    // If text search, prioritize by text score
    if (query && query.trim()) {
      sort.searchScore = { $meta: 'textScore' };
    }

    // Apply custom sorting
    if (sortOptions.field) {
      const direction = sortOptions.direction === 'desc' ? -1 : 1;
      
      switch (sortOptions.field) {
        case 'name':
          sort['personalInfo.firstName'] = direction;
          sort['personalInfo.lastName'] = direction;
          break;
        case 'appliedDate':
          sort['pipelineInfo.appliedDate'] = direction;
          break;
        case 'createdAt':
          sort['metadata.createdAt'] = direction;
          break;
        case 'updatedAt':
          sort['metadata.updatedAt'] = direction;
          break;
        case 'stage':
          sort['pipelineInfo.currentStage'] = direction;
          break;
        default:
          // Default to creation date
          sort['metadata.createdAt'] = -1;
      }
    } else {
      // Default sorting
      if (!query || !query.trim()) {
        sort['metadata.createdAt'] = -1;
      }
    }

    return sort;
  }

  /**
   * Gets total count of matching candidates for pagination
   * @param {string} query - Search query
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Total count
   */
  async getTotalCount(query, filters) {
    try {
      const collection = await getCandidatesCollection();
      
      const pipeline = [];

      // Match active candidates
      pipeline.push({
        $match: {
          'metadata.isActive': true
        }
      });

      // Add text search if query provided
      if (query && query.trim()) {
        pipeline.unshift({
          $match: {
            $text: { 
              $search: query.trim(),
              $caseSensitive: false
            }
          }
        });
      }

      // Apply filters
      const mongoFilters = this.buildFilters(filters);
      if (Object.keys(mongoFilters).length > 0) {
        pipeline.push({
          $match: mongoFilters
        });
      }

      // Count documents
      pipeline.push({
        $count: 'total'
      });

      const result = await collection.aggregate(pipeline).toArray();
      return result.length > 0 ? result[0].total : 0;

    } catch (error) {
      console.error('Count error:', error);
      return 0;
    }
  }

  /**
   * Gets search suggestions based on partial input
   * @param {string} input - Partial input
   * @param {string} field - Field to search for suggestions
   * @param {number} limit - Maximum suggestions to return
   * @returns {Promise<Array>} Array of suggestions
   */
  async getSearchSuggestions(input, field = 'skills', limit = 10) {
    try {
      if (!input || input.trim().length < 2) {
        return [];
      }

      const collection = await getCandidatesCollection();
      const pipeline = [];

      // Match active candidates
      pipeline.push({
        $match: {
          'metadata.isActive': true
        }
      });

      // Unwind and match based on field
      switch (field) {
        case 'skills':
          pipeline.push(
            { $unwind: '$professionalInfo.skills' },
            {
              $match: {
                'professionalInfo.skills': {
                  $regex: input.trim(),
                  $options: 'i'
                }
              }
            },
            {
              $group: {
                _id: '$professionalInfo.skills',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1, _id: 1 } }
          );
          break;

        case 'location':
          pipeline.push(
            {
              $match: {
                'personalInfo.location': {
                  $regex: input.trim(),
                  $options: 'i'
                }
              }
            },
            {
              $group: {
                _id: '$personalInfo.location',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1, _id: 1 } }
          );
          break;

        case 'role':
          pipeline.push(
            {
              $match: {
                $or: [
                  {
                    'professionalInfo.currentRole': {
                      $regex: input.trim(),
                      $options: 'i'
                    }
                  },
                  {
                    'professionalInfo.appliedForRole': {
                      $regex: input.trim(),
                      $options: 'i'
                    }
                  }
                ]
              }
            },
            {
              $project: {
                roles: [
                  '$professionalInfo.currentRole',
                  '$professionalInfo.appliedForRole'
                ]
              }
            },
            { $unwind: '$roles' },
            {
              $match: {
                roles: {
                  $regex: input.trim(),
                  $options: 'i'
                }
              }
            },
            {
              $group: {
                _id: '$roles',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1, _id: 1 } }
          );
          break;

        default:
          return [];
      }

      // Limit results
      pipeline.push({ $limit: limit });

      // Project final result
      pipeline.push({
        $project: {
          suggestion: '$_id',
          count: 1,
          _id: 0
        }
      });

      const results = await collection.aggregate(pipeline).toArray();
      return results.map(r => r.suggestion).filter(Boolean);

    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  /**
   * Gets aggregated statistics for search results
   * @param {string} query - Search query
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Search statistics
   */
  async getSearchStats(query, filters = {}) {
    try {
      const collection = await getCandidatesCollection();
      
      const pipeline = [];

      // Match active candidates
      pipeline.push({
        $match: {
          'metadata.isActive': true
        }
      });

      // Add text search if query provided
      if (query && query.trim()) {
        pipeline.unshift({
          $match: {
            $text: { 
              $search: query.trim(),
              $caseSensitive: false
            }
          }
        });
      }

      // Apply filters
      const mongoFilters = this.buildFilters(filters);
      if (Object.keys(mongoFilters).length > 0) {
        pipeline.push({
          $match: mongoFilters
        });
      }

      // Aggregate statistics
      pipeline.push({
        $group: {
          _id: null,
          totalCandidates: { $sum: 1 },
          stageDistribution: {
            $push: '$pipelineInfo.currentStage'
          },
          sourceDistribution: {
            $push: '$professionalInfo.source'
          },
          avgApplicationsPerDay: {
            $avg: {
              $divide: [
                { $subtract: [new Date(), '$pipelineInfo.appliedDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      });

      // Process distributions
      pipeline.push({
        $project: {
          totalCandidates: 1,
          stageDistribution: {
            $arrayToObject: {
              $map: {
                input: {
                  $setUnion: '$stageDistribution'
                },
                as: 'stage',
                in: {
                  k: '$$stage',
                  v: {
                    $size: {
                      $filter: {
                        input: '$stageDistribution',
                        cond: { $eq: ['$$this', '$$stage'] }
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
                input: {
                  $setUnion: '$sourceDistribution'
                },
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
          avgApplicationsPerDay: 1
        }
      });

      const result = await collection.aggregate(pipeline).toArray();
      
      if (result.length === 0) {
        return {
          totalCandidates: 0,
          stageDistribution: {},
          sourceDistribution: {},
          avgApplicationsPerDay: 0
        };
      }

      return result[0];

    } catch (error) {
      console.error('Search stats error:', error);
      throw new SearchServiceError(
        'Failed to get search statistics',
        'STATS_ERROR',
        500
      );
    }
  }
}

// Export singleton instance
export const searchService = new SearchService();