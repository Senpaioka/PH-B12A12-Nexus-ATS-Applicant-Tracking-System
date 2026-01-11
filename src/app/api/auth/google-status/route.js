/**
 * Google OAuth Status API Route
 * Returns whether Google OAuth is configured
 */

import { NextResponse } from 'next/server';
import { getGoogleOAuthStatus } from '@/lib/auth/google-config.js';

/**
 * GET /api/auth/google-status
 * Returns Google OAuth configuration status
 */
export async function GET() {
  try {
    const status = getGoogleOAuthStatus();
    
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Google OAuth status check error:', error);
    
    return NextResponse.json({
      success: false,
      isConfigured: false,
      message: 'Failed to check Google OAuth status'
    }, { status: 500 });
  }
}