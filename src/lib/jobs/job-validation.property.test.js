/**
 * Property-Based Tests for Job Validation
 * Tests universal properties of job data validation using fast-check
 */

import fc from 'fast-check';
import { validateJobData, sanitizeJobInput, DEPARTMENTS, EMPLOYMENT_TYPES } from './job-validation.js';

// Feature: job-management, Property 1: Job Data Validation

// Helper generators for valid data
const validTitleGen = fc.string({ minLength: 3, maxLength: 50 })
  .map(s => s.replace(/[^a-zA-Z0-9\s\-\(\)\.\,\/&]/g, 'A'))
  .filter(s => s.trim().length >= 3);

const validLocationGen = fc.string({ minLength: 2, maxLength: 50 })
  .map(s => s.replace(/[^a-zA-Z0-9\s\-\/\,\(\)]/g, 'A'))
  .filter(s => s.trim().length >= 2);

const validTextGen = fc.string({ minLength: 50, maxLength: 200 })
  .map(s => s.padEnd(50, 'A'))
  .filter(s => s.length >= 50);

describe('Job Data Validation Properties', () => {
  
  /**
   * Property 1: Job Data Validation
   * For any job submission data, the validation system should correctly identify 
   * missing required fields, invalid data types, and enum violations, rejecting 
   * invalid submissions while accepting valid ones.
   */
  test('Property 1: Job Data Validation - validates all job data correctly', () => {
    fc.assert(
      fc.property(
        // Generator for valid job data
        fc.record({
          title: validTitleGen,
          department: fc.constantFrom(...DEPARTMENTS),
          type: fc.constantFrom(...EMPLOYMENT_TYPES),
          location: validLocationGen,
          salary: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          description: validTextGen,
          requirements: validTextGen
        }),
        (validJobData) => {
          // Valid job data should pass validation
          const result = validateJobData(validJobData);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 1: Job Data Validation - rejects missing required fields', () => {
    fc.assert(
      fc.property(
        // Generator for job data with missing required fields
        fc.record({
          title: fc.option(validTitleGen, { nil: undefined }),
          department: fc.option(fc.constantFrom(...DEPARTMENTS), { nil: undefined }),
          type: fc.option(fc.constantFrom(...EMPLOYMENT_TYPES), { nil: undefined }),
          location: fc.option(validLocationGen, { nil: undefined }),
          salary: fc.option(fc.string(), { nil: null }),
          description: fc.option(validTextGen, { nil: undefined }),
          requirements: fc.option(validTextGen, { nil: undefined })
        }).filter(data => {
          // Ensure at least one required field is missing
          return !data.title || !data.department || !data.type || 
                 !data.location || !data.description || !data.requirements;
        }),
        (incompleteJobData) => {
          // Incomplete job data should fail validation
          const result = validateJobData(incompleteJobData);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should have specific error codes for missing fields
          const errorCodes = result.errors.map(e => e.code);
          expect(errorCodes.some(code => code.endsWith('_REQUIRED'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 1: Job Data Validation - rejects invalid data types', () => {
    fc.assert(
      fc.property(
        // Generator for job data with invalid types
        fc.record({
          title: fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.string())),
          department: fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.string())),
          type: fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.string())),
          location: fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.string())),
          salary: fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.string())),
          description: fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.string())),
          requirements: fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.string()))
        }),
        (invalidTypeJobData) => {
          // Invalid type job data should fail validation
          const result = validateJobData(invalidTypeJobData);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should have specific error codes for invalid types
          const errorCodes = result.errors.map(e => e.code);
          expect(errorCodes.some(code => code.endsWith('_INVALID_TYPE'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 1: Job Data Validation - rejects invalid enum values', () => {
    fc.assert(
      fc.property(
        // Generator for job data with invalid enum values
        fc.record({
          title: validTitleGen,
          department: fc.string({ minLength: 1 }).filter(s => s.trim() !== '' && !DEPARTMENTS.includes(s.trim())),
          type: fc.string({ minLength: 1 }).filter(s => s.trim() !== '' && !EMPLOYMENT_TYPES.includes(s.trim())),
          location: validLocationGen,
          salary: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
          description: validTextGen,
          requirements: validTextGen
        }),
        (invalidEnumJobData) => {
          // Invalid enum job data should fail validation
          const result = validateJobData(invalidEnumJobData);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should have specific error codes for invalid enum values
          const errorCodes = result.errors.map(e => e.code);
          expect(errorCodes.some(code => code.endsWith('_INVALID_VALUE'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 1: Job Data Validation - rejects fields that are too short', () => {
    fc.assert(
      fc.property(
        // Generator for job data with fields that are too short
        fc.record({
          title: fc.string({ maxLength: 2 }), // Too short (min 3)
          department: fc.constantFrom(...DEPARTMENTS),
          type: fc.constantFrom(...EMPLOYMENT_TYPES),
          location: fc.string({ maxLength: 1 }), // Too short (min 2)
          salary: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
          description: fc.string({ maxLength: 49 }), // Too short (min 50)
          requirements: fc.string({ maxLength: 49 }) // Too short (min 50)
        }),
        (tooShortJobData) => {
          // Job data with fields too short should fail validation
          const result = validateJobData(tooShortJobData);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should have specific error codes for fields too short
          const errorCodes = result.errors.map(e => e.code);
          expect(errorCodes.some(code => code.endsWith('_TOO_SHORT'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 1: Job Data Validation - rejects fields that are too long', () => {
    fc.assert(
      fc.property(
        // Generator for job data with fields that are too long
        fc.record({
          title: fc.string({ minLength: 101, maxLength: 200 }), // Too long (max 100)
          department: fc.constantFrom(...DEPARTMENTS),
          type: fc.constantFrom(...EMPLOYMENT_TYPES),
          location: fc.string({ minLength: 101, maxLength: 200 }), // Too long (max 100)
          salary: fc.string({ minLength: 51, maxLength: 100 }), // Too long (max 50)
          description: fc.string({ minLength: 2001, maxLength: 3000 }), // Too long (max 2000)
          requirements: fc.string({ minLength: 2001, maxLength: 3000 }) // Too long (max 2000)
        }),
        (tooLongJobData) => {
          // Job data with fields too long should fail validation
          const result = validateJobData(tooLongJobData);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should have specific error codes for fields too long
          const errorCodes = result.errors.map(e => e.code);
          expect(errorCodes.some(code => code.endsWith('_TOO_LONG'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 1: Job Data Validation - handles null/undefined input gracefully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant({}),
          fc.string(),
          fc.integer(),
          fc.boolean()
        ),
        (invalidInput) => {
          // Invalid input should be handled gracefully
          const result = validateJobData(invalidInput);
          expect(result).toHaveProperty('isValid');
          expect(result).toHaveProperty('errors');
          expect(Array.isArray(result.errors)).toBe(true);
          
          if (invalidInput === null || invalidInput === undefined || typeof invalidInput !== 'object') {
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 1: Job Data Validation - salary field is optional', () => {
    fc.assert(
      fc.property(
        // Generator for valid job data without salary
        fc.record({
          title: validTitleGen,
          department: fc.constantFrom(...DEPARTMENTS),
          type: fc.constantFrom(...EMPLOYMENT_TYPES),
          location: validLocationGen,
          description: validTextGen,
          requirements: validTextGen
        }),
        (jobDataWithoutSalary) => {
          // Job data without salary should pass validation
          const result = validateJobData(jobDataWithoutSalary);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

});

describe('Job Input Sanitization Properties', () => {

  test('Sanitization preserves valid data structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string(),
          department: fc.string(),
          type: fc.string(),
          location: fc.string(),
          salary: fc.option(fc.string(), { nil: null }),
          description: fc.string(),
          requirements: fc.string()
        }),
        (jobData) => {
          // Sanitization should preserve the structure
          const sanitized = sanitizeJobInput(jobData);
          expect(typeof sanitized).toBe('object');
          expect(sanitized).not.toBeNull();
          
          // All fields should be strings or null/undefined
          Object.values(sanitized).forEach(value => {
            expect(typeof value === 'string' || value === null || value === undefined).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Sanitization handles invalid input gracefully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.array(fc.string())
        ),
        (invalidInput) => {
          // Sanitization should handle invalid input gracefully
          const result = sanitizeJobInput(invalidInput);
          expect(typeof result).toBe('object');
          expect(result).not.toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

});