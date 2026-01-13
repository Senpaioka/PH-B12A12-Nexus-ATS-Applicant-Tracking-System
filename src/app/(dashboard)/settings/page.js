'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Bell, Shield, Users, Save, Building, Upload, Loader2, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import {
    Button,
    Input,
    Label,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Switch,
    Separator,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Textarea
} from '@/components/ui/common';
import { DeleteAccountDialog } from '@/components/ui/delete-account-dialog';

export default function SettingsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        bio: '',
        photoURL: ''
    });
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        photoURL: ''
    });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [bioValidation, setBioValidation] = useState(null);
    const [photoUrlValidation, setPhotoUrlValidation] = useState(null);
    
    // Delete account state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [accountData, setAccountData] = useState(null);
    const [isLoadingAccountData, setIsLoadingAccountData] = useState(false);
    
    // Password change state
    const [passwordData, setPasswordData] = useState({
        canChangePassword: false,
        isOAuthUser: true,
        provider: 'google'
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoadingPasswordInfo, setIsLoadingPasswordInfo] = useState(true);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({});
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Load profile data on component mount
    useEffect(() => {
        if (session?.user) {
            loadProfile();
            loadPasswordInfo();
        }
    }, [session]);

    // Real-time bio validation
    useEffect(() => {
        if (formData.bio && formData.bio.trim()) {
            const wordCount = formData.bio.trim().split(/\s+/).filter(word => word.length > 0).length;
            setBioValidation({
                wordCount,
                isValid: wordCount >= 300 && wordCount <= 500,
                isTooShort: wordCount > 0 && wordCount < 300,
                isTooLong: wordCount > 500,
                wordsNeeded: wordCount < 300 ? 300 - wordCount : 0,
                wordsOver: wordCount > 500 ? wordCount - 500 : 0
            });
        } else {
            setBioValidation(null);
        }
    }, [formData.bio]);

    // Real-time photo URL validation
    useEffect(() => {
        if (formData.photoURL && formData.photoURL.trim()) {
            // More flexible URL validation that accepts Google profile URLs and other image services
            const urlRegex = /^https?:\/\/.+/i;
            
            if (!urlRegex.test(formData.photoURL)) {
                setPhotoUrlValidation({ 
                    isValid: false, 
                    message: 'URL must be a valid HTTPS URL' 
                });
                return;
            }
            
            // Check for common image hosting domains or file extensions
            const isImageUrl = 
                formData.photoURL.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) || // Traditional image URLs with extensions
                formData.photoURL.includes('googleusercontent.com') || // Google profile images
                formData.photoURL.includes('gravatar.com') || // Gravatar images
                formData.photoURL.includes('imgur.com') || // Imgur images
                formData.photoURL.includes('cloudinary.com') || // Cloudinary images
                formData.photoURL.includes('amazonaws.com'); // AWS S3 images
            
            if (isImageUrl) {
                setPhotoUrlValidation({ isValid: true, message: 'Valid image URL' });
            } else {
                setPhotoUrlValidation({ 
                    isValid: false, 
                    message: 'URL must be from a recognized image service or have a valid image file extension' 
                });
            }
        } else {
            setPhotoUrlValidation(null);
        }
    }, [formData.photoURL]);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/user/profile');
            const data = await response.json();

            if (data.success) {
                setProfile(data.data);
                setFormData({
                    name: data.data.name || '',
                    bio: data.data.bio || '',
                    photoURL: data.data.photoURL || ''
                });
            } else {
                console.error('Failed to load profile:', data.error);
            }
        } catch (error) {
            console.error('Profile load error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPasswordInfo = async () => {
        setIsLoadingPasswordInfo(true);
        try {
            const response = await fetch('/api/user/change-password');
            const data = await response.json();

            if (data.success) {
                setPasswordData(data.data);
            } else {
                console.error('Failed to load password info:', data.error);
            }
        } catch (error) {
            console.error('Password info load error:', error);
        } finally {
            setIsLoadingPasswordInfo(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation (optional)
        if (formData.name && formData.name.trim().length > 100) {
            newErrors.name = 'Name must not exceed 100 characters';
        }

        // Bio validation (optional but if provided must be valid)
        if (formData.bio && formData.bio.trim()) {
            if (bioValidation && !bioValidation.isValid) {
                if (bioValidation.isTooShort) {
                    newErrors.bio = `Bio must be at least 300 words (currently ${bioValidation.wordCount} words)`;
                } else if (bioValidation.isTooLong) {
                    newErrors.bio = `Bio must not exceed 500 words (currently ${bioValidation.wordCount} words)`;
                }
            }
        }

        // Photo URL validation (optional but if provided must be valid)
        if (formData.photoURL && formData.photoURL.trim()) {
            if (photoUrlValidation && !photoUrlValidation.isValid) {
                newErrors.photoURL = photoUrlValidation.message;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveProfile = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        setErrors({});
        setSuccessMessage('');

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim() || null,
                    bio: formData.bio.trim() || null,
                    photoURL: formData.photoURL.trim() || null
                }),
            });

            const data = await response.json();

            if (data.success) {
                setProfile(data.data);
                setSuccessMessage('Profile updated successfully!');
                
                // Dispatch event to update navbar profile
                window.dispatchEvent(new CustomEvent('profileUpdated'));
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            } else {
                // Handle validation errors
                if (data.error.field) {
                    setErrors({ [data.error.field]: data.error.message });
                } else {
                    setErrors({ general: data.error.message });
                }
            }
        } catch (error) {
            console.error('Profile update error:', error);
            setErrors({ general: 'Network error. Please check your connection and try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const getBioStatusColor = () => {
        if (!bioValidation) return '';
        if (bioValidation.isValid) return 'text-green-600';
        if (bioValidation.isTooShort) return 'text-yellow-600';
        if (bioValidation.isTooLong) return 'text-red-600';
        return '';
    };

    const getBioStatusIcon = () => {
        if (!bioValidation) return null;
        if (bioValidation.isValid) return <CheckCircle className="h-4 w-4 text-green-500" />;
        if (bioValidation.isTooShort) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        if (bioValidation.isTooLong) return <XCircle className="h-4 w-4 text-red-500" />;
        return null;
    };

    // Delete account functions
    const handleDeleteAccountClick = async () => {
        setIsLoadingAccountData(true);
        try {
            const response = await fetch('/api/user/delete-account');
            const data = await response.json();
            
            if (data.success) {
                setAccountData(data.data);
                setShowDeleteDialog(true);
            } else {
                setErrors({ general: 'Failed to load account information. Please try again.' });
            }
        } catch (error) {
            console.error('Error loading account data:', error);
            setErrors({ general: 'Failed to load account information. Please try again.' });
        } finally {
            setIsLoadingAccountData(false);
        }
    };

    const handleDeleteAccountConfirm = async (confirmationText) => {
        try {
            const response = await fetch('/api/user/delete-account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    confirmationText,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Sign out the user and redirect to home page
                await signOut({ 
                    callbackUrl: '/?message=account-deleted',
                    redirect: true 
                });
            } else {
                throw new Error(data.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    };

    // Password change functions
    const handlePasswordChange = (field, value) => {
        setPasswordForm(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear errors when user starts typing
        if (passwordErrors[field]) {
            setPasswordErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
        
        // Clear general success message
        if (passwordSuccess) {
            setPasswordSuccess('');
        }
    };

    const validatePasswordForm = () => {
        const newErrors = {};

        if (!passwordForm.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!passwordForm.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (passwordForm.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters long';
        } else {
            // Password strength validation
            const hasUpperCase = /[A-Z]/.test(passwordForm.newPassword);
            const hasLowerCase = /[a-z]/.test(passwordForm.newPassword);
            const hasNumbers = /\d/.test(passwordForm.newPassword);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword);

            if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
                newErrors.newPassword = 'Password must contain uppercase, lowercase, number, and special character';
            }
        }

        if (!passwordForm.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setPasswordErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePasswordSubmit = async () => {
        if (!validatePasswordForm()) {
            return;
        }

        setIsChangingPassword(true);
        setPasswordErrors({});
        setPasswordSuccess('');

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                    confirmPassword: passwordForm.confirmPassword
                }),
            });

            const data = await response.json();

            if (data.success) {
                setPasswordSuccess('Password updated successfully!');
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                
                // Clear success message after 5 seconds
                setTimeout(() => {
                    setPasswordSuccess('');
                }, 5000);
            } else {
                setPasswordErrors({ general: data.error || 'Failed to update password' });
            }
        } catch (error) {
            console.error('Password change error:', error);
            setPasswordErrors({ general: 'Network error. Please check your connection and try again.' });
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Separator className="my-6" />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-1/4">
                        <TabsList className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible h-auto items-stretch bg-transparent space-x-2 lg:space-x-0 lg:space-y-1 p-0 pb-2 lg:pb-0 scrollbar-hide">
                            <TabsTrigger value="general" className="whitespace-nowrap flex-shrink-0 justify-start px-4 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none">
                                <User className="mr-2 h-4 w-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="whitespace-nowrap flex-shrink-0 justify-start px-4 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none">
                                <Bell className="mr-2 h-4 w-4" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger value="team" className="whitespace-nowrap flex-shrink-0 justify-start px-4 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none">
                                <Users className="mr-2 h-4 w-4" />
                                Team
                            </TabsTrigger>
                            <TabsTrigger value="security" className="whitespace-nowrap flex-shrink-0 justify-start px-4 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none">
                                <Shield className="mr-2 h-4 w-4" />
                                Security
                            </TabsTrigger>
                        </TabsList>
                    </aside>

                    <div className="flex-1">
                        <TabsContent value="general" className="space-y-6">
                            {successMessage && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <p className="text-sm text-green-800">{successMessage}</p>
                                    </div>
                                </div>
                            )}

                            {errors.general && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <p className="text-sm text-red-800">{errors.general}</p>
                                    </div>
                                </div>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-secondary-foreground overflow-hidden">
                                            {formData.photoURL ? (
                                                <img 
                                                    src={formData.photoURL} 
                                                    alt="Profile" 
                                                    className="w-full h-full object-cover"
                                                    crossOrigin="anonymous"
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : (
                                                (profile.name || session?.user?.name || 'U').charAt(0).toUpperCase()
                                            )}
                                            <div className="w-full h-full items-center justify-center text-2xl font-bold text-secondary-foreground" style={{display: formData.photoURL ? 'none' : 'flex'}}>
                                                {(profile.name || session?.user?.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input 
                                            id="name" 
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter your full name"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            value={profile.email || session?.user?.email || ''}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="photoURL">Profile Photo URL</Label>
                                        <div className="relative">
                                            <Input 
                                                id="photoURL" 
                                                value={formData.photoURL}
                                                onChange={e => setFormData({ ...formData, photoURL: e.target.value })}
                                                placeholder="https://example.com/photo.jpg"
                                                className={errors.photoURL ? 'border-red-500' : photoUrlValidation?.isValid ? 'border-green-500' : ''}
                                            />
                                            {photoUrlValidation && (
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                    {photoUrlValidation.isValid ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {errors.photoURL && (
                                            <p className="text-sm text-red-600">{errors.photoURL}</p>
                                        )}
                                        {photoUrlValidation && !photoUrlValidation.isValid && !errors.photoURL && (
                                            <p className="text-sm text-red-600">{photoUrlValidation.message}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Supported: Image URLs with extensions (JPG, PNG, etc.) or from recognized services (Google, Gravatar, etc.)
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="bio">Bio</Label>
                                            <div className="flex items-center gap-2">
                                                {getBioStatusIcon()}
                                                {bioValidation && (
                                                    <span className={`text-xs ${getBioStatusColor()}`}>
                                                        {bioValidation.wordCount} words
                                                        {bioValidation.isTooShort && ` (need ${bioValidation.wordsNeeded} more)`}
                                                        {bioValidation.isTooLong && ` (${bioValidation.wordsOver} over limit)`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Textarea 
                                            id="bio" 
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Tell us about yourself (300-500 words)"
                                            className={`resize-none min-h-[120px] ${errors.bio ? 'border-red-500' : bioValidation?.isValid ? 'border-green-500' : ''}`}
                                        />
                                        {errors.bio && (
                                            <p className="text-sm text-red-600">{errors.bio}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Write a brief biography about yourself (300-500 words required)
                                        </p>
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <Button onClick={handleSaveProfile} disabled={isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Organization</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="company">Company Name</Label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="company" className="pl-9" defaultValue="Nexus Innovations Inc." />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notifications" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Email Notifications</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="new-candidates" className="flex flex-col space-y-1">
                                            <span>New Candidates</span>
                                            <span className="font-normal text-xs text-muted-foreground">Receive emails when new candidates apply.</span>
                                        </Label>
                                        <Switch id="new-candidates" checked />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="interview-updates" className="flex flex-col space-y-1">
                                            <span>Interview Updates</span>
                                            <span className="font-normal text-xs text-muted-foreground">Get notified when an interview is scheduled or cancelled.</span>
                                        </Label>
                                        <Switch id="interview-updates" checked />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="marketing-emails" className="flex flex-col space-y-1">
                                            <span>Marketing Emails</span>
                                            <span className="font-normal text-xs text-muted-foreground">Receive emails about new features and updates.</span>
                                        </Label>
                                        <Switch id="marketing-emails" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="team" className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Team Members</CardTitle>
                                    <Button size="sm">
                                        <Users className="mr-2 h-4 w-4" />
                                        Invite Member
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {[
                                            { name: "Alex Chen", role: "Admin", email: "alex@nexus.co", status: "Active" },
                                            { name: "Sarah Smith", role: "Recruiter", email: "sarah@nexus.co", status: "Active" },
                                            { name: "Mike Johnson", role: "Interviewer", email: "mike@nexus.co", status: "Invited" },
                                        ].map((member, i) => (
                                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                                                        {member.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium leading-none truncate">{member.name}</p>
                                                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end space-x-2">
                                                    <span className="text-xs text-muted-foreground mr-2">{member.role}</span>
                                                    <Button variant="outline" size="sm">Edit</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security" className="space-y-6">
                            {/* Password Change Section - Only for email/password users */}
                            {isLoadingPasswordInfo ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Password</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </CardContent>
                                </Card>
                            ) : passwordData.canChangePassword ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Change Password</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {passwordSuccess && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <p className="text-sm text-green-800">{passwordSuccess}</p>
                                                </div>
                                            </div>
                                        )}

                                        {passwordErrors.general && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                                <div className="flex items-center gap-2">
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                    <p className="text-sm text-red-800">{passwordErrors.general}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="current">Current Password</Label>
                                            <Input 
                                                id="current" 
                                                type="password" 
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                                className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                                                placeholder="Enter your current password"
                                            />
                                            {passwordErrors.currentPassword && (
                                                <p className="text-sm text-red-600">{passwordErrors.currentPassword}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new">New Password</Label>
                                            <Input 
                                                id="new" 
                                                type="password" 
                                                value={passwordForm.newPassword}
                                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                                className={passwordErrors.newPassword ? 'border-red-500' : ''}
                                                placeholder="Enter your new password"
                                            />
                                            {passwordErrors.newPassword && (
                                                <p className="text-sm text-red-600">{passwordErrors.newPassword}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Password must be at least 8 characters with uppercase, lowercase, number, and special character
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm">Confirm New Password</Label>
                                            <Input 
                                                id="confirm" 
                                                type="password" 
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                                className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                                                placeholder="Confirm your new password"
                                            />
                                            {passwordErrors.confirmPassword && (
                                                <p className="text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                                            )}
                                        </div>
                                        <div className="flex justify-end">
                                            <Button 
                                                onClick={handlePasswordSubmit}
                                                disabled={isChangingPassword}
                                            >
                                                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <Shield className="mr-2 h-4 w-4" />
                                                Update Password
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Password</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Shield className="h-5 w-5 text-blue-600" />
                                                <h4 className="font-medium text-blue-900">OAuth Authentication</h4>
                                            </div>
                                            <p className="text-sm text-blue-800">
                                                You signed in using {passwordData.provider === 'google' ? 'Google' : 'OAuth'}. 
                                                Password changes are managed through your {passwordData.provider === 'google' ? 'Google account' : 'OAuth provider'}.
                                            </p>
                                            {passwordData.provider === 'google' && (
                                                <p className="text-xs text-blue-700 mt-2">
                                                    To change your password, visit your Google Account settings.
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="border-destructive/50">
                                <CardHeader>
                                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-900">Delete Account</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Permanently delete your account and all of your data from our servers. This action cannot be undone.
                                        </p>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-sm text-red-800">
                                                <strong>Warning:</strong> This will delete all your candidates, job postings, interviews, and account data permanently.
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="destructive" 
                                        onClick={handleDeleteAccountClick}
                                        disabled={isLoadingAccountData}
                                    >
                                        {isLoadingAccountData && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Account
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>

            {/* Delete Account Dialog */}
            <DeleteAccountDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDeleteAccountConfirm}
                accountData={accountData}
            />
        </div>
    );
}
