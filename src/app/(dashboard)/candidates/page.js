'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MoreVertical, Plus, Loader2, X } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui/common';
import { cn } from '@/lib/utils';

const PIPELINE_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired'];

const SearchFilters = ({ onFiltersChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        skills: [],
        location: '',
        experience: '',
        source: ''
    });
    const [skillInput, setSkillInput] = useState('');

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const addSkill = (skill) => {
        if (skill && !filters.skills.includes(skill)) {
            const newSkills = [...filters.skills, skill];
            handleFilterChange('skills', newSkills);
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove) => {
        const newSkills = filters.skills.filter(skill => skill !== skillToRemove);
        handleFilterChange('skills', newSkills);
    };

    const clearFilters = () => {
        const emptyFilters = { skills: [], location: '', experience: '', source: '' };
        setFilters(emptyFilters);
        onFiltersChange(emptyFilters);
    };

    const hasActiveFilters = filters.skills.length > 0 || filters.location || filters.experience || filters.source;

    return (
        <div className="relative">
            <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                    "flex-1 sm:flex-initial h-9",
                    hasActiveFilters && "border-primary text-primary"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                        {filters.skills.length + (filters.location ? 1 : 0) + (filters.experience ? 1 : 0) + (filters.source ? 1 : 0)}
                    </Badge>
                )}
            </Button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg p-4 z-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">Filter Candidates</h3>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Clear All
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Skills</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Add skill..."
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addSkill(skillInput.trim());
                                        }
                                    }}
                                    className="flex-1 px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <Button 
                                    size="sm" 
                                    onClick={() => addSkill(skillInput.trim())}
                                    disabled={!skillInput.trim()}
                                >
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {filters.skills.map(skill => (
                                    <Badge key={skill} variant="secondary" className="text-xs">
                                        {skill}
                                        <button
                                            onClick={() => removeSkill(skill)}
                                            className="ml-1 hover:text-red-500"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Location</label>
                            <input
                                type="text"
                                placeholder="e.g. San Francisco, CA"
                                value={filters.location}
                                onChange={(e) => handleFilterChange('location', e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Experience</label>
                            <select
                                value={filters.experience}
                                onChange={(e) => handleFilterChange('experience', e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Any experience</option>
                                <option value="0-2">0-2 years</option>
                                <option value="3-5">3-5 years</option>
                                <option value="6-10">6-10 years</option>
                                <option value="10+">10+ years</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Source</label>
                            <select
                                value={filters.source}
                                onChange={(e) => handleFilterChange('source', e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Any source</option>
                                <option value="website">Careers Page</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="referral">Referral</option>
                                <option value="agency">Agency</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CandidateCard = ({ candidate, onStageChange }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStageChange = async (newStage) => {
        if (newStage === candidate.pipelineInfo.currentStage) return;
        
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/candidates/${candidate._id}/stage`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newStage }),
            });

            if (!response.ok) {
                throw new Error('Failed to update stage');
            }

            onStageChange(candidate._id, newStage);
        } catch (error) {
            console.error('Error updating stage:', error);
            // You might want to show a toast notification here
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card className="p-3 mb-3 cursor-pointer hover:shadow-md transition-shadow group border-l-4 border-l-transparent hover:border-l-primary">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-semibold text-sm">
                        {candidate.personalInfo.firstName} {candidate.personalInfo.lastName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        {candidate.professionalInfo?.appliedForRole || candidate.professionalInfo?.currentRole || 'No role specified'}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                    <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                {candidate.professionalInfo?.skills?.slice(0, 2).map(skill => (
                    <span key={skill} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                        {skill}
                    </span>
                ))}
                {candidate.professionalInfo?.skills?.length > 2 && (
                    <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                        +{candidate.professionalInfo.skills.length - 2}
                    </span>
                )}
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{candidate.professionalInfo?.experience || 'No experience listed'}</span>
                <span>{new Date(candidate.metadata.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Stage transition buttons */}
            <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {PIPELINE_STAGES.map(stage => (
                    <button
                        key={stage}
                        onClick={() => handleStageChange(stage)}
                        disabled={isUpdating || stage === candidate.pipelineInfo.currentStage}
                        className={cn(
                            "text-[10px] px-2 py-1 rounded border transition-colors",
                            stage === candidate.pipelineInfo.currentStage
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border hover:bg-secondary"
                        )}
                    >
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </button>
                ))}
            </div>
        </Card>
    );
};

export default function CandidatesPage() {
    const router = useRouter();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        skills: [],
        location: '',
        experience: '',
        source: ''
    });

    // Fetch candidates from API
    const fetchCandidates = async (searchParams = {}) => {
        try {
            setLoading(true);
            
            // Build query parameters
            const params = new URLSearchParams();
            if (searchParams.search) params.append('search', searchParams.search);
            if (searchParams.skills?.length) params.append('skills', searchParams.skills.join(','));
            if (searchParams.location) params.append('location', searchParams.location);
            if (searchParams.experience) params.append('experience', searchParams.experience);
            if (searchParams.source) params.append('source', searchParams.source);

            const url = params.toString() ? `/api/candidates/search?${params}` : '/api/candidates';
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch candidates');
            }
            
            const data = await response.json();
            setCandidates(data.candidates || []);
        } catch (err) {
            console.error('Error fetching candidates:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchCandidates();
    }, []);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const searchParams = {
                search: searchQuery,
                ...filters
            };
            fetchCandidates(searchParams);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, filters]);

    // Handle stage changes
    const handleStageChange = (candidateId, newStage) => {
        setCandidates(prevCandidates =>
            prevCandidates.map(candidate =>
                candidate._id === candidateId
                    ? {
                        ...candidate,
                        pipelineInfo: {
                            ...candidate.pipelineInfo,
                            currentStage: newStage
                        }
                    }
                    : candidate
            )
        );
    };

    // Handle filter changes
    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading candidates...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Error loading candidates: {error}</p>
                    <Button onClick={() => fetchCandidates()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Candidates</h2>
                        <p className="text-muted-foreground">
                            Manage your recruitment pipeline ({candidates.length} candidates)
                        </p>
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
                            placeholder="Search candidates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 w-full bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <SearchFilters onFiltersChange={handleFiltersChange} />
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-[1000px] h-full">
                    {PIPELINE_STAGES.map(stage => {
                        const stageCandidates = candidates.filter(c => c.pipelineInfo.currentStage === stage);
                        return (
                            <div key={stage} className="flex-1 min-w-[280px] flex flex-col">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                                            {stage.charAt(0).toUpperCase() + stage.slice(1)}
                                        </h3>
                                        <Badge variant="secondary" className="rounded-md px-1.5">
                                            {stageCandidates.length}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-2 flex-1 border border-dashed border-slate-300">
                                    {stageCandidates.map(candidate => (
                                        <CandidateCard 
                                            key={candidate._id} 
                                            candidate={candidate} 
                                            onStageChange={handleStageChange}
                                        />
                                    ))}
                                    <button
                                        onClick={() => router.push('/candidates/new')}
                                        className="w-full py-2 text-sm text-muted-foreground hover:text-primary hover:bg-background/50 rounded-md border border-transparent hover:border-border border-dashed transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Add to {stage.charAt(0).toUpperCase() + stage.slice(1)}
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
