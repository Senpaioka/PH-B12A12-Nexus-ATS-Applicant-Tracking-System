/**
 * Individual Document API Routes
 * Handles document retrieval and deletion
 */

import { NextResponse } from 'next/server';
import { documentService } from '@/lib/candidates/document-service.js';

/**
 * GET /api/candidates/[id]/documents/[docId]
 * Download a specific document
 */
export async function GET(request, { params }) {
  try {
    const { id: candidateId, docId } = await params;

    const documentData = await documentService.getDocument(candidateId, docId);

    // Create response with file data
    const response = new NextResponse(documentData.buffer);
    
    // Set appropriate headers
    response.headers.set('Content-Type', documentData.metadata.mimeType);
    response.headers.set('Content-Length', documentData.metadata.size.toString());
    response.headers.set(
      'Content-Disposition', 
      `attachment; filename="${documentData.metadata.originalName}"`
    );

    return response;

  } catch (error) {
    console.error('Document download error:', error);

    if (error.name === 'DocumentServiceError') {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/candidates/[id]/documents/[docId]
 * Delete a specific document
 */
export async function DELETE(request, { params }) {
  try {
    const { id: candidateId, docId } = await params;
    
    // Get deletedBy from request body or query params
    const url = new URL(request.url);
    const deletedBy = url.searchParams.get('deletedBy');

    const success = await documentService.deleteDocument(candidateId, docId, deletedBy);

    return NextResponse.json({
      success,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Document deletion error:', error);

    if (error.name === 'DocumentServiceError') {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}