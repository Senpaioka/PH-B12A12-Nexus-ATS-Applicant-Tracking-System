/**
 * User Profile API Routes
 * Handles profile updates including bio and photoURL
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { updateUserProfile, getUserProfile, formatProfileError } from '@/lib/auth/profile.js';

/**
 * GET /api/user/profile
 * Retrieves the current user's profile
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const profile = await getUserProfile(session.user.id);
    
    return NextResponse.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Profile GET error:', error);
    const errorResponse = formatProfileError(error);
    
    const statusCode = error.code === 'USER_NOT_FOUND' ? 404 : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * PUT /api/user/profile
 * Updates the current user's profile
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Extract allowed profile fields
    const profileData = {};
    
    if (body.name !== undefined) {
      profileData.name = body.name;
    }
    
    if (body.bio !== undefined) {
      profileData.bio = body.bio;
    }
    
    if (body.photoURL !== undefined) {
      profileData.photoURL = body.photoURL;
    }

    // Update profile
    const updatedProfile = await updateUserProfile(session.user.id, profileData);
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });

  } catch (error) {
    console.error('Profile PUT error:', error);
    const errorResponse = formatProfileError(error);
    
    // Determine status code based on error type
    let statusCode = 500;
    if (error.code === 'USER_NOT_FOUND') {
      statusCode = 404;
    } else if (error.code === 'USER_ID_REQUIRED' || error.field) {
      statusCode = 400;
    }
    
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}