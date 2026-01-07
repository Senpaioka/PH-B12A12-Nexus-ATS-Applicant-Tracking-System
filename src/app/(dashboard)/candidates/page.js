'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MoreVertical, Plus } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui/common';
import { candidates as initialCandidates } from '@/../mockData';
import { cn } from '@/lib/utils';

const PIPELINE_STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

const CandidateCard = ({ candidate }) => {
    return (
        <Card className="p-3 mb-3 cursor-pointer hover:shadow-md transition-shadow group border-l-4 border-l-transparent hover:border-l-primary">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-semibold text-sm">{candidate.name}</h4>
                    <p className="text-xs text-muted-foreground">{candidate.role}</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                {candidate.skills.slice(0, 2).map(skill => (
                    <span key={skill} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                        {skill}
                    </span>
                ))}
                {candidate.skills.length > 2 && (
                    <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                        +{candidate.skills.length - 2}
                    </span>
                )}
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{candidate.experience}</span>
                <span>{new Date(candidate.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
        </Card>
    );
};

export default function CandidatesPage() {
    const router = useRouter();
    const [candidates] = useState(initialCandidates);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Candidates</h2>
                        <p className="text-muted-foreground">Manage your recruitment pipeline</p>
                    </div>
                    <Button onClick={() => router.push('/candidates/new')} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Candidate
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search pipeline..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 w-full bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-initial h-9">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-[1000px] h-full">
                    {PIPELINE_STAGES.map(stage => {
                        const stageCandidates = filteredCandidates.filter(c => c.status === stage);
                        return (
                            <div key={stage} className="flex-1 min-w-[280px] flex flex-col">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{stage}</h3>
                                        <Badge variant="secondary" className="rounded-md px-1.5">
                                            {stageCandidates.length}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-2 flex-1 border border-dashed border-slate-300">
                                    {stageCandidates.map(candidate => (
                                        <CandidateCard key={candidate.id} candidate={candidate} />
                                    ))}
                                    <button
                                        onClick={() => router.push('/candidates/new')}
                                        className="w-full py-2 text-sm text-muted-foreground hover:text-primary hover:bg-background/50 rounded-md border border-transparent hover:border-border border-dashed transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Add to {stage}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
