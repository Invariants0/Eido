import type { Session } from 'next-auth';

const BACKEND_TOKEN_KEY = 'eido_backend_token';

export function getBackendToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BACKEND_TOKEN_KEY);
}

export function clearBackendToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(BACKEND_TOKEN_KEY);
}

export async function syncBackendSession(session: Session): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!session.user?.email || !session.user?.name) return null;

  const googleId = (session.user as { googleId?: string }).googleId;
  if (!googleId) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: session.user.email,
      name: session.user.name,
      google_id: googleId,
      avatar_url: session.user.image,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const token = data?.access_token as string | undefined;
  if (!token) return null;

  localStorage.setItem(BACKEND_TOKEN_KEY, token);
  return token;
}
