'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Calendar,
    Settings,
    LogOut,
    Bell,
    Search,
    Menu,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SidebarItem = ({
    icon: Icon,
    label,
    path,
    active,
    onClick
}) => (
    <Link
        href={path}
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
    >
        <Icon className="h-4 w-4" />
        {label}
    </Link>
);

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path) => {
        if (path === '/') {
            // Dashboard is at root, so check if we're exactly at root or not on any other specific page
            return pathname === '/' || (!pathname.startsWith('/candidates') && !pathname.startsWith('/jobs') && !pathname.startsWith('/schedule') && !pathname.startsWith('/settings'));
        }
        return pathname.startsWith(path);
    };

    const handleLogout = () => {
        localStorage.removeItem('nexus_auth');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
                <div className="p-6 border-b flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Nexus ATS</span>
                </div>

                <div className="flex-1 py-6 px-4 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" active={isActive('/')} />
                    <SidebarItem icon={Users} label="Candidates" path="/candidates" active={isActive('/candidates')} />
                    <SidebarItem icon={Briefcase} label="Jobs" path="/jobs" active={isActive('/jobs')} />
                    <SidebarItem icon={Calendar} label="Schedule" path="/schedule" active={isActive('/schedule')} />
                    <SidebarItem icon={Settings} label="Settings" path="/settings" active={isActive('/settings')} />
                </div>

                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Sidebar Overlay */}
            <div className={`fixed inset-0 bg-black/50 z-40 md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`} onClick={() => setIsMobileMenuOpen(false)} />

            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl">Nexus</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)}>
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>
                <div className="flex-1 py-6 px-4 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" active={isActive('/')} onClick={() => setIsMobileMenuOpen(false)} />
                    <SidebarItem icon={Users} label="Candidates" path="/candidates" active={isActive('/candidates')} onClick={() => setIsMobileMenuOpen(false)} />
                    <SidebarItem icon={Briefcase} label="Jobs" path="/jobs" active={isActive('/jobs')} onClick={() => setIsMobileMenuOpen(false)} />
                    <SidebarItem icon={Calendar} label="Schedule" path="/schedule" active={isActive('/schedule')} onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="mt-4 pt-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search candidates, jobs..."
                                className="pl-9 pr-4 py-2 w-64 bg-muted/50 border-none rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-background"></span>
                        </button>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border-2 border-background"></div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8 bg-muted/20">
                    {children}
                </div>
            </main>
        </div>
    );
}
