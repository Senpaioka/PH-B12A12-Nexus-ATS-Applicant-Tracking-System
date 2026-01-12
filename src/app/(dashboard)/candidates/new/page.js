'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, User, Briefcase, FileText, Loader2 } from 'lucide-react';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui/common';

export default function AddCandidatePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        appliedForRole: '',
        experience: '',
        skills: '',
        source: 'website',
        notes: ''
    });
    const [uploadedFile, setUploadedFile] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type and size
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                setError('Please upload a PDF, DOC, or DOCX file');
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB
                setError('File size must be less than 10MB');
                return;
            }
            
            setUploadedFile(file);
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Prepare candidate data
            const candidateData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                location: formData.location.trim(),
                appliedForRole: formData.appliedForRole.trim(),
                experience: formData.experience.trim(),
                skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
                source: formData.source
            };

            // Create candidate
            const response = await fetch('/api/candidates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(candidateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create candidate');
            }

            const createdCandidate = await response.json();

            // Upload document if provided
            if (uploadedFile) {
                const formData = new FormData();
                formData.append('file', uploadedFile);
                formData.append('documentType', 'resume');

                const uploadResponse = await fetch(`/api/candidates/${createdCandidate._id}/documents`, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    console.warn('Failed to upload document, but candidate was created');
                }
            }

            // Add initial note if provided
            if (formData.notes.trim()) {
                const noteResponse = await fetch(`/api/candidates/${createdCandidate._id}/notes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: formData.notes.trim(),
                        type: 'screening'
                    }),
                });

                if (!noteResponse.ok) {
                    console.warn('Failed to add note, but candidate was created');
                }
            }

            // Redirect to candidates page
            router.push('/candidates');
        } catch (err) {
            console.error('Error creating candidate:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
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

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <CardTitle>Personal Information</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input 
                                    id="firstName" 
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    placeholder="Jane" 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input 
                                    id="lastName" 
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    placeholder="Doe" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input 
                                    id="email" 
                                    name="email"
                                    type="email" 
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="jane.doe@example.com" 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input 
                                    id="phone" 
                                    name="phone"
                                    type="tel" 
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 (555) 000-0000" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input 
                                id="location" 
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="e.g. San Francisco, CA" 
                            />
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="appliedForRole">Applied For Role</Label>
                                <Input 
                                    id="appliedForRole" 
                                    name="appliedForRole"
                                    value={formData.appliedForRole}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Senior Frontend Engineer"
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="experience">Years of Experience</Label>
                                <Input 
                                    id="experience" 
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 5 years" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="skills">Skills</Label>
                            <Input 
                                id="skills" 
                                name="skills"
                                value={formData.skills}
                                onChange={handleInputChange}
                                placeholder="e.g. React, JavaScript, Node.js (comma separated)" 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="source">Source</Label>
                            <Select 
                                id="source" 
                                name="source"
                                value={formData.source}
                                onChange={handleInputChange}
                            >
                                <option value="website">Careers Page</option>
                                <option value="linkedin">LinkedIn</option>
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
                                <p className="font-medium">
                                    {uploadedFile ? uploadedFile.name : 'Click to upload Resume/CV'}
                                </p>
                                <p className="text-xs">PDF, DOCX up to 10MB</p>
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileUpload}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Internal Notes</Label>
                            <Textarea 
                                id="notes" 
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Add any initial screening notes here..." 
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Add Candidate
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
