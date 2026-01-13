/**
 * Invitation Acceptance API
 * Handles retrieving invitation details and accepting invitations
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import {
    findInvitationByToken,
    updateInvitationStatus,
    createTeamMember,
    findTeamMember
} from '@/lib/team/invitation-db.js';
import {
    createTeamMemberDocument,
    INVITATION_STATUS,
    isInvitationExpired,
    formatInvitationForDisplay
} from '@/lib/team/invitation-models.js';
import { getCollection } from '@/lib/mongodb.js';

/**
 * GET /api/invitations/accept/[token] - Get invitation details by token
 */
export async function GET(request, { params }) {
    try {
        const { token } = await params;

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Find invitation by token
        const invitation = await findInvitationByToken(token);

        if (!invitation) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        // Check if invitation is expired
        if (isInvitationExpired(invitation)) {
            return NextResponse.json(
                {
                    error: 'This invitation has expired',
                    expired: true
                },
                { status: 410 }
            );
        }

        // Check if invitation is already accepted
        if (invitation.status === INVITATION_STATUS.ACCEPTED) {
            return NextResponse.json(
                {
                    error: 'This invitation has already been accepted',
                    alreadyAccepted: true
                },
                { status: 400 }
            );
        }

        // Check if invitation is pending
        if (invitation.status !== INVITATION_STATUS.PENDING) {
            return NextResponse.json(
                {
                    error: `This invitation is ${invitation.status}`,
                    status: invitation.status
                },
                { status: 400 }
            );
        }

        // Format invitation for display
        const formattedInvitation = formatInvitationForDisplay(invitation);

        return NextResponse.json({
            success: true,
            data: formattedInvitation
        });

    } catch (error) {
        console.error('Error retrieving invitation:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve invitation' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/invitations/accept/[token] - Accept an invitation
 */
export async function POST(request, { params }) {
    try {
        const { token } = await params;
        const session = await getServerSession(authOptions);

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // User must be authenticated to accept invitation
        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    error: 'You must be logged in to accept this invitation',
                    requiresAuth: true
                },
                { status: 401 }
            );
        }

        // Find invitation by token
        const invitation = await findInvitationByToken(token);

        if (!invitation) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        // Check if invitation is expired
        if (isInvitationExpired(invitation)) {
            return NextResponse.json(
                { error: 'This invitation has expired' },
                { status: 410 }
            );
        }

        // Check if invitation is already accepted
        if (invitation.status === INVITATION_STATUS.ACCEPTED) {
            return NextResponse.json(
                { error: 'This invitation has already been accepted' },
                { status: 400 }
            );
        }

        // Check if invitation is pending
        if (invitation.status !== INVITATION_STATUS.PENDING) {
            return NextResponse.json(
                { error: `This invitation is ${invitation.status}` },
                { status: 400 }
            );
        }

        // Get user information
        const usersCollection = await getCollection('users');
        const user = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify that the logged-in user's email matches the invitation email
        if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
            return NextResponse.json(
                {
                    error: 'This invitation was sent to a different email address',
                    invitationEmail: invitation.email,
                    userEmail: user.email
                },
                { status: 403 }
            );
        }

        // Check if user is already a team member
        const existingMember = await findTeamMember(user._id, invitation.organizationId);
        if (existingMember) {
            return NextResponse.json(
                { error: 'You are already a member of this team' },
                { status: 409 }
            );
        }

        // Create team member document
        const teamMemberData = createTeamMemberDocument({
            organizationId: invitation.organizationId,
            userId: user._id,
            role: invitation.role,
            invitedBy: invitation.invitedBy
        });

        // Save team member
        const teamMember = await createTeamMember(teamMemberData);

        // Update invitation status to accepted
        await updateInvitationStatus(
            invitation._id,
            INVITATION_STATUS.ACCEPTED,
            {
                acceptedBy: new ObjectId(user._id)
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Invitation accepted successfully',
            data: {
                teamMember: {
                    id: teamMember._id.toString(),
                    role: teamMember.role,
                    joinedAt: teamMember.joinedAt
                }
            }
        });

    } catch (error) {
        console.error('Error accepting invitation:', error);

        // Handle specific database errors
        if (error.message.includes('already a member')) {
            return NextResponse.json(
                { error: error.message },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to accept invitation' },
            { status: 500 }
        );
    }
}
