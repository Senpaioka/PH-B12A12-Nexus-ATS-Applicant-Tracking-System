/**
 * Convert Job Application to Candidate API Route
 * Handles HTTP requests for converting job applications to candidates in the pipeline
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { getCollection } from '@/lib/mongodb.js';
import { candidateService } from '@/lib/candidates/candidate-service.js';
import { APPLICATION_SOURCES } from '@/lib/candidates/candidate-models.js';

/**
 * Handles POST requests to convert job application to candidate
 * @param {Request} request - The incoming request
 * @param {Object} context - Route context with params
 * @returns {Promise<NextResponse>} JSON response with conversion result
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
            message: 'Authentication required to convert applications.',
            code: 'AUTH_REQUIRED'
          }
        },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const params = await context.params;
    const { jobId, applicationId } = params;

    // Validate IDs
    if (!ObjectId.isValid(jobId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid job ID format.',
            code: 'INVALID_JOB_ID'
          }
        },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(applicationId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid application ID format.',
            code: 'INVALID_APPLICATION_ID'
          }
        },
        { status: 400 }
      );
    }

    try {
      // Get the job application
      const applicationsCollection = await getCollection('applications');
      const application = await applicationsCollection.findOne({
        _id: new ObjectId(applicationId),
        jobId: new ObjectId(jobId)
      });

      if (!application) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Job application not found.',
              code: 'APPLICATION_NOT_FOUND'
            }
          },
          { status: 404 }
        );
      }

      // Get the job details
      const jobsCollection = await getCollection('jobs');
      const job = await jobsCollection.findOne({
        _id: new ObjectId(jobId)
      });

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
              message: 'You do not have permission to convert applications for this job.',
              code: 'UNAUTHORIZED'
            }
          },
          { status: 403 }
        );
      }

      // Check if candidate already exists with this email
      // We need to get user details from the application's applicantId
      const usersCollection = await getCollection('users');
      const applicantUser = await usersCollection.findOne({
        _id: new ObjectId(application.applicantId)
      });

      if (!applicantUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Applicant user not found.',
              code: 'APPLICANT_NOT_FOUND'
            }
          },
          { status: 404 }
        );
      }

      // Check if candidate already exists
      const candidatesCollection = await getCollection('candidates');
      const existingCandidate = await candidatesCollection.findOne({
        'personalInfo.email': applicantUser.email,
        'metadata.isActive': true
      });

      if (existingCandidate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'A candidate with this email already exists in the pipeline.',
              code: 'CANDIDATE_EXISTS'
            }
          },
          { status: 409 }
        );
      }

      // Prepare candidate data from application
      const candidateData = {
        // Personal information
        firstName: applicantUser.firstName || '',
        lastName: applicantUser.lastName || '',
        email: applicantUser.email,
        phone: application.phone || applicantUser.phone || '',
        location: applicantUser.location || '',
        
        // Professional information
        currentRole: applicantUser.currentRole || '',
        experience: applicantUser.experience || '',
        skills: applicantUser.skills || [],
        appliedForRole: job.title,
        source: APPLICATION_SOURCES.JOB_BOARD,
        
        // Pipeline information - start in "applied" stage
        currentStage: 'applied',
        
        // Additional notes from cover letter
        notes: application.coverLetter ? `Cover Letter: ${application.coverLetter}` : '',
        
        // Links
        resumeUrl: application.resumeUrl || '',
        linkedinUrl: application.linkedinUrl || applicantUser.linkedinUrl || ''
      };

      // Create the candidate
      const candidate = await candidateService.createCandidate(candidateData, session.user.id);

      // Link the job application to the candidate
      const jobApplicationData = {
        jobId: jobId,
        appliedDate: application.appliedAt,
        status: 'active',
        source: APPLICATION_SOURCES.JOB_BOARD,
        notes: `Converted from job application #${applicationId.slice(-8)}`
      };

      // Import and use job application service
      const { jobApplicationService } = await import('@/lib/candidates/job-application-service.js');
      await jobApplicationService.linkJobApplication(candidate._id.toString(), jobApplicationData);

      // Update the original application status to indicate it's been converted
      await applicationsCollection.updateOne(
        { _id: new ObjectId(applicationId) },
        {
          $set: {
            status: 'converted',
            convertedToCandidateId: candidate._id,
            convertedAt: new Date(),
            convertedBy: new ObjectId(session.user.id),
            updatedAt: new Date()
          }
        }
      );

      console.log(`Converted application ${applicationId} to candidate ${candidate._id}`);

      return NextResponse.json(
        {
          success: true,
          candidate: {
            id: candidate._id.toString(),
            name: `${candidate.personalInfo.firstName} ${candidate.personalInfo.lastName}`,
            email: candidate.personalInfo.email,
            stage: candidate.pipelineInfo.currentStage
          },
          message: 'Application successfully converted to candidate'
        },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Database error converting application:', dbError);
      
      // Handle specific candidate service errors
      if (dbError.code === 'DUPLICATE_EMAIL') {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'A candidate with this email already exists in the pipeline.',
              code: 'CANDIDATE_EXISTS'
            }
          },
          { status: 409 }
        );
      }

      if (dbError.code === 'VALIDATION_ERROR') {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: dbError.message || 'Invalid candidate data.',
              code: 'VALIDATION_ERROR'
            }
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unable to convert application. Please try again.',
            code: 'CONVERSION_ERROR'
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Application conversion API error:', error);

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