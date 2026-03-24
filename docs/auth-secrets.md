# Authentication and Secrets Setup

## Google OAuth (Frontend)
Set in `frontend/.env.local`:

```bash
AUTH_SECRET=replace_with_strong_random_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Google Cloud Console configuration:
- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

## Backend Session/Auth
Set in `backend/.env`:

```bash
BACKEND_JWT_SECRET=replace_with_strong_random_secret
SESSION_TOKEN_TTL_HOURS=168
ADMIN_API_KEY=optional_admin_key_for_waitlist_exports
```

## Surge Auth and Runtime Checks
Set in `backend/.env`:

```bash
SURGE_API_KEY=your_surge_api_key_here
REQUIRE_SURGE_API_KEY=false
```

Notes:
- `REQUIRE_SURGE_API_KEY=true` enforces startup validation.
- `/api/auth/surge-status` exposes non-sensitive auth status (`configured`, `mode`).

## Secret Handling Guidelines
- Never hardcode keys in source files.
- Use `.env` for local dev and a managed secret store in production.
- Rotate any key immediately if accidental exposure is suspected.
