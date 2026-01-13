'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import Link from 'next/link';
import { Briefcase, Loader2, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/common';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isGoogleAvailable, setIsGoogleAvailable] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Check for messages from URL params
    useEffect(() => {
        const message = searchParams.get('message');
        const error = searchParams.get('error');

        if (message === 'registration-success') {
            setSuccessMessage('Account created successfully! Please sign in with your credentials.');
        } else if (message === 'email-verified') {
            setSuccessMessage('Email verified successfully! You can now sign in.');
        } else if (message === 'account-deleted') {
            setSuccessMessage('Your account has been successfully deleted. Thank you for using Nexus ATS.');
        }

        if (error) {
            switch (error) {
                case 'CredentialsSignin':
                    setError('Invalid email or password. Please try again.');
                    break;
                case 'Configuration':
                    setError('Authentication service is temporarily unavailable.');
                    break;
                case 'google-not-registered':
                    setError('This Google account is not registered. Please sign up first or use a different account.');
                    break;
                default:
                    setError('An error occurred during sign in. Please try again.');
            }
        }
    }, [searchParams]);

    // Check if Google OAuth is configured
    useEffect(() => {
        const checkGoogleStatus = async () => {
            try {
                const response = await fetch('/api/auth/google-status');
                const data = await response.json();
                setIsGoogleAvailable(data.isConfigured);
            } catch (error) {
                console.error('Failed to check Google OAuth status:', error);
                setIsGoogleAvailable(false);
            }
        };
        
        checkGoogleStatus();
    }, []);

    // Check if user is already authenticated
    useEffect(() => {
        const checkSession = async () => {
            const session = await getSession();
            if (session) {
                router.push('/');
            }
        };
        checkSession();
    }, [router]);

    const validateForm = () => {
        if (!formData.email) {
            setError('Email is required');
            return false;
        }

        if (!formData.password) {
            setError('Password is required');
            return false;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const result = await signIn('credentials', {
                email: formData.email.trim(),
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                switch (result.error) {
                    case 'CredentialsSignin':
                        setError('Invalid email or password. Please check your credentials and try again.');
                        break;
                    case 'Configuration':
                        setError('Authentication service is temporarily unavailable. Please try again later.');
                        break;
                    default:
                        setError('An error occurred during sign in. Please try again.');
                }
            } else if (result?.ok) {
                // Sign in successful, redirect to dashboard
                router.push('/');
                router.refresh(); // Refresh to update session state
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
            // Use signIn with a callback URL that includes login intent
            await signIn('google', { 
                callbackUrl: '/login?intent=signin',
                redirect: true 
            });
        } catch (error) {
            console.error('Google sign-in error:', error);
            setError('Failed to sign in with Google. Please try again.');
        } finally {
            setIsGoogleLoading(false);
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
                    <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
                    <p className="text-sm text-muted-foreground text-center">
                        Enter your email and password to sign in
                    </p>
                </CardHeader>
                <CardContent>
                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <p className="text-sm text-green-800">{successMessage}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="#" className="text-sm text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>

                    {isGoogleAvailable && (
                        <div className="mt-4">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full mt-4"
                                onClick={handleGoogleSignIn}
                                disabled={isGoogleLoading || isLoading}
                            >
                                {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {!isGoogleLoading && (
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                )}
                                Sign in with Google
                            </Button>
                        </div>
                    )}

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link href="/register" className="font-medium text-primary hover:underline">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <p className="mt-8 text-center text-xs text-muted-foreground">
                &copy; 2024 Nexus ATS. All rights reserved.
            </p>
        </div>
    );
}
