/**
 * Dashboard Activity API
 * Provides recent activity feed for the dashboard
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCollection } from '@/lib/mongodb';

/**
 * GET /api/dashboard/activity - Get recent activity feed
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Get collections
    const [candidatesCollection, jobsCollection, interviewsCollection] = await Promise.all([
      getCollection('candidates'),
      getCollection('jobs'),
      getCollection('interviews')
    ]);

    // Get recent activities from different sources
    const [recentCandidates, recentJobs, recentInterviews] = await Promise.all([
      // Recent candidate applications
      candidatesCollection.find(
        { 'metadata.isActive': true },
        { 
          projection: { 
            'personalInfo.firstName': 1, 
            'personalInfo.lastName': 1,
            'professionalInfo.appliedForRole': 1,
            'metadata.createdAt': 1 
          } 
        }
      ).sort({ 'metadata.createdAt': -1 }).limit(5).toArray().catch(() => []),

      // Recent job postings
      jobsCollection.find(
        { 'metadata.isActive': true },
        { 
          projection: { 
            title: 1, 
            'metadata.createdAt': 1 
          } 
        }
      ).sort({ 'metadata.createdAt': -1 }).limit(3).toArray().catch(() => []),

      // Recent interviews
      interviewsCollection.find(
        { 'metadata.isActive': true },
        { 
          projection: { 
            candidateName: 1, 
            type: 1, 
            status: 1,
            'metadata.createdAt': 1,
            'metadata.updatedAt': 1
          } 
        }
      ).sort({ 'metadata.updatedAt': -1 }).limit(5).toArray().catch(() => [])
    ]);

    // Format activities
    const activities = [];

    // Add candidate activities
    recentCandidates.forEach(candidate => {
      const firstName = candidate.personalInfo?.firstName || 'Unknown';
      const lastName = candidate.personalInfo?.lastName || 'Candidate';
      const role = candidate.professionalInfo?.appliedForRole || 'a position';
      
      activities.push({
        id: `candidate-${candidate._id}`,
        name: `${firstName} ${lastName}`,
        action: 'applied for',
        target: role,
        time: formatTimeAgo(candidate.metadata.createdAt),
        timestamp: candidate.metadata.createdAt,
        type: 'candidate'
      });
    });

    // Add job activities
    recentJobs.forEach(job => {
      activities.push({
        id: `job-${job._id}`,
        name: 'System',
        action: 'posted job',
        target: job.title,
        time: formatTimeAgo(job.metadata.createdAt),
        timestamp: job.metadata.createdAt,
        type: 'job'
      });
    });

    // Add interview activities
    recentInterviews.forEach(interview => {
      let action = 'scheduled';
      if (interview.status === 'completed') {
        action = 'completed';
      } else if (interview.status === 'cancelled') {
        action = 'cancelled';
      }

      activities.push({
        id: `interview-${interview._id}`,
        name: interview.candidateName || 'Unknown Candidate',
        action: action,
        target: `${interview.type} interview`,
        time: formatTimeAgo(interview.metadata.updatedAt),
        timestamp: interview.metadata.updatedAt,
        type: 'interview'
      });
    });

    // Sort all activities by timestamp (most recent first) and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
      .map(activity => {
        // Remove timestamp from final response
        const { timestamp, ...activityWithoutTimestamp } = activity;
        return activityWithoutTimestamp;
      });

    return NextResponse.json({ activities: sortedActivities });

  } catch (error) {
    console.error('Error fetching dashboard activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}

/**
 * Format timestamp to relative time string
 * @param {Date} date - Date to format
 * @returns {string} Formatted time string
 */
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
}