/**
 * Dashboard Trends API
 * Provides application trends data for charts
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCollection } from '@/lib/mongodb';

/**
 * GET /api/dashboard/trends - Get application trends for the last 7 days
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const candidatesCollection = await getCollection('candidates');

    // Calculate date range for last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Aggregate applications by day
    const pipeline = [
      {
        $match: {
          'metadata.isActive': true,
          'metadata.createdAt': { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$metadata.createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    const results = await candidatesCollection.aggregate(pipeline).toArray().catch(() => []);

    // Create a map of date -> count
    const dataMap = {};
    results.forEach(item => {
      dataMap[item._id] = item.count;
    });

    // Generate data for last 7 days
    const trendsData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      
      trendsData.push({
        name: dayName,
        apps: dataMap[dateString] || 0,
        date: dateString
      });
    }

    return NextResponse.json({ trends: trendsData });

  } catch (error) {
    console.error('Error fetching dashboard trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application trends' },
      { status: 500 }
    );
  }
}