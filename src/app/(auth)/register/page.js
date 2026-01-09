'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Loader2, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/common';

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [emailValidation, setEmailValidation] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Real-time email validation
    useEffect(() => {
        if (formData.email && formData.email.length > 0) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (emailRegex.test(formData.email)) {
                setEmailValidation({ isValid: true, message: 'Valid email format' });
            } else {
                setEmailValidation({ isValid: false, message: 'Please enter a valid email address' });
            }
        } else {
            setEmailValidation(null);
        }
    }, [formData.email]);

    // Real-time password strength validation
    useEffect(() => {
        if (formData.password && formData.password.length > 0) {
            const strength = validatePasswordStrength(formData.password);
            setPasswordStrength(strength);
        } else {
            setPasswordStrength(null);
        }
    }, [formData.password]);

    const validatePasswordStrength = (password) => {
        const result = {
            score: 0,
            feedback: [],
            strength: 'weak'
        };

        if (password.length >= 8) {
            result.score += 1;
            result.feedback.push('✓ At least 8 characters');
        } else {
            result.feedback.push('✗ At least 8 characters required');
        }

        if (/[A-Z]/.test(password)) {
            result.score += 1;
            result.feedback.push('✓ Contains uppercase letter');
        } else {
            result.feedback.push('✗ Add uppercase letter');
        }

        if (/[a-z]/.test(password)) {
            result.score += 1;
            result.feedback.push('✓ Contains lowercase letter');
        } else {
            result.feedback.push('✗ Add lowercase letter');
        }

        if (/\d/.test(password)) {
            result.score += 1;
            result.feedback.push('✓ Contains number');
        } else {
            result.feedback.push('✗ Add number');
        }

        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            result.score += 1;
            result.feedback.push('✓ Contains special character (recommended)');
        }

        // Determine strength
        if (result.score >= 4) {
            result.strength = 'strong';
        } else if (result.score >= 3) {
            result.strength = 'medium';
        } else {
            result.strength = 'weak';
        }

        return result;
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!emailValidation?.isValid) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (passwordStrength?.score < 3) {
            newErrors.password = 'Password is too weak. Please follow the requirements.';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Password confirmation is required';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});
        setSuccessMessage('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage(data.message);
                // Redirect to login after a short delay
                setTimeout(() => {
                    router.push('/login?message=registration-success');
                }, 2000);
            } else {
                // Handle validation errors
                if (data.error.details) {
                    const fieldErrors = {};
                    data.error.details.forEach(error => {
                        fieldErrors[error.field] = error.message;
                    });
                    setErrors(fieldErrors);
                } else if (data.error.field) {
                    setErrors({ [data.error.field]: data.error.message });
                } else {
                    setErrors({ general: data.error.message });
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            setErrors({ general: 'Network error. Please check your connection and try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const getStrengthColor = (strength) => {
        switch (strength) {
            case 'strong': return 'text-green-600';
            case 'medium': return 'text-yellow-600';
            default: return 'text-red-600';
        }
    };

    const getStrengthBars = (score) => {
        return Array.from({ length: 4 }, (_, i) => (
            <div
                key={i}
                className={`h-1 rounded-full flex-1 ${
                    i < score 
                        ? score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                        : 'bg-gray-200'
                }`}
            />
        ));
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
                    <CardTitle className="text-2xl text-center">Create an account</CardTitle>
                    <p className="text-sm text-muted-foreground text-center">
                        Enter your information to get started
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

                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <p className="text-sm text-red-800">{errors.general}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className={errors.email ? 'border-red-500' : emailValidation?.isValid ? 'border-green-500' : ''}
                                />
                                {emailValidation && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        {emailValidation.isValid ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                            {errors.email && (
                                <p className="text-sm text-red-600">{errors.email}</p>
                            )}
                            {emailValidation && !emailValidation.isValid && !errors.email && (
                                <p className="text-sm text-red-600">{emailValidation.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className={errors.password ? 'border-red-500' : ''}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            
                            {passwordStrength && (
                                <div className="space-y-2">
                                    <div className="flex gap-1">
                                        {getStrengthBars(passwordStrength.score)}
                                    </div>
                                    <p className={`text-sm font-medium ${getStrengthColor(passwordStrength.strength)}`}>
                                        Password strength: {passwordStrength.strength}
                                    </p>
                                    <div className="text-xs space-y-1">
                                        {passwordStrength.feedback.map((item, index) => (
                                            <p key={index} className={item.startsWith('✓') ? 'text-green-600' : 'text-red-600'}>
                                                {item}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {errors.password && (
                                <p className="text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={errors.confirmPassword ? 'border-red-500' : formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' : ''}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Passwords match
                                </div>
                            )}
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">Already have an account? </span>
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
