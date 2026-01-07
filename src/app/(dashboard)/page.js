'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Briefcase,
    CalendarCheck,
    TrendingUp,
    MoreHorizontal
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui/common';

const data = [
    { name: 'Mon', apps: 12 },
    { name: 'Tue', apps: 19 },
    { name: 'Wed', apps: 15 },
    { name: 'Thu', apps: 28 },
    { name: 'Fri', apps: 24 },
    { name: 'Sat', apps: 8 },
    { name: 'Sun', apps: 5 },
];

const StatCard = ({ title, value, subtext, icon: Icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                {title}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">
                {subtext}
            </p>
        </CardContent>
    </Card>
);

export default function DashboardPage() {
    const router = useRouter();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">Download Report</Button>
                    <Button onClick={() => router.push('/jobs/new')}>Create Job Post</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Candidates"
                    value="1,284"
                    subtext="+12% from last month"
                    icon={Users}
                />
                <StatCard
                    title="Active Jobs"
                    value="12"
                    subtext="3 closing this week"
                    icon={Briefcase}
                />
                <StatCard
                    title="Interviews"
                    value="24"
                    subtext="Scheduled for this week"
                    icon={CalendarCheck}
                />
                <StatCard
                    title="Time to Hire"
                    value="18 Days"
                    subtext="-2 days from average"
                    icon={TrendingUp}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Application Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="apps"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorApps)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[
                                { name: "Sarah Chen", action: "applied for", target: "Senior Frontend Engineer", time: "2 hours ago" },
                                { name: "Mike Ross", action: "moved to", target: "Interview Stage", time: "4 hours ago" },
                                { name: "System", action: "posted job", target: "Product Designer", time: "Yesterday" },
                                { name: "David Kim", action: "completed", target: "Technical Assessment", time: "Yesterday" },
                                { name: "Recruiting Team", action: "scheduled", target: "Team Debrief", time: "2 days ago" },
                            ].map((item, i) => (
                                <div className="flex items-center" key={i}>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            <span className="font-semibold">{item.name}</span> {item.action} <span className="text-primary">{item.target}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.time}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
