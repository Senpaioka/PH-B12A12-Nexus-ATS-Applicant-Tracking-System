/**
 * Candidate Search API Route
 * Provides search and filtering capabilities for candidates
 */

import { NextResponse } from 'next/server';
import { searchService } from '@/lib/candidates/search-service.js';

/**
 * GET /api/candidates/search
 * Search candidates with filters, sorting, and pagination
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    
    // Extract filter parameters
    const filters = {};
    
    if (searchParams.get('stage')) {
      filters.stage = searchParams.get('stage');
    }
    
    if (searchParams.get('skills')) {
      filters.skills = searchParams.get('skills').split(',').map(s => s.trim()).filter(Boolean);
    }
    
    if (searchParams.get('location')) {
      filters.location = searchParams.get('location');
    }
    
    if (searchParams.get('experience')) {
      filters.experience = searchParams.get('experience');
    }
    
    if (searchParams.get('source')) {
      filters.source = searchParams.get('source');
    }
    
    if (searchParams.get('appliedDateFrom')) {
      filters.appliedDateFrom = searchParams.get('appliedDateFrom');
    }
    
    if (searchParams.get('appliedDateTo')) {
      filters.appliedDateTo = searchParams.get('appliedDateTo');
    }

    // Extract sort parameters
    const sort = {};
    if (searchParams.get('sortBy')) {
      sort.field = searchParams.get('sortBy');
      sort.direction = searchParams.get('sortOrder') || 'asc';
    }

    // Build search options
    const searchOptions = {
      page,
      limit,
      filters,
      sort
    };

    // Perform search
    const results = await searchService.searchCandidates(query, searchOptions);

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Search error:', error);

    if (error.name === 'SearchServiceError') {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search candidates' },
      { status: 500 }
    );
  }
}