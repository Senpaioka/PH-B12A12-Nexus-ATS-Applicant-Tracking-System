'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, DollarSign, Users, Briefcase, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, Button, Input, Select } from '@/components/ui/common';

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

export default function BrowseJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');

    // Fetch all active jobs
    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError(null);

            // For now, we'll fetch from the same endpoint but we should create a public endpoint
            const response = await fetch('/api/jobs?status=Active');
            const data = await response.json();

            if (data.success) {
                // Only show active jobs
                const activeJobs = (data.jobs || []).filter(job => job.status === 'Active');
                setJobs(activeJobs);
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

    useEffect(() => {
        fetchJobs();
    }, []);

    // Filter jobs based on search and department
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = !searchQuery || 
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDepartment = departmentFilter === 'All' || 
            job.department.toLowerCase() === departmentFilter.toLowerCase();
        
        return matchesSearch && matchesDepartment;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Browse Jobs</h2>
                    <p className="text-muted-foreground">Find and apply for open positions</p>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search jobs by title, description, or location..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="w-full sm:w-[200px]"
                    >
                        <option value="All">All Departments</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Product">Product</option>
                        <option value="Sales">Sales</option>
                    </Select>
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
                            onClick={fetchJobs}
                        >
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Jobs List */}
            {!loading && !error && (
                <div className="grid gap-6">
                    {filteredJobs.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">No Jobs Found</h3>
                            <p className="text-muted-foreground mb-4">
                                {jobs.length === 0 
                                    ? "No active job postings are currently available." 
                                    : "No jobs match your search criteria. Try adjusting your filters."
                                }
                            </p>
                        </div>
                    ) : (
                        filteredJobs.map(job => (
                            <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/jobs/browse/${job.id}`)}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="space-y-3 flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-xl text-primary hover:underline truncate">
                                                    {job.title}
                                                </h3>
                                                <StatusBadge status={job.status} />
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Briefcase className="h-4 w-4" />
                                                    {job.department}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4" />
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <DollarSign className="h-4 w-4" />
                                                    {job.salaryRange}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4" />
                                                    {job.type}
                                                </span>
                                            </div>

                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                {job.description}
                                            </p>

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Users className="h-4 w-4" />
                                                    <span>{job.applicantsCount} applicants</span>
                                                    <span>•</span>
                                                    <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col gap-2 sm:items-end">
                                            <Button 
                                                size="sm" 
                                                className="flex-1 sm:flex-initial"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/jobs/browse/${job.id}`);
                                                }}
                                            >
                                                View Details
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