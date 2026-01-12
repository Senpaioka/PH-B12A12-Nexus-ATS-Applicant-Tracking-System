'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle, Select, Separator } from '@/components/ui/common';

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch job data from API
    const fetchJob = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/jobs/${params.jobId}`);
            const data = await response.json();

            if (data.success) {
                setJob(data.job);
            } else {
                setError(data.error?.message || 'Failed to fetch job details');
                if (response.status === 404) {
                    // Job not found, redirect to jobs list
                    setTimeout(() => router.push('/jobs'), 2000);
                }
            }
        } catch (err) {
            console.error('Error fetching job:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.jobId) {
            fetchJob();
        }
    }, [params.jobId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Extract form data
        const formData = new FormData(e.target);
        const jobData = {
            title: formData.get('title'),
            department: formData.get('department'),
            type: formData.get('type'),
            location: formData.get('location'),
            salary: formData.get('salary') || null,
            status: formData.get('status'),
            description: formData.get('description'),
            requirements: formData.get('requirements')
        };

        // TODO: Implement job update API call
        console.log('Job update data:', jobData);
        
        // Simulate API call for now
        setTimeout(() => {
            setIsLoading(false);
            router.push('/jobs');
        }, 1000);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
            setIsLoading(true);
            
            // TODO: Implement job deletion API call
            console.log('Deleting job:', params.jobId);
            
            // Simulate API call for now
            setTimeout(() => {
                setIsLoading(false);
                router.push('/jobs');
            }, 800);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading job details...</span>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto pb-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/jobs')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Edit Job</h2>
                        <p className="text-muted-foreground text-sm">Update job details and requirements.</p>
                    </div>
                </div>
                
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-5 w-5" />
                            <p className="font-medium">{error}</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchJob}
                            >
                                Try Again
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => router.push('/jobs')}
                            >
                                Back to Jobs
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Job not found
    if (!job) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto pb-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/jobs')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Job Not Found</h2>
                        <p className="text-muted-foreground text-sm">The job you're looking for doesn't exist.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Edit Job</h2>
                        <p className="text-muted-foreground text-sm">Update job details and requirements.</p>
                    </div>
                </div>
                <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full sm:w-auto" 
                    onClick={handleDelete}
                    disabled={isLoading}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Job
                </Button>
            </div>

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
                                    defaultValue={job.title} 
                                    required 
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Select 
                                    id="department" 
                                    name="department"
                                    defaultValue={job.department.toLowerCase()} 
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
                                    defaultValue={job.type.toLowerCase()} 
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
                                    defaultValue={job.location} 
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
                                defaultValue={job.salary || ''} 
                                placeholder="e.g. $120k - $150k"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select 
                                id="status" 
                                name="status"
                                defaultValue={job.status.toLowerCase()}
                                disabled={isLoading}
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="closed">Closed</option>
                            </Select>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="description">Job Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={job.description}
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
                                defaultValue={job.requirements}
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
                                {isLoading ? 'Saving...' : 'Update Job'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
