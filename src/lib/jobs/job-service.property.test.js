/**
 * Property-Based Tests for Job Service
 * Tests universal properties of job service operations using fast-check
 */

import fc from 'fast-check';
import { createJob, getJobById, getJobsByUser } from './job-service.js';
import { getJobsCollection } from './job-service.js';
import { DEPARTMENTS, EMPLOYMENT_TYPES } from './job-validation.js';
import { ObjectId } from 'mongodb';

// Feature: job-management, Property 2: Database Persistence
// Feature: job-management, Property 3: Unique Identifier Assignment  
// Feature: job-management, Property 4: Automatic Timestamp Generation

// Helper generators for valid job data
const validJobGen = fc.record({
  title: fc.string({ minLength: 3, maxLength: 50 })
    .map(s => s.replace(/[^a-zA-Z0-9\s\-\(\)\.\,\/&]/g, 'A'))
    .filter(s => s.trim().length >= 3),
  department: fc.constantFrom(...DEPARTMENTS),
  type: fc.constantFrom(...EMPLOYMENT_TYPES),
  location: fc.string({ minLength: 2, maxLength: 50 })
    .map(s => s.replace(/[^a-zA-Z0-9\s\-\/\,\(\)]/g, 'A'))
    .filter(s => s.trim().length >= 2),
  salary: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  description: fc.string({ minLength: 50, maxLength: 200 })
    .map(s => s.padEnd(50, 'A'))
    .filter(s => s.length >= 50),
  requirements: fc.string({ minLength: 50, maxLength: 200 })
    .map(s => s.padEnd(50, 'A'))
    .filter(s => s.length >= 50)
});

const validUserIdGen = fc.string({ minLength: 24, maxLength: 24 })
  .map(() => new ObjectId().toString());

describe('Job Service Properties', () => {

  // Clean up test data after each test
  afterEach(async () => {
    try {
      const jobsCollection = await getJobsCollection();
      await jobsCollection.deleteMany({ title: { $regex: /^Test/ } });
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  /**
   * Property 2: Database Persistence
   * For any valid job data, when successfully validated and saved, the job should be 
   * retrievable from the 'jobs' MongoDB collection with all original data intact.
   */
  test('Property 2: Database Persistence - jobs persist correctly in database', () => {
    return fc.assert(
      fc.asyncProperty(
        validJobGen,
        validUserIdGen,
        async (jobData, userId) => {
          // Ensure test data is identifiable
          const testJobData = {
            ...jobData,
            title: `Test ${jobData.title}`
          };

          // Create job
          const createdJob = await createJob(testJobData, userId);
          
          // Verify job was created
          expect(createdJob).toBeDefined();
          expect(createdJob.id).toBeDefined();
          
          // Retrieve job from database
          const retrievedJob = await getJobById(createdJob.id);
          
          // Verify job was persisted correctly
          expect(retrievedJob).toBeDefined();
          expect(retrievedJob.title).toBe(testJobData.title);
          expect(retrievedJob.department).toBe(testJobData.department);
          expect(retrievedJob.type).toBe(testJobData.type);
          expect(retrievedJob.location).toBe(testJobData.location);
          expect(retrievedJob.description).toBe(testJobData.description);
          expect(retrievedJob.requirements).toBe(testJobData.requirements);
          expect(retrievedJob.createdBy).toBe(userId);
          
          // Handle optional salary field
          if (testJobData.salary) {
            expect(retrievedJob.salary).toBe(testJobData.salary);
          } else {
            expect(retrievedJob.salary).toBeNull();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3: Unique Identifier Assignment
   * For any successfully created job, the system should assign a unique MongoDB ObjectId 
   * that can be used to identify and retrieve that specific job.
   */
  test('Property 3: Unique Identifier Assignment - each job gets unique ID', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.array(validJobGen, { minLength: 2, maxLength: 5 }),
        validUserIdGen,
        async (jobDataArray, userId) => {
          const createdJobs = [];
          
          // Create multiple jobs
          for (const jobData of jobDataArray) {
            const testJobData = {
              ...jobData,
              title: `Test ${jobData.title} ${Math.random()}`
            };
            
            const createdJob = await createJob(testJobData, userId);
            createdJobs.push(createdJob);
          }
          
          // Verify all jobs have unique IDs
          const jobIds = createdJobs.map(job => job.id);
          const uniqueIds = new Set(jobIds);
          
          expect(uniqueIds.size).toBe(jobIds.length);
          
          // Verify all IDs are valid ObjectIds
          jobIds.forEach(id => {
            expect(ObjectId.isValid(id)).toBe(true);
          });
          
          // Verify each job can be retrieved by its unique ID
          for (const createdJob of createdJobs) {
            const retrievedJob = await getJobById(createdJob.id);
            expect(retrievedJob).toBeDefined();
            expect(retrievedJob.id).toBe(createdJob.id);
            expect(retrievedJob.title).toBe(createdJob.title);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 4: Automatic Timestamp Generation
   * For any job creation, the system should automatically generate valid createdAt 
   * and updatedAt timestamps that reflect the creation time.
   */
  test('Property 4: Automatic Timestamp Generation - timestamps are generated correctly', () => {
    return fc.assert(
      fc.asyncProperty(
        validJobGen,
        validUserIdGen,
        async (jobData, userId) => {
          const testJobData = {
            ...jobData,
            title: `Test ${jobData.title}`
          };

          const beforeCreation = new Date();
          
          // Create job
          const createdJob = await createJob(testJobData, userId);
          
          const afterCreation = new Date();
          
          // Verify timestamps exist and are valid dates
          expect(createdJob.createdAt).toBeDefined();
          expect(createdJob.updatedAt).toBeDefined();
          expect(createdJob.createdAt instanceof Date).toBe(true);
          expect(createdJob.updatedAt instanceof Date).toBe(true);
          
          // Verify timestamps are within reasonable range
          expect(createdJob.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
          expect(createdJob.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
          expect(createdJob.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
          expect(createdJob.updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
          
          // Verify createdAt and updatedAt are the same for new jobs
          expect(Math.abs(createdJob.createdAt.getTime() - createdJob.updatedAt.getTime())).toBeLessThan(1000);
          
          // Verify timestamps persist in database
          const retrievedJob = await getJobById(createdJob.id);
          expect(retrievedJob.createdAt instanceof Date).toBe(true);
          expect(retrievedJob.updatedAt instanceof Date).toBe(true);
          expect(retrievedJob.createdAt.getTime()).toBe(createdJob.createdAt.getTime());
          expect(retrievedJob.updatedAt.getTime()).toBe(createdJob.updatedAt.getTime());
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Property: Job retrieval by user works correctly', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.array(validJobGen, { minLength: 1, maxLength: 3 }),
        validUserIdGen,
        validUserIdGen,
        async (jobDataArray, userId1, userId2) => {
          const user1Jobs = [];
          const user2Jobs = [];
          
          // Create jobs for user 1
          for (const jobData of jobDataArray.slice(0, Math.ceil(jobDataArray.length / 2))) {
            const testJobData = {
              ...jobData,
              title: `Test User1 ${jobData.title} ${Math.random()}`
            };
            
            const createdJob = await createJob(testJobData, userId1);
            user1Jobs.push(createdJob);
          }
          
          // Create jobs for user 2
          for (const jobData of jobDataArray.slice(Math.ceil(jobDataArray.length / 2))) {
            const testJobData = {
              ...jobData,
              title: `Test User2 ${jobData.title} ${Math.random()}`
            };
            
            const createdJob = await createJob(testJobData, userId2);
            user2Jobs.push(createdJob);
          }
          
          // Retrieve jobs for each user
          const retrievedUser1Jobs = await getJobsByUser(userId1);
          const retrievedUser2Jobs = await getJobsByUser(userId2);
          
          // Filter to only test jobs
          const testUser1Jobs = retrievedUser1Jobs.filter(job => job.title.startsWith('Test User1'));
          const testUser2Jobs = retrievedUser2Jobs.filter(job => job.title.startsWith('Test User2'));
          
          // Verify correct number of jobs returned
          expect(testUser1Jobs.length).toBe(user1Jobs.length);
          expect(testUser2Jobs.length).toBe(user2Jobs.length);
          
          // Verify all returned jobs belong to correct user
          testUser1Jobs.forEach(job => {
            expect(job.createdBy).toBe(userId1);
          });
          
          testUser2Jobs.forEach(job => {
            expect(job.createdBy).toBe(userId2);
          });
          
          // Verify job IDs match
          const user1JobIds = user1Jobs.map(job => job.id).sort();
          const retrievedUser1JobIds = testUser1Jobs.map(job => job.id).sort();
          expect(retrievedUser1JobIds).toEqual(user1JobIds);
          
          const user2JobIds = user2Jobs.map(job => job.id).sort();
          const retrievedUser2JobIds = testUser2Jobs.map(job => job.id).sort();
          expect(retrievedUser2JobIds).toEqual(user2JobIds);
        }
      ),
      { numRuns: 10 }
    );
  });

});