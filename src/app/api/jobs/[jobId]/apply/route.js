/**
 * Job Application API Route
 * Handles HTTP requests for job application operations
 */

import { NextResponse } from 'next/server';
import { createApplication, formatApplicationError, ApplicationError } from '@/lib/applications/application-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Handles job application submission
 * @param {Request} request - The incoming request
 * @param {Object} context - Route context with params
 * @returns {Promise<NextResponse>} JSON response with application result
 */
export async function POST(request, context) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required to apply for jobs.',
            code: 'AUTH_REQUIRED'
          }
        },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const params = await context.params;
    const { jobId } = params;

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

    const { coverLetter, resumeUrl, phone, linkedinUrl } = body;

    // Validate required fields at API level
    if (!coverLetter) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Cover letter is required.',
            code: 'MISSING_COVER_LETTER'
          }
        },
        { status: 400 }
      );
    }

    // Create application data object
    const applicationData = {
      coverLetter,
      resumeUrl,
      phone,
      linkedinUrl
    };

    // Create the application
    const newApplication = await createApplication(applicationData, jobId, session.user.id);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully!',
        application: {
          id: newApplication.id,
          jobId: newApplication.jobId,
          coverLetter: newApplication.coverLetter,
          resumeUrl: newApplication.resumeUrl,
          phone: newApplication.phone,
          linkedinUrl: newApplication.linkedinUrl,
          status: newApplication.status,
          appliedAt: newApplication.appliedAt
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Job application API error:', error);

    // Handle application-specific errors
    if (error instanceof ApplicationError) {
      const statusCode = error.code === 'AUTH_REQUIRED' ? 401 : 
                        error.code === 'ALREADY_APPLIED' ? 409 : 400;
      return NextResponse.json(
        formatApplicationError(error),
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