'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const isAuth = localStorage.getItem('nexus_auth') === 'true';
        const isAuthPage = pathname === '/login' || pathname === '/register';

        if (!isAuth && !isAuthPage) {
            router.push('/login');
        } else if (isAuth && isAuthPage) {
            router.push('/');
        }
    }, [pathname, router]);

    return <>{children}</>;
}
