# API Specification

This document describes the HTTP API exposed by the LeetNode backend.

- **Base URL (local):** `http://localhost:<PORT>`
- **API Prefix:** `/api`
- **Content Type:** JSON unless otherwise noted (redirects)
- **Auth Model:** Session-based (cookie). Some routes rely on environment variables instead of user auth.


## Conventions

### Standard Response Types
Most endpoints respond with JSON. Some auth endpoints respond with **redirects**.

### Sessions & Cookies
The backend uses server-side sessions (stored in MongoDB) and sets a session cookie for the client.
- Requests from the frontend should include credentials (cookies).

### CORS
CORS allows requests from `FRONTEND_URL` with credentials enabled.

### Error Handling (Current Behavior)
Error response formats are currently inconsistent across endpoints:
- Some routes return JSON errors.
- Some routes return plain text.
- Some routes log errors without responding.

This spec documents **current behavior**.


## Global Middleware

Applied to all routes (based on backend configuration):
- `express.json()` — parses JSON request bodies
- CORS configured for `FRONTEND_URL` with credentials
- Session middleware with MongoDB store

## Health

`GET /api/health`
Basic health check.

**Auth:** None  
**Request:** No params/body  

**Responses**
- `200 OK`
  ```json
  { "ok": true }

## Auth

#### `GET /api/auth/me`
Checks whether a user is logged in via session.

Auth: Session (implicit)
Request: No params/body

Responses
- 200 OK (logged in)
  - Body (JSON): { "loggedIn": true, "user": {} }
- 401 Unauthorized (not logged in)
  - Body (JSON): { "loggedIn": false }


#### `GET /api/auth/github/start`
Starts GitHub OAuth by redirecting the user to GitHub’s authorization URL.

Auth: None
Request: No params/body

Responses
- 302 Found (redirect to GitHub OAuth URL)
- 500 Internal Server Error (session save failure; response body may vary)


#### `GET /api/auth/github/callback`
Handles the GitHub OAuth callback:
- Validates state
- Exchanges code for token
- Fetches GitHub user data
- Stores user/session in DB
- Redirects to FRONTEND_URL on success

Auth: None (OAuth callback endpoint)

Query Parameters
- code (string) — required on success
- state (string) — required
- error (string) — optional
- error_description (string) — optional

Responses
- 302 Found (redirect to FRONTEND_URL)
- 400 Bad Request (invalid params/state mismatch; body may vary)
- 500 Internal Server Error (OAuth exchange failure; body may vary)


#### `POST /api/auth/signout`
Destroys the session and clears the session cookie.

Auth: None
Request: No body

Responses
- 200 OK
  - Body (JSON): { "ok": true }
- 500 Internal Server Error (session destroy failure; body may vary)

---

## LeetCode

#### `GET /api/leetcode/me`
Fetches the authenticated user’s LeetCode submissions using LEETCODE_SESSION_COOKIE from environment variables.

Note: This endpoint does NOT use the user’s session.

Auth: None (requires server env var)
Request: No params/body

Responses
- 200 OK
  - Body (JSON): { "count": 0, "submissions": [] }
- 400 Bad Request (missing LEETCODE_SESSION_COOKIE)
- 500 Internal Server Error (LeetCode query failure)


#### `GET /api/leetcode/user/:username`
Fetches public LeetCode user data for a given username.

Auth: None

Path Parameters
- username (string)

Responses
- 200 OK
  - Body: LeetCode user object (shape depends on leetcode-query)
- Failure behavior (current): errors may be logged without a structured error response.


#### `POST /api/leetcode/link-account`
Links a LeetCode account by verifying GitHub URL match and updating DB.

Auth: None (current)

Request Body (JSON)
- username (string)
- githubUrl (string)

Responses
- 200 OK
  - Body (JSON): { "message": "LeetCode account linked successfully" }
- 400 Bad Request (validation/verification failure)
- 404 Not Found (user not found)

---

## Notes / Known Inconsistencies

1. Response formats vary
    - Some endpoints return JSON.
    - Some redirect.
    - Some return plain text errors.

2. Error handling is inconsistent
    - Some endpoints return 500 with JSON.
    - Some log errors without sending structured responses.

3. Auth enforcement is inconsistent
    - Session exists but is not uniformly required.
    - Some endpoints rely on environment variables instead of user auth.

4. No rate limiting
    - No rate limiting middleware is currently applied.

---

## Appendix: Endpoint Index

- `GET /api/auth/me`
- `GET /api/auth/github/start`
- `GET /api/auth/github/callback`
- `POST /api/auth/signout`
- `GET /api/leetcode/me`
- `GET /api/leetcode/user/:username`
- `POST /api/leetcode/link-account`