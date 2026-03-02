# Backend Overview

This document provides a high-level overview of the LeetNode backend: what it does, how it is structured, how requests flow through the system, and the major known limitations based on the current codebase.

---

## Purpose

The backend is the REST API for LeetNode. Its current responsibilities are:

- Session-based authentication (cookies) with GitHub OAuth
- Persisting core user identity (GitHub identifiers + linked LeetCode username)
- Fetching LeetCode user data via the `leetcode-query` library (public lookup and logged-in flows)
- Providing a simple follow system (followers/following) stored in MongoDB
- Storing some submission-related schemas (currently unused / partial)

It currently does not implement pagination, rate limiting, or consistent request validation, and most analytics-heavy processing is not implemented in the backend yet.

---

## Entry Point and Boot Sequence

### Main Entry File
- `src/backend/server.js`

### Startup Sequence (as implemented)
1. Imports `./env.js`
   - Note: `env.js` exists but is empty (dotenv is not invoked)
2. Creates an Express app
3. Applies global middleware:
   - `express.json()` for JSON request bodies
   - CORS middleware from `config/cors.js`
   - Session middleware from `config/session.js`
4. Registers a health endpoint:
   - `GET /api/health`
5. Mounts route modules with full prefixes:
   - `/api/auth` → `routes/authRoutes.js`
   - `/api/leetcode` → `routes/leetcodeRoute.js`
   - `/api/friend` → `routes/friendRoutes.js`
6. Connects to MongoDB via `connectDB()` from `config/db.js`
7. After DB connection resolves, starts server with `app.listen(PORT)`

---

## Project Structure

### config/
Configuration modules used by the server:
- `config/db.js` — MongoDB connection setup (Mongoose)
- `config/session.js` — `express-session` configuration (cookie/session options)
- `config/cors.js` — CORS settings (origin + credentials)

### routes/
Express routers that define endpoint paths and attach controller handlers:
- `routes/authRoutes.js`
- `routes/leetcodeRoute.js`
- `routes/friendRoutes.js`

### controllers/
Business logic and request handlers. Controllers also perform manual session checks:
- `controllers/authController.js`
- `controllers/leetcodeController.js`
- `controllers/friendController.js`

### models/
Mongoose schemas / collections:
- `models/User.js`
- `models/Friend.js`
- `models/submissions/` (schemas exist but appear unused / partial)
  - `lc_daily_activity.js`
  - `lc_problems.js`
  - `lc_stats_snapshot.js`

### middlewares/
- `middlewares/identification.js`
  - Middleware that checks `req.session.accessToken`
  - Not applied to any routes in current codebase

### env.js
- `env.js` is imported by server.js but is empty
- No dotenv initialization is present in the repo based on current sources

---

## Request Flow

Typical request lifecycle in this backend:

1. Incoming HTTP request hits Express in `server.js`
2. Global middleware runs:
   - JSON body parsing (`express.json()`)
   - CORS (origin + credentials)
   - Session parsing/creation (cookie-based session)
3. Request is routed to a module under `/api/*`:
   - auth, leetcode, friend
4. Route invokes a controller function
5. Controller performs:
   - session checks (manual per handler)
   - DB reads/writes via Mongoose models
   - optional external API calls (GitHub / LeetCode)
6. Controller returns JSON responses or redirects (OAuth flow)

---

## Data Layer

### Database
- MongoDB via Mongoose

### Models

#### User
Stores core user identity and linked LeetCode info:
- GitHub identifiers (e.g., githubID, githubUsername, githubUrl)
- Optional linked LeetCode username (including lowercase copy)

Key constraints (high-level):
- Unique/indexed GitHub username
- Sparse unique index on `leetcodeUsernameLower`

#### Friend
Stores follow edges as a separate collection (edge list):
- `leetnodeUser` (ObjectId ref User) → the follower
- `leetcodeUsername` (string, lowercased) → the followed target

Key constraints (high-level):
- Index on `leetnodeUser`
- Index on `leetcodeUsername`
- Compound unique index on (`leetnodeUser`, `leetcodeUsername`)

#### Submissions (schemas only; appear unused / partial)
- `models/submissions/lc_daily_activity.js`
- `models/submissions/lc_problems.js`
- `models/submissions/lc_stats_snapshot.js`

Notes:
- These schemas appear not referenced by routes/controllers
- Some contain typos (e.g., `moongoose`, `types`) suggesting they may not compile if imported

---

## Authentication

### Auth Model
- Session-based auth using `express-session`
- No JWTs or bearer token system

### Session Cookie
- Cookie name: `sid`
- httpOnly: true
- sameSite: `lax` (comment indicates `none` may be needed in production)
- secure: enabled when `NODE_ENV === "production"`
- maxAge: currently set to 5 minutes (test value)

### Session Keys Used
- `userId` — MongoDB `_id` of logged-in user
- `leetcodeUsername` — lowercased LeetCode username after linking
- `oAuthState` — stored during GitHub OAuth start for state validation

### CORS
- `origin` is set from `process.env.FRONTEND_URL`
- `credentials: true` is enabled so cookies are sent and accepted

---

## External Integrations

### GitHub OAuth
Flow endpoints:
- `GET /api/auth/github/start`
  - redirects to GitHub authorize endpoint
  - generates and stores `oAuthState` in session

- `GET /api/auth/github/callback`
  - validates `state` against session
  - exchanges code for access token via GitHub OAuth endpoint
  - fetches GitHub user profile
  - upserts User record
  - regenerates session and stores `userId` (+ optionally `leetcodeUsername`)
  - redirects to frontend route (either link-account or profile)

### LeetCode
- Uses `leetcode-query` (`new LeetCode()`)
- Supports:
  - public lookup of any username
  - linking a LeetCode account by verifying GitHub URL on LeetCode profile matches OAuth GitHub URL
  - follow verification: friend controller checks username existence with a 5 second timeout (Promise.race pattern)

---

## API Surface Summary

### Health
- `GET /api/health` → `{ ok: true }`

### Auth (`/api/auth`)
- `GET /me`
- `GET /github/start`
- `GET /github/callback`
- `POST /signout`
- `POST /signup` (stub)
- `POST /signin` (stub)

### LeetCode (`/api/leetcode`)
- `GET /me`
- `GET /user/:username`
- `POST /link-account`

### Friend (`/api/friend`)
- `POST /:leetcodeUsername/follow`
- `DELETE /:leetcodeUsername/follow`
- `GET /counts`
- `GET /is-following/:leetcodeUsername`
- `GET /followers`
- `GET /following`

### Authorization Enforcement
- No route-level auth middleware is applied globally
- Controllers manually check `req.session.userId` (and sometimes `req.session.leetcodeUsername`)
- `middlewares/identification.js` exists but is unused

---

## Known Issues and Inconsistencies

- `leetcodeController.me` checks `req.session.user?.userId` instead of `req.session.userId`
- `env.js` is imported but empty; environment variables are not loaded via dotenv
- Submission schemas under `models/submissions/` appear unused and contain typos (`moongoose`, `types`)
- Inconsistent error response shapes:
  - sometimes `{ success: false, message }`
  - sometimes `{ message }`
  - sometimes `{ error }`
- Session cookie `maxAge` is currently set to 5 minutes (test value)
- `authController.signup` / `signin` endpoints appear vestigial and not integrated with OAuth session login

---

## Missing / Not Implemented

Based on the current codebase, the following are not present:

- Pagination support on list endpoints (followers/following)
- Rate limiting
- Centralized request validation (Joi is installed but unused)
- Global auth middleware enforcing login at router level
- Error normalization (single consistent error envelope)
- Analytics engine / heavy computation layer (beyond basic LeetCode lookups and simple counts)