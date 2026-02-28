'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/entities/user';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
