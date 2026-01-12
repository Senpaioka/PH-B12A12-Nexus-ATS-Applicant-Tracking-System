/**
 * Search Statistics API Route
 * Provides aggregated statistics for search results
 */

import { NextResponse } from 'next/server';
import { searchService } from '@/lib/candidates/search-service.js';

/**
 * GET /api/candidates/search/stats
 * Get search statistics and aggregations
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters (same as search endpoint)
    const query = searchParams.get('q') || '';
    
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

    // Get search statistics
    const stats = await searchService.getSearchStats(query, filters);

    return NextResponse.json({
      success: true,
      stats,
      query: query || '',
      filters
    });

  } catch (error) {
    console.error('Search stats error:', error);

    if (error.name === 'SearchServiceError') {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get search statistics' },
      { status: 500 }
    );
  }
}