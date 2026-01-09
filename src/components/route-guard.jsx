'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RouteGuard({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isPublicPage = isAuthPage; // Add other public pages here if needed

    useEffect(() => {
        if (status === 'loading') return; // Still loading

        if (!session && !isPublicPage) {
            // Not authenticated and trying to access protected page
            router.push('/login');
        } else if (session && isAuthPage) {
            // Authenticated and trying to access auth pages
            router.push('/');
        }
    }, [session, status, router, pathname, isPublicPage, isAuthPage]);

    // Show loading spinner while checking authentication
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render protected content if not authenticated
    if (!session && !isPublicPage) {
        return null;
    }

    // Don't render auth pages if already authenticated
    if (session && isAuthPage) {
        return null;
    }

    return <>{children}</>;
}