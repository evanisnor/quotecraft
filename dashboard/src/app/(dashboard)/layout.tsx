'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuthState } from '@/entities/user';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const authState = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (authState.status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [authState.status, router]);

  if (authState.status === 'loading') {
    return null;
  }

  if (authState.status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
