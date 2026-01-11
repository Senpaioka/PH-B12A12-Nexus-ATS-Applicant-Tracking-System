/**
 * User Registration API Route
 * Handles POST requests for user account creation
 */

import { NextResponse } from 'next/server';
import { registerUser, validateRegistrationData, formatRegistrationError, RegistrationError } from '@/lib/auth/registration';
import { initializeDatabase } from '@/lib/db-init';

/**
 * Handles user registration requests
 * @param {Request} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with registration result
 */
export async function POST(request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid request format. Please send valid JSON.',
            code: 'INVALID_JSON'
          }
        },
        { status: 400 }
      );
    }

    const { email, password, confirmPassword, name } = body;

    // Validate required fields
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Email, password, and password confirmation are required.',
            code: 'MISSING_FIELDS'
          }
        },
        { status: 400 }
      );
    }

    // Validate registration data
    const validation = validateRegistrationData(email, password, confirmPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validation.errors
          }
        },
        { status: 400 }
      );
    }

    // Initialize database (ensures collections and indexes exist)
    await initializeDatabase();

    // Register the user
    const newUser = await registerUser(email, password, { name });

    // Return success response
    const message = newUser.emailVerificationSent 
      ? 'Account created successfully! Please check your email to verify your account before logging in.'
      : 'Account created successfully! You can request a verification email from the verification page.';
      
    return NextResponse.json(
      {
        success: true,
        message,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
          emailVerified: newUser.emailVerified,
          emailVerificationSent: newUser.emailVerificationSent
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration API error:', error);

    // Handle registration-specific errors
    if (error instanceof RegistrationError) {
      const statusCode = error.code === 'EMAIL_EXISTS' ? 409 : 400;
      return NextResponse.json(
        formatRegistrationError(error),
        { status: statusCode }
      );
    }

    // Handle database connection errors
    if (error.message.includes('Database connection failed')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Service temporarily unavailable. Please try again later.',
            code: 'SERVICE_UNAVAILABLE'
          }
        },
        { status: 503 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred. Please try again.',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Handles OPTIONS requests for CORS
 * @returns {NextResponse} CORS headers response
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Handles unsupported HTTP methods
 * @returns {NextResponse} Method not allowed response
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Method not allowed. Use POST to register a new user.',
        code: 'METHOD_NOT_ALLOWED'
      }
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Method not allowed. Use POST to register a new user.',
        code: 'METHOD_NOT_ALLOWED'
      }
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Method not allowed. Use POST to register a new user.',
        code: 'METHOD_NOT_ALLOWED'
      }
    },
    { status: 405 }
  );
}