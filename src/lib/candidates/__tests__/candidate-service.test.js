/**
 * Property-Based Tests for Candidate Service CRUD Operations
 * Feature: candidate-management, Property 1: Candidate data persistence round-trip
 * Validates: Requirements 1.1, 1.2
 */

import fc from 'fast-check';
import { validateCandidateData, ValidationError } from '../candidate-validation.js';
import { createCandidateDocument, PIPELINE_STAGES, APPLICATION_SOURCES } from '../candidate-models.js';

describe('Candidate Service CRUD Property Tests', () => {

  /**
   * Property 1: Candidate data persistence round-trip
   * For any valid candidate data, creating a candidate document and then validating it 
   * should return equivalent data with all fields preserved
   */
  describe('Property 1: Candidate data persistence round-trip', () => {
    
    test('should preserve all candidate data through document creation cycle', () => {
      fc.assert(fc.property(
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }).map(s => '+1' + s.replace(/\D/g, '').slice(0, 10))),
          location: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          currentRole: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          experience: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          skills: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 })),
          appliedForRole: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          source: fc.option(fc.constantFrom(...Object.values(APPLICATION_SOURCES))),
          currentStage: fc.option(fc.constantFrom(...Object.values(PIPELINE_STAGES)))
        }),
        (candidateData) => {
          // Validate the input data
          expect(() => validateCandidateData(candidateData)).not.toThrow();
          
          // Create candidate document
          const candidateDoc = createCandidateDocument(candidateData);
          
          expect(candidateDoc).toBeDefined();
          
          // Verify personal info preservation
          expect(candidateDoc.personalInfo.firstName).toBe(candidateData.firstName.trim());
          expect(candidateDoc.personalInfo.lastName).toBe(candidateData.lastName.trim());
          expect(candidateDoc.personalInfo.email).toBe(candidateData.email.toLowerCase().trim());
          
          if (candidateData.phone) {
            expect(candidateDoc.personalInfo.phone).toBeDefined();
          }
          
          if (candidateData.location) {
            expect(candidateDoc.personalInfo.location).toBe(candidateData.location.trim());
          }
          
          // Verify professional info preservation
          if (candidateData.currentRole) {
            expect(candidateDoc.professionalInfo.currentRole).toBe(candidateData.currentRole.trim());
          }
          
          if (candidateData.experience) {
            expect(candidateDoc.professionalInfo.experience).toBe(candidateData.experience.trim());
          }
          
          if (candidateData.skills) {
            expect(candidateDoc.professionalInfo.skills).toEqual(
              candidateData.skills.map(s => s.trim()).filter(Boolean)
            );
          }
          
          if (candidateData.appliedForRole) {
            expect(candidateDoc.professionalInfo.appliedForRole).toBe(candidateData.appliedForRole.trim());
          }
          
          // Verify pipeline info
          const expectedStage = candidateData.currentStage || PIPELINE_STAGES.APPLIED;
          expect(candidateDoc.pipelineInfo.currentStage).toBe(expectedStage);
          
          // Verify metadata
          expect(candidateDoc.metadata.isActive).toBe(true);
          expect(candidateDoc.metadata.createdAt).toBeDefined();
          expect(candidateDoc.metadata.updatedAt).toBeDefined();
          
          // Verify stage history
          expect(candidateDoc.pipelineInfo.stageHistory).toHaveLength(1);
          expect(candidateDoc.pipelineInfo.stageHistory[0].stage).toBe(expectedStage);
        }
      ), { numRuns: 100 });
    });

    test('should handle edge cases in candidate data normalization', () => {
      fc.assert(fc.property(
        fc.record({
          firstName: fc.constantFrom('A', 'X'.repeat(50), '  John  ', 'José', 'Mary-Jane'),
          lastName: fc.constantFrom('B', 'Y'.repeat(50), '  Doe  ', 'García', "O'Connor"),
          email: fc.constantFrom(
            'test@example.com',
            'UPPERCASE@DOMAIN.COM',
            'user+tag@domain.co.uk',
            'very.long.email.address@very.long.domain.name.com'
          ),
          phone: fc.option(fc.constantFrom(
            '+1234567890',
            '1234567890',
            '+1 (234) 567-8900',
            '+44 20 7946 0958'
          )),
          skills: fc.option(fc.constantFrom(
            [],
            ['JavaScript'],
            ['React', 'Node.js', 'MongoDB'],
            ['  Python  ', '  Django  '] // Test trimming
          ))
        }),
        (candidateData) => {
          const candidateDoc = createCandidateDocument(candidateData);
          
          // Verify data normalization
          expect(candidateDoc.personalInfo.firstName).toBe(candidateData.firstName.trim());
          expect(candidateDoc.personalInfo.lastName).toBe(candidateData.lastName.trim());
          expect(candidateDoc.personalInfo.email).toBe(candidateData.email.toLowerCase().trim());
          
          if (candidateData.skills) {
            expect(candidateDoc.professionalInfo.skills).toEqual(
              candidateData.skills.map(s => s.trim()).filter(Boolean)
            );
          }
        }
      ), { numRuns: 50 });
    });
  });

  describe('Data Structure Validation Tests', () => {
    
    test('should create valid document structure for any valid input', () => {
      fc.assert(fc.property(
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress()
        }),
        (candidateData) => {
          const candidateDoc = createCandidateDocument(candidateData);
          
          // Verify required structure
          expect(candidateDoc).toHaveProperty('personalInfo');
          expect(candidateDoc).toHaveProperty('professionalInfo');
          expect(candidateDoc).toHaveProperty('pipelineInfo');
          expect(candidateDoc).toHaveProperty('documents');
          expect(candidateDoc).toHaveProperty('jobApplications');
          expect(candidateDoc).toHaveProperty('notes');
          expect(candidateDoc).toHaveProperty('metadata');
          
          // Verify arrays are initialized
          expect(Array.isArray(candidateDoc.documents)).toBe(true);
          expect(Array.isArray(candidateDoc.jobApplications)).toBe(true);
          expect(Array.isArray(candidateDoc.notes)).toBe(true);
          expect(Array.isArray(candidateDoc.professionalInfo.skills)).toBe(true);
          expect(Array.isArray(candidateDoc.pipelineInfo.stageHistory)).toBe(true);
          
          // Verify dates
          expect(candidateDoc.metadata.createdAt).toBeInstanceOf(Date);
          expect(candidateDoc.metadata.updatedAt).toBeInstanceOf(Date);
          expect(candidateDoc.pipelineInfo.appliedDate).toBeInstanceOf(Date);
        }
      ), { numRuns: 100 });
    });
  });
});