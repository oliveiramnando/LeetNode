# Authentication

This document describes how authentication works in the LeetNode codebase (backend + frontend). LeetNode uses **session-based authentication** with **GitHub OAuth** as the login mechanism.

---

## Auth Model

### Summary
- **Type:** Session-based authentication (server-side sessions).
- **Client storage:** The browser stores a **session cookie** only (no JWT/local token storage).
- **Backend library:** `express-session`.

### What “logged in” means
A user is considered logged in when:
- `req.session.userId` exists on the backend, and
- it corresponds to a valid `User` record in MongoDB (checked by `/api/auth/me`).

---

## Session Configuration (Backend)

### Where it is configured
- `src/backend/config/session.js` — session middleware configuration
- Mounted in `src/backend/server.js` via `app.use(sessionMiddleware)`

### Store
- Uses the default `express-session` **MemoryStore** (in-memory).
- No Mongo/Redis session store is configured in current code.

### Cookie settings
- Cookie name: `sid`
- `httpOnly: true`
- `maxAge: 1000 * 60 * 5` (5 minutes)
  - Note: a 7-day maxAge exists as commented code.
- `sameSite: "lax"`
  - Comment indicates switching to `"none"` may be needed in production.
- `secure: process.env.NODE_ENV === "production"`

### Session secret
- `SESSION_SECRET` environment variable is used to sign the session cookie.

---

## CORS & Credentials

### Backend CORS config
- `src/backend/config/cors.js`

Behavior:
- `origin` is set to `process.env.FRONTEND_URL`
- `credentials: true` is enabled

This is required so browsers will:
- send the session cookie with requests, and
- accept the session cookie from the backend.

---

## GitHub OAuth Flow (Backend)

### Overview
GitHub OAuth is used to authenticate users. The flow is:

1. Frontend sends the user to `/api/auth/github/start`
2. Backend redirects user to GitHub authorize page
3. GitHub redirects back to `/api/auth/github/callback` with `code` + `state`
4. Backend exchanges `code` for an access token
5. Backend fetches GitHub user profile
6. Backend upserts the user in MongoDB
7. Backend regenerates the session and stores user identity in it
8. Backend redirects the user to the frontend

---

### Step 1 — Start OAuth
**Route**
- `GET /api/auth/github/start` (in `src/backend/routes/authRoutes.js`)

**Handler**
- `startGithubOAuth` in `src/backend/controllers/authController.js`

**State generation**
- `crypto.randomBytes(16).toString("hex")`
- Stored in the session as: `req.session.oAuthState`

**Redirect**
- Redirects to GitHub authorize endpoint with:
  - `client_id`
  - `redirect_uri` (`GITHUB_REDIRECT_URI`)
  - `scope`
  - `state`

---

### Step 2 — OAuth Callback
**Route**
- `GET /api/auth/github/callback`

**Handler**
- `githubOAuthCallback` in `src/backend/controllers/authController.js`

**State validation**
- Compares:
  - `req.query.state`
  - `req.session.oAuthState`
- If mismatch: returns `400` (“Security validation failed”)
- Deletes `req.session.oAuthState` after validation

**Token exchange**
- POST request to:
  - `https://github.com/login/oauth/access_token/`
- Uses:
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `code`
  - `GITHUB_REDIRECT_URI`
- Uses `Accept: application/json`

**Fetch GitHub user**
- GET request to:
  - `https://api.github.com/user`
- Authorization:
  - `Authorization: Bearer <accessToken>`

Extracted fields:
- `login` → `githubUsername`
- `html_url` → `githubUrl`
- `id` → `githubID`

**Upsert user in DB**
- `User.findOneAndUpdate(...)` with:
  - query: `{ githubID }`
  - update: `{ githubID, githubUsername, githubUrl }`
  - options: `{ upsert: true, new: true }`

**Session fixation mitigation**
- Session is regenerated via `req.session.regenerate(...)` after successful login.

**Session fields set**
- `req.session.userId = user._id`
- if present:
  - `req.session.leetcodeUsername = user.leetcodeUsernameLower`

**Redirect after success**
- If user does **not** have `leetcodeUsername`:
  - redirect to: `${FRONTEND_URL}/link-account`
- Else:
  - redirect to: `${FRONTEND_URL}/profile/${encodeURIComponent(user.leetcodeUsername)}`

---

## Session Usage (Backend)

### Session writes
- `req.session.oAuthState`
  - written in `startGithubOAuth`

- `req.session.userId`
  - written in `githubOAuthCallback` (after session regeneration)

- `req.session.leetcodeUsername`
  - written in `githubOAuthCallback` if DB user already has `leetcodeUsernameLower`
  - written again in `leetcodeController.linkLeetcode` when linking a LeetCode account

### Session reads
Common pattern across controllers:
- check `req.session?.userId`
- sometimes use `req.session?.leetcodeUsername`

Notable endpoint:
- `/api/auth/me` reads `req.session.userId` and fetches the DB user.

### Logout / session destruction
- Implemented in `authController.logout`:
  - calls `req.session.destroy(...)`
  - responds with `{ loggedIn: false }` and status `401`

Other session destruction cases:
- `/api/auth/me` destroys the session if the session references a user that no longer exists in DB.
- OAuth callback regenerates session to create a clean authenticated session.

### Cookie clearing
- There are no explicit `res.clearCookie(...)` calls.
- Cookie invalidation occurs implicitly when the session is destroyed.

---

## Authorization Enforcement

### No global auth middleware
- There is **no** centralized “auth required” middleware mounted globally.

### identification middleware
- `src/backend/middlewares/identification.js` exists
- It checks `req.session.accessToken`
- It is **not used by any routes** in the repo currently.

### How routes are protected today
Protection is manual and endpoint-specific, commonly by checking:
- `req.session.userId`

Examples:
- `/api/auth/me` returns `401` if `userId` is missing.
- `/api/leetcode/link-account` returns `401` if `userId` missing.
- Friend routes/controllers rely on `req.session.userId` and fail if undefined.

### Role-based access
- None. No admin/role authorization appears in codebase.

---

## Frontend Auth Handling

### Auth state (React context)
- `src/frontend/src/components/auth/AuthProvider.tsx` is the source of truth for frontend auth state.

What it does:
- On mount, calls `/api/auth/me` with `credentials: "include"`
- Stores:
  - `loading`
  - `loggedIn`
  - user data (from `/api/auth/me`)
- Provides `useAuth()` for consumers.

### Where auth is consumed
- `src/frontend/src/components/Navbar.jsx`
  - Uses `useAuth()` to conditionally render:
    - login/signup links when logged out
    - user info + logout when logged in
  - Shows `FriendSearch` only when logged in

### Sign out
- Frontend calls `POST /api/auth/signout` with `credentials: "include"`
- Also supports a local state update via `signOutLocal()` (immediate UI update).

### Local storage
- Local storage is **not** used as auth state storage.
- Session state comes from backend `/api/auth/me`.

---

## Environment Variables

### Backend
- `SESSION_SECRET` — session signing secret
- `NODE_ENV` — controls cookie `secure` flag
- `FRONTEND_URL` — CORS origin and post-login redirects
- `GITHUB_CLIENT_ID` — GitHub OAuth
- `GITHUB_CLIENT_SECRET` — GitHub OAuth
- `GITHUB_REDIRECT_URI` — GitHub OAuth callback redirect URI
- `MONGO_URI` — DB connection (supports user persistence)

### Frontend
- `NEXT_PUBLIC_BACKEND_URL` — backend base URL used for auth API calls and OAuth start links

---

## Security Characteristics (Current)

Implemented:
- OAuth `state` parameter validation
- Session regeneration after login (mitigates session fixation)
- `httpOnly` cookies
- `secure` cookies in production
- `sameSite: "lax"`

Not implemented / not found:
- General CSRF middleware (no `csurf` or equivalent)
- Token-based auth (no JWT)
- Global auth enforcement middleware
- Role-based authorization

---

## Known Limitations

- Session storage is currently in-memory (`MemoryStore`), which is not durable across restarts and does not scale horizontally.
- Session lifetime is currently short (`maxAge` 5 minutes).
- Authorization is enforced manually per route rather than via a global middleware.

---