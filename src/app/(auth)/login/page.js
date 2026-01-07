'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Loader2 } from 'lucide-react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/common';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            localStorage.setItem('nexus_auth', 'true');
            router.push('/');
        }, 1000);
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
                        Enter your email to sign in to your account
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="#" className="text-sm text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
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
