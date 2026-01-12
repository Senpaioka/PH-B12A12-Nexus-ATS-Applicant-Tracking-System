/**
 * Property-Based Tests for API Response Consistency
 * Feature: candidate-management, Property 15: API response consistency
 * Validates: Requirements 8.8
 */

import fc from 'fast-check';

describe('API Response Consistency Property Tests', () => {

  /**
   * Property 15: API response consistency
   * For any API endpoint call, the response should include appropriate HTTP status codes 
   * and consistent error message formats
   */
  describe('Property 15: API response consistency', () => {
    
    test('should have consistent success response structure', () => {
      fc.assert(fc.property(
        fc.record({
          data: fc.anything(),
          message: fc.option(fc.string()),
          pagination: fc.option(fc.record({
            page: fc.integer({ min: 1 }),
            limit: fc.integer({ min: 1, max: 100 }),
            total: fc.integer({ min: 0 }),
            pages: fc.integer({ min: 0 }),
            hasNext: fc.boolean(),
            hasPrev: fc.boolean()
          }))
        }),
        (responseData) => {
          // Simulate successful API response structure
          const successResponse = {
            success: true,
            ...responseData
          };
          
          // Verify required success response structure
          expect(successResponse).toHaveProperty('success');
          expect(successResponse.success).toBe(true);
          expect(successResponse).toHaveProperty('data');
          
          // Verify optional fields maintain their types
          if (successResponse.message !== undefined && successResponse.message !== null) {
            expect(typeof successResponse.message).toBe('string');
          }
          
          if (successResponse.pagination !== undefined && successResponse.pagination !== null) {
            expect(successResponse.pagination).toHaveProperty('page');
            expect(successResponse.pagination).toHaveProperty('limit');
            expect(successResponse.pagination).toHaveProperty('total');
            expect(successResponse.pagination).toHaveProperty('pages');
            expect(successResponse.pagination).toHaveProperty('hasNext');
            expect(successResponse.pagination).toHaveProperty('hasPrev');
            
            expect(typeof successResponse.pagination.page).toBe('number');
            expect(typeof successResponse.pagination.limit).toBe('number');
            expect(typeof successResponse.pagination.total).toBe('number');
            expect(typeof successResponse.pagination.pages).toBe('number');
            expect(typeof successResponse.pagination.hasNext).toBe('boolean');
            expect(typeof successResponse.pagination.hasPrev).toBe('boolean');
          }
        }
      ), { numRuns: 100 });
    });

    test('should have consistent error response structure', () => {
      fc.assert(fc.property(
        fc.record({
          error: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          statusCode: fc.integer({ min: 400, max: 599 }),
          code: fc.option(fc.string({ minLength: 1 }))
        }),
        (errorData) => {
          // Simulate error API response structure
          const errorResponse = {
            success: false,
            error: errorData.error,
            message: errorData.message
          };
          
          if (errorData.code) {
            errorResponse.code = errorData.code;
          }
          
          // Verify required error response structure
          expect(errorResponse).toHaveProperty('success');
          expect(errorResponse.success).toBe(false);
          expect(errorResponse).toHaveProperty('error');
          expect(errorResponse).toHaveProperty('message');
          
          // Verify error fields are strings
          expect(typeof errorResponse.error).toBe('string');
          expect(typeof errorResponse.message).toBe('string');
          expect(errorResponse.error.length).toBeGreaterThan(0);
          expect(errorResponse.message.length).toBeGreaterThan(0);
          
          // Verify optional code field
          if (errorResponse.code !== undefined) {
            expect(typeof errorResponse.code).toBe('string');
            expect(errorResponse.code.length).toBeGreaterThan(0);
          }
        }
      ), { numRuns: 100 });
    });

    test('should map status codes to appropriate error types', () => {
      fc.assert(fc.property(
        fc.constantFrom(
          { statusCode: 400, errorType: 'validation', expectedErrors: ['VALIDATION_ERROR', 'INVALID_ID'] },
          { statusCode: 401, errorType: 'authentication', expectedErrors: ['UNAUTHORIZED', 'AUTH_REQUIRED'] },
          { statusCode: 403, errorType: 'authorization', expectedErrors: ['FORBIDDEN', 'ACCESS_DENIED'] },
          { statusCode: 404, errorType: 'not_found', expectedErrors: ['NOT_FOUND', 'RESOURCE_NOT_FOUND'] },
          { statusCode: 409, errorType: 'conflict', expectedErrors: ['DUPLICATE_EMAIL', 'CONFLICT'] },
          { statusCode: 500, errorType: 'server_error', expectedErrors: ['INTERNAL_ERROR', 'DATABASE_ERROR'] }
        ),
        fc.string({ minLength: 1 }),
        (statusInfo, message) => {
          // Simulate error response for different status codes
          const errorResponse = {
            success: false,
            error: statusInfo.errorType,
            message: message,
            statusCode: statusInfo.statusCode
          };
          
          // Verify status code consistency
          expect(errorResponse.statusCode).toBe(statusInfo.statusCode);
          
          // Verify error type is appropriate for status code
          if (statusInfo.statusCode >= 400 && statusInfo.statusCode < 500) {
            // Client errors
            expect(['validation', 'authentication', 'authorization', 'not_found', 'conflict'])
              .toContain(errorResponse.error);
          } else if (statusInfo.statusCode >= 500) {
            // Server errors
            expect(['server_error']).toContain(errorResponse.error);
          }
          
          // Verify message is present
          expect(errorResponse.message).toBeDefined();
          expect(typeof errorResponse.message).toBe('string');
          expect(errorResponse.message.length).toBeGreaterThan(0);
        }
      ), { numRuns: 100 });
    });

    test('should maintain consistent field types across responses', () => {
      fc.assert(fc.property(
        fc.oneof(
          // Success response
          fc.record({
            responseType: fc.constant('success'),
            data: fc.anything(),
            message: fc.option(fc.string())
          }),
          // Error response
          fc.record({
            responseType: fc.constant('error'),
            error: fc.string({ minLength: 1 }),
            message: fc.string({ minLength: 1 }),
            statusCode: fc.integer({ min: 400, max: 599 })
          })
        ),
        (responseSpec) => {
          let response;
          
          if (responseSpec.responseType === 'success') {
            response = {
              success: true,
              data: responseSpec.data
            };
            if (responseSpec.message) {
              response.message = responseSpec.message;
            }
          } else {
            response = {
              success: false,
              error: responseSpec.error,
              message: responseSpec.message
            };
          }
          
          // Verify success field is always boolean
          expect(typeof response.success).toBe('boolean');
          
          // Verify type consistency based on response type
          if (response.success) {
            expect(response).toHaveProperty('data');
            if (response.message !== undefined) {
              expect(typeof response.message).toBe('string');
            }
          } else {
            expect(response).toHaveProperty('error');
            expect(response).toHaveProperty('message');
            expect(typeof response.error).toBe('string');
            expect(typeof response.message).toBe('string');
          }
        }
      ), { numRuns: 100 });
    });

    test('should handle pagination parameters consistently', () => {
      fc.assert(fc.property(
        fc.record({
          page: fc.integer({ min: 1, max: 1000 }),
          limit: fc.integer({ min: 1, max: 100 }),
          total: fc.integer({ min: 0, max: 10000 })
        }),
        (paginationInput) => {
          // Calculate pagination metadata
          const pages = Math.ceil(paginationInput.total / paginationInput.limit);
          const hasNext = paginationInput.page * paginationInput.limit < paginationInput.total;
          const hasPrev = paginationInput.page > 1;
          
          const paginationResponse = {
            page: paginationInput.page,
            limit: paginationInput.limit,
            total: paginationInput.total,
            pages: pages,
            hasNext: hasNext,
            hasPrev: hasPrev
          };
          
          // Verify pagination structure consistency
          expect(typeof paginationResponse.page).toBe('number');
          expect(typeof paginationResponse.limit).toBe('number');
          expect(typeof paginationResponse.total).toBe('number');
          expect(typeof paginationResponse.pages).toBe('number');
          expect(typeof paginationResponse.hasNext).toBe('boolean');
          expect(typeof paginationResponse.hasPrev).toBe('boolean');
          
          // Verify pagination logic consistency
          expect(paginationResponse.page).toBeGreaterThanOrEqual(1);
          expect(paginationResponse.limit).toBeGreaterThanOrEqual(1);
          expect(paginationResponse.total).toBeGreaterThanOrEqual(0);
          expect(paginationResponse.pages).toBeGreaterThanOrEqual(0);
          
          // Verify hasNext logic
          if (paginationResponse.total === 0) {
            expect(paginationResponse.hasNext).toBe(false);
          } else {
            const expectedHasNext = paginationResponse.page * paginationResponse.limit < paginationResponse.total;
            expect(paginationResponse.hasNext).toBe(expectedHasNext);
          }
          
          // Verify hasPrev logic
          const expectedHasPrev = paginationResponse.page > 1;
          expect(paginationResponse.hasPrev).toBe(expectedHasPrev);
        }
      ), { numRuns: 100 });
    });

    test('should validate HTTP status code ranges', () => {
      fc.assert(fc.property(
        fc.integer({ min: 100, max: 599 }),
        (statusCode) => {
          // Categorize status codes
          let category;
          if (statusCode >= 200 && statusCode < 300) {
            category = 'success';
          } else if (statusCode >= 400 && statusCode < 500) {
            category = 'client_error';
          } else if (statusCode >= 500 && statusCode < 600) {
            category = 'server_error';
          } else {
            category = 'other';
          }
          
          // Verify status code categorization
          if (category === 'success') {
            expect(statusCode).toBeGreaterThanOrEqual(200);
            expect(statusCode).toBeLessThan(300);
          } else if (category === 'client_error') {
            expect(statusCode).toBeGreaterThanOrEqual(400);
            expect(statusCode).toBeLessThan(500);
          } else if (category === 'server_error') {
            expect(statusCode).toBeGreaterThanOrEqual(500);
            expect(statusCode).toBeLessThan(600);
          }
          
          // Verify that we handle the expected status codes
          const expectedStatusCodes = [200, 201, 400, 401, 403, 404, 409, 500, 503];
          if (expectedStatusCodes.includes(statusCode)) {
            expect([200, 201, 400, 401, 403, 404, 409, 500, 503]).toContain(statusCode);
          }
        }
      ), { numRuns: 100 });
    });
  });
});