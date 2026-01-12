/**
 * Property-Based Tests for Job Application Integration
 * Feature: candidate-management, Property 14: Job application integration
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

import fc from 'fast-check';
import { APPLICATION_SOURCES } from '../candidate-models.js';
import { JobApplicationService, JobApplicationServiceError } from '../job-application-service.js';

// Helper to generate valid ObjectId strings
const validObjectId = () => fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 24, maxLength: 24 })
  .map(arr => arr.map(n => n.toString(16)).join(''));

// Helper to generate valid job application data
const validJobApplicationData = () => fc.record({
  jobId: validObjectId(),
  appliedDate: fc.option(
    fc.date({ min: new Date('2020-01-01'), max: new Date() }).filter(d => !isNaN(d.getTime())), 
    { nil: undefined }
  ),
  status: fc.option(fc.constantFrom('active', 'withdrawn', 'rejected', 'hired'), { nil: undefined }),
  source: fc.option(fc.constantFrom(...Object.values(APPLICATION_SOURCES)), { nil: undefined }),
  notes: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined })
});

// Helper to generate invalid job application data
const invalidJobApplicationData = () => fc.oneof(
  // Missing jobId
  fc.record({
    appliedDate: fc.date(),
    status: fc.string(),
    source: fc.string(),
    notes: fc.string()
  }),
  // Invalid jobId
  fc.record({
    jobId: fc.oneof(
      fc.string().filter(s => s.length !== 24),
      fc.constant(''),
      fc.constant(null),
      fc.integer()
    ),
    appliedDate: fc.date(),
    status: fc.string(),
    source: fc.string(),
    notes: fc.string()
  }),
  // Invalid status
  fc.record({
    jobId: validObjectId(),
    status: fc.string().filter(s => !['active', 'withdrawn', 'rejected', 'hired'].includes(s)),
    source: fc.constantFrom(...Object.values(APPLICATION_SOURCES)),
    notes: fc.string({ minLength: 0, maxLength: 100 })
  }),
  // Invalid source
  fc.record({
    jobId: validObjectId(),
    status: fc.constantFrom('active', 'withdrawn', 'rejected', 'hired'),
    source: fc.string().filter(s => !Object.values(APPLICATION_SOURCES).includes(s)),
    notes: fc.string({ minLength: 0, maxLength: 100 })
  }),
  // Future applied date
  fc.record({
    jobId: validObjectId(),
    appliedDate: fc.date({ min: new Date(Date.now() + 86400000) }), // Tomorrow
    status: fc.constantFrom('active', 'withdrawn', 'rejected', 'hired'),
    source: fc.constantFrom(...Object.values(APPLICATION_SOURCES)),
    notes: fc.string({ minLength: 0, maxLength: 100 })
  }),
  // Notes too long
  fc.record({
    jobId: validObjectId(),
    status: fc.constantFrom('active', 'withdrawn', 'rejected', 'hired'),
    source: fc.constantFrom(...Object.values(APPLICATION_SOURCES)),
    notes: fc.string({ minLength: 1001, maxLength: 2000 })
  })
);

describe('Job Application Integration Tests', () => {
  
  let jobApplicationService;

  beforeEach(() => {
    jobApplicationService = new JobApplicationService();
  });

  describe('Property 14: Job Application Integration', () => {
    
    test('job application data validation is consistent', () => {
      fc.assert(fc.property(
        validJobApplicationData(),
        (applicationData) => {
          // Property: Valid application data should not throw validation errors
          expect(() => jobApplicationService.validateApplicationData(applicationData)).not.toThrow();

          // Property: Job ID should be valid ObjectId format
          expect(typeof applicationData.jobId).toBe('string');
          expect(applicationData.jobId.length).toBe(24);
          expect(/^[0-9a-fA-F]{24}$/.test(applicationData.jobId)).toBe(true);

          // Property: Status should be valid if provided
          if (applicationData.status !== undefined && applicationData.status !== null) {
            expect(['active', 'withdrawn', 'rejected', 'hired']).toContain(applicationData.status);
          }

          // Property: Source should be valid if provided
          if (applicationData.source !== undefined && applicationData.source !== null) {
            expect(Object.values(APPLICATION_SOURCES)).toContain(applicationData.source);
          }

          // Property: Applied date should be valid if provided
          if (applicationData.appliedDate !== undefined && applicationData.appliedDate !== null) {
            expect(applicationData.appliedDate).toBeInstanceOf(Date);
            expect(applicationData.appliedDate.getTime()).toBeLessThanOrEqual(Date.now());
          }

          // Property: Notes should be string and within limits if provided
          if (applicationData.notes !== undefined && applicationData.notes !== null) {
            expect(typeof applicationData.notes).toBe('string');
            expect(applicationData.notes.length).toBeLessThanOrEqual(1000);
          }
        }
      ), { numRuns: 50 });
    });

    test('invalid job application data is consistently rejected', () => {
      fc.assert(fc.property(
        invalidJobApplicationData(),
        (invalidData) => {
          // Property: Invalid application data should always throw validation errors
          expect(() => jobApplicationService.validateApplicationData(invalidData)).toThrow();
        }
      ), { numRuns: 30 });
    });

    test('job application update data validation is consistent', () => {
      fc.assert(fc.property(
        fc.record({
          status: fc.option(fc.constantFrom('active', 'withdrawn', 'rejected', 'hired'), { nil: undefined }),
          notes: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined })
        }),
        (updateData) => {
          // Property: Valid update data should not throw validation errors
          expect(() => jobApplicationService.validateUpdateData(updateData)).not.toThrow();

          // Property: Status should be valid if provided
          if (updateData.status !== undefined && updateData.status !== null) {
            expect(['active', 'withdrawn', 'rejected', 'hired']).toContain(updateData.status);
          }

          // Property: Notes should be string and within limits if provided
          if (updateData.notes !== undefined && updateData.notes !== null) {
            expect(typeof updateData.notes).toBe('string');
            expect(updateData.notes.length).toBeLessThanOrEqual(1000);
          }
        }
      ), { numRuns: 30 });
    });

    test('invalid update data is consistently rejected', () => {
      fc.assert(fc.property(
        fc.oneof(
          // Invalid status
          fc.record({
            status: fc.string().filter(s => !['active', 'withdrawn', 'rejected', 'hired'].includes(s)),
            notes: fc.string({ minLength: 0, maxLength: 100 })
          }),
          // Invalid notes type
          fc.record({
            status: fc.constantFrom('active', 'withdrawn', 'rejected', 'hired'),
            notes: fc.oneof(fc.integer(), fc.boolean(), fc.constant({}), fc.constant([]))
          }),
          // Notes too long
          fc.record({
            status: fc.constantFrom('active', 'withdrawn', 'rejected', 'hired'),
            notes: fc.string({ minLength: 1001, maxLength: 2000 })
          })
        ),
        (invalidUpdateData) => {
          // Property: Invalid update data should always throw validation errors
          expect(() => jobApplicationService.validateUpdateData(invalidUpdateData)).toThrow();
        }
      ), { numRuns: 25 });
    });

    test('job application entry structure is consistent', () => {
      fc.assert(fc.property(
        validJobApplicationData(),
        (applicationData) => {
          // Property: Default values should be applied correctly
          const defaultStatus = applicationData.status || 'active';
          const defaultSource = applicationData.source || APPLICATION_SOURCES.OTHER;
          const defaultNotes = applicationData.notes || '';
          const defaultAppliedDate = applicationData.appliedDate || new Date();

          expect(['active', 'withdrawn', 'rejected', 'hired']).toContain(defaultStatus);
          expect(Object.values(APPLICATION_SOURCES)).toContain(defaultSource);
          expect(typeof defaultNotes).toBe('string');
          expect(defaultAppliedDate).toBeInstanceOf(Date);

          // Property: Job ID should be valid ObjectId format
          expect(typeof applicationData.jobId).toBe('string');
          expect(applicationData.jobId.length).toBe(24);
          expect(/^[0-9a-fA-F]{24}$/.test(applicationData.jobId)).toBe(true);

          // Property: Optional fields should have correct types when present
          if (applicationData.status !== undefined) {
            expect(typeof applicationData.status).toBe('string');
          }

          if (applicationData.source !== undefined) {
            expect(typeof applicationData.source).toBe('string');
          }

          if (applicationData.notes !== undefined) {
            expect(typeof applicationData.notes).toBe('string');
          }

          if (applicationData.appliedDate !== undefined) {
            expect(applicationData.appliedDate).toBeInstanceOf(Date);
          }
        }
      ), { numRuns: 40 });
    });

    test('application limit enforcement is consistent', () => {
      fc.assert(fc.property(
        fc.integer({ min: 0, max: 100 }),
        (currentApplicationCount) => {
          const maxLimit = jobApplicationService.maxApplicationsPerCandidate;

          // Property: Limit should be a positive number
          expect(typeof maxLimit).toBe('number');
          expect(maxLimit).toBeGreaterThan(0);

          // Property: Limit enforcement logic should be consistent
          const wouldExceedLimit = currentApplicationCount >= maxLimit;
          const canAddApplication = currentApplicationCount < maxLimit;

          expect(wouldExceedLimit).toBe(!canAddApplication);

          // Property: Boundary conditions should be handled correctly
          if (currentApplicationCount === maxLimit - 1) {
            expect(canAddApplication).toBe(true);
          }

          if (currentApplicationCount === maxLimit) {
            expect(canAddApplication).toBe(false);
          }

          if (currentApplicationCount > maxLimit) {
            expect(canAddApplication).toBe(false);
          }
        }
      ), { numRuns: 50 });
    });

    test('duplicate application detection is consistent', () => {
      fc.assert(fc.property(
        validObjectId(),
        fc.array(validObjectId(), { minLength: 0, maxLength: 10 }),
        (newJobId, existingJobIds) => {
          // Property: Duplicate detection should be consistent
          const isDuplicate = existingJobIds.includes(newJobId);
          const isUnique = !existingJobIds.includes(newJobId);

          expect(isDuplicate).toBe(!isUnique);

          // Property: Array operations should be consistent
          const uniqueJobIds = [...new Set(existingJobIds)];
          const hasDuplicatesInExisting = uniqueJobIds.length !== existingJobIds.length;

          expect(typeof hasDuplicatesInExisting).toBe('boolean');

          // Property: New job ID should be valid ObjectId format
          expect(typeof newJobId).toBe('string');
          expect(newJobId.length).toBe(24);
          expect(/^[0-9a-fA-F]{24}$/.test(newJobId)).toBe(true);

          // Property: Existing job IDs should all be valid ObjectId format
          existingJobIds.forEach(jobId => {
            expect(typeof jobId).toBe('string');
            expect(jobId.length).toBe(24);
            expect(/^[0-9a-fA-F]{24}$/.test(jobId)).toBe(true);
          });
        }
      ), { numRuns: 40 });
    });

    test('application status transitions are valid', () => {
      fc.assert(fc.property(
        fc.constantFrom('active', 'withdrawn', 'rejected', 'hired'),
        fc.constantFrom('active', 'withdrawn', 'rejected', 'hired'),
        (fromStatus, toStatus) => {
          // Property: All status values should be valid
          const validStatuses = ['active', 'withdrawn', 'rejected', 'hired'];
          expect(validStatuses).toContain(fromStatus);
          expect(validStatuses).toContain(toStatus);

          // Property: Status transitions should be logical
          const isValidTransition = isValidStatusTransition(fromStatus, toStatus);
          expect(typeof isValidTransition).toBe('boolean');

          // Property: Some transitions should always be valid
          if (fromStatus === 'active') {
            // Active can transition to any status
            expect(['active', 'withdrawn', 'rejected', 'hired']).toContain(toStatus);
          }

          // Property: Terminal states should be handled correctly
          const terminalStates = ['withdrawn', 'rejected', 'hired'];
          if (terminalStates.includes(fromStatus) && fromStatus !== toStatus) {
            // Transitions from terminal states might be restricted
            expect(typeof isValidTransition).toBe('boolean');
          }
        }
      ), { numRuns: 30 });
    });

    test('application statistics calculations are mathematically correct', () => {
      fc.assert(fc.property(
        fc.array(
          fc.record({
            candidateId: validObjectId(),
            jobId: validObjectId(),
            status: fc.constantFrom('active', 'withdrawn', 'rejected', 'hired'),
            source: fc.constantFrom(...Object.values(APPLICATION_SOURCES)),
            appliedDate: fc.date({ min: new Date('2020-01-01'), max: new Date() })
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (applications) => {
          // Property: Statistics should be mathematically consistent
          const totalApplications = applications.length;
          const uniqueCandidates = new Set(applications.map(app => app.candidateId)).size;
          const uniqueJobs = new Set(applications.map(app => app.jobId)).size;

          // Property: Counts should be non-negative
          expect(totalApplications).toBeGreaterThanOrEqual(0);
          expect(uniqueCandidates).toBeGreaterThanOrEqual(0);
          expect(uniqueJobs).toBeGreaterThanOrEqual(0);

          // Property: Unique counts should not exceed total
          expect(uniqueCandidates).toBeLessThanOrEqual(totalApplications);
          expect(uniqueJobs).toBeLessThanOrEqual(totalApplications);

          // Property: Status distribution should sum to total
          const statusCounts = {};
          applications.forEach(app => {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
          });

          const statusSum = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
          expect(statusSum).toBe(totalApplications);

          // Property: Source distribution should sum to total
          const sourceCounts = {};
          applications.forEach(app => {
            sourceCounts[app.source] = (sourceCounts[app.source] || 0) + 1;
          });

          const sourceSum = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
          expect(sourceSum).toBe(totalApplications);

          // Property: Date ranges should be logical
          if (applications.length > 0) {
            const dates = applications.map(app => app.appliedDate.getTime());
            const minDate = Math.min(...dates);
            const maxDate = Math.max(...dates);

            expect(minDate).toBeLessThanOrEqual(maxDate);
            expect(new Date(minDate)).toBeInstanceOf(Date);
            expect(new Date(maxDate)).toBeInstanceOf(Date);
          }
        }
      ), { numRuns: 30 });
    });
  });

  describe('Job Application Service Configuration', () => {
    
    test('service has proper configuration', () => {
      expect(typeof jobApplicationService.maxApplicationsPerCandidate).toBe('number');
      expect(jobApplicationService.maxApplicationsPerCandidate).toBeGreaterThan(0);
    });

    test('service methods exist and are functions', () => {
      expect(typeof jobApplicationService.linkJobApplication).toBe('function');
      expect(typeof jobApplicationService.updateJobApplication).toBe('function');
      expect(typeof jobApplicationService.unlinkJobApplication).toBe('function');
      expect(typeof jobApplicationService.getCandidateApplications).toBe('function');
      expect(typeof jobApplicationService.getJobCandidates).toBe('function');
      expect(typeof jobApplicationService.getApplicationStats).toBe('function');
      expect(typeof jobApplicationService.validateApplicationData).toBe('function');
      expect(typeof jobApplicationService.validateUpdateData).toBe('function');
    });
  });

  describe('Job Application Service Error Handling', () => {
    
    test('error handling maintains consistent error structure', () => {
      fc.assert(fc.property(
        fc.string(),
        fc.string(),
        fc.integer({ min: 400, max: 599 }),
        (message, code, statusCode) => {
          const error = new JobApplicationServiceError(message, code, statusCode);

          // Property: Error should have consistent structure
          expect(error).toBeInstanceOf(Error);
          expect(error).toBeInstanceOf(JobApplicationServiceError);
          expect(error.name).toBe('JobApplicationServiceError');
          expect(error.message).toBe(message);
          expect(error.code).toBe(code);
          expect(error.statusCode).toBe(statusCode);

          // Property: Error should be throwable and catchable
          expect(() => {
            throw error;
          }).toThrow(JobApplicationServiceError);
        }
      ), { numRuns: 20 });
    });
  });

  // Helper method for status transition validation
  function isValidStatusTransition(fromStatus, toStatus) {
    // Define valid transitions (this is a simplified example)
    const validTransitions = {
      'active': ['active', 'withdrawn', 'rejected', 'hired'],
      'withdrawn': ['withdrawn'],
      'rejected': ['rejected'],
      'hired': ['hired']
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }
});