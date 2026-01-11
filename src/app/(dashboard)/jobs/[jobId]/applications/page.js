'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, MoreVertical, Mail, Calendar, Briefcase } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Select } from '@/components/ui/common';
import { jobs, candidates as allCandidates } from '@/lib/data/sampleData';

export default function JobApplicationsPage() {
    const params = useParams();
    const router = useRouter();
    const job = jobs.find(j => j.id === params.jobId);

    // Filter candidates who applied for this job title
    const jobCandidates = allCandidates.filter(c => c.role === job?.title);

    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    if (!job) {
        return <div className="p-8 text-center">Job not found</div>;
    }

    const filteredCandidates = jobCandidates.filter(c => {
        const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

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
                        <span className="text-xl sm:text-2xl font-bold">{jobCandidates.length}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pipeline</span>
                        <span className="text-xl sm:text-2xl font-bold">{jobCandidates.filter(c => ['Screening', 'Interview'].includes(c.status)).length}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">Offered</span>
                        <span className="text-xl sm:text-2xl font-bold text-green-600">{jobCandidates.filter(c => c.status === 'Offer').length}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">Rejected</span>
                        <span className="text-xl sm:text-2xl font-bold text-muted-foreground">{jobCandidates.filter(c => ['Rejected'].includes(c.status)).length}</span>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and List */}
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-4">
                    <CardTitle>Candidates</CardTitle>
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
                    <div className="space-y-4">
                        {filteredCandidates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Search className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg">No candidates found</h3>
                                <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                            </div>
                        ) : (
                            filteredCandidates.map(candidate => (
                                <div key={candidate.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {candidate.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg hover:text-primary cursor-pointer transition-colors">{candidate.name}</h4>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {candidate.email}
                                                </span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    Applied {new Date(candidate.appliedDate).toLocaleDateString()}
                                                </span>
                                                <span className="hidden sm:inline">•</span>
                                                <span>{candidate.experience} exp</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                                        <div className="flex flex-wrap gap-1 max-w-[200px] justify-start md:justify-end">
                                            {candidate.skills.slice(0, 3).map(skill => (
                                                <span key={skill} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md font-medium">
                                                    {skill}
                                                </span>
                                            ))}
                                            {candidate.skills.length > 3 && (
                                                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md font-medium">
                                                    +{candidate.skills.length - 3}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={
                                                candidate.status === 'Hired' ? 'success' :
                                                    candidate.status === 'Rejected' ? 'destructive' :
                                                        candidate.status === 'Offer' ? 'default' :
                                                            'secondary'
                                            } className="text-sm px-2.5 py-0.5">
                                                {candidate.status}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
