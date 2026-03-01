'use client';

import { useMemo } from 'react';
import { useAuthState } from '@/entities/user';
import { DashboardPage } from '@/views/dashboard';
import { createApiClient } from '@/shared/api';
import { API_BASE_URL } from '@/shared/config/apiConfig';

export default function Page() {
  const authState = useAuthState();
  const token = authState.status === 'authenticated' ? authState.token : undefined;
  const client = useMemo(
    () => (token !== undefined ? createApiClient(API_BASE_URL, token) : null),
    [token],
  );
  if (!client) return null;
  return <DashboardPage client={client} />;
}
