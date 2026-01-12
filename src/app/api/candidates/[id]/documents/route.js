/**
 * Document Management API Routes
 * Handles document upload and listing for candidates
 */

import { NextResponse } from 'next/server';
import { documentService } from '@/lib/candidates/document-service.js';
import { DOCUMENT_TYPES } from '@/lib/candidates/candidate-models.js';

/**
 * POST /api/candidates/[id]/documents
 * Upload a document for a candidate
 */
export async function POST(request, { params }) {
  try {
    const { id: candidateId } = await params;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType') || DOCUMENT_TYPES.OTHER;
    const uploadedBy = formData.get('uploadedBy');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create file data object
    const fileData = {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      buffer
    };

    // Upload document
    const documentMetadata = await documentService.uploadDocument(
      candidateId,
      fileData,
      documentType,
      uploadedBy
    );

    return NextResponse.json({
      success: true,
      document: documentMetadata
    }, { status: 201 });

  } catch (error) {
    console.error('Document upload error:', error);

    if (error.name === 'DocumentServiceError') {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/candidates/[id]/documents
 * List all documents for a candidate
 */
export async function GET(request, { params }) {
  try {
    const { id: candidateId } = await params;

    const documents = await documentService.listDocuments(candidateId);

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length
    });

  } catch (error) {
    console.error('Document list error:', error);

    if (error.name === 'DocumentServiceError') {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}