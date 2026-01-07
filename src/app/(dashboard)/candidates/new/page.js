'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, User, Briefcase, FileText } from 'lucide-react';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui/common';

export default function AddCandidatePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            router.push('/candidates');
        }, 1000);
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Add Candidate</h2>
                    <p className="text-muted-foreground">Manually add a new candidate to your pipeline.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <CardTitle>Personal Information</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" placeholder="Jane" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" placeholder="Doe" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" placeholder="jane.doe@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" placeholder="e.g. San Francisco, CA" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-primary" />
                            <CardTitle>Professional Details</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Applied For Role</Label>
                                <Select id="role" required>
                                    <option value="">Select Role...</option>
                                    <option value="frontend">Senior Frontend Engineer</option>
                                    <option value="designer">Product Designer</option>
                                    <option value="backend">Backend Developer</option>
                                    <option value="marketing">Marketing Manager</option>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="experience">Years of Experience</Label>
                                <Input id="experience" placeholder="e.g. 5 years" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="skills">Skills</Label>
                            <Input id="skills" placeholder="e.g. React, JavaScript, Node.js (comma separated)" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="source">Source</Label>
                            <Select id="source">
                                <option value="linkedin">LinkedIn</option>
                                <option value="website">Careers Page</option>
                                <option value="referral">Referral</option>
                                <option value="agency">Agency</option>
                                <option value="other">Other</option>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <CardTitle>Documents</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <p className="font-medium">Click to upload Resume/CV</p>
                                <p className="text-xs">PDF, DOCX up to 10MB</p>
                            </div>
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Internal Notes</Label>
                            <Textarea id="notes" placeholder="Add any initial screening notes here..." />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        <Save className="mr-2 h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Add Candidate'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
