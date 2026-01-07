'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Video, MoreVertical, Calendar as CalendarIcon, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui/common';
import { interviews } from '@/../mockData';

export default function SchedulePage() {
    const router = useRouter();
    // Sort interviews by date/time (mock sorting)
    const sortedInterviews = [...interviews].sort((a, b) => a.date.localeCompare(b.date));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Interview Schedule</h2>
                    <p className="text-muted-foreground">Upcoming interviews and events</p>
                </div>
                <Button onClick={() => router.push('/schedule/new')}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Schedule Interview
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-medium text-lg">Upcoming</h3>
                    {sortedInterviews.map(interview => (
                        <Card key={interview.id} className="hover:border-primary/50 transition-colors">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center text-primary">
                                        <span className="text-sm font-medium">{new Date(interview.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                                        <span className="text-2xl font-bold">{new Date(interview.date).getDate()}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-lg">{interview.candidateName}</h4>
                                                <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                                            </div>
                                            <Badge variant="secondary">{interview.type}</Badge>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-4 w-4" />
                                                {interview.time} (45m)
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Video className="h-4 w-4" />
                                                Google Meet
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <UsersIcon className="h-4 w-4" />
                                                {interview.interviewers.join(', ')}
                                            </div>
                                        </div>
                                    </div>

                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start">Send Availability Request</Button>
                            <Button variant="outline" className="w-full justify-start">Sync Calendar</Button>
                            <Button variant="outline" className="w-full justify-start">Configure Interview Templates</Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground border-none">
                        <CardHeader>
                            <CardTitle className="text-white">Daily Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-white mb-2">3</div>
                            <p className="text-blue-100">Interviews scheduled for today.</p>
                            <div className="mt-4 pt-4 border-t border-blue-400/30 flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">JD</div>
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">AS</div>
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">+1</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
