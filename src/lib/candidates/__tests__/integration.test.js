/**
 * Integration Tests for Candidate Management System
 * Tests complete workflows and component integration
 */

import { candidateService } from '../candidate-service.js';
import { pipelineService } from '../pipeline-service.js';
import { documentService } from '../document-service.js';
import { searchService } from '../search-service.js';
import { jobApplicationService } from '../job-application-service.js';
import { getCandidatesCollection, initializeCandidatesCollection } from '../candidate-db.js';

describe('Candidate Management Integration Tests', () => {
  let testCandidateId;
  let testJobId = '507f1f77bcf86cd799439011'; // Mock job ID

  beforeAll(async () => {
    await initializeCandidatesCollection();
  });

  afterEach(async () => {
    // Clean up test data
    if (testCandidateId) {
      try {
        await candidateService.deleteCandidate(testCandidateId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Complete Candidate Lifecycle', () => {
    test('should handle complete candidate creation to hiring workflow', async () => {
      // Step 1: Create a new candidate
      const candidateData = {
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration.test@example.com',
        phone: '+1-555-123-4567',
        location: 'San Francisco, CA',
        appliedForRole: 'Senior Developer',
        experience: '5 years',
        skills: ['JavaScript', 'React', 'Node.js'],
        source: 'linkedin'
      };

      const createdCandidate = await candidateService.createCandidate(candidateData);
      testCandidateId = createdCandidate._id.toString();

      expect(createdCandidate).toBeDefined();
      expect(createdCandidate.personalInfo.email).toBe(candidateData.email);
      expect(createdCandidate.pipelineInfo.currentStage).toBe('applied');

      // Step 2: Move through pipeline stages
      const stages = ['screening', 'interview', 'offer', 'hired'];
      
      for (const stage of stages) {
        await pipelineService.updateCandidateStage(testCandidateId, stage);
        
        const updatedCandidate = await candidateService.getCandidateById(testCandidateId);
        expect(updatedCandidate.pipelineInfo.currentStage).toBe(stage);
        
        // Verify stage history is tracked
        const stageHistory = updatedCandidate.pipelineInfo.stageHistory;
        const currentStageEntry = stageHistory.find(entry => entry.stage === stage);
        expect(currentStageEntry).toBeDefined();
        expect(currentStageEntry.timestamp).toBeDefined();
      }

      // Step 3: Add documents
      const mockDocument = {
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('mock pdf content')
      };

      const uploadedDoc = await documentService.uploadDocument(
        testCandidateId,
        mockDocument,
        'resume'
      );

      expect(uploadedDoc).toBeDefined();
      expect(uploadedDoc.originalName).toBe(mockDocument.originalName);

      // Step 4: Link to job application
      await jobApplicationService.linkCandidateToJob(testCandidateId, testJobId);
      
      const candidateJobs = await jobApplicationService.getCandidateJobs(testCandidateId);
      expect(candidateJobs).toHaveLength(1);
      expect(candidateJobs[0].jobId.toString()).toBe(testJobId);

      // Step 5: Search and verify candidate is findable
      const searchResults = await searchService.searchCandidates('Integration Test');
      expect(searchResults.candidates).toHaveLength(1);
      expect(searchResults.candidates[0]._id.toString()).toBe(testCandidateId);

      // Step 6: Filter by skills
      const skillFilterResults = await searchService.filterCandidates({
        skills: ['JavaScript']
      });
      
      const foundCandidate = skillFilterResults.candidates.find(
        c => c._id.toString() === testCandidateId
      );
      expect(foundCandidate).toBeDefined();
    });

    test('should handle candidate data updates correctly', async () => {
      // Create candidate
      const candidateData = {
        firstName: 'Update',
        lastName: 'Test',
        email: 'update.test@example.com',
        appliedForRole: 'Developer'
      };

      const createdCandidate = await candidateService.createCandidate(candidateData);
      testCandidateId = createdCandidate._id.toString();

      // Update personal information
      const personalUpdates = {
        phone: '+1-555-999-8888',
        location: 'New York, NY'
      };

      const updatedCandidate = await candidateService.updateCandidate(
        testCandidateId,
        personalUpdates
      );

      expect(updatedCandidate.personalInfo.phone).toBe('+15559998888'); // Normalized
      expect(updatedCandidate.personalInfo.location).toBe(personalUpdates.location);

      // Update professional information
      const professionalUpdates = {
        skills: ['Python', 'Django', 'PostgreSQL'],
        experience: '3 years'
      };

      const updatedCandidate2 = await candidateService.updateCandidate(
        testCandidateId,
        professionalUpdates
      );

      expect(updatedCandidate2.professionalInfo.skills).toEqual(professionalUpdates.skills);
      expect(updatedCandidate2.professionalInfo.experience).toBe(professionalUpdates.experience);
    });

    test('should handle document management workflow', async () => {
      // Create candidate
      const candidateData = {
        firstName: 'Document',
        lastName: 'Test',
        email: 'document.test@example.com'
      };

      const createdCandidate = await candidateService.createCandidate(candidateData);
      testCandidateId = createdCandidate._id.toString();

      // Upload multiple documents
      const documents = [
        {
          originalName: 'resume.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          buffer: Buffer.from('resume content'),
          type: 'resume'
        },
        {
          originalName: 'cover-letter.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1536,
          buffer: Buffer.from('cover letter content'),
          type: 'cover_letter'
        }
      ];

      const uploadedDocs = [];
      for (const doc of documents) {
        const uploaded = await documentService.uploadDocument(
          testCandidateId,
          doc,
          doc.type
        );
        uploadedDocs.push(uploaded);
      }

      expect(uploadedDocs).toHaveLength(2);

      // List documents
      const candidateDocuments = await documentService.getCandidateDocuments(testCandidateId);
      expect(candidateDocuments).toHaveLength(2);

      // Retrieve specific document
      const resumeDoc = uploadedDocs.find(doc => doc.documentType === 'resume');
      const retrievedDoc = await documentService.getDocument(testCandidateId, resumeDoc._id);
      
      expect(retrievedDoc).toBeDefined();
      expect(retrievedDoc.originalName).toBe('resume.pdf');

      // Delete document
      await documentService.deleteDocument(testCandidateId, resumeDoc._id);
      
      const remainingDocs = await documentService.getCandidateDocuments(testCandidateId);
      expect(remainingDocs).toHaveLength(1);
    });

    test('should handle search and filtering integration', async () => {
      // Create multiple test candidates
      const candidates = [
        {
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice.johnson@example.com',
          location: 'San Francisco, CA',
          appliedForRole: 'Frontend Developer',
          skills: ['React', 'JavaScript', 'CSS'],
          experience: '3 years',
          source: 'linkedin'
        },
        {
          firstName: 'Bob',
          lastName: 'Smith',
          email: 'bob.smith@example.com',
          location: 'New York, NY',
          appliedForRole: 'Backend Developer',
          skills: ['Node.js', 'Python', 'MongoDB'],
          experience: '5 years',
          source: 'website'
        },
        {
          firstName: 'Carol',
          lastName: 'Davis',
          email: 'carol.davis@example.com',
          location: 'Austin, TX',
          appliedForRole: 'Full Stack Developer',
          skills: ['React', 'Node.js', 'PostgreSQL'],
          experience: '4 years',
          source: 'referral'
        }
      ];

      const createdCandidates = [];
      for (const candidateData of candidates) {
        const created = await candidateService.createCandidate(candidateData);
        createdCandidates.push(created);
      }

      // Store IDs for cleanup
      testCandidateId = createdCandidates.map(c => c._id.toString());

      // Test text search
      const searchResults = await searchService.searchCandidates('Frontend');
      expect(searchResults.candidates).toHaveLength(1);
      expect(searchResults.candidates[0].professionalInfo.appliedForRole).toBe('Frontend Developer');

      // Test skill filtering
      const reactResults = await searchService.filterCandidates({
        skills: ['React']
      });
      expect(reactResults.candidates).toHaveLength(2); // Alice and Carol

      // Test location filtering
      const sfResults = await searchService.filterCandidates({
        location: 'San Francisco'
      });
      expect(sfResults.candidates).toHaveLength(1);
      expect(sfResults.candidates[0].personalInfo.firstName).toBe('Alice');

      // Test experience filtering
      const experiencedResults = await searchService.filterCandidates({
        experience: '5'
      });
      expect(experiencedResults.candidates).toHaveLength(1);
      expect(experiencedResults.candidates[0].personalInfo.firstName).toBe('Bob');

      // Test combined filtering
      const combinedResults = await searchService.filterCandidates({
        skills: ['Node.js'],
        location: 'Austin'
      });
      expect(combinedResults.candidates).toHaveLength(1);
      expect(combinedResults.candidates[0].personalInfo.firstName).toBe('Carol');

      // Cleanup multiple candidates
      for (const candidateId of testCandidateId) {
        await candidateService.deleteCandidate(candidateId);
      }
      testCandidateId = null; // Prevent double cleanup
    });

    test('should handle error scenarios gracefully', async () => {
      // Test invalid candidate ID
      await expect(
        candidateService.getCandidateById('invalid-id')
      ).rejects.toThrow('Invalid candidate ID format');

      // Test duplicate email
      const candidateData = {
        firstName: 'Duplicate',
        lastName: 'Test',
        email: 'duplicate.test@example.com'
      };

      const firstCandidate = await candidateService.createCandidate(candidateData);
      testCandidateId = firstCandidate._id.toString();

      await expect(
        candidateService.createCandidate(candidateData)
      ).rejects.toThrow('A candidate with this email address already exists');

      // Test updating non-existent candidate
      await expect(
        candidateService.updateCandidate('507f1f77bcf86cd799439012', { firstName: 'Updated' })
      ).rejects.toThrow('Candidate not found');

      // Test invalid stage transition
      await expect(
        pipelineService.updateCandidateStage(testCandidateId, 'hired') // Skip intermediate stages
      ).rejects.toThrow('Invalid stage transition');
    });
  });

  describe('API Integration', () => {
    test('should validate API response formats', async () => {
      // Create candidate for API testing
      const candidateData = {
        firstName: 'API',
        lastName: 'Test',
        email: 'api.test@example.com'
      };

      const createdCandidate = await candidateService.createCandidate(candidateData);
      testCandidateId = createdCandidate._id.toString();

      // Verify candidate structure matches API expectations
      expect(createdCandidate).toHaveProperty('_id');
      expect(createdCandidate).toHaveProperty('personalInfo');
      expect(createdCandidate).toHaveProperty('professionalInfo');
      expect(createdCandidate).toHaveProperty('pipelineInfo');
      expect(createdCandidate).toHaveProperty('metadata');

      expect(createdCandidate.personalInfo).toHaveProperty('firstName');
      expect(createdCandidate.personalInfo).toHaveProperty('lastName');
      expect(createdCandidate.personalInfo).toHaveProperty('email');

      expect(createdCandidate.pipelineInfo).toHaveProperty('currentStage');
      expect(createdCandidate.pipelineInfo).toHaveProperty('stageHistory');

      expect(createdCandidate.metadata).toHaveProperty('createdAt');
      expect(createdCandidate.metadata).toHaveProperty('updatedAt');
      expect(createdCandidate.metadata).toHaveProperty('isActive');
    });
  });
});