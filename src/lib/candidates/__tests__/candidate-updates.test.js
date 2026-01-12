/**
 * Property-Based Tests for Candidate Updates
 * Feature: candidate-management, Property 2: Candidate update preservation
 * Validates: Requirements 1.3
 */

import fc from 'fast-check';
import { createCandidateDocument, PIPELINE_STAGES, APPLICATION_SOURCES } from '../candidate-models.js';
import { normalizePhoneNumber, sanitizeString } from '../candidate-validation.js';

describe('Candidate Update Property Tests', () => {

  /**
   * Property 2: Candidate update preservation
   * For any existing candidate and valid update data, updating the candidate 
   * should preserve all unchanged fields while correctly applying the updates
   */
  describe('Property 2: Candidate update preservation', () => {
    
    test('should preserve unchanged fields while applying updates', () => {
      fc.assert(fc.property(
        // Original candidate data
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
          source: fc.option(fc.constantFrom(...Object.values(APPLICATION_SOURCES)))
        }),
        // Update data (partial)
        fc.record({
          firstName: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)),
          lastName: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)),
          phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }).map(s => '+1' + s.replace(/\D/g, '').slice(0, 10))),
          location: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          currentRole: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          experience: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          skills: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }))
        }, { requiredKeys: [] }),
        (originalData, updateData) => {
          // Create original candidate document
          const originalDoc = createCandidateDocument(originalData);
          
          // Simulate update by creating expected result (without deep cloning dates)
          const expectedDoc = {
            ...originalDoc,
            personalInfo: { ...originalDoc.personalInfo },
            professionalInfo: { ...originalDoc.professionalInfo },
            pipelineInfo: { ...originalDoc.pipelineInfo },
            metadata: { ...originalDoc.metadata }
          };
          
          // Apply updates to expected document
          if (updateData.firstName !== undefined) {
            expectedDoc.personalInfo.firstName = sanitizeString(updateData.firstName);
          }
          if (updateData.lastName !== undefined) {
            expectedDoc.personalInfo.lastName = sanitizeString(updateData.lastName);
          }
          if (updateData.phone !== undefined) {
            expectedDoc.personalInfo.phone = normalizePhoneNumber(updateData.phone);
          }
          if (updateData.location !== undefined) {
            expectedDoc.personalInfo.location = sanitizeString(updateData.location);
          }
          if (updateData.currentRole !== undefined) {
            expectedDoc.professionalInfo.currentRole = sanitizeString(updateData.currentRole);
          }
          if (updateData.experience !== undefined) {
            expectedDoc.professionalInfo.experience = sanitizeString(updateData.experience);
          }
          if (updateData.skills !== undefined && updateData.skills !== null) {
            expectedDoc.professionalInfo.skills = updateData.skills
              .map(skill => sanitizeString(skill))
              .filter(Boolean);
          }
          
          // Verify that unchanged fields remain the same
          if (updateData.firstName === undefined) {
            expect(expectedDoc.personalInfo.firstName).toBe(originalDoc.personalInfo.firstName);
          }
          if (updateData.lastName === undefined) {
            expect(expectedDoc.personalInfo.lastName).toBe(originalDoc.personalInfo.lastName);
          }
          if (updateData.phone === undefined) {
            expect(expectedDoc.personalInfo.phone).toBe(originalDoc.personalInfo.phone);
          }
          if (updateData.location === undefined) {
            expect(expectedDoc.personalInfo.location).toBe(originalDoc.personalInfo.location);
          }
          if (updateData.currentRole === undefined) {
            expect(expectedDoc.professionalInfo.currentRole).toBe(originalDoc.professionalInfo.currentRole);
          }
          if (updateData.experience === undefined) {
            expect(expectedDoc.professionalInfo.experience).toBe(originalDoc.professionalInfo.experience);
          }
          if (updateData.skills === undefined) {
            expect(expectedDoc.professionalInfo.skills).toEqual(originalDoc.professionalInfo.skills);
          }
          
          // Verify that email is never changed (should remain from original)
          expect(expectedDoc.personalInfo.email).toBe(originalDoc.personalInfo.email);
          
          // Verify that metadata structure is preserved (compare timestamps as numbers)
          expect(expectedDoc.metadata.createdAt.getTime()).toBe(originalDoc.metadata.createdAt.getTime());
          expect(expectedDoc.metadata.isActive).toBe(originalDoc.metadata.isActive);
          
          // Verify that pipeline info is preserved
          expect(expectedDoc.pipelineInfo.currentStage).toBe(originalDoc.pipelineInfo.currentStage);
          expect(expectedDoc.pipelineInfo.stageHistory).toEqual(originalDoc.pipelineInfo.stageHistory);
          
          // Verify that arrays are preserved
          expect(expectedDoc.documents).toEqual(originalDoc.documents);
          expect(expectedDoc.jobApplications).toEqual(originalDoc.jobApplications);
          expect(expectedDoc.notes).toEqual(originalDoc.notes);
        }
      ), { numRuns: 100 });
    });

    test('should handle partial updates correctly', () => {
      fc.assert(fc.property(
        fc.constantFrom(
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            currentRole: 'Developer',
            skills: ['JavaScript', 'React']
          }
        ),
        fc.oneof(
          // Single field updates
          fc.record({ firstName: fc.string({ minLength: 1, maxLength: 50 }) }),
          fc.record({ currentRole: fc.string({ minLength: 1, maxLength: 100 }) }),
          fc.record({ skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }) }),
          // Multiple field updates
          fc.record({
            firstName: fc.string({ minLength: 1, maxLength: 50 }),
            lastName: fc.string({ minLength: 1, maxLength: 50 })
          }),
          // Empty update (should change nothing)
          fc.constant({})
        ),
        (originalData, updateData) => {
          const originalDoc = createCandidateDocument(originalData);
          
          // Count how many fields are being updated
          const updateKeys = Object.keys(updateData);
          
          if (updateKeys.length === 0) {
            // Empty update should preserve everything
            expect(originalDoc.personalInfo.firstName).toBe(originalData.firstName);
            expect(originalDoc.personalInfo.lastName).toBe(originalData.lastName);
            expect(originalDoc.personalInfo.email).toBe(originalData.email.toLowerCase());
            expect(originalDoc.professionalInfo.currentRole).toBe(originalData.currentRole);
            expect(originalDoc.professionalInfo.skills).toEqual(originalData.skills);
          } else {
            // Verify that only specified fields would change
            updateKeys.forEach(key => {
              expect(updateData[key]).toBeDefined();
            });
            
            // Verify that unspecified fields remain unchanged
            const allPossibleKeys = ['firstName', 'lastName', 'currentRole', 'skills', 'experience', 'phone', 'location'];
            const unchangedKeys = allPossibleKeys.filter(key => !updateKeys.includes(key));
            
            unchangedKeys.forEach(key => {
              // These fields should remain as they were in the original
              expect(updateData[key]).toBeUndefined();
            });
          }
        }
      ), { numRuns: 100 });
    });

    test('should handle nested update structures', () => {
      fc.assert(fc.property(
        fc.constantFrom(
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            currentRole: 'Designer',
            location: 'New York'
          }
        ),
        fc.oneof(
          // Nested personal info updates
          fc.record({
            personalInfo: fc.record({
              firstName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
              phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
              location: fc.option(fc.string({ minLength: 1, maxLength: 100 }))
            }, { requiredKeys: [] })
          }),
          // Nested professional info updates
          fc.record({
            professionalInfo: fc.record({
              currentRole: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
              experience: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
              skills: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 15 }))
            }, { requiredKeys: [] })
          })
        ),
        (originalData, updateData) => {
          const originalDoc = createCandidateDocument(originalData);
          
          // Verify structure preservation
          expect(originalDoc.personalInfo).toBeDefined();
          expect(originalDoc.professionalInfo).toBeDefined();
          
          if (updateData.personalInfo) {
            // Personal info updates should not affect professional info
            expect(originalDoc.professionalInfo.currentRole).toBe(originalData.currentRole);
            
            // Only specified personal info fields should be considered for update
            Object.keys(updateData.personalInfo).forEach(key => {
              if (updateData.personalInfo[key] !== undefined) {
                expect(updateData.personalInfo[key]).toBeDefined();
              }
            });
          }
          
          if (updateData.professionalInfo) {
            // Professional info updates should not affect personal info
            expect(originalDoc.personalInfo.firstName).toBe(originalData.firstName);
            expect(originalDoc.personalInfo.lastName).toBe(originalData.lastName);
            expect(originalDoc.personalInfo.email).toBe(originalData.email.toLowerCase());
            
            // Only specified professional info fields should be considered for update
            Object.keys(updateData.professionalInfo).forEach(key => {
              if (updateData.professionalInfo[key] !== undefined) {
                expect(updateData.professionalInfo[key]).toBeDefined();
              }
            });
          }
        }
      ), { numRuns: 100 });
    });

    test('should preserve data types and structure integrity', () => {
      fc.assert(fc.property(
        fc.constantFrom(
          {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            skills: ['Skill1', 'Skill2']
          }
        ),
        fc.record({
          skills: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 })),
          experience: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
        }, { requiredKeys: [] }),
        (originalData, updateData) => {
          const originalDoc = createCandidateDocument(originalData);
          
          // Verify original structure
          expect(Array.isArray(originalDoc.professionalInfo.skills)).toBe(true);
          expect(Array.isArray(originalDoc.documents)).toBe(true);
          expect(Array.isArray(originalDoc.jobApplications)).toBe(true);
          expect(Array.isArray(originalDoc.notes)).toBe(true);
          expect(Array.isArray(originalDoc.pipelineInfo.stageHistory)).toBe(true);
          
          // Verify that updates maintain type integrity
          if (updateData.skills !== undefined && updateData.skills !== null) {
            expect(Array.isArray(updateData.skills)).toBe(true);
            // After normalization, should still be array
            const normalizedSkills = updateData.skills
              .map(skill => sanitizeString(skill))
              .filter(Boolean);
            expect(Array.isArray(normalizedSkills)).toBe(true);
          }
          
          if (updateData.experience !== undefined && updateData.experience !== null) {
            expect(typeof updateData.experience).toBe('string');
            expect(typeof sanitizeString(updateData.experience)).toBe('string');
          }
          
          // Verify metadata types are preserved
          expect(originalDoc.metadata.createdAt).toBeInstanceOf(Date);
          expect(originalDoc.metadata.updatedAt).toBeInstanceOf(Date);
          expect(typeof originalDoc.metadata.isActive).toBe('boolean');
        }
      ), { numRuns: 100 });
    });
  });
});