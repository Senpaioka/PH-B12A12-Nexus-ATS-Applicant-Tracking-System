/**
 * Individual Job API Route
 * Handles HTTP requests for individual job operations (GET, PUT, DELETE)
 */

import { NextResponse } from 'next/server';
import { getJobById, formatJobError, JobError } from '@/lib/jobs/job-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Handles GET requests for a specific job
 * @param {Request} request - The incoming request
 * @param {Object} context - Route context with params
 * @returns {Promise<NextResponse>} JSON response with job data
 */
export async function GET(request, context) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required to view job details.',
            code: 'AUTH_REQUIRED'
          }
        },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const params = await context.params;
    const { jobId } = params;

    try {
      // Get job from database
      const job = await getJobById(jobId);

      if (!job) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Job not found.',
              code: 'JOB_NOT_FOUND'
            }
          },
          { status: 404 }
        );
      }

      // Check if user owns this job
      if (job.createdBy !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'You do not have permission to view this job.',
              code: 'UNAUTHORIZED'
            }
          },
          { status: 403 }
        );
      }

      // Transform job to match frontend expectations
      const transformedJob = {
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        salary: job.salary,
        salaryRange: job.salary || 'Not specified',
        status: job.status.charAt(0).toUpperCase() + job.status.slice(1),
        description: job.description,
        requirements: job.requirements,
        postedAt: job.createdAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        applicantsCount: job.applicationCount || 0,
        hiringManager: 'Current User'
      };

      return NextResponse.json(
        {
          success: true,
          job: transformedJob
        },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Database error fetching job:', dbError);
      
      if (dbError instanceof JobError) {
        const statusCode = dbError.code === 'ID_INVALID' ? 400 : 500;
        return NextResponse.json(
          formatJobError(dbError),
          { status: statusCode }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unable to retrieve job details. Please try again.',
            code: 'RETRIEVAL_ERROR'
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Job retrieval API error:', error);

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
 * Handles PUT requests for updating a job
 * @param {Request} request - The incoming request
 * @param {Object} context - Route context with params
 * @returns {Promise<NextResponse>} JSON response with update result
 */
export async function PUT(request, context) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required to update job.',
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

    // For now, return a placeholder response
    // This will be implemented when we add job update functionality
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Job update functionality not yet implemented.',
          code: 'NOT_IMPLEMENTED'
        }
      },
      { status: 501 }
    );

  } catch (error) {
    console.error('Job update API error:', error);

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
 * Handles DELETE requests for deleting a job
 * @param {Request} request - The incoming request
 * @param {Object} context - Route context with params
 * @returns {Promise<NextResponse>} JSON response with deletion result
 */
export async function DELETE(request, context) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required to delete job.',
            code: 'AUTH_REQUIRED'
          }
        },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const params = await context.params;
    const { jobId } = params;

    // For now, return a placeholder response
    // This will be implemented when we add job deletion functionality
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Job deletion functionality not yet implemented.',
          code: 'NOT_IMPLEMENTED'
        }
      },
      { status: 501 }
    );

  } catch (error) {
    console.error('Job deletion API error:', error);

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