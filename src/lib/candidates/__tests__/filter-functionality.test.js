/**
 * Property-Based Tests for Filter Functionality
 * Feature: candidate-management, Property 11: Filter functionality
 * Validates: Requirements 4.2, 4.3
 */

import fc from 'fast-check';
import { PIPELINE_STAGES, APPLICATION_SOURCES } from '../candidate-models.js';
import { SearchService } from '../search-service.js';

// Helper to generate complex filter combinations
const complexFilters = () => fc.record({
  stage: fc.option(fc.constantFrom(...Object.values(PIPELINE_STAGES))),
  skills: fc.option(fc.array(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
    { minLength: 1, maxLength: 10 }
  )),
  location: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)),
  experience: fc.option(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0)),
  source: fc.option(fc.constantFrom(...Object.values(APPLICATION_SOURCES))),
  appliedDateFrom: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2023-12-31') })),
  appliedDateTo: fc.option(fc.date({ min: new Date('2021-01-01'), max: new Date() }))
});

// Helper to generate candidate-like data for filtering tests
const candidateData = () => fc.record({
  personalInfo: fc.record({
    firstName: fc.string({ minLength: 1, maxLength: 50 }),
    lastName: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.emailAddress(),
    location: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
  }),
  professionalInfo: fc.record({
    skills: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 15 }),
    experience: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
    source: fc.constantFrom(...Object.values(APPLICATION_SOURCES))
  }),
  pipelineInfo: fc.record({
    currentStage: fc.constantFrom(...Object.values(PIPELINE_STAGES)),
    appliedDate: fc.date({ min: new Date('2020-01-01'), max: new Date() })
  }),
  metadata: fc.record({
    isActive: fc.constant(true),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
  })
});

describe('Filter Functionality Tests', () => {
  
  let searchService;

  beforeEach(() => {
    searchService = new SearchService();
  });

  describe('Property 11: Filter Functionality', () => {
    
    test('stage filtering produces correct MongoDB queries', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.values(PIPELINE_STAGES)),
        (stage) => {
          const filters = { stage };
          const mongoFilters = searchService.buildFilters(filters);

          // Property: Stage filter should map to correct field
          expect(mongoFilters['pipelineInfo.currentStage']).toBe(stage);

          // Property: Only valid stages should be accepted
          expect(Object.values(PIPELINE_STAGES)).toContain(stage);

          // Property: Filter should be exact match
          expect(typeof mongoFilters['pipelineInfo.currentStage']).toBe('string');
        }
      ), { numRuns: 20 });
    });

    test('skills filtering handles arrays correctly', () => {
      fc.assert(fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        (skills) => {
          const filters = { skills };
          const mongoFilters = searchService.buildFilters(filters);

          // Property: Skills filter should use $in operator with regex
          expect(mongoFilters['professionalInfo.skills']).toBeTruthy();
          expect(mongoFilters['professionalInfo.skills'].$in).toBeTruthy();
          
          const regexArray = mongoFilters['professionalInfo.skills'].$in;
          expect(Array.isArray(regexArray)).toBe(true);
          expect(regexArray.length).toBe(skills.length);

          // Property: Each skill should be converted to case-insensitive regex
          regexArray.forEach((regex, index) => {
            expect(regex).toBeInstanceOf(RegExp);
            expect(regex.flags).toContain('i');
          });
        }
      ), { numRuns: 30 });
    });

    test('location filtering uses case-insensitive partial matching', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (location) => {
          const filters = { location };
          const mongoFilters = searchService.buildFilters(filters);

          // Property: Location filter should use regex for partial matching
          expect(mongoFilters['personalInfo.location']).toBeTruthy();
          expect(mongoFilters['personalInfo.location'].$regex).toBeTruthy();
          expect(mongoFilters['personalInfo.location'].$options).toBeTruthy();

          // Property: Should be case-insensitive
          expect(mongoFilters['personalInfo.location'].$options).toBe('i');
        }
      ), { numRuns: 25 });
    });

    test('date range filtering handles various date combinations', () => {
      fc.assert(fc.property(
        fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2023-06-01') })),
        fc.option(fc.date({ min: new Date('2023-06-01'), max: new Date() })),
        (dateFrom, dateTo) => {
          const filters = {};
          if (dateFrom) filters.appliedDateFrom = dateFrom;
          if (dateTo) filters.appliedDateTo = dateTo;

          const mongoFilters = searchService.buildFilters(filters);

          if (dateFrom || dateTo) {
            // Property: Date filter should exist when dates provided
            expect(mongoFilters['pipelineInfo.appliedDate']).toBeTruthy();
            
            const dateFilter = mongoFilters['pipelineInfo.appliedDate'];
            expect(typeof dateFilter).toBe('object');

            // Property: From date should use $gte operator
            if (dateFrom) {
              expect(dateFilter.$gte).toBeInstanceOf(Date);
              expect(dateFilter.$gte.getTime()).toBe(dateFrom.getTime());
            }

            // Property: To date should use $lte operator
            if (dateTo) {
              expect(dateFilter.$lte).toBeInstanceOf(Date);
              expect(dateFilter.$lte.getTime()).toBe(dateTo.getTime());
            }
          } else {
            // Property: No date filter when no dates provided
            expect(mongoFilters['pipelineInfo.appliedDate']).toBeFalsy();
          }
        }
      ), { numRuns: 40 });
    });

    test('source filtering uses exact matching', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.values(APPLICATION_SOURCES)),
        (source) => {
          const filters = { source };
          const mongoFilters = searchService.buildFilters(filters);

          // Property: Source filter should be exact match
          expect(mongoFilters['professionalInfo.source']).toBe(source);

          // Property: Only valid sources should be accepted
          expect(Object.values(APPLICATION_SOURCES)).toContain(source);
        }
      ), { numRuns: 15 });
    });

    test('experience filtering uses case-insensitive partial matching', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (experience) => {
          const filters = { experience };
          const mongoFilters = searchService.buildFilters(filters);

          // Property: Experience filter should use regex
          expect(mongoFilters['professionalInfo.experience']).toBeTruthy();
          expect(mongoFilters['professionalInfo.experience'].$regex).toBeTruthy();
          expect(mongoFilters['professionalInfo.experience'].$options).toBeTruthy();

          // Property: Should be case-insensitive
          expect(mongoFilters['professionalInfo.experience'].$options).toBe('i');
        }
      ), { numRuns: 25 });
    });

    test('complex filter combinations work correctly', () => {
      fc.assert(fc.property(
        complexFilters(),
        (filters) => {
          const mongoFilters = searchService.buildFilters(filters);

          // Property: Result should always be an object
          expect(typeof mongoFilters).toBe('object');
          expect(mongoFilters).not.toBeNull();

          // Property: Each provided filter should be represented
          let expectedFilterCount = 0;

          if (filters.stage) {
            expect(mongoFilters['pipelineInfo.currentStage']).toBeTruthy();
            expectedFilterCount++;
          }

          if (filters.skills && filters.skills.length > 0) {
            expect(mongoFilters['professionalInfo.skills']).toBeTruthy();
            expectedFilterCount++;
          }

          if (filters.location) {
            expect(mongoFilters['personalInfo.location']).toBeTruthy();
            expectedFilterCount++;
          }

          if (filters.experience) {
            expect(mongoFilters['professionalInfo.experience']).toBeTruthy();
            expectedFilterCount++;
          }

          if (filters.source) {
            expect(mongoFilters['professionalInfo.source']).toBeTruthy();
            expectedFilterCount++;
          }

          if (filters.appliedDateFrom || filters.appliedDateTo) {
            expect(mongoFilters['pipelineInfo.appliedDate']).toBeTruthy();
            expectedFilterCount++;
          }

          // Property: Filter count should match provided filters
          expect(Object.keys(mongoFilters).length).toBe(expectedFilterCount);
        }
      ), { numRuns: 50 });
    });

    test('empty and null filters are handled correctly', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant({}),
          fc.constant(null),
          fc.constant(undefined),
          fc.record({
            stage: fc.constant(null),
            skills: fc.constant([]),
            location: fc.constant(''),
            experience: fc.constant(null),
            source: fc.constant(undefined)
          })
        ),
        (filters) => {
          const mongoFilters = searchService.buildFilters(filters || {});

          // Property: Empty filters should result in empty MongoDB filter
          expect(typeof mongoFilters).toBe('object');
          expect(mongoFilters).not.toBeNull();

          // Property: Should not have any filter properties for empty inputs
          expect(Object.keys(mongoFilters).length).toBe(0);
        }
      ), { numRuns: 20 });
    });

    test('filter validation rejects invalid values', () => {
      fc.assert(fc.property(
        fc.record({
          stage: fc.option(fc.string().filter(s => !Object.values(PIPELINE_STAGES).includes(s))),
          skills: fc.option(fc.oneof(
            fc.string(),
            fc.integer(),
            fc.constant(null)
          )),
          location: fc.option(fc.oneof(
            fc.integer(),
            fc.constant(null),
            fc.array(fc.string())
          )),
          source: fc.option(fc.string().filter(s => !Object.values(APPLICATION_SOURCES).includes(s)))
        }),
        (invalidFilters) => {
          const mongoFilters = searchService.buildFilters(invalidFilters);

          // Property: Invalid stage should not create filter
          if (invalidFilters.stage && !Object.values(PIPELINE_STAGES).includes(invalidFilters.stage)) {
            expect(mongoFilters).not.toHaveProperty('pipelineInfo.currentStage');
          }

          // Property: Invalid skills should not create filter
          if (invalidFilters.skills && !Array.isArray(invalidFilters.skills)) {
            expect(mongoFilters).not.toHaveProperty('professionalInfo.skills');
          }

          // Property: Invalid location should not create filter
          if (invalidFilters.location && typeof invalidFilters.location !== 'string') {
            expect(mongoFilters).not.toHaveProperty('personalInfo.location');
          }

          // Property: Invalid source should not create filter
          if (invalidFilters.source && !Object.values(APPLICATION_SOURCES).includes(invalidFilters.source)) {
            expect(mongoFilters).not.toHaveProperty('professionalInfo.source');
          }
        }
      ), { numRuns: 30 });
    });

    test('filter logic is consistent with candidate data structure', () => {
      fc.assert(fc.property(
        candidateData(),
        complexFilters(),
        (candidate, filters) => {
          const mongoFilters = searchService.buildFilters(filters);

          // Property: Filter paths should match candidate data structure
          Object.keys(mongoFilters).forEach(filterPath => {
            const pathParts = filterPath.split('.');
            
            // Property: All filter paths should be valid candidate fields
            const validPaths = [
              'pipelineInfo.currentStage',
              'professionalInfo.skills',
              'personalInfo.location',
              'professionalInfo.experience',
              'professionalInfo.source',
              'pipelineInfo.appliedDate'
            ];
            
            expect(validPaths).toContain(filterPath);

            // Property: Path should exist in candidate structure
            let current = candidate;
            for (const part of pathParts) {
              if (current && typeof current === 'object') {
                // Path exists in structure (may be null/undefined)
                expect(Object.prototype.hasOwnProperty.call(current, part) || current[part] !== undefined).toBeTruthy();
                current = current[part];
              }
            }
          });
        }
      ), { numRuns: 40 });
    });
  });

  describe('Filter Performance Considerations', () => {
    
    test('filter complexity remains manageable', () => {
      fc.assert(fc.property(
        complexFilters(),
        (filters) => {
          const mongoFilters = searchService.buildFilters(filters);

          // Property: Filter object should not be overly complex
          expect(Object.keys(mongoFilters).length).toBeLessThanOrEqual(10);

          // Property: Nested filter depth should be reasonable
          const maxDepth = Math.max(
            ...Object.values(mongoFilters).map(filter => {
              if (typeof filter === 'object' && filter !== null) {
                return Object.keys(filter).length;
              }
              return 1;
            })
          );
          
          expect(maxDepth).toBeLessThanOrEqual(5);
        }
      ), { numRuns: 30 });
    });
  });
});