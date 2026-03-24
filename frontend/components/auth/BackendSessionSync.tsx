'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { clearBackendToken, syncBackendSession } from '@/lib/auth/backendSession';

export function BackendSessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      clearBackendToken();
      return;
    }

    if (status === 'authenticated' && session) {
      void syncBackendSession(session);
    }
  }, [session, status]);

  return null;
}
