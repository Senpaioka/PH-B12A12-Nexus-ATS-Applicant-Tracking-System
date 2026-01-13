/**
 * Team Invitation API - Individual Resource
 * Handles operations on specific team invitations
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { getCollection } from '@/lib/mongodb';
import {
    deleteInvitation,
    findInvitationByToken // Importing this just in case, but we need ID lookup really, or just use delete
} from '@/lib/team/invitation-db.js';

/**
 * DELETE /api/team/invitations/[id] - Revoke/Cancel an invitation
 */
export async function DELETE(request, { params }) {
    try {
        // Await params as per Next.js 15+ requirements
        const { id } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid invitation ID' }, { status: 400 });
        }

        // Get user information to check permissions
        const usersCollection = await getCollection('users');
        const user = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // For now, we'll assume the user's organization is their user ID
        const organizationId = session.user.id;
        const userRole = user.role || 'user';

        // Check if user has admin permissions (only admins can revoke invitations)
        const isAdmin = userRole === 'admin' || user._id.toString() === organizationId;

        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Only administrators can revoke invitations' },
                { status: 403 }
            );
        }

        // Delete the invitation
        // We pass organizationId to ensure we only delete invitations for this organization
        const deleted = await deleteInvitation(id, organizationId);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Invitation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Invitation revoked successfully'
        });

    } catch (error) {
        console.error('Error revoking invitation:', error);
        return NextResponse.json(
            { error: 'Failed to revoke invitation' },
            { status: 500 }
        );
    }
}
