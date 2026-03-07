'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuthState } from '@/entities/user';
import { EditorPage } from '@/views/editor';
import { createApiClient } from '@/shared/api';
import { API_BASE_URL } from '@/shared/config/apiConfig';

export default function EditorPageRoute() {
  const params = useParams<{ id: string }>();
  const authState = useAuthState();
  const token = authState.status === 'authenticated' ? authState.token : undefined;
  const client = useMemo(
    () => (token !== undefined ? createApiClient(API_BASE_URL, token) : null),
    [token],
  );
  if (!client || !params.id) return null;
  return <EditorPage calculatorId={params.id} client={client} />;
}
