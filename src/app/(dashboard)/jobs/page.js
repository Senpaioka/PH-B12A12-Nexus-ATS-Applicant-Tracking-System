'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Plus, MapPin, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, Button, Select } from '@/components/ui/common';
import { jobs } from '@/../mockData';

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
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-[150px] bg-background"
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

            <div className="grid gap-4">
                {filteredJobs.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No jobs found matching your filter.</p>
                    </div>
                ) : (
                    filteredJobs.map(job => (
                        <Card key={job.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg hover:text-primary cursor-pointer" onClick={() => router.push(`/jobs/${job.id}/edit`)}>{job.title}</h3>
                                            <StatusBadge status={job.status} />
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                                    <Button variant="ghost" size="icon" onClick={() => router.push(`/jobs/${job.id}/edit`)}>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mt-6 flex items-center justify-between pt-4 border-t">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{job.applicantsCount}</span>
                                            <span className="text-muted-foreground text-sm">Candidates</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Posted {new Date(job.postedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/jobs/${job.id}/applications`)}
                                        >
                                            View Applications
                                        </Button>
                                        <Button size="sm" onClick={() => router.push(`/jobs/${job.id}/edit`)}>Edit</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
