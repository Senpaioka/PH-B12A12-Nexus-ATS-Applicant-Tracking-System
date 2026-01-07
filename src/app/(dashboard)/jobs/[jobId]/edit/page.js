'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle, Select, Separator } from '@/components/ui/common';
import { jobs } from '@/../mockData';

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [job, setJob] = useState(null);

    useEffect(() => {
        // In a real app, fetch from API
        const foundJob = jobs.find(j => j.id === params.jobId);
        if (foundJob) {
            setJob(foundJob);
        } else {
            router.push('/jobs');
        }
    }, [params.jobId, router]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            router.push('/jobs');
        }, 1000);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this job posting?')) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                router.push('/jobs');
            }, 800);
        }
    };

    if (!job) return null;

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Job</h2>
                        <p className="text-muted-foreground">Update job details and requirements.</p>
                    </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Job
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Job Title</Label>
                                <Input id="title" defaultValue={job.title} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Select id="department" defaultValue={job.department.toLowerCase()} required>
                                    <option value="">Select Department...</option>
                                    <option value="engineering">Engineering</option>
                                    <option value="design">Design</option>
                                    <option value="marketing">Marketing</option>
                                    <option value="product">Product</option>
                                    <option value="sales">Sales</option>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Employment Type</Label>
                                <Select id="type" defaultValue={job.type.toLowerCase()} required>
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">Internship</option>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" defaultValue={job.location} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salary">Salary Range</Label>
                            <Input id="salary" defaultValue={job.salaryRange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select id="status" defaultValue={job.status}>
                                <option value="Active">Active</option>
                                <option value="Draft">Draft</option>
                                <option value="Closed">Closed</option>
                            </Select>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="description">Job Description</Label>
                            <Textarea
                                id="description"
                                defaultValue={`We are looking for a ${job.title} to join our ${job.department} team. You will play a key role in building our product...`}
                                className="min-h-[150px]"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requirements">Requirements</Label>
                            <Textarea
                                id="requirements"
                                defaultValue="- 3+ years of experience&#10;- Strong communication skills&#10;- Team player"
                                className="min-h-[150px]"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                <Save className="mr-2 h-4 w-4" />
                                {isLoading ? 'Saving...' : 'Update Job'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
