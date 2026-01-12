/**
 * Individual Candidate API Routes
 * Handles operations for specific candidates
 */

import { NextResponse } from 'next/server';
import { candidateService } from '@/lib/candidates/candidate-service';

/**
 * GET /api/candidates/[id] - Get a specific candidate
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const candidate = await candidateService.getCandidateById(id);
    
    if (!candidate) {
      return NextResponse.json({
        success: false,
        error: 'Candidate not found',
        message: `No candidate found with ID: ${id}`
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: candidate
    });
    
  } catch (error) {
    console.error('Failed to get candidate:', error);
    
    if (error.code === 'INVALID_ID') {
      return NextResponse.json({
        success: false,
        error: 'Invalid candidate ID',
        message: error.message
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve candidate',
      message: error.message
    }, { status: error.statusCode || 500 });
  }
}

/**
 * PUT /api/candidates/[id] - Update a candidate
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updateData = await request.json();
    
    // TODO: Get user ID from session/auth
    const userId = 'system'; // Placeholder
    
    const candidate = await candidateService.updateCandidate(id, updateData, userId);
    
    return NextResponse.json({
      success: true,
      data: candidate,
      message: 'Candidate updated successfully'
    });
    
  } catch (error) {
    console.error('Failed to update candidate:', error);
    
    if (error.code === 'INVALID_ID') {
      return NextResponse.json({
        success: false,
        error: 'Invalid candidate ID',
        message: error.message
      }, { status: 400 });
    }
    
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({
        success: false,
        error: 'Candidate not found',
        message: error.message
      }, { status: 404 });
    }
    
    if (error.code === 'VALIDATION_ERROR') {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: error.message
      }, { status: 400 });
    }
    
    if (error.code === 'DUPLICATE_EMAIL') {
      return NextResponse.json({
        success: false,
        error: 'Duplicate email',
        message: error.message
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update candidate',
      message: error.message
    }, { status: error.statusCode || 500 });
  }
}

/**
 * DELETE /api/candidates/[id] - Delete a candidate
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // TODO: Get user ID from session/auth
    const userId = 'system'; // Placeholder
    
    const success = await candidateService.deleteCandidate(id, userId);
    
    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully'
    });
    
  } catch (error) {
    console.error('Failed to delete candidate:', error);
    
    if (error.code === 'INVALID_ID') {
      return NextResponse.json({
        success: false,
        error: 'Invalid candidate ID',
        message: error.message
      }, { status: 400 });
    }
    
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({
        success: false,
        error: 'Candidate not found',
        message: error.message
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete candidate',
      message: error.message
    }, { status: error.statusCode || 500 });
  }
}