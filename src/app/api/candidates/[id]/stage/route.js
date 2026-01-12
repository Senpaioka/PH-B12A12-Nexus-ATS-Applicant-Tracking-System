/**
 * API Route: PATCH /api/candidates/[id]/stage
 * Updates a candidate's pipeline stage
 */

import { NextResponse } from 'next/server';
import { pipelineService } from '@/lib/candidates/pipeline-service';
import { ObjectId } from 'mongodb';

/**
 * PATCH /api/candidates/[id]/stage
 * Updates a candidate's pipeline stage
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    
    // Validate candidate ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid candidate ID format',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    const { newStage, notes = '', userId = null } = body;

    // Validate required fields
    if (!newStage) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'newStage is required',
          code: 'MISSING_STAGE'
        },
        { status: 400 }
      );
    }

    // Update candidate stage
    const updatedCandidate = await pipelineService.updateCandidateStage(
      id,
      newStage,
      userId,
      notes
    );

    return NextResponse.json({
      success: true,
      data: {
        candidate: updatedCandidate,
        message: `Candidate stage updated to ${newStage}`
      }
    });

  } catch (error) {
    console.error('Failed to update candidate stage:', error);

    // Handle specific pipeline service errors
    if (error.name === 'PipelineServiceError') {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.code
        },
        { status: error.statusCode || 500 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update candidate stage',
        code: 'STAGE_UPDATE_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/candidates/[id]/stage
 * Gets a candidate's current stage and stage history
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Validate candidate ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid candidate ID format',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Get stage history
    const stageHistory = await pipelineService.getStageHistory(id);

    return NextResponse.json({
      success: true,
      data: {
        stageHistory,
        currentStage: stageHistory.length > 0 ? stageHistory[stageHistory.length - 1].toStage : null
      }
    });

  } catch (error) {
    console.error('Failed to get candidate stage history:', error);

    // Handle specific pipeline service errors
    if (error.name === 'PipelineServiceError') {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.code
        },
        { status: error.statusCode || 500 }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get candidate stage history',
        code: 'STAGE_HISTORY_ERROR'
      },
      { status: 500 }
    );
  }
}