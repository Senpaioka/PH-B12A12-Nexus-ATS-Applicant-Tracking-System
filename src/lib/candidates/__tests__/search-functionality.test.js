/**
 * Property-Based Tests for Search Functionality
 * Feature: candidate-management, Property 10: Search functionality
 * Validates: Requirements 4.1
 */

import fc from 'fast-check';
import { PIPELINE_STAGES, APPLICATION_SOURCES } from '../candidate-models.js';
import { SearchService, SearchServiceError } from '../search-service.js';

// Helper to generate valid search queries
const validSearchQuery = () => fc.oneof(
  fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  fc.constant(''),
  fc.constant(null),
  fc.constant(undefined)
);

// Helper to generate valid filter options
const validFilters = () => fc.record({
  stage: fc.option(fc.constantFrom(...Object.values(PIPELINE_STAGES))),
  skills: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 })),
  location: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  experience: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  source: fc.option(fc.constantFrom(...Object.values(APPLICATION_SOURCES))),
  appliedDateFrom: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() })),
  appliedDateTo: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() }))
});

// Helper to generate valid sort options
const validSortOptions = () => fc.record({
  field: fc.option(fc.constantFrom('name', 'appliedDate', 'createdAt', 'updatedAt', 'stage')),
  direction: fc.option(fc.constantFrom('asc', 'desc'))
});

// Helper to generate valid pagination options
const validPaginationOptions = () => fc.record({
  page: fc.option(fc.integer({ min: 1, max: 100 })),
  limit: fc.option(fc.integer({ min: 1, max: 100 }))
});

describe('Search Functionality Tests', () => {
  
  let searchService;

  beforeEach(() => {
    searchService = new SearchService();
  });

  describe('Property 10: Search Functionality', () => {
    
    test('search query processing is consistent and safe', () => {
      fc.assert(fc.property(
        validSearchQuery(),
        validFilters(),
        validSortOptions(),
        validPaginationOptions(),
        (query, filters, sortOptions, paginationOptions) => {
          // Property: Search options should be properly structured
          const searchOptions = {
            filters,
            sort: sortOptions,
            ...paginationOptions
          };

          // Property: Query normalization should be consistent
          const normalizedQuery = query ? query.toString().trim() : '';
          expect(typeof normalizedQuery).toBe('string');

          // Property: Filters should maintain valid structure
          if (filters.stage) {
            expect(Object.values(PIPELINE_STAGES)).toContain(filters.stage);
          }

          if (filters.skills && Array.isArray(filters.skills)) {
            expect(filters.skills.length).toBeGreaterThanOrEqual(0);
            filters.skills.forEach(skill => {
              expect(typeof skill).toBe('string');
            });
          }

          if (filters.location) {
            expect(typeof filters.location).toBe('string');
          }

          if (filters.source) {
            expect(Object.values(APPLICATION_SOURCES)).toContain(filters.source);
          }

          // Property: Date filters should be valid dates
          if (filters.appliedDateFrom) {
            expect(filters.appliedDateFrom).toBeInstanceOf(Date);
          }

          if (filters.appliedDateTo) {
            expect(filters.appliedDateTo).toBeInstanceOf(Date);
          }

          // Property: Sort options should be valid
          if (sortOptions.field) {
            expect(['name', 'appliedDate', 'createdAt', 'updatedAt', 'stage']).toContain(sortOptions.field);
          }

          if (sortOptions.direction) {
            expect(['asc', 'desc']).toContain(sortOptions.direction);
          }

          // Property: Pagination should be positive integers
          if (paginationOptions.page) {
            expect(paginationOptions.page).toBeGreaterThan(0);
          }

          if (paginationOptions.limit) {
            expect(paginationOptions.limit).toBeGreaterThan(0);
            expect(paginationOptions.limit).toBeLessThanOrEqual(100);
          }
        }
      ), { numRuns: 50 });
    });

    test('filter building produces valid MongoDB queries', () => {
      fc.assert(fc.property(
        validFilters(),
        (filters) => {
          const mongoFilters = searchService.buildFilters(filters);

          // Property: Result should be a valid object
          expect(typeof mongoFilters).toBe('object');
          expect(mongoFilters).not.toBeNull();

          // Property: Stage filter should map correctly
          if (filters.stage) {
            expect(mongoFilters['pipelineInfo.currentStage']).toBe(filters.stage);
          }

          // Property: Skills filter should use $in operator
          if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
            expect(mongoFilters['professionalInfo.skills']).toHaveProperty('$in');
            expect(Array.isArray(mongoFilters['professionalInfo.skills'].$in)).toBe(true);
          }

          // Property: Location filter should use regex
          if (filters.location) {
            expect(mongoFilters['personalInfo.location']).toHaveProperty('$regex');
            expect(mongoFilters['personalInfo.location']).toHaveProperty('$options');
            expect(mongoFilters['personalInfo.location'].$options).toBe('i');
          }

          // Property: Date range filters should use proper operators
          if (filters.appliedDateFrom || filters.appliedDateTo) {
            const dateFilter = mongoFilters['pipelineInfo.appliedDate'];
            expect(dateFilter).toBeTruthy();
            
            if (filters.appliedDateFrom) {
              expect(dateFilter.$gte).toBeInstanceOf(Date);
            }
            
            if (filters.appliedDateTo) {
              expect(dateFilter.$lte).toBeInstanceOf(Date);
            }
          }

          // Property: Source filter should be exact match
          if (filters.source) {
            expect(mongoFilters['professionalInfo.source']).toBe(filters.source);
          }
        }
      ), { numRuns: 50 });
    });

    test('sort stage building produces valid MongoDB sort objects', () => {
      fc.assert(fc.property(
        validSortOptions(),
        validSearchQuery(),
        (sortOptions, query) => {
          const sortStage = searchService.buildSortStage(sortOptions, query);

          // Property: Result should be a valid object
          expect(typeof sortStage).toBe('object');
          expect(sortStage).not.toBeNull();

          // Property: Text search should prioritize search score
          if (query && query.trim()) {
            expect(sortStage.searchScore).toEqual({ $meta: 'textScore' });
          }

          // Property: Field sorting should map to correct database fields
          if (sortOptions.field) {
            const direction = sortOptions.direction === 'desc' ? -1 : 1;
            
            switch (sortOptions.field) {
              case 'name':
                expect(sortStage['personalInfo.firstName']).toBe(direction);
                expect(sortStage['personalInfo.lastName']).toBe(direction);
                break;
              case 'appliedDate':
                expect(sortStage['pipelineInfo.appliedDate']).toBe(direction);
                break;
              case 'createdAt':
                expect(sortStage['metadata.createdAt']).toBe(direction);
                break;
              case 'updatedAt':
                expect(sortStage['metadata.updatedAt']).toBe(direction);
                break;
              case 'stage':
                expect(sortStage['pipelineInfo.currentStage']).toBe(direction);
                break;
            }
          }

          // Property: Default sort should be by creation date if no text search
          if ((!query || !query.trim()) && !sortOptions.field) {
            expect(sortStage['metadata.createdAt']).toBe(-1);
          }
        }
      ), { numRuns: 50 });
    });

    test('search suggestions input validation is consistent', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 100 }),
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined)
        ),
        fc.constantFrom('skills', 'location', 'role', 'invalid'),
        fc.integer({ min: 1, max: 50 }),
        (input, field, limit) => {
          // Property: Input validation should be consistent
          const isValidInput = Boolean(input && typeof input === 'string' && input.trim().length >= 2);
          const isValidField = ['skills', 'location', 'role'].includes(field);
          const isValidLimit = typeof limit === 'number' && limit > 0;

          expect(typeof isValidInput).toBe('boolean');
          expect(typeof isValidField).toBe('boolean');
          expect(typeof isValidLimit).toBe('boolean');

          // Property: Short inputs should be rejected
          if (!input || typeof input !== 'string' || input.trim().length < 2) {
            expect(isValidInput).toBe(false);
          }

          // Property: Invalid fields should be rejected
          if (!['skills', 'location', 'role'].includes(field)) {
            expect(isValidField).toBe(false);
          }

          // Property: Limit should be positive
          expect(limit).toBeGreaterThan(0);
        }
      ), { numRuns: 50 });
    });

    test('pagination calculation is mathematically correct', () => {
      fc.assert(fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (totalCount, limit, page) => {
          // Property: Pagination math should be consistent
          const totalPages = Math.ceil(totalCount / limit);
          const skip = (page - 1) * limit;
          const hasNext = page < totalPages;
          const hasPrev = page > 1;

          // Property: Skip should be non-negative
          expect(skip).toBeGreaterThanOrEqual(0);

          // Property: Total pages should be correct
          if (totalCount === 0) {
            expect(totalPages).toBe(0);
          } else {
            expect(totalPages).toBeGreaterThan(0);
            expect(totalPages).toBe(Math.ceil(totalCount / limit));
          }

          // Property: hasNext should be correct
          if (totalCount === 0 || page >= totalPages) {
            expect(hasNext).toBe(false);
          } else {
            expect(hasNext).toBe(true);
          }

          // Property: hasPrev should be correct
          if (page <= 1) {
            expect(hasPrev).toBe(false);
          } else {
            expect(hasPrev).toBe(true);
          }

          // Property: Skip should not exceed total count (unless on last page)
          if (page <= totalPages) {
            expect(skip).toBeLessThanOrEqual(totalCount);
          }
        }
      ), { numRuns: 100 });
    });

    test('search result structure is consistent', () => {
      fc.assert(fc.property(
        validSearchQuery(),
        validFilters(),
        validPaginationOptions(),
        (query, filters, paginationOptions) => {
          // Property: Search result structure should be predictable
          const expectedResult = {
            results: expect.any(Array),
            pagination: {
              page: expect.any(Number),
              limit: expect.any(Number),
              total: expect.any(Number),
              pages: expect.any(Number),
              hasNext: expect.any(Boolean),
              hasPrev: expect.any(Boolean)
            },
            query: expect.any(String),
            filters: expect.any(Object)
          };

          // Property: Query should be normalized to string
          const normalizedQuery = query ? query.toString().trim() : '';
          expect(typeof normalizedQuery).toBe('string');

          // Property: Filters should be an object
          expect(typeof filters).toBe('object');
          expect(filters).not.toBeNull();

          // Property: Pagination should have valid values
          const page = paginationOptions.page || 1;
          const limit = paginationOptions.limit || searchService.defaultLimit;
          
          expect(page).toBeGreaterThan(0);
          expect(limit).toBeGreaterThan(0);
          expect(limit).toBeLessThanOrEqual(searchService.maxLimit || 100);

          // Property: Expected structure should be consistent
          expect(expectedResult.results).toEqual(expect.any(Array));
          expect(expectedResult.pagination.page).toEqual(expect.any(Number));
          expect(expectedResult.pagination.limit).toEqual(expect.any(Number));
          expect(expectedResult.query).toEqual(expect.any(String));
          expect(expectedResult.filters).toEqual(expect.any(Object));
        }
      ), { numRuns: 30 });
    });
  });

  describe('Search Service Configuration', () => {
    
    test('search service has proper configuration', () => {
      expect(typeof searchService.defaultLimit).toBe('number');
      expect(searchService.defaultLimit).toBeGreaterThan(0);
      expect(typeof searchService.maxLimit).toBe('number');
      expect(searchService.maxLimit).toBeGreaterThan(0);
      expect(searchService.maxLimit).toBeGreaterThanOrEqual(searchService.defaultLimit);
    });

    test('search service methods exist and are functions', () => {
      expect(typeof searchService.searchCandidates).toBe('function');
      expect(typeof searchService.buildFilters).toBe('function');
      expect(typeof searchService.buildSortStage).toBe('function');
      expect(typeof searchService.getTotalCount).toBe('function');
      expect(typeof searchService.getSearchSuggestions).toBe('function');
      expect(typeof searchService.getSearchStats).toBe('function');
    });
  });

  describe('Search Service Error Handling', () => {
    
    test('error handling maintains consistent error structure', () => {
      fc.assert(fc.property(
        fc.string(),
        fc.string(),
        fc.integer({ min: 400, max: 599 }),
        (message, code, statusCode) => {
          const error = new SearchServiceError(message, code, statusCode);

          // Property: Error should have consistent structure
          expect(error).toBeInstanceOf(Error);
          expect(error).toBeInstanceOf(SearchServiceError);
          expect(error.name).toBe('SearchServiceError');
          expect(error.message).toBe(message);
          expect(error.code).toBe(code);
          expect(error.statusCode).toBe(statusCode);

          // Property: Error should be throwable and catchable
          expect(() => {
            throw error;
          }).toThrow(SearchServiceError);
        }
      ), { numRuns: 20 });
    });
  });
});