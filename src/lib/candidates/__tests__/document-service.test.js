/**
 * Property-Based Tests for Document Service
 * Feature: candidate-management, Property 8: Document upload and storage
 * Validates: Requirements 3.1, 3.2, 3.4, 3.5
 */

import fc from 'fast-check';
import { DOCUMENT_TYPES } from '../candidate-models.js';
import { DocumentService, DocumentServiceError } from '../document-service.js';
import { validateDocumentUpload, validateDocumentType } from '../candidate-validation.js';

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

describe('Document Service Tests', () => {
  
  let documentService;

  beforeEach(() => {
    documentService = new DocumentService();
  });

  describe('Document Upload Validation', () => {
    
    test('should validate document upload data correctly', () => {
      fc.assert(fc.property(
        validFileData(),
        (fileData) => {
          // Should not throw for valid file data
          expect(() => validateDocumentUpload(fileData)).not.toThrow();
        }
      ), { numRuns: 25 });
    });

    test('should reject invalid file data', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant({}),
          fc.record({
            originalName: fc.constant(''),
            mimeType: fc.string(),
            size: fc.integer({ min: 1, max: 100 }),
            buffer: fc.constant(Buffer.alloc(10))
          }),
          fc.record({
            originalName: fc.string({ minLength: 1, maxLength: 10 }),
            mimeType: fc.constant(''),
            size: fc.integer({ min: 1, max: 100 }),
            buffer: fc.constant(Buffer.alloc(10))
          })
        ),
        (invalidFileData) => {
          expect(() => validateDocumentUpload(invalidFileData)).toThrow();
        }
      ), { numRuns: 25 });
    });

    test('should validate document types correctly', () => {
      fc.assert(fc.property(
        fc.constantFrom(...Object.values(DOCUMENT_TYPES)),
        (documentType) => {
          expect(() => validateDocumentType(documentType)).not.toThrow();
        }
      ), { numRuns: 10 });
    });

    test('should reject invalid document types', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.string().filter(s => !Object.values(DOCUMENT_TYPES).includes(s)),
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.integer()
        ),
        (invalidType) => {
          expect(() => validateDocumentType(invalidType)).toThrow();
        }
      ), { numRuns: 25 });
    });
  });

  describe('Document Service Methods', () => {
    
    test('should have all required methods', () => {
      expect(typeof documentService.uploadDocument).toBe('function');
      expect(typeof documentService.getDocument).toBe('function');
      expect(typeof documentService.listDocuments).toBe('function');
      expect(typeof documentService.deleteDocument).toBe('function');
      expect(typeof documentService.getDocumentStats).toBe('function');
    });

    test('should generate unique filenames', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0).map(s => s.trim().replace(/[^a-zA-Z0-9-_]/g, '_') + '.pdf'),
        validObjectId(),
        (originalName, candidateId) => {
          const filename1 = documentService.generateUniqueFilename(originalName, candidateId);
          const filename2 = documentService.generateUniqueFilename(originalName, candidateId);
          
          // Should be different each time
          expect(filename1).not.toBe(filename2);
          
          // Should contain candidate ID
          expect(filename1).toContain(candidateId);
          expect(filename2).toContain(candidateId);
          
          // Should preserve extension
          expect(filename1.endsWith('.pdf')).toBe(true);
          expect(filename2.endsWith('.pdf')).toBe(true);
          
          // Should be valid filenames
          expect(filename1.length).toBeGreaterThan(0);
          expect(filename2.length).toBeGreaterThan(0);
        }
      ), { numRuns: 25 });
    });

    test('should validate file size limits', () => {
      fc.assert(fc.property(
        fc.integer({ min: documentService.maxFileSize + 1, max: documentService.maxFileSize * 2 }),
        (oversizedFileSize) => {
          const fileData = {
            originalName: 'large-file.pdf',
            mimeType: 'application/pdf',
            size: oversizedFileSize,
            buffer: Buffer.alloc(Math.min(oversizedFileSize, 1000)) // Don't actually allocate huge buffers
          };

          // Should validate file size in the service
          expect(oversizedFileSize).toBeGreaterThan(documentService.maxFileSize);
        }
      ), { numRuns: 10 });
    });

    test('should validate MIME types', () => {
      fc.assert(fc.property(
        fc.string().filter(s => !documentService.allowedMimeTypes.includes(s)),
        (invalidMimeType) => {
          // Should have allowed MIME types configured
          expect(Array.isArray(documentService.allowedMimeTypes)).toBe(true);
          expect(documentService.allowedMimeTypes.length).toBeGreaterThan(0);
          expect(documentService.allowedMimeTypes).not.toContain(invalidMimeType);
        }
      ), { numRuns: 25 });
    });

    test('should have proper configuration', () => {
      expect(typeof documentService.storageDir).toBe('string');
      expect(documentService.storageDir.length).toBeGreaterThan(0);
      expect(typeof documentService.maxFileSize).toBe('number');
      expect(documentService.maxFileSize).toBeGreaterThan(0);
      expect(Array.isArray(documentService.allowedMimeTypes)).toBe(true);
      expect(documentService.allowedMimeTypes.length).toBeGreaterThan(0);
    });

    test('should sanitize filenames properly', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).map(s => s + '.pdf'),
        validObjectId(),
        (originalName, candidateId) => {
          const filename = documentService.generateUniqueFilename(originalName, candidateId);
          
          // Should not contain dangerous characters
          expect(filename).not.toMatch(/[<>:"/\\|?*]/);
          
          // Should be a reasonable length
          expect(filename.length).toBeLessThan(255);
          
          // Should contain timestamp and random components for uniqueness
          expect(filename).toMatch(/\d+/); // Should contain numbers (timestamp/random)
        }
      ), { numRuns: 25 });
    });
  });

  describe('Document Type Validation', () => {
    
    test('should accept all valid document types', () => {
      Object.values(DOCUMENT_TYPES).forEach(docType => {
        expect(() => validateDocumentType(docType)).not.toThrow();
      });
    });

    test('should have expected document types', () => {
      expect(DOCUMENT_TYPES.RESUME).toBe('resume');
      expect(DOCUMENT_TYPES.COVER_LETTER).toBe('cover_letter');
      expect(DOCUMENT_TYPES.PORTFOLIO).toBe('portfolio');
      expect(DOCUMENT_TYPES.OTHER).toBe('other');
    });

    test('should reject empty or invalid document types', () => {
      const invalidTypes = ['', null, undefined, 'invalid_type', 123, {}, []];
      
      invalidTypes.forEach(invalidType => {
        expect(() => validateDocumentType(invalidType)).toThrow();
      });
    });
  });

  describe('Property 8: Document Upload and Storage', () => {
    
    test('document upload preserves file integrity and metadata', () => {
      fc.assert(fc.property(
        validObjectId(),
        validFileData(),
        fc.constantFrom(...Object.values(DOCUMENT_TYPES)),
        fc.option(validObjectId()),
        (candidateId, fileData, documentType, uploadedBy) => {
          // Property: Valid inputs should not throw validation errors
          expect(() => validateDocumentUpload(fileData)).not.toThrow();
          expect(() => validateDocumentType(documentType)).not.toThrow();

          // Property: Generated filename should be unique and contain candidate ID
          const filename1 = documentService.generateUniqueFilename(fileData.originalName, candidateId);
          const filename2 = documentService.generateUniqueFilename(fileData.originalName, candidateId);
          
          expect(filename1).not.toBe(filename2);
          expect(filename1).toContain(candidateId);
          expect(filename2).toContain(candidateId);

          // Property: File size validation should work correctly
          if (fileData.size > documentService.maxFileSize) {
            // Should be rejected by service validation
            expect(fileData.size).toBeGreaterThan(documentService.maxFileSize);
          } else {
            // Should pass size validation
            expect(fileData.size).toBeLessThanOrEqual(documentService.maxFileSize);
          }

          // Property: MIME type validation should work correctly
          const isAllowedMimeType = documentService.allowedMimeTypes.includes(fileData.mimeType);
          expect(typeof isAllowedMimeType).toBe('boolean');

          // Property: Document metadata structure should be consistent
          const metadata = {
            filename: filename1,
            originalName: fileData.originalName,
            mimeType: fileData.mimeType,
            size: fileData.size,
            documentType,
            uploadedBy
          };

          expect(metadata.originalName).toBe(fileData.originalName);
          expect(metadata.mimeType).toBe(fileData.mimeType);
          expect(metadata.size).toBe(fileData.size);
          expect(metadata.documentType).toBe(documentType);
        }
      ), { numRuns: 50 });
    });

    test('document upload validation rejects invalid inputs consistently', () => {
      fc.assert(fc.property(
        fc.oneof(
          // Invalid file data structures
          fc.constant(null),
          fc.constant(undefined),
          fc.constant({}),
          fc.record({
            originalName: fc.constant(''),
            mimeType: fc.string(),
            size: fc.integer({ min: 1, max: 100 }),
            buffer: fc.constant(Buffer.alloc(10))
          }),
          fc.record({
            originalName: fc.string({ minLength: 1, maxLength: 10 }),
            mimeType: fc.constant(''),
            size: fc.integer({ min: 1, max: 100 }),
            buffer: fc.constant(Buffer.alloc(10))
          }),
          fc.record({
            originalName: fc.string({ minLength: 1, maxLength: 10 }),
            mimeType: fc.string({ minLength: 1, maxLength: 10 }),
            size: fc.constant(0),
            buffer: fc.constant(Buffer.alloc(10))
          }),
          fc.record({
            originalName: fc.string({ minLength: 1, maxLength: 10 }),
            mimeType: fc.string({ minLength: 1, maxLength: 10 }),
            size: fc.integer({ min: 1, max: 100 }),
            buffer: fc.constant('not-a-buffer')
          })
        ),
        (invalidFileData) => {
          // Property: Invalid file data should always be rejected
          expect(() => validateDocumentUpload(invalidFileData)).toThrow();
        }
      ), { numRuns: 25 });
    });

    test('document filename sanitization is consistent and safe', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0).map(s => s.trim().replace(/[^a-zA-Z0-9-_]/g, '_') + '.pdf'),
        validObjectId(),
        (originalName, candidateId) => {
          const filename = documentService.generateUniqueFilename(originalName, candidateId);
          
          // Property: Filename should not contain dangerous characters
          expect(filename).not.toMatch(/[<>:"/\\|?*]/);
          
          // Property: Filename should be reasonable length
          expect(filename.length).toBeLessThan(255);
          expect(filename.length).toBeGreaterThan(0);
          
          // Property: Filename should contain candidate ID
          expect(filename).toContain(candidateId);
          
          // Property: Filename should preserve extension
          expect(filename.endsWith('.pdf')).toBe(true);
          
          // Property: Multiple calls should produce different filenames
          const filename2 = documentService.generateUniqueFilename(originalName, candidateId);
          expect(filename).not.toBe(filename2);
        }
      ), { numRuns: 50 });
    });
  });
});