'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, MoreVertical, Mail, Calendar, Briefcase, Users, AlertCircle, Loader2, ExternalLink, Phone, Linkedin } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Select } from '@/components/ui/common';

// Applications List Component
function ApplicationsList({ jobId }) {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/jobs/${jobId}/applications`);
            const data = await response.json();

            if (data.success) {
                setApplications(data.applications || []);
            } else {
                setError(data.error?.message || 'Failed to fetch applications');
            }
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (jobId) {
            fetchApplications();
        }
    }, [jobId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading applications...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="flex items-center justify-center gap-2 text-red-600 mb-3">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchApplications}>
                    Try Again
                </Button>
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No Applications Yet</h3>
                <p className="text-muted-foreground">Applications will appear here once candidates start applying.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {applications.map(application => (
                <div key={application.id} className="flex flex-col md:flex-row md:items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4">
                    <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-semibold text-lg">Application #{application.id.slice(-8)}</h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Applied {new Date(application.appliedAt).toLocaleDateString()}
                                    </span>
                                    {application.phone && (
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5" />
                                            {application.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Badge variant={
                                application.status === 'Hired' ? 'success' :
                                application.status === 'Rejected' ? 'destructive' :
                                application.status === 'Offer' ? 'default' :
                                'secondary'
                            } className="text-sm px-2.5 py-0.5">
                                {application.status}
                            </Badge>
                        </div>

                        <div>
                            <h5 className="font-medium text-sm text-muted-foreground mb-1">Cover Letter</h5>
                            <p className="text-sm leading-relaxed line-clamp-3">{application.coverLetter}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {application.resumeUrl && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Resume
                                    </a>
                                </Button>
                            )}
                            {application.linkedinUrl && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                        <Linkedin className="h-3 w-3 mr-1" />
                                        LinkedIn
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function JobApplicationsPage() {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading job applications...</span>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6 pb-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/jobs')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Job Applications</h2>
                        <p className="text-muted-foreground text-sm">View and manage applications for this job.</p>
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
            <div className="space-y-6 pb-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/jobs')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Job Not Found</h2>
                        <p className="text-muted-foreground text-sm">The job you're looking for doesn't exist.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push('/jobs')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold tracking-tight truncate">{job.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm mt-1">
                        <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {job.department}
                        </span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total</span>
                        <span className="text-xl sm:text-2xl font-bold">{job.applicantsCount}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pipeline</span>
                        <span className="text-xl sm:text-2xl font-bold">0</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">Offered</span>
                        <span className="text-xl sm:text-2xl font-bold text-green-600">0</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">Hired</span>
                        <span className="text-xl sm:text-2xl font-bold text-blue-600">0</span>
                    </CardContent>
                </Card>
            </div>

            {/* Applications Management */}
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-4">
                    <CardTitle>Applications</CardTitle>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search candidates..."
                                className="pl-9 w-full md:w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full md:w-[180px]"
                        >
                            <option value="All">All Status</option>
                            <option value="Applied">Applied</option>
                            <option value="Screening">Screening</option>
                            <option value="Interview">Interview</option>
                            <option value="Offer">Offer</option>
                            <option value="Hired">Hired</option>
                            <option value="Rejected">Rejected</option>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <ApplicationsList jobId={job.id} />
                </CardContent>
            </Card>

            {/* Job Details Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Department</h4>
                            <p className="font-medium">{job.department}</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Employment Type</h4>
                            <p className="font-medium">{job.type}</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Location</h4>
                            <p className="font-medium">{job.location}</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Salary Range</h4>
                            <p className="font-medium">{job.salaryRange}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                        <p className="text-sm leading-relaxed">{job.description}</p>
                    </div>
                    
                    <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Requirements</h4>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{job.requirements}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
