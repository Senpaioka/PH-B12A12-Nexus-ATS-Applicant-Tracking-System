'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Loader2, CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui/common';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [resendEmail, setResendEmail] = useState('');
    const [resendMessage, setResendMessage] = useState('');
    const [resendError, setResendError] = useState('');

    // Get token from URL parameters
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            verifyEmailToken(token);
        }
    }, [token]); // Remove verifyEmailToken from dependencies to avoid infinite loop

    const verifyEmailToken = async (verificationToken) => {
        setIsVerifying(true);
        console.log('🔍 Starting email verification for token:', verificationToken);
        
        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: verificationToken }),
            });

            console.log('📡 API Response status:', response.status);
            const data = await response.json();
            console.log('📡 API Response data:', data);

            if (data.success) {
                console.log('✅ Verification successful!');
                setVerificationStatus({
                    success: true,
                    message: data.message,
                    user: data.user
                });
                
                // Redirect to login after 5 seconds (increased from 3)
                console.log('⏰ Setting redirect timer for 5 seconds...');
                setTimeout(() => {
                    console.log('🔄 Redirecting to login...');
                    router.push('/login?message=email-verified');
                }, 5000);
            } else {
                console.log('❌ Verification failed:', data.error);
                setVerificationStatus({
                    success: false,
                    message: data.error.message,
                    code: data.error.code
                });
            }
        } catch (error) {
            console.error('❌ Verification error:', error);
            setVerificationStatus({
                success: false,
                message: 'Network error. Please check your connection and try again.',
                code: 'NETWORK_ERROR'
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendVerification = async (e) => {
        e.preventDefault();
        
        if (!resendEmail.trim()) {
            setResendError('Email address is required');
            return;
        }

        setIsResending(true);
        setResendError('');
        setResendMessage('');

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: resendEmail.trim() }),
            });

            const data = await response.json();

            if (data.success) {
                setResendMessage(data.message);
                setResendEmail('');
            } else {
                setResendError(data.error.message);
            }
        } catch (error) {
            console.error('Resend error:', error);
            setResendError('Network error. Please check your connection and try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-8">
                <div className="h-10 w-10 rounded bg-primary flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="font-bold text-2xl tracking-tight">Nexus ATS</span>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Token Verification Section */}
                    {token && (
                        <div className="text-center">
                            {isVerifying && (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">
                                        Verifying your email address...
                                    </p>
                                </div>
                            )}

                            {verificationStatus && !isVerifying && (
                                <div className="space-y-4">
                                    {verificationStatus.success ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <CheckCircle className="h-12 w-12 text-green-600" />
                                            <div className="space-y-2">
                                                <h3 className="font-semibold text-green-800">
                                                    Email Verified Successfully!
                                                </h3>
                                                <p className="text-sm text-green-700">
                                                    {verificationStatus.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Redirecting to login page in 5 seconds...
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4">
                                            <XCircle className="h-12 w-12 text-red-600" />
                                            <div className="space-y-2">
                                                <h3 className="font-semibold text-red-800">
                                                    Verification Failed
                                                </h3>
                                                <p className="text-sm text-red-700">
                                                    {verificationStatus.message}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* No Token - Show Resend Form */}
                    {!token && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                                <h3 className="font-semibold mb-2">Verify Your Email</h3>
                                <p className="text-sm text-muted-foreground">
                                    Enter your email address to receive a new verification link.
                                </p>
                            </div>

                            {resendMessage && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <p className="text-sm text-green-800">{resendMessage}</p>
                                    </div>
                                </div>
                            )}

                            {resendError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <p className="text-sm text-red-800">{resendError}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleResendVerification} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={resendEmail}
                                        onChange={e => setResendEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button className="w-full" type="submit" disabled={isResending}>
                                    {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {!isResending && <RefreshCw className="mr-2 h-4 w-4" />}
                                    Send Verification Email
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <div className="text-center space-y-2">
                        <div className="text-sm">
                            <Link href="/login" className="font-medium text-primary hover:underline">
                                Back to Login
                            </Link>
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">Don&apos;t have an account? </span>
                            <Link href="/register" className="font-medium text-primary hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}