'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Users,
    Briefcase,
    CalendarCheck,
    TrendingUp,
    MoreHorizontal,
    CheckCircle,
    X,
    Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui/common';

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
    const searchParams = useSearchParams();
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Dashboard data state
    const [stats, setStats] = useState({
        totalCandidates: { value: 0, growth: 0, subtext: 'Loading...' },
        activeJobs: { value: 0, closing: 0, subtext: 'Loading...' },
        interviews: { value: 0, total: 0, subtext: 'Loading...' },
        timeToHire: { value: 0, unit: 'Days', subtext: 'Loading...' }
    });
    const [trendsData, setTrendsData] = useState([]);
    const [activities, setActivities] = useState([]);

    // Fetch dashboard data
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all dashboard data in parallel
            const [statsRes, trendsRes, activityRes] = await Promise.all([
                fetch('/api/dashboard/stats'),
                fetch('/api/dashboard/trends'),
                fetch('/api/dashboard/activity?limit=5')
            ]);

            // Check if all requests were successful
            if (!statsRes.ok || !trendsRes.ok || !activityRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const [statsData, trendsData, activityData] = await Promise.all([
                statsRes.json(),
                trendsRes.json(),
                activityRes.json()
            ]);

            setStats(statsData.stats);
            setTrendsData(trendsData.trends);
            setActivities(activityData.activities);

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data. Please try refreshing the page.');
        } finally {
            setLoading(false);
        }
    };

    // Check for messages from URL params
    useEffect(() => {
        const message = searchParams.get('message');
        
        if (message === 'email-verified') {
            setSuccessMessage('Email verified successfully! Your account is now fully activated.');
            
            // Clear the message from URL after showing it
            const url = new URL(window.location);
            url.searchParams.delete('message');
            window.history.replaceState({}, '', url);
            
            // Auto-hide message after 5 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 5000);
        }
    }, [searchParams]);

    return (
        <div className="space-y-8">
            {/* Success Message Banner */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <p className="text-sm font-medium text-green-800">
                                {successMessage}
                            </p>
                        </div>
                        <button
                            onClick={() => setSuccessMessage('')}
                            className="text-green-600 hover:text-green-800 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Refresh
                    </Button>
                    <Button onClick={() => router.push('/jobs/new')}>Create Job Post</Button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Candidates"
                        value={stats.totalCandidates.value.toLocaleString()}
                        subtext={stats.totalCandidates.subtext}
                        icon={Users}
                    />
                    <StatCard
                        title="Active Jobs"
                        value={stats.activeJobs.value}
                        subtext={stats.activeJobs.subtext}
                        icon={Briefcase}
                    />
                    <StatCard
                        title="Interviews"
                        value={stats.interviews.value}
                        subtext={stats.interviews.subtext}
                        icon={CalendarCheck}
                    />
                    <StatCard
                        title="Time to Hire"
                        value={`${stats.timeToHire.value} ${stats.timeToHire.unit}`}
                        subtext={stats.timeToHire.subtext}
                        icon={TrendingUp}
                    />
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Application Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loading ? (
                            <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <div className="h-[250px] sm:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendsData}>
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
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-6">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div className="flex items-center gap-3" key={i}>
                                        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
                                            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                                        </div>
                                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                                    </div>
                                ))}
                            </div>
                        ) : activities.length > 0 ? (
                            <div className="space-y-6">
                                {activities.map((item) => (
                                    <div className="flex items-center gap-3" key={item.id}>
                                        <div className="h-8 w-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-xs font-bold">
                                            {item.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-tight truncate md:whitespace-normal">
                                                <span className="font-semibold">{item.name}</span> {item.action} <span className="text-primary">{item.target}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.time}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No recent activity found.</p>
                                <p className="text-sm mt-1">Activity will appear here as you use the system.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
