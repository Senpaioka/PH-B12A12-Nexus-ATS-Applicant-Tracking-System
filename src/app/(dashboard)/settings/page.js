'use client';

import React, { useState } from 'react';
import { User, Bell, Shield, Users, Save, Building, Upload } from 'lucide-react';
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

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

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
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="-mx-4 md:w-1/5 md:mx-0">
                        <TabsList className="flex flex-col h-auto items-stretch bg-transparent space-y-1 p-0">
                            <TabsTrigger value="general" className="justify-start px-4 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none">
                                <User className="mr-2 h-4 w-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="justify-start px-4 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none">
                                <Bell className="mr-2 h-4 w-4" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger value="team" className="justify-start px-4 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none">
                                <Users className="mr-2 h-4 w-4" />
                                Team
                            </TabsTrigger>
                            <TabsTrigger value="security" className="justify-start px-4 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none">
                                <Shield className="mr-2 h-4 w-4" />
                                Security
                            </TabsTrigger>
                        </TabsList>
                    </aside>

                    <div className="flex-1">
                        <TabsContent value="general" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-secondary-foreground">
                                            AC
                                        </div>
                                        <Button variant="outline" size="sm">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Change Avatar
                                        </Button>
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First name</Label>
                                            <Input id="firstName" defaultValue="Alex" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last name</Label>
                                            <Input id="lastName" defaultValue="Chen" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" defaultValue="alex.chen@nexus.co" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <Textarea id="bio" placeholder="Tell us a little bit about yourself" className="resize-none" />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button>
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
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                        {member.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium leading-none">{member.name}</p>
                                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Password</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current">Current Password</Label>
                                        <Input id="current" type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new">New Password</Label>
                                        <Input id="new" type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm">Confirm Password</Label>
                                        <Input id="confirm" type="password" />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button>Update Password</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-destructive/50">
                                <CardHeader>
                                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete your account and all of your data from our servers. This action cannot be undone.
                                    </p>
                                    <Button variant="destructive">Delete Account</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
