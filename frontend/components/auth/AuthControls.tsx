'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export function AuthControls({ compact = false }: { compact?: boolean }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <span className="text-xs text-zinc-400">Checking session...</span>;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {!compact && <span className="text-xs text-zinc-300">{session.user.name}</span>}
        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 text-xs rounded-lg border border-white/15 text-white hover:bg-white/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="px-3 py-1.5 text-xs rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors"
    >
      Sign in with Google
    </button>
  );
}
