/**
 * Search Suggestions API Route
 * Provides autocomplete suggestions for search inputs
 */

import { NextResponse } from 'next/server';
import { searchService } from '@/lib/candidates/search-service.js';

/**
 * GET /api/candidates/search/suggestions
 * Get search suggestions for autocomplete
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const input = searchParams.get('input') || '';
    const field = searchParams.get('field') || 'skills';
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Validate input length
    if (!input || input.trim().length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: []
      });
    }

    // Validate field
    const validFields = ['skills', 'location', 'role'];
    if (!validFields.includes(field)) {
      return NextResponse.json(
        { error: `Invalid field. Must be one of: ${validFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Get suggestions
    const suggestions = await searchService.getSearchSuggestions(input, field, limit);

    return NextResponse.json({
      success: true,
      suggestions,
      field,
      input: input.trim()
    });

  } catch (error) {
    console.error('Search suggestions error:', error);

    if (error.name === 'SearchServiceError') {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get search suggestions' },
      { status: 500 }
    );
  }
}