'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle, Select, Separator } from '@/components/ui/common';

export default function CreateJobPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        // Extract form data
        const formData = new FormData(e.target);
        const jobData = {
            title: formData.get('title'),
            department: formData.get('department'),
            type: formData.get('type'),
            location: formData.get('location'),
            salary: formData.get('salary') || null,
            description: formData.get('description'),
            requirements: formData.get('requirements')
        };

        try {
            const response = await fetch('/api/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jobData),
            });

            const result = await response.json();

            if (result.success) {
                setSuccess(true);
                // Redirect after showing success message
                setTimeout(() => {
                    router.push('/jobs');
                }, 1500);
            } else {
                setError(result.error?.message || 'Failed to create job posting');
            }
        } catch (err) {
            console.error('Job creation error:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Create Job Posting</h2>
                    <p className="text-muted-foreground">Add a new role to your open positions.</p>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-5 w-5" />
                            <p className="font-medium">Job posting created successfully! Redirecting...</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Message */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-5 w-5" />
                            <p className="font-medium">{error}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Job Title</Label>
                                <Input 
                                    id="title" 
                                    name="title"
                                    placeholder="e.g. Senior Product Designer" 
                                    required 
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Select 
                                    id="department" 
                                    name="department"
                                    required 
                                    disabled={isLoading}
                                >
                                    <option value="">Select Department...</option>
                                    <option value="engineering">Engineering</option>
                                    <option value="design">Design</option>
                                    <option value="marketing">Marketing</option>
                                    <option value="product">Product</option>
                                    <option value="sales">Sales</option>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Employment Type</Label>
                                <Select 
                                    id="type" 
                                    name="type"
                                    required 
                                    disabled={isLoading}
                                >
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">Internship</option>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input 
                                    id="location" 
                                    name="location"
                                    placeholder="e.g. Remote / New York" 
                                    required 
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salary">Salary Range</Label>
                            <Input 
                                id="salary" 
                                name="salary"
                                placeholder="e.g. $120k - $150k" 
                                disabled={isLoading}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="description">Job Description</Label>
                            <Textarea 
                                id="description" 
                                name="description"
                                placeholder="Describe the role and responsibilities..." 
                                className="min-h-[150px]" 
                                required 
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requirements">Requirements</Label>
                            <Textarea 
                                id="requirements" 
                                name="requirements"
                                placeholder="List the required skills and experience..." 
                                className="min-h-[150px]" 
                                required 
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => router.back()}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                <Save className="mr-2 h-4 w-4" />
                                {isLoading ? 'Saving...' : 'Publish Job'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
