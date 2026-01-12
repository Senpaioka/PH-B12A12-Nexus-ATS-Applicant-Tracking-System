/**
 * Document Service
 * Manages candidate document uploads, storage, and retrieval
 */

import { ObjectId } from 'mongodb';
import { getCandidatesCollection } from './candidate-db.js';
import { 
  DOCUMENT_TYPES, 
  createDocumentMetadata 
} from './candidate-models.js';
import { 
  validateDocumentUpload,
  validateDocumentType 
} from './candidate-validation.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Document service error class
 */
export class DocumentServiceError extends Error {
  constructor(message, code = 'DOCUMENT_SERVICE_ERROR', statusCode = 500) {
    super(message);
    this.name = 'DocumentServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Document Service Class
 */
export class DocumentService {
  
  constructor() {
    // Configure storage directory
    this.storageDir = process.env.DOCUMENT_STORAGE_DIR || './storage/documents';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
    this.allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
  }

  /**
   * Ensures storage directory exists
   */
  async ensureStorageDirectory() {
    try {
      await fs.access(this.storageDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(this.storageDir, { recursive: true });
    }
  }

  /**
   * Generates a unique filename for storage
   * @param {string} originalName - Original filename
   * @param {string} candidateId - Candidate ID
   * @returns {string} Unique filename
   */
  generateUniqueFilename(originalName, candidateId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    // Sanitize filename
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return `${candidateId}_${timestamp}_${random}_${sanitizedBaseName}${extension}`;
  }

  /**
   * Uploads a document for a candidate
   * @param {string} candidateId - Candidate ID
   * @param {Object} fileData - File data object
   * @param {string} documentType - Type of document
   * @param {string} uploadedBy - ID of user uploading
   * @returns {Promise<Object>} Document metadata
   */
  async uploadDocument(candidateId, fileData, documentType = DOCUMENT_TYPES.OTHER, uploadedBy = null) {
    try {
      // Validate inputs
      if (!ObjectId.isValid(candidateId)) {
        throw new DocumentServiceError(
          'Invalid candidate ID format',
          'INVALID_ID',
          400
        );
      }

      validateDocumentType(documentType);
      validateDocumentUpload(fileData);

      // Validate file size
      if (fileData.size > this.maxFileSize) {
        throw new DocumentServiceError(
          `File size exceeds maximum allowed size of ${this.maxFileSize} bytes`,
          'FILE_TOO_LARGE',
          400
        );
      }

      // Validate MIME type
      if (!this.allowedMimeTypes.includes(fileData.mimeType)) {
        throw new DocumentServiceError(
          `File type ${fileData.mimeType} is not allowed`,
          'INVALID_FILE_TYPE',
          400
        );
      }

      // Ensure storage directory exists
      await this.ensureStorageDirectory();

      // Generate unique filename
      const filename = this.generateUniqueFilename(fileData.originalName, candidateId);
      const filePath = path.join(this.storageDir, filename);

      // Save file to storage
      await fs.writeFile(filePath, fileData.buffer);

      // Create document metadata
      const documentMetadata = createDocumentMetadata({
        filename,
        originalName: fileData.originalName,
        mimeType: fileData.mimeType,
        size: fileData.size,
        documentType,
        filePath,
        uploadedBy
      });

      // Add document to candidate record
      const collection = await getCandidatesCollection();
      
      const result = await collection.findOneAndUpdate(
        { 
          _id: new ObjectId(candidateId),
          'metadata.isActive': true
        },
        {
          $push: {
            documents: documentMetadata
          },
          $set: {
            'metadata.updatedAt': new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        // Clean up uploaded file if candidate update failed
        await fs.unlink(filePath).catch(() => {}); // Ignore cleanup errors
        
        throw new DocumentServiceError(
          'Candidate not found or document upload failed',
          'CANDIDATE_NOT_FOUND',
          404
        );
      }

      console.log(`Document uploaded for candidate ${candidateId}: ${filename}`);
      return documentMetadata;

    } catch (error) {
      if (error instanceof DocumentServiceError) {
        throw error;
      }
      
      console.error('Failed to upload document:', error);
      throw new DocumentServiceError(
        'Failed to upload document',
        'UPLOAD_ERROR',
        500
      );
    }
  }

  /**
   * Retrieves a document for a candidate
   * @param {string} candidateId - Candidate ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Document data and metadata
   */
  async getDocument(candidateId, documentId) {
    try {
      if (!ObjectId.isValid(candidateId) || !ObjectId.isValid(documentId)) {
        throw new DocumentServiceError(
          'Invalid ID format',
          'INVALID_ID',
          400
        );
      }

      const collection = await getCandidatesCollection();
      
      const candidate = await collection.findOne(
        { 
          _id: new ObjectId(candidateId),
          'metadata.isActive': true,
          'documents._id': new ObjectId(documentId),
          'documents.isActive': true
        },
        {
          projection: {
            'documents.$': 1
          }
        }
      );

      if (!candidate || !candidate.documents || candidate.documents.length === 0) {
        throw new DocumentServiceError(
          'Document not found',
          'DOCUMENT_NOT_FOUND',
          404
        );
      }

      const document = candidate.documents[0];

      // Read file from storage
      let fileBuffer;
      try {
        fileBuffer = await fs.readFile(document.filePath);
      } catch (error) {
        console.error('Failed to read document file:', error);
        throw new DocumentServiceError(
          'Document file not found in storage',
          'FILE_NOT_FOUND',
          404
        );
      }

      return {
        metadata: document,
        buffer: fileBuffer
      };

    } catch (error) {
      if (error instanceof DocumentServiceError) {
        throw error;
      }
      
      console.error('Failed to get document:', error);
      throw new DocumentServiceError(
        'Failed to retrieve document',
        'RETRIEVAL_ERROR',
        500
      );
    }
  }

  /**
   * Lists all documents for a candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array>} Array of document metadata
   */
  async listDocuments(candidateId) {
    try {
      if (!ObjectId.isValid(candidateId)) {
        throw new DocumentServiceError(
          'Invalid candidate ID format',
          'INVALID_ID',
          400
        );
      }

      const collection = await getCandidatesCollection();
      
      const candidate = await collection.findOne(
        { 
          _id: new ObjectId(candidateId),
          'metadata.isActive': true
        },
        {
          projection: {
            documents: 1
          }
        }
      );

      if (!candidate) {
        throw new DocumentServiceError(
          'Candidate not found',
          'CANDIDATE_NOT_FOUND',
          404
        );
      }

      // Filter active documents
      const activeDocuments = (candidate.documents || []).filter(doc => doc.isActive);

      return activeDocuments;

    } catch (error) {
      if (error instanceof DocumentServiceError) {
        throw error;
      }
      
      console.error('Failed to list documents:', error);
      throw new DocumentServiceError(
        'Failed to list documents',
        'LIST_ERROR',
        500
      );
    }
  }

  /**
   * Deletes a document for a candidate
   * @param {string} candidateId - Candidate ID
   * @param {string} documentId - Document ID
   * @param {string} deletedBy - ID of user deleting
   * @returns {Promise<boolean>} Success status
   */
  async deleteDocument(candidateId, documentId, deletedBy = null) {
    try {
      if (!ObjectId.isValid(candidateId) || !ObjectId.isValid(documentId)) {
        throw new DocumentServiceError(
          'Invalid ID format',
          'INVALID_ID',
          400
        );
      }

      const collection = await getCandidatesCollection();
      
      // First get the document to find the file path
      const candidate = await collection.findOne(
        { 
          _id: new ObjectId(candidateId),
          'metadata.isActive': true,
          'documents._id': new ObjectId(documentId)
        },
        {
          projection: {
            'documents.$': 1
          }
        }
      );

      if (!candidate || !candidate.documents || candidate.documents.length === 0) {
        throw new DocumentServiceError(
          'Document not found',
          'DOCUMENT_NOT_FOUND',
          404
        );
      }

      const document = candidate.documents[0];

      // Mark document as inactive (soft delete)
      const result = await collection.findOneAndUpdate(
        { 
          _id: new ObjectId(candidateId),
          'documents._id': new ObjectId(documentId)
        },
        {
          $set: {
            'documents.$.isActive': false,
            'documents.$.deletedAt': new Date(),
            'documents.$.deletedBy': deletedBy ? new ObjectId(deletedBy) : null,
            'metadata.updatedAt': new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new DocumentServiceError(
          'Failed to delete document',
          'DELETE_FAILED',
          500
        );
      }

      // Optionally delete physical file (commented out for safety - keep files for recovery)
      // try {
      //   await fs.unlink(document.filePath);
      // } catch (error) {
      //   console.warn('Failed to delete physical file:', error);
      // }

      console.log(`Document deleted for candidate ${candidateId}: ${document.filename}`);
      return true;

    } catch (error) {
      if (error instanceof DocumentServiceError) {
        throw error;
      }
      
      console.error('Failed to delete document:', error);
      throw new DocumentServiceError(
        'Failed to delete document',
        'DELETE_ERROR',
        500
      );
    }
  }

  /**
   * Gets document statistics for a candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object>} Document statistics
   */
  async getDocumentStats(candidateId) {
    try {
      if (!ObjectId.isValid(candidateId)) {
        throw new DocumentServiceError(
          'Invalid candidate ID format',
          'INVALID_ID',
          400
        );
      }

      const documents = await this.listDocuments(candidateId);

      const stats = {
        totalDocuments: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
        documentTypes: {},
        oldestDocument: null,
        newestDocument: null
      };

      // Calculate type distribution
      documents.forEach(doc => {
        stats.documentTypes[doc.documentType] = (stats.documentTypes[doc.documentType] || 0) + 1;
      });

      // Find oldest and newest documents
      if (documents.length > 0) {
        const sortedByDate = documents.sort((a, b) => a.uploadDate - b.uploadDate);
        stats.oldestDocument = sortedByDate[0];
        stats.newestDocument = sortedByDate[sortedByDate.length - 1];
      }

      return stats;

    } catch (error) {
      if (error instanceof DocumentServiceError) {
        throw error;
      }
      
      console.error('Failed to get document stats:', error);
      throw new DocumentServiceError(
        'Failed to get document statistics',
        'STATS_ERROR',
        500
      );
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();