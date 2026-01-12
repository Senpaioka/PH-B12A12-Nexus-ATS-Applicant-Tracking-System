'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, DollarSign, Briefcase, Clock, Users, Send, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Textarea, Input } from '@/components/ui/common';

export default function JobDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [applying, setApplying] = useState(false);
    const [applicationError, setApplicationError] = useState(null);
    const [applicationSuccess, setApplicationSuccess] = useState(false);
    const [showApplicationForm, setShowApplicationForm] = useState(false);

    // Fetch job data
    const fetchJob = React.useCallback(async () => {
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
                    setTimeout(() => router.push('/jobs/browse'), 2000);
                }
            }
        } catch (err) {
            console.error('Error fetching job:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [params.jobId, router]);

    useEffect(() => {
        if (params.jobId) {
            fetchJob();
        }
    }, [params.jobId, fetchJob]);

    // Handle application submission
    const handleApplicationSubmit = async (e) => {
        e.preventDefault();
        setApplying(true);
        setApplicationError(null);

        const formData = new FormData(e.target);
        const applicationData = {
            coverLetter: formData.get('coverLetter'),
            resumeUrl: formData.get('resumeUrl') || null,
            phone: formData.get('phone') || null,
            linkedinUrl: formData.get('linkedinUrl') || null
        };

        try {
            const response = await fetch(`/api/jobs/${params.jobId}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(applicationData),
            });

            const result = await response.json();

            if (result.success) {
                setApplicationSuccess(true);
                setShowApplicationForm(false);
                // Update job application count
                setJob(prev => ({
                    ...prev,
                    applicantsCount: prev.applicantsCount + 1
                }));
            } else {
                setApplicationError(result.error?.message || 'Failed to submit application');
            }
        } catch (err) {
            console.error('Application submission error:', err);
            setApplicationError('Network error. Please check your connection and try again.');
        } finally {
            setApplying(false);
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
            <div className="space-y-6 max-w-4xl mx-auto pb-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/jobs/browse')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Job Details</h2>
                        <p className="text-muted-foreground text-sm">View job information and apply.</p>
                    </div>
                </div>
                
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-5 w-5" />
                            <p className="font-medium">{error}</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm" onClick={fetchJob}>
                                Try Again
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => router.push('/jobs/browse')}>
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
            <div className="space-y-6 max-w-4xl mx-auto pb-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/jobs/browse')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Job Not Found</h2>
                        <p className="text-muted-foreground text-sm">The job you&apos;re looking for doesn&apos;t exist.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/jobs/browse')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Job Details</h2>
                    <p className="text-muted-foreground text-sm">View job information and apply.</p>
                </div>
            </div>

            {/* Success Message */}
            {applicationSuccess && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-5 w-5" />
                            <p className="font-medium">Application submitted successfully! We&apos;ll be in touch soon.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Job Header */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-primary mb-2">{job.title}</h1>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Briefcase className="h-4 w-4" />
                                            {job.department}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4" />
                                            {job.location}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-4 w-4" />
                                            {job.type}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <DollarSign className="h-4 w-4" />
                                            {job.salaryRange}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {job.applicantsCount} applicants
                                    </span>
                                    <span>•</span>
                                    <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Job Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
                        </CardContent>
                    </Card>

                    {/* Requirements */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Requirements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed whitespace-pre-line">{job.requirements}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Apply Button */}
                    {!applicationSuccess && (
                        <Card>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Interested in this role?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Submit your application and we&apos;ll get back to you soon.
                                    </p>
                                    <Button 
                                        className="w-full" 
                                        onClick={() => setShowApplicationForm(true)}
                                        disabled={showApplicationForm}
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        Apply Now
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Application Form */}
                    {showApplicationForm && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Submit Application</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {applicationError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <div className="flex items-center gap-2 text-red-800">
                                            <AlertCircle className="h-4 w-4" />
                                            <p className="text-sm font-medium">{applicationError}</p>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleApplicationSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="coverLetter">Cover Letter *</Label>
                                        <Textarea
                                            id="coverLetter"
                                            name="coverLetter"
                                            placeholder="Tell us why you&apos;re interested in this role and what makes you a great fit..."
                                            className="min-h-[120px]"
                                            required
                                            disabled={applying}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="resumeUrl">Resume URL</Label>
                                        <Input
                                            id="resumeUrl"
                                            name="resumeUrl"
                                            type="url"
                                            placeholder="https://example.com/resume.pdf"
                                            disabled={applying}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+1 (555) 123-4567"
                                            disabled={applying}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                                        <Input
                                            id="linkedinUrl"
                                            name="linkedinUrl"
                                            type="url"
                                            placeholder="https://linkedin.com/in/yourprofile"
                                            disabled={applying}
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowApplicationForm(false)}
                                            disabled={applying}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={applying} className="flex-1">
                                            {applying ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Submit
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Job Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Department</h4>
                                <p className="text-sm">{job.department}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Employment Type</h4>
                                <p className="text-sm">{job.type}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Location</h4>
                                <p className="text-sm">{job.location}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Salary Range</h4>
                                <p className="text-sm">{job.salaryRange}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}