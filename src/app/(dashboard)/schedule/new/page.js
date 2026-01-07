'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Select, Separator, Textarea } from '@/components/ui/common';
import { candidates, jobs } from '@/../mockData';

export default function ScheduleInterviewPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            router.push('/schedule');
        }, 1000);
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Schedule Interview</h2>
                    <p className="text-muted-foreground">Set up a new interview with a candidate.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Interview Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="candidate">Candidate</Label>
                                <Select id="candidate" required>
                                    <option value="">Select Candidate...</option>
                                    {candidates.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="job">Job Position</Label>
                                <Select id="job" required>
                                    <option value="">Select Job...</option>
                                    {jobs.map(j => (
                                        <option key={j.id} value={j.id}>{j.title}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Interview Type</Label>
                                <Select id="type" required>
                                    <option value="screening">Screening Call</option>
                                    <option value="technical">Technical Interview</option>
                                    <option value="cultural">Cultural Fit</option>
                                    <option value="final">Final Round</option>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interviewers">Interviewers</Label>
                                <Input id="interviewers" placeholder="e.g. Alex Chen, Sarah Smith" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time</Label>
                                <Input id="time" type="time" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location / Link</Label>
                            <Select id="location">
                                <option value="google_meet">Google Meet (Auto-generated)</option>
                                <option value="zoom">Zoom</option>
                                <option value="phone">Phone Call</option>
                                <option value="office">In Office</option>
                            </Select>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes for Interviewers</Label>
                            <Textarea id="notes" placeholder="Add specific topics to cover or questions to ask..." className="min-h-[100px]" />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                <Save className="mr-2 h-4 w-4" />
                                {isLoading ? 'Scheduling...' : 'Schedule Interview'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
