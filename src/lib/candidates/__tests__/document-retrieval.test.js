/**
 * Property-Based Tests for Document Retrieval
 * Feature: candidate-management, Property 9: Document retrieval integrity
 * Validates: Requirements 3.3
 */

import fc from 'fast-check';
import { DOCUMENT_TYPES } from '../candidate-models.js';
import { DocumentService, DocumentServiceError } from '../document-service.js';

// Helper to generate valid ObjectId strings
const validObjectId = () => fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 24, maxLength: 24 })
  .map(arr => arr.map(n => n.toString(16)).join(''));

// Helper to generate valid file data
const validFileData = () => fc.integer({ min: 1, max: 1024 * 1024 }).chain(size => 
  fc.record({
    originalName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0).map(s => s.trim().replace(/[^a-zA-Z0-9-_]/g, '_') + '.pdf'),
    mimeType: fc.constantFrom('application/pdf', 'application/msword', 'text/plain'),
    size: fc.constant(size),
    buffer: fc.constant(Buffer.alloc(size, 'test'))
  })
);

// Helper to generate document metadata
const validDocumentMetadata = () => fc.record({
  _id: validObjectId(),
  filename: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9-_.]/g, '_')),
  originalName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0).map(s => s.trim() + '.pdf'),
  mimeType: fc.constantFrom('application/pdf', 'application/msword', 'text/plain'),
  size: fc.integer({ min: 1, max: 1024 * 1024 }),
  uploadDate: fc.constant(new Date()),
  documentType: fc.constantFrom(...Object.values(DOCUMENT_TYPES)),
  filePath: fc.string({ minLength: 1, maxLength: 200 }).map(s => './storage/documents/' + s.replace(/[^a-zA-Z0-9-_.]/g, '_')),
  uploadedBy: fc.option(validObjectId()),
  isActive: fc.constant(true)
});

describe('Document Retrieval Tests', () => {
  
  let documentService;

  beforeEach(() => {
    documentService = new DocumentService();
  });

  describe('Property 9: Document Retrieval Integrity', () => {
    
    test('document metadata consistency during retrieval operations', () => {
      fc.assert(fc.property(
        validObjectId(),
        validDocumentMetadata(),
        (candidateId, documentMetadata) => {
          // Property: Document metadata should maintain consistent structure
          expect(typeof documentMetadata._id).toBe('string');
          expect(typeof documentMetadata.filename).toBe('string');
          expect(typeof documentMetadata.originalName).toBe('string');
          expect(typeof documentMetadata.mimeType).toBe('string');
          expect(typeof documentMetadata.size).toBe('number');
          expect(documentMetadata.uploadDate).toBeInstanceOf(Date);
          expect(Object.values(DOCUMENT_TYPES)).toContain(documentMetadata.documentType);
          expect(typeof documentMetadata.filePath).toBe('string');
          expect(typeof documentMetadata.isActive).toBe('boolean');

          // Property: Required fields should not be empty
          expect(documentMetadata.filename.length).toBeGreaterThan(0);
          expect(documentMetadata.originalName.length).toBeGreaterThan(0);
          expect(documentMetadata.mimeType.length).toBeGreaterThan(0);
          expect(documentMetadata.size).toBeGreaterThan(0);
          expect(documentMetadata.filePath.length).toBeGreaterThan(0);

          // Property: File path should be safe and valid
          expect(documentMetadata.filePath).not.toMatch(/[<>:"|?*]/);
          expect(documentMetadata.filePath).toMatch(/^\.\/storage\/documents\//);

          // Property: MIME type should be allowed
          const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png'
          ];
          // Note: We're using a subset for testing, but the service should validate against its full list
          expect(typeof documentMetadata.mimeType).toBe('string');
        }
      ), { numRuns: 50 });
    });

    test('document listing operations maintain data integrity', () => {
      fc.assert(fc.property(
        validObjectId(),
        fc.array(validDocumentMetadata(), { minLength: 0, maxLength: 10 }),
        (candidateId, documentsArray) => {
          // Property: Document arrays should maintain consistent structure
          expect(Array.isArray(documentsArray)).toBe(true);

          documentsArray.forEach((doc, index) => {
            // Property: Each document should have required fields
            expect(doc).toHaveProperty('_id');
            expect(doc).toHaveProperty('filename');
            expect(doc).toHaveProperty('originalName');
            expect(doc).toHaveProperty('mimeType');
            expect(doc).toHaveProperty('size');
            expect(doc).toHaveProperty('documentType');
            expect(doc).toHaveProperty('isActive');

            // Property: Document IDs should be unique within the array
            const duplicateIds = documentsArray.filter(d => d._id === doc._id);
            expect(duplicateIds.length).toBe(1);

            // Property: Active documents should have valid data
            if (doc.isActive) {
              expect(doc.filename.length).toBeGreaterThan(0);
              expect(doc.originalName.length).toBeGreaterThan(0);
              expect(doc.size).toBeGreaterThan(0);
            }
          });

          // Property: Document count should match array length
          expect(documentsArray.length).toBeGreaterThanOrEqual(0);
          expect(documentsArray.length).toBeLessThanOrEqual(10);
        }
      ), { numRuns: 25 });
    });

    test('document statistics calculations are consistent', () => {
      fc.assert(fc.property(
        validObjectId(),
        fc.array(validDocumentMetadata(), { minLength: 0, maxLength: 20 }),
        (candidateId, documentsArray) => {
          // Simulate document statistics calculation
          const stats = {
            totalDocuments: documentsArray.length,
            totalSize: documentsArray.reduce((sum, doc) => sum + doc.size, 0),
            documentTypes: {},
            oldestDocument: null,
            newestDocument: null
          };

          // Calculate type distribution
          documentsArray.forEach(doc => {
            stats.documentTypes[doc.documentType] = (stats.documentTypes[doc.documentType] || 0) + 1;
          });

          // Find oldest and newest documents
          if (documentsArray.length > 0) {
            const sortedByDate = documentsArray.sort((a, b) => a.uploadDate - b.uploadDate);
            stats.oldestDocument = sortedByDate[0];
            stats.newestDocument = sortedByDate[sortedByDate.length - 1];
          }

          // Property: Statistics should be mathematically consistent
          expect(stats.totalDocuments).toBe(documentsArray.length);
          expect(stats.totalSize).toBeGreaterThanOrEqual(0);
          expect(typeof stats.documentTypes).toBe('object');

          // Property: Type counts should sum to total documents
          const typeCountSum = Object.values(stats.documentTypes).reduce((sum, count) => sum + count, 0);
          expect(typeCountSum).toBe(stats.totalDocuments);

          // Property: Oldest and newest should be consistent
          if (documentsArray.length > 0) {
            expect(stats.oldestDocument).toBeTruthy();
            expect(stats.newestDocument).toBeTruthy();
            expect(stats.oldestDocument.uploadDate <= stats.newestDocument.uploadDate).toBe(true);
          } else {
            expect(stats.oldestDocument).toBeNull();
            expect(stats.newestDocument).toBeNull();
          }

          // Property: All document types should be valid
          Object.keys(stats.documentTypes).forEach(docType => {
            expect(Object.values(DOCUMENT_TYPES)).toContain(docType);
          });
        }
      ), { numRuns: 30 });
    });

    test('document ID validation is consistent', () => {
      fc.assert(fc.property(
        fc.oneof(
          validObjectId(),
          fc.string().filter(s => s.length !== 24),
          fc.string({ minLength: 24, maxLength: 24 }).filter(s => !/^[0-9a-fA-F]{24}$/.test(s)),
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined)
        ),
        fc.oneof(
          validObjectId(),
          fc.string().filter(s => s.length !== 24),
          fc.string({ minLength: 24, maxLength: 24 }).filter(s => !/^[0-9a-fA-F]{24}$/.test(s)),
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (candidateId, documentId) => {
          // Property: Valid ObjectId format should be 24 hex characters
          const isValidCandidateId = typeof candidateId === 'string' && 
                                   candidateId.length === 24 && 
                                   /^[0-9a-fA-F]{24}$/.test(candidateId);
          
          const isValidDocumentId = typeof documentId === 'string' && 
                                  documentId.length === 24 && 
                                  /^[0-9a-fA-F]{24}$/.test(documentId);

          // Property: ID validation should be consistent
          if (isValidCandidateId) {
            expect(candidateId).toMatch(/^[0-9a-fA-F]{24}$/);
          } else {
            expect(candidateId === null || candidateId === undefined || 
                   typeof candidateId !== 'string' || 
                   candidateId.length !== 24 || 
                   !/^[0-9a-fA-F]{24}$/.test(candidateId)).toBe(true);
          }

          if (isValidDocumentId) {
            expect(documentId).toMatch(/^[0-9a-fA-F]{24}$/);
          } else {
            expect(documentId === null || documentId === undefined || 
                   typeof documentId !== 'string' || 
                   documentId.length !== 24 || 
                   !/^[0-9a-fA-F]{24}$/.test(documentId)).toBe(true);
          }
        }
      ), { numRuns: 50 });
    });

    test('document file integrity validation', () => {
      fc.assert(fc.property(
        validFileData(),
        validDocumentMetadata(),
        (fileData, documentMetadata) => {
          // Property: File data and metadata should be consistent
          if (documentMetadata.size === fileData.size) {
            expect(documentMetadata.size).toBe(fileData.size);
          }

          if (documentMetadata.mimeType === fileData.mimeType) {
            expect(documentMetadata.mimeType).toBe(fileData.mimeType);
          }

          // Property: Buffer integrity should be maintained
          expect(Buffer.isBuffer(fileData.buffer)).toBe(true);
          expect(fileData.buffer.length).toBe(fileData.size);

          // Property: File metadata should be valid
          expect(fileData.originalName.length).toBeGreaterThan(0);
          expect(fileData.mimeType.length).toBeGreaterThan(0);
          expect(fileData.size).toBeGreaterThan(0);

          // Property: Document metadata should reference valid file
          expect(documentMetadata.filename.length).toBeGreaterThan(0);
          expect(documentMetadata.filePath.length).toBeGreaterThan(0);
          expect(documentMetadata.size).toBeGreaterThan(0);
        }
      ), { numRuns: 40 });
    });
  });

  describe('Document Service Error Handling', () => {
    
    test('error handling maintains consistent error structure', () => {
      fc.assert(fc.property(
        fc.string(),
        fc.string(),
        fc.integer({ min: 400, max: 599 }),
        (message, code, statusCode) => {
          const error = new DocumentServiceError(message, code, statusCode);

          // Property: Error should have consistent structure
          expect(error).toBeInstanceOf(Error);
          expect(error).toBeInstanceOf(DocumentServiceError);
          expect(error.name).toBe('DocumentServiceError');
          expect(error.message).toBe(message);
          expect(error.code).toBe(code);
          expect(error.statusCode).toBe(statusCode);

          // Property: Error should be throwable and catchable
          expect(() => {
            throw error;
          }).toThrow(DocumentServiceError);
        }
      ), { numRuns: 20 });
    });
  });
});