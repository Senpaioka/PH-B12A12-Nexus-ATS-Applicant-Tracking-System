/**
 * Delete Account API
 * Handles permanent account deletion with all associated data
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * DELETE /api/user/delete-account - Permanently delete user account and all data
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { confirmationText } = body;

    // Validate confirmation text
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Confirmation text does not match. Please type "DELETE MY ACCOUNT" exactly.' },
        { status: 400 }
      );
    }

    const userId = new ObjectId(session.user.id);

    // Get all collections that might contain user data
    const [
      usersCollection,
      candidatesCollection,
      jobsCollection,
      interviewsCollection
    ] = await Promise.all([
      getCollection('users'),
      getCollection('candidates'),
      getCollection('jobs'),
      getCollection('interviews')
    ]);

    // Delete user data sequentially (simpler approach without transactions)
    const deletionResults = {
      candidates: 0,
      jobs: 0,
      interviews: 0,
      user: 0
    };

    try {
      // Delete user's candidates
      const candidatesResult = await candidatesCollection.deleteMany({ 
        'metadata.createdBy': userId 
      });
      deletionResults.candidates = candidatesResult.deletedCount;

      // Delete user's job postings
      const jobsResult = await jobsCollection.deleteMany({ 
        createdBy: userId 
      });
      deletionResults.jobs = jobsResult.deletedCount;

      // Delete user's interviews
      const interviewsResult = await interviewsCollection.deleteMany({ 
        'metadata.createdBy': userId 
      });
      deletionResults.interviews = interviewsResult.deletedCount;

      // Finally, delete the user account
      const userResult = await usersCollection.deleteOne({ 
        _id: userId 
      });
      deletionResults.user = userResult.deletedCount;

      if (userResult.deletedCount === 0) {
        return NextResponse.json(
          { error: 'User account not found or already deleted' },
          { status: 404 }
        );
      }

      // Log the account deletion for audit purposes
      console.log(`Account deleted successfully:`, {
        userId: userId.toString(),
        timestamp: new Date().toISOString(),
        deletedData: deletionResults
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Account and all associated data have been permanently deleted.',
        deletedData: deletionResults
      });

    } catch (deletionError) {
      console.error('Error during account deletion:', deletionError);
      return NextResponse.json(
        { error: 'Failed to delete account data. Please try again or contact support.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/delete-account - Get account deletion information
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = new ObjectId(session.user.id);

    // Get counts of data that will be deleted
    const [
      candidatesCollection,
      jobsCollection,
      interviewsCollection
    ] = await Promise.all([
      getCollection('candidates'),
      getCollection('jobs'),
      getCollection('interviews')
    ]);

    const [candidatesCount, jobsCount, interviewsCount] = await Promise.all([
      candidatesCollection.countDocuments({ 'metadata.createdBy': userId }),
      jobsCollection.countDocuments({ createdBy: userId }),
      interviewsCollection.countDocuments({ 'metadata.createdBy': userId })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        candidatesCount,
        jobsCount,
        interviewsCount,
        totalItems: candidatesCount + jobsCount + interviewsCount
      }
    });

  } catch (error) {
    console.error('Error getting account deletion info:', error);
    return NextResponse.json(
      { error: 'Failed to get account information' },
      { status: 500 }
    );
  }
}