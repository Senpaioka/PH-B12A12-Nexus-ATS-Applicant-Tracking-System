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
        }

        if (error) {
            switch (error) {
                case 'CredentialsSignin':
                    setError('Invalid email or password. Please try again.');
                    break;
                case 'Configuration':
                    setError('Authentication service is temporarily unavailable.');
                    break;
                default:
                    setError('An error occurred during sign in. Please try again.');
            }
        }
    }, [searchParams]);

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
