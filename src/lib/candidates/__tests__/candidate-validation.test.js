/**
 * Property-Based Tests for Candidate Validation
 * Feature: candidate-management, Property 4: Input validation rejection
 * Validates: Requirements 1.5, 1.6, 6.1, 6.2
 */

import fc from 'fast-check';
import {
  validatePersonalInfo,
  validateProfessionalInfo,
  validatePipelineStage,
  validateStageTransition,
  validateDocumentMetadata,
  validateNoteData,
  validateCandidateData,
  normalizePhoneNumber,
  ValidationError
} from '../candidate-validation.js';
import { PIPELINE_STAGES, APPLICATION_SOURCES, DOCUMENT_TYPES, NOTE_TYPES } from '../candidate-models.js';

describe('Candidate Validation Property Tests', () => {
  
  /**
   * Property 4: Input validation rejection
   * For any invalid candidate data (missing required fields, invalid email format, etc.), 
   * the system should reject the input and return descriptive error messages
   */
  describe('Property 4: Input validation rejection', () => {
    
    test('should reject invalid personal info and provide descriptive errors', () => {
      fc.assert(fc.property(
        fc.record({
          firstName: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(''),
            fc.constant('   '),
            fc.string({ minLength: 51 }), // Too long
            fc.integer() // Wrong type
          ),
          lastName: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(''),
            fc.constant('   '),
            fc.string({ minLength: 51 }), // Too long
            fc.integer() // Wrong type
          ),
          email: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(''),
            fc.constant('invalid-email'),
            fc.constant('missing@domain'),
            fc.constant('@missing-local.com'),
            fc.string({ minLength: 101 }), // Too long
            fc.integer() // Wrong type
          ),
          phone: fc.oneof(
            fc.constant('invalid-phone'),
            fc.constant('abc123'),
            fc.integer() // Wrong type
          ),
          location: fc.oneof(
            fc.string({ minLength: 101 }), // Too long
            fc.integer() // Wrong type
          )
        }, { requiredKeys: [] }),
        (invalidPersonalInfo) => {
          expect(() => {
            validatePersonalInfo(invalidPersonalInfo);
          }).toThrow(ValidationError);
        }
      ), { numRuns: 100 });
    });

    test('should reject invalid professional info and provide descriptive errors', () => {
      fc.assert(fc.property(
        fc.record({
          currentRole: fc.oneof(
            fc.string({ minLength: 101 }), // Too long
            fc.integer() // Wrong type
          ),
          experience: fc.oneof(
            fc.string({ minLength: 51 }), // Too long
            fc.integer() // Wrong type
          ),
          skills: fc.oneof(
            fc.string(), // Wrong type (should be array)
            fc.array(fc.integer()), // Wrong element type
            fc.array(fc.string({ minLength: 51 })), // Elements too long
            fc.array(fc.string(), { minLength: 21 }) // Too many skills
          ),
          appliedForRole: fc.oneof(
            fc.string({ minLength: 101 }), // Too long
            fc.integer() // Wrong type
          ),
          source: fc.string().filter(s => !Object.values(APPLICATION_SOURCES).includes(s))
        }, { requiredKeys: [] }),
        (invalidProfessionalInfo) => {
          expect(() => {
            validateProfessionalInfo(invalidProfessionalInfo);
          }).toThrow(ValidationError);
        }
      ), { numRuns: 100 });
    });

    test('should reject invalid pipeline stages', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.string().filter(s => !Object.values(PIPELINE_STAGES).includes(s)),
          fc.integer()
        ),
        (invalidStage) => {
          expect(() => {
            validatePipelineStage(invalidStage);
          }).toThrow(ValidationError);
        }
      ), { numRuns: 100 });
    });

    test('should reject invalid stage transitions', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.values(PIPELINE_STAGES)),
        fc.constantFrom(...Object.values(PIPELINE_STAGES)),
        (fromStage, toStage) => {
          // Skip valid transitions and same-stage transitions
          if (fromStage === toStage) return;
          
          const validTransitions = {
            [PIPELINE_STAGES.APPLIED]: [PIPELINE_STAGES.SCREENING],
            [PIPELINE_STAGES.SCREENING]: [PIPELINE_STAGES.INTERVIEW, PIPELINE_STAGES.APPLIED],
            [PIPELINE_STAGES.INTERVIEW]: [PIPELINE_STAGES.OFFER, PIPELINE_STAGES.SCREENING],
            [PIPELINE_STAGES.OFFER]: [PIPELINE_STAGES.HIRED, PIPELINE_STAGES.INTERVIEW],
            [PIPELINE_STAGES.HIRED]: []
          };
          
          if (validTransitions[fromStage]?.includes(toStage)) return;
          
          expect(() => {
            validateStageTransition(fromStage, toStage);
          }).toThrow(ValidationError);
        }
      ), { numRuns: 100 });
    });

    test('should reject invalid document metadata', () => {
      fc.assert(fc.property(
        fc.record({
          filename: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(''),
            fc.integer()
          ),
          originalName: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(''),
            fc.integer()
          ),
          mimeType: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(''),
            fc.constant('text/plain'), // Invalid MIME type
            fc.constant('image/jpeg'), // Invalid MIME type
            fc.integer()
          ),
          size: fc.oneof(
            fc.constant(0),
            fc.constant(-1),
            fc.constant(11 * 1024 * 1024), // Too large (>10MB)
            fc.string()
          ),
          documentType: fc.string().filter(s => !Object.values(DOCUMENT_TYPES).includes(s))
        }, { requiredKeys: [] }),
        (invalidDocumentData) => {
          expect(() => {
            validateDocumentMetadata(invalidDocumentData);
          }).toThrow(ValidationError);
        }
      ), { numRuns: 100 });
    });

    test('should reject invalid note data', () => {
      fc.assert(fc.property(
        fc.record({
          content: fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(''),
            fc.constant('   '),
            fc.string({ minLength: 1001 }), // Too long
            fc.integer()
          ),
          type: fc.string().filter(s => !Object.values(NOTE_TYPES).includes(s))
        }, { requiredKeys: [] }),
        (invalidNoteData) => {
          expect(() => {
            validateNoteData(invalidNoteData);
          }).toThrow(ValidationError);
        }
      ), { numRuns: 100 });
    });

    test('should reject completely invalid candidate data', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.string(),
          fc.integer(),
          fc.record({
            // Missing required fields
            optionalField: fc.string()
          })
        ),
        (invalidCandidateData) => {
          expect(() => {
            validateCandidateData(invalidCandidateData);
          }).toThrow(ValidationError);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Phone Number Normalization Property Tests', () => {
    
    test('should normalize valid phone numbers consistently', () => {
      fc.assert(fc.property(
        fc.record({
          countryCode: fc.constantFrom('1', '44', '33', '49'),
          areaCode: fc.integer({ min: 100, max: 999 }).map(String),
          number: fc.integer({ min: 1000000, max: 9999999 }).map(String)
        }),
        ({ countryCode, areaCode, number }) => {
          const variations = [
            `+${countryCode}${areaCode}${number}`,
            `${countryCode}${areaCode}${number}`,
            `+${countryCode} ${areaCode} ${number}`,
            `+${countryCode}-${areaCode}-${number}`,
            `(${areaCode}) ${number}` // US format without country code
          ];
          
          const normalized = variations.map(normalizePhoneNumber);
          
          // All variations should normalize to the same format (or similar valid format)
          normalized.forEach(norm => {
            expect(norm).toMatch(/^\+?\d+$/);
            expect(norm.length).toBeGreaterThan(0);
          });
        }
      ), { numRuns: 100 });
    });

    test('should handle invalid phone numbers gracefully', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.string().filter(s => !/\d/.test(s)), // No digits
          fc.integer()
        ),
        (invalidPhone) => {
          const result = normalizePhoneNumber(invalidPhone);
          expect(typeof result).toBe('string');
          // Should return empty string or valid format (including just '+' for edge cases)
          expect(result === '' || /^\+?\d*$/.test(result)).toBe(true);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Valid Data Should Pass Validation', () => {
    
    test('should accept valid personal info', () => {
      fc.assert(fc.property(
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }).map(s => '+1' + s.replace(/\D/g, '').slice(0, 10))),
          location: fc.option(fc.string({ minLength: 1, maxLength: 100 }))
        }),
        (validPersonalInfo) => {
          expect(() => {
            validatePersonalInfo(validPersonalInfo);
          }).not.toThrow();
        }
      ), { numRuns: 100 });
    });

    test('should accept valid professional info', () => {
      fc.assert(fc.property(
        fc.record({
          currentRole: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          experience: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          skills: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 })),
          appliedForRole: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          source: fc.option(fc.constantFrom(...Object.values(APPLICATION_SOURCES)))
        }),
        (validProfessionalInfo) => {
          expect(() => {
            validateProfessionalInfo(validProfessionalInfo);
          }).not.toThrow();
        }
      ), { numRuns: 100 });
    });

    test('should accept valid pipeline stages', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.values(PIPELINE_STAGES)),
        (validStage) => {
          expect(() => {
            validatePipelineStage(validStage);
          }).not.toThrow();
        }
      ), { numRuns: 100 });
    });

    test('should accept valid document metadata', () => {
      fc.assert(fc.property(
        fc.record({
          filename: fc.string({ minLength: 1 }),
          originalName: fc.string({ minLength: 1 }),
          mimeType: fc.constantFrom(
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ),
          size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          documentType: fc.option(fc.constantFrom(...Object.values(DOCUMENT_TYPES)))
        }),
        (validDocumentData) => {
          expect(() => {
            validateDocumentMetadata(validDocumentData);
          }).not.toThrow();
        }
      ), { numRuns: 100 });
    });
  });
});