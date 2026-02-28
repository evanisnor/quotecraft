'use client';

import { useAuthState } from '@/entities/user';
import { DashboardPage } from '@/pages/dashboard';
import { API_BASE_URL } from '@/shared/config/apiConfig';

export default function Page() {
  const authState = useAuthState();
  if (authState.status !== 'authenticated') return null;
  return <DashboardPage apiBaseUrl={API_BASE_URL} token={authState.token} />;
}
