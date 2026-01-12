/**
 * Document Statistics API Route
 * Provides document statistics for a candidate
 */

import { NextResponse } from 'next/server';
import { documentService } from '@/lib/candidates/document-service.js';

/**
 * GET /api/candidates/[id]/documents/stats
 * Get document statistics for a candidate
 */
export async function GET(request, { params }) {
  try {
    const { id: candidateId } = await params;

    const stats = await documentService.getDocumentStats(candidateId);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Document stats error:', error);

    if (error.name === 'DocumentServiceError') {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get document statistics' },
      { status: 500 }
    );
  }
}