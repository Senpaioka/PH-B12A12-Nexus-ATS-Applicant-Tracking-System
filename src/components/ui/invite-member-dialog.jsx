/**
 * Team Invitation Dialog Component
 * Modal for inviting new team members
 */

'use client';

import React, { useState } from 'react';
import { X, Mail, Users, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
    Button,
    Input,
    Label,
    Textarea
} from '@/components/ui/common';

export function InviteMemberDialog({ isOpen, onClose, onInviteSuccess }) {
    const [formData, setFormData] = useState({
        email: '',
        role: 'Interviewer',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

    const roles = [
        { value: 'Admin', label: 'Admin', description: 'Full access to all features' },
        { value: 'Recruiter', label: 'Recruiter', description: 'Manage jobs and candidates' },
        { value: 'Interviewer', label: 'Interviewer', description: 'Conduct interviews' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Reset states
        setErrors({});
        setSubmitStatus(null);

        // Basic validation
        const newErrors = {};
        if (!formData.email || !formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/team/invitations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                setSubmitStatus('success');
                // Reset form
                setFormData({
                    email: '',
                    role: 'Interviewer',
                    message: ''
                });

                // Call success callback
                if (onInviteSuccess) {
                    onInviteSuccess(data.data);
                }

                // Close dialog after a brief delay
                setTimeout(() => {
                    onClose();
                    setSubmitStatus(null);
                }, 1500);
            } else {
                setSubmitStatus('error');
                if (data.details) {
                    setErrors({ general: data.details });
                } else {
                    setErrors({ general: data.error || 'Failed to send invitation' });
                }
            }
        } catch (error) {
            console.error('Invitation error:', error);
            setSubmitStatus('error');
            setErrors({ general: 'Network error. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setFormData({
                email: '',
                role: 'Interviewer',
                message: ''
            });
            setErrors({});
            setSubmitStatus(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto animate-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Invite Team Member</h2>
                            <p className="text-sm text-gray-500">Send an invitation to join your team</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Success/Error Messages */}
                    {submitStatus === 'success' && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <p className="text-sm text-green-800">Invitation sent successfully!</p>
                        </div>
                    )}

                    {errors.general && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{errors.general}</p>
                        </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Email Address <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="colleague@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`pl-9 ${errors.email ? 'border-red-500' : ''}`}
                                disabled={isSubmitting}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="role">
                            Role <span className="text-red-500">*</span>
                        </Label>
                        <div className="space-y-2">
                            {roles.map((role) => (
                                <label
                                    key={role.value}
                                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${formData.role === role.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role.value}
                                        checked={formData.role === role.value}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        disabled={isSubmitting}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{role.label}</p>
                                        <p className="text-xs text-gray-500">{role.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Optional Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Personal Message (Optional)</Label>
                        <Textarea
                            id="message"
                            placeholder="Add a personal message to the invitation..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="resize-none min-h-[80px]"
                            disabled={isSubmitting}
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-500">
                            {formData.message.length}/500 characters
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invitation
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
