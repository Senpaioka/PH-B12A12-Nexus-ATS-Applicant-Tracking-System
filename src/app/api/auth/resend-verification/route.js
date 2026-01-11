/**
 * Resend Verification Email API Route
 * Handles resending verification emails
 */

import { NextResponse } from 'next/server';
import { resendVerificationEmail, formatVerificationError } from '@/lib/auth/verification.js';
import { sendVerificationEmail } from '@/lib/email/email-service.js';

/**
 * POST /api/auth/resend-verification
 * Resends verification email to user
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Email address is required',
            code: 'EMAIL_REQUIRED'
          }
        },
        { status: 400 }
      );
    }

    const result = await resendVerificationEmail(email);
    
    // Send the verification email
    try {
      await sendVerificationEmail(result.user.email, result.token, result.user.name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to send verification email. Please try again.',
            code: 'EMAIL_SEND_FAILED'
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification API error:', error);
    const errorResponse = formatVerificationError(error);
    
    let statusCode = 500;
    if (error.code === 'USER_NOT_FOUND') {
      statusCode = 404;
    } else if (error.code === 'ALREADY_VERIFIED' || error.code === 'RATE_LIMITED') {
      statusCode = 400;
    }
    
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}