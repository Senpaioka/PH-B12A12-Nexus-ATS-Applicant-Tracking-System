/**
 * Job Applications List API Route
 * Handles HTTP requests for viewing job applications
 */

import { NextResponse } from 'next/server';
import { getApplicationsByJob, formatApplicationError, ApplicationError } from '@/lib/applications/application-service';
import { getJobById } from '@/lib/jobs/job-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Handles GET requests for job applications
 * @param {Request} request - The incoming request
 * @param {Object} context - Route context with params
 * @returns {Promise<NextResponse>} JSON response with applications list
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
            message: 'Authentication required to view applications.',
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
      // First, verify the job exists and user owns it
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
              message: 'You do not have permission to view applications for this job.',
              code: 'UNAUTHORIZED'
            }
          },
          { status: 403 }
        );
      }

      // Parse query parameters for pagination
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit')) || 50;
      const skip = parseInt(searchParams.get('skip')) || 0;

      // Get applications for this job
      const applications = await getApplicationsByJob(jobId, {
        limit,
        skip,
        sort: { appliedAt: -1 } // Most recent first
      });

      // Transform applications for frontend
      const transformedApplications = applications.map(app => ({
        id: app.id,
        applicantId: app.applicantId,
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
        phone: app.phone,
        linkedinUrl: app.linkedinUrl,
        status: app.status.charAt(0).toUpperCase() + app.status.slice(1), // Capitalize
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt
      }));

      return NextResponse.json(
        {
          success: true,
          applications: transformedApplications,
          total: transformedApplications.length,
          hasMore: applications.length === limit
        },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Database error fetching applications:', dbError);
      
      if (dbError instanceof ApplicationError) {
        const statusCode = dbError.code === 'JOB_ID_INVALID' ? 400 : 500;
        return NextResponse.json(
          formatApplicationError(dbError),
          { status: statusCode }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unable to retrieve applications. Please try again.',
            code: 'RETRIEVAL_ERROR'
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Applications API error:', error);

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