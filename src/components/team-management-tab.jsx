'use client';

import React, { useState, useEffect } from 'react';
import { Users, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/common';
import { InviteMemberDialog } from '@/components/ui/invite-member-dialog';

// Team Management Tab Component
function TeamManagementTab({ session }) {
    const [invitations, setInvitations] = useState([]);
    const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadInvitations();
    }, []);

    const loadInvitations = async () => {
        setIsLoadingInvitations(true);
        setError(null);
        try {
            const response = await fetch('/api/team/invitations');
            const data = await response.json();

            if (data.success) {
                setInvitations(data.data || []);
            } else {
                setError(data.error || 'Failed to load invitations');
            }
        } catch (error) {
            console.error('Error loading invitations:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsLoadingInvitations(false);
        }
    };

    const handleInviteSuccess = (newInvitation) => {
        // Reload invitations to show the new one
        loadInvitations();
    };

    const handleRevokeInvitation = async (invitationId) => {
        if (!confirm('Are you sure you want to revoke this invitation?')) {
            return;
        }

        try {
            const response = await fetch(`/api/team/invitations/${invitationId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                // Reload invitations
                loadInvitations();
            } else {
                alert(data.error || 'Failed to revoke invitation');
            }
        } catch (error) {
            console.error('Error revoking invitation:', error);
            alert('Network error. Please try again.');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            accepted: 'bg-green-100 text-green-800 border-green-200',
            expired: 'bg-red-100 text-red-800 border-red-200',
            declined: 'bg-gray-100 text-gray-800 border-gray-200',
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.pending}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <>
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Team Invitations</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage pending invitations and team members
                        </p>
                    </div>
                    <Button size="sm" onClick={() => setShowInviteDialog(true)}>
                        <Users className="mr-2 h-4 w-4" />
                        Invite Member
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoadingInvitations ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No invitations yet.</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Click "Invite Member" to send your first invitation.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invitations.map((invitation) => (
                                <div
                                    key={invitation.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium flex-shrink-0">
                                            {invitation.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium leading-none truncate">
                                                {invitation.email}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500">{invitation.role}</span>
                                                <span className="text-xs text-gray-400">•</span>
                                                {getStatusBadge(invitation.status)}
                                            </div>
                                            {invitation.isExpired && invitation.status === 'pending' && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    Expired {invitation.daysUntilExpiry < 0 ? Math.abs(invitation.daysUntilExpiry) + ' days ago' : ''}
                                                </p>
                                            )}
                                            {!invitation.isExpired && invitation.status === 'pending' && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Expires in {invitation.daysUntilExpiry} day{invitation.daysUntilExpiry !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {invitation.status === 'pending' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRevokeInvitation(invitation.id)}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Revoke
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <InviteMemberDialog
                isOpen={showInviteDialog}
                onClose={() => setShowInviteDialog(false)}
                onInviteSuccess={handleInviteSuccess}
            />
        </>
    );
}

export { TeamManagementTab };
