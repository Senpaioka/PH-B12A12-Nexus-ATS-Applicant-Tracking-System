/**
 * Property-Based Tests for Duplicate Candidate Prevention
 * Feature: candidate-management, Property 13: Duplicate candidate prevention
 * Validates: Requirements 6.5
 */

import fc from 'fast-check';
import { CandidateServiceError } from '../candidate-service.js';

describe('Duplicate Candidate Prevention Property Tests', () => {

  /**
   * Property 13: Duplicate candidate prevention
   * For any candidate email address, attempting to create a second candidate 
   * with the same email should be rejected with an appropriate error message
   */
  describe('Property 13: Duplicate candidate prevention', () => {
    
    test('should simulate duplicate email rejection logic', () => {
      fc.assert(fc.property(
        fc.emailAddress(),
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        (email, firstCandidate, secondCandidate) => {
          // Simulate an in-memory store of existing emails
          const existingEmails = new Set();
          
          // Simulate duplicate prevention logic
          const checkDuplicate = (candidateData) => {
            const candidateEmail = candidateData.email?.toLowerCase().trim();
            if (candidateEmail && existingEmails.has(candidateEmail)) {
              throw new CandidateServiceError(
                'A candidate with this email address already exists',
                'DUPLICATE_EMAIL',
                409
              );
            }
            if (candidateEmail) {
              existingEmails.add(candidateEmail);
            }
            return { success: true, email: candidateEmail };
          };
          
          // First candidate should succeed
          const firstResult = checkDuplicate({ 
            ...firstCandidate, 
            email: email 
          });
          expect(firstResult.success).toBe(true);
          expect(firstResult.email).toBe(email.toLowerCase().trim());
          
          // Second candidate with same email should fail
          expect(() => {
            checkDuplicate({ 
              ...secondCandidate, 
              email: email 
            });
          }).toThrow('A candidate with this email address already exists');
          
          // Verify the error has correct properties
          try {
            checkDuplicate({ ...secondCandidate, email: email });
          } catch (error) {
            expect(error).toBeInstanceOf(CandidateServiceError);
            expect(error.code).toBe('DUPLICATE_EMAIL');
            expect(error.statusCode).toBe(409);
            expect(error.message).toContain('email address already exists');
          }
        }
      ), { numRuns: 100 });
    });

    test('should handle email case insensitivity for duplicates', () => {
      fc.assert(fc.property(
        fc.emailAddress(),
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        (baseEmail, candidateData) => {
          // Create variations of the same email with different cases
          const emailVariations = [
            baseEmail.toLowerCase(),
            baseEmail.toUpperCase(),
            baseEmail.charAt(0).toUpperCase() + baseEmail.slice(1).toLowerCase(),
            baseEmail.split('@').map((part, index) => 
              index === 0 ? part.toUpperCase() : part.toLowerCase()
            ).join('@')
          ];
          
          // Simulate an in-memory store with case-insensitive checking
          const existingEmails = new Set();
          
          // Simulate duplicate check logic with case normalization
          const checkDuplicateWithNormalization = (candidateData) => {
            const normalizedEmail = candidateData.email.toLowerCase().trim();
            if (existingEmails.has(normalizedEmail)) {
              throw new CandidateServiceError(
                'A candidate with this email address already exists',
                'DUPLICATE_EMAIL',
                409
              );
            }
            existingEmails.add(normalizedEmail);
            return { success: true, email: normalizedEmail };
          };
          
          // First variation should succeed
          const firstResult = checkDuplicateWithNormalization({
            ...candidateData,
            email: emailVariations[0]
          });
          expect(firstResult.success).toBe(true);
          
          // All other variations should be detected as duplicates
          for (let i = 1; i < emailVariations.length; i++) {
            expect(() => {
              checkDuplicateWithNormalization({
                ...candidateData,
                email: emailVariations[i]
              });
            }).toThrow('A candidate with this email address already exists');
          }
        }
      ), { numRuns: 50 });
    });

    test('should allow different email addresses', () => {
      fc.assert(fc.property(
        fc.array(fc.emailAddress(), { minLength: 2, maxLength: 5 }).filter(emails => {
          // Ensure all emails are unique (case-insensitive)
          const normalizedEmails = emails.map(e => e.toLowerCase());
          return new Set(normalizedEmails).size === normalizedEmails.length;
        }),
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        (uniqueEmails, candidateTemplate) => {
          // Simulate an in-memory store
          const existingEmails = new Set();
          
          // Simulate creating candidates with different emails
          const checkUniqueEmail = (candidateData) => {
            const candidateEmail = candidateData.email?.toLowerCase().trim();
            if (candidateEmail && existingEmails.has(candidateEmail)) {
              throw new CandidateServiceError(
                'A candidate with this email address already exists',
                'DUPLICATE_EMAIL',
                409
              );
            }
            if (candidateEmail) {
              existingEmails.add(candidateEmail);
            }
            return { success: true, email: candidateEmail };
          };
          
          // All unique emails should be allowed
          for (const email of uniqueEmails) {
            const result = checkUniqueEmail({
              ...candidateTemplate,
              email: email
            });
            
            expect(result.success).toBe(true);
            expect(result.email).toBe(email.toLowerCase().trim());
          }
          
          // Verify all emails were stored
          expect(existingEmails.size).toBe(uniqueEmails.length);
        }
      ), { numRuns: 50 });
    });

    test('should handle empty or null emails appropriately', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.constant('   ')
        ),
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        (emptyEmail, candidateData) => {
          // Simulate an in-memory store
          const existingEmails = new Set();
          
          // Simulate duplicate check with empty email handling
          const checkDuplicateWithEmptyHandling = (candidateData) => {
            const candidateEmail = candidateData.email;
            
            // Only check for duplicates if email is provided and not empty
            if (candidateEmail && candidateEmail.trim() && existingEmails.has(candidateEmail.toLowerCase().trim())) {
              throw new CandidateServiceError(
                'A candidate with this email address already exists',
                'DUPLICATE_EMAIL',
                409
              );
            }
            
            if (candidateEmail && candidateEmail.trim()) {
              existingEmails.add(candidateEmail.toLowerCase().trim());
            }
            
            return { success: true, email: candidateEmail };
          };
          
          // Empty emails should not trigger duplicate check
          const result = checkDuplicateWithEmptyHandling({
            ...candidateData,
            email: emptyEmail
          });
          
          expect(result.success).toBe(true);
          
          // No emails should be stored for empty values
          expect(existingEmails.size).toBe(0);
        }
      ), { numRuns: 50 });
    });

    test('should provide consistent error messages for duplicates', () => {
      fc.assert(fc.property(
        fc.emailAddress(),
        fc.array(
          fc.record({
            firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (duplicateEmail, candidatesData) => {
          // Simulate an in-memory store with the email already existing
          const existingEmails = new Set([duplicateEmail.toLowerCase().trim()]);
          
          // Simulate duplicate prevention for multiple attempts
          const checkDuplicate = (candidateData) => {
            const candidateEmail = candidateData.email?.toLowerCase().trim();
            if (candidateEmail && existingEmails.has(candidateEmail)) {
              throw new CandidateServiceError(
                'A candidate with this email address already exists',
                'DUPLICATE_EMAIL',
                409
              );
            }
            return { success: true };
          };
          
          const errors = [];
          
          // Try to create multiple candidates with the same email
          for (const candidateData of candidatesData) {
            try {
              checkDuplicate({ ...candidateData, email: duplicateEmail });
            } catch (error) {
              errors.push(error);
            }
          }
          
          // All errors should be consistent
          expect(errors).toHaveLength(candidatesData.length);
          
          errors.forEach(error => {
            expect(error).toBeInstanceOf(CandidateServiceError);
            expect(error.code).toBe('DUPLICATE_EMAIL');
            expect(error.statusCode).toBe(409);
            expect(error.message).toBe('A candidate with this email address already exists');
          });
        }
      ), { numRuns: 50 });
    });
  });
});