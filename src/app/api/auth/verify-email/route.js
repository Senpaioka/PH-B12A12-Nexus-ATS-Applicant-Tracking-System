/**
 * Email Verification API Route
 * Handles email verification using tokens
 */

import { NextResponse } from 'next/server';
import { verifyEmail, formatVerificationError } from '@/lib/auth/verification.js';

/**
 * POST /api/auth/verify-email
 * Verifies user email using verification token
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Verification token is required',
            code: 'TOKEN_REQUIRED'
          }
        },
        { status: 400 }
      );
    }

    const result = await verifyEmail(token);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: result.user
    });

  } catch (error) {
    console.error('Email verification API error:', error);
    const errorResponse = formatVerificationError(error);
    
    const statusCode = error.code === 'TOKEN_INVALID' ? 400 : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * GET /api/auth/verify-email?token=xxx
 * Verifies user email using token from URL (for email links)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Verification token is required',
            code: 'TOKEN_REQUIRED'
          }
        },
        { status: 400 }
      );
    }

    const result = await verifyEmail(token);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: result.user
    });

  } catch (error) {
    console.error('Email verification API error:', error);
    const errorResponse = formatVerificationError(error);
    
    const statusCode = error.code === 'TOKEN_INVALID' ? 400 : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}