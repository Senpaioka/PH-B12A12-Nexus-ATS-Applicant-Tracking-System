'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Plus, MapPin, DollarSign, Users, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, Button, Select } from '@/components/ui/common';

const StatusBadge = ({ status }) => {
    const styles = {
        Active: "bg-green-100 text-green-700 border-green-200",
        Closed: "bg-slate-100 text-slate-700 border-slate-200",
        Draft: "bg-amber-100 text-amber-700 border-amber-200"
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
            {status}
        </span>
    );
};

export default function JobsPage() {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState('All');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch jobs from API
    const fetchJobs = async (status = 'All') => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (status !== 'All') {
                params.append('status', status);
            }

            const response = await fetch(`/api/jobs?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setJobs(data.jobs || []);
            } else {
                setError(data.error?.message || 'Failed to fetch jobs');
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load jobs on component mount
    useEffect(() => {
        fetchJobs(statusFilter);
    }, [statusFilter]);

    // Handle status filter change
    const handleStatusFilterChange = (e) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
    };

    const filteredJobs = jobs.filter(job =>
        statusFilter === 'All' ? true : job.status === statusFilter
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
                    <p className="text-muted-foreground">Manage job postings and applications</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/jobs/browse')}
                    >
                        Browse All Jobs
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchJobs(statusFilter)}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="w-[150px] bg-background"
                        disabled={loading}
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Closed">Closed</option>
                    </Select>
                    <Button onClick={() => router.push('/jobs/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Post New Job
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading jobs...</span>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-5 w-5" />
                            <p className="font-medium">{error}</p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={() => fetchJobs(statusFilter)}
                        >
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Jobs List */}
            {!loading && !error && (
                <div className="grid gap-4">
                    {filteredJobs.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground mb-2">
                                {jobs.length === 0 
                                    ? "No job postings yet. Create your first job posting to get started!" 
                                    : "No jobs found matching your filter."
                                }
                            </p>
                            {jobs.length === 0 && (
                                <Button onClick={() => router.push('/jobs/new')} className="mt-2">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Job
                                </Button>
                            )}
                        </div>
                    ) : (
                        filteredJobs.map(job => (
                            <Card key={job.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-base sm:text-lg hover:text-primary cursor-pointer truncate" onClick={() => router.push(`/jobs/${job.id}/edit`)}>{job.title}</h3>
                                                <StatusBadge status={job.status} />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" />
                                                    {job.salaryRange}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    {job.department}
                                                </span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.push(`/jobs/${job.id}/edit`)}>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t gap-4">
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{job.applicantsCount}</span>
                                                <span className="text-muted-foreground text-sm">Candidates</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Posted {new Date(job.postedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-initial"
                                                onClick={() => {
                                                    try {
                                                        router.push(`/jobs/${job.id}/applications`);
                                                    } catch (error) {
                                                        console.error('Navigation error:', error);
                                                    }
                                                }}
                                            >
                                                View Applications
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                className="flex-1 sm:flex-initial" 
                                                onClick={() => {
                                                    try {
                                                        router.push(`/jobs/${job.id}/edit`);
                                                    } catch (error) {
                                                        console.error('Navigation error:', error);
                                                    }
                                                }}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
