/**
 * Candidates API Routes
 * Handles CRUD operations for candidates
 */

import { NextResponse } from 'next/server';
import { candidateService } from '@/lib/candidates/candidate-service';
import { ValidationError } from '@/lib/candidates/candidate-validation';

/**
 * GET /api/candidates - List candidates with pagination and filtering
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    
    // Extract filter parameters
    const filters = {};
    if (searchParams.get('stage')) {
      filters.stage = searchParams.get('stage');
    }
    if (searchParams.get('skills')) {
      filters.skills = searchParams.get('skills').split(',').map(s => s.trim());
    }
    if (searchParams.get('location')) {
      filters.location = searchParams.get('location');
    }
    if (searchParams.get('experience')) {
      filters.experience = searchParams.get('experience');
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search');
    }
    
    const result = await candidateService.listCandidates(filters, { page, limit });
    
    return NextResponse.json({
      success: true,
      data: result.candidates,
      pagination: result.pagination
    });
    
  } catch (error) {
    console.error('Failed to list candidates:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve candidates',
      message: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/candidates - Create a new candidate
 */
export async function POST(request) {
  try {
    const candidateData = await request.json();
    
    // TODO: Get user ID from session/auth
    const userId = 'system'; // Placeholder
    
    const candidate = await candidateService.createCandidate(candidateData, userId);
    
    return NextResponse.json({
      success: true,
      data: candidate,
      message: 'Candidate created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Failed to create candidate:', error);
    
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
      error: 'Failed to create candidate',
      message: error.message
    }, { status: error.statusCode || 500 });
  }
}