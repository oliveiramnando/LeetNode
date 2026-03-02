# Backend API Specification

This document describes the HTTP API exposed by the LeetNode backend.

- Base prefix: `/api`
- Auth model: session-based (cookie via `express-session`)
- CORS: configured to allow `FRONTEND_URL` with credentials enabled

---

## Route Map

### Health
- GET `/api/health`

### Auth
- GET `/api/auth/me`
- GET `/api/auth/github/start`
- GET `/api/auth/github/callback`
- POST `/api/auth/signup`
- POST `/api/auth/signin`
- POST `/api/auth/signout`

### LeetCode
- GET `/api/leetcode/me`
- GET `/api/leetcode/user/:username`
- POST `/api/leetcode/link-account`

### Friend (Follow System)
- POST `/api/friend/:leetcodeUsername/follow`
- DELETE `/api/friend/:leetcodeUsername/follow`
- GET `/api/friend/counts`
- GET `/api/friend/is-following/:leetcodeUsername`
- GET `/api/friend/followers`
- GET `/api/friend/following`

---

## Health

### GET /api/health

Public health check endpoint.

#### Auth
None

#### Request
- Params: none
- Query: none
- Body: none

#### Success Response (200)
Returns a simple OK payload.

Example:
{ "ok": true }

---

## Auth

### GET /api/auth/me

Returns session-authenticated user info.

#### Auth
Session required:
- `req.session.userId` must exist

#### Request
- Params: none
- Query: none
- Body: none

#### Success Response (200)
Example:
{
  "loggedIn": true,
  "user": {
    "id": "<userId>",
    "githubID": 12345,
    "githubUsername": "<string>",
    "githubUrl": "<string>",
    "leetcodeUsername": "<string or null>"
  }
}

#### Error Responses
- 401
  - { "loggedIn": false }
- 500
  - { "message": "<error.message>" }

#### Notes
- If a session exists but the DB user record is missing, the server destroys the session.

---

### GET /api/auth/github/start

Initiates GitHub OAuth by redirecting to GitHub authorize URL.

#### Auth
None

#### Request
- Params: none
- Query: none
- Body: none

#### Success Response
- 302 redirect to GitHub authorize URL
- Stores OAuth state in session:
  - `req.session.oAuthState` (random hex string)

#### Error Responses
- 500
  - { "message": "<error.message>" }

---

### GET /api/auth/github/callback

Handles GitHub OAuth callback, validates state, exchanges code for token, fetches GitHub user profile, upserts DB user, and creates a logged-in session.

#### Auth
Requires OAuth state validation:
- `state` query param must match `req.session.oAuthState`

#### Request
- Params: none
- Query:
  - code (required)
  - state (required)
- Body: none

#### Success Response
- 302 redirect:
  - If LeetCode NOT linked: `${FRONTEND_URL}/link-account`
  - If LeetCode linked: `${FRONTEND_URL}/profile/${encodeURIComponent(leetcodeUsername)}`

Also:
- Regenerates session (session fixation mitigation)
- Sets session:
  - `req.session.userId = <User._id>`
  - `req.session.leetcodeUsername = user.leetcodeUsernameLower` (if present)

#### Error Responses
- 400
  - { "success": false, "message": "Missing oAuth code" }
- 400
  - { "success": false, "message": "Security validation failed. Please try logging in again" }
- 400
  - { "success": false, "message": "Github ID missing" }
- 500
  - { "message": "<error.message>" }
- 500
  - { "message": "Failed to create session" }

#### Notes
- Exchanges `code` for access token using GitHub OAuth endpoint.
- Fetches user data from `https://api.github.com/user`.
- Upserts User document with: githubID, githubUsername, githubUrl.

---

### POST /api/auth/signup

Creates a new user by name.

#### Auth
None

#### Request
Body:
- name (required)

#### Success Response (200)
Example:
{
  "success": true,
  "message": "Your account has been successfully created!",
  "user": { "<full User document>" }
}

#### Error Responses
- 500
  - { "message": "<error.message>" }

#### Notes
- This endpoint is not integrated with the GitHub OAuth session login flow.

---

### POST /api/auth/signin

Finds a user by name.

#### Auth
None

#### Request
Body:
- name (required)

#### Success Response (200)
Example:
{
  "success": true,
  "existingUSer": { "<User document or null>" }
}

#### Error Responses
- 500
  - { "message": "<error.message>" }

#### Notes
- This endpoint does not create a session.
- Response key contains a typo: `existingUSer`.

---

### POST /api/auth/signout

Destroys the current session.

#### Auth
Session required

#### Request
- Params: none
- Query: none
- Body: none

#### Success Response
Returns status 401 with:
{ "loggedIn": false }

#### Notes
- This endpoint intentionally returns 401 even on success.

---

## LeetCode

### GET /api/leetcode/me

Fetches LeetCode data for the currently logged-in user (based on the User record in DB).

#### Auth
Session required

#### Request
- Params: none
- Query: none
- Body: none

#### Success Response (200)
Returns a raw LeetCode API user object.

#### Error Responses
- 500
  - { "message": "<error.message>" }

#### Notes
- The implementation checks `req.session.user?.userId`, but the session stores `req.session.userId`.
- This mismatch is a known bug and may cause this endpoint to fail even when logged in.

---

### GET /api/leetcode/user/:username

Fetches public LeetCode profile data for the given username.

#### Auth
None

#### Request
Path param:
- username (required)

#### Success Response (200)
Returns a raw LeetCode API user object.

#### Error Responses
- 500
  - { "message": "<error.message>" }

---

### POST /api/leetcode/link-account

Links a LeetCode account to the logged-in user by verifying the GitHub URL on the LeetCode profile matches the GitHub URL from OAuth.

#### Auth
Session required:
- `req.session.userId`

#### Request
Body:
- leetcodeUsername (required)

#### Success Response (200)
Example:
{
  "success": true,
  "message": "LeetCode account linked successfully",
  "user": {
    "id": "<userId>",
    "leetcodeUsername": "<original case>",
    "leetcodeUsernameLower": "<lowercase>"
  }
}

#### Error Responses
- 401
  - { "message": "user not logged in" }
- 404
  - { "error": "Session user not found" }
- 400
  - { "message": "Leetcode username is required" }
- 404
  - { "error": "LeetCode user not found" }
- 400
  - { "error": "LeetCode user does not have a GitHub URL in their profile" }
- 400
  - { "error": "LeetCode profile GitHub URL is invalid or not a github.com profile." }
- 500
  - { "error": "Your GitHub URL from OAuth is invalid (unexpected)." }
- 400
  - { "error": "GitHub URL does not match the one in LeetCode profile" }
- 409
  - { "message": "That LeetCode username is already linked to another account." }
- 500
  - { "message": "Server error" }

#### Notes
- Updates User fields:
  - leetcodeUsername
  - leetcodeUsernameLower
- Updates session:
  - `req.session.leetcodeUsername` set to lowercase username
- Unique constraint exists on `leetcodeUsernameLower`.

---

## Friend (Follow System)

### POST /api/friend/:leetcodeUsername/follow

Creates a follow relationship for the logged-in user.

#### Auth
Session required:
- `req.session.userId`
- Uses `req.session.leetcodeUsername` for self-follow prevention

#### Request
Path param:
- leetcodeUsername (required, normalized: trim + lowercase)

Body: none

#### Success Response (200)
Example:
{
  "success": true,
  "message": "Successfully followed user",
  "follow": {
    "_id": "<objectId>",
    "leetnodeUser": "<userId>",
    "leetcodeUsername": "<lowercase>",
    "createdAt": "<ISO date>",
    "updatedAt": "<ISO date>"
  }
}

#### Error Responses
- 400
  - { "success": false, "message": "Leetcode username not provided" }
- 401
  - { "success": false, "message": "Not logged in" }
- 400
  - { "success": false, "message": "Cannot follow yourself" }
- 400
  - { "success": false, "message": "Already following user" }
- 404
  - { "success": false, "message": "LeetCode user not found" }
- 503
  - { "success": false, "message": "LeetCode verification unavailable. Try again." }
- 409
  - { "success": false, "message": "Already following user" }
- 500
  - { "message": "<error.message>" }

#### Notes
- Verifies target LeetCode user exists via LeetCode API with a 5s timeout.
- Duplicate prevention:
  - pre-check with findOne
  - unique compound index
  - 11000 duplicate key mapped to 409

---

### DELETE /api/friend/:leetcodeUsername/follow

Deletes a follow relationship for the logged-in user.

#### Auth
Session required:
- `req.session.userId`

#### Request
Path param:
- leetcodeUsername (required, normalized: trim + lowercase)

Body: none

#### Success Response (200)
Example:
{
  "success": true,
  "message": "Successfully unfollowed user",
  "unfollow": {
    "_id": "<objectId>",
    "leetnodeUser": "<userId>",
    "leetcodeUsername": "<lowercase>",
    "createdAt": "<ISO date>",
    "updatedAt": "<ISO date>"
  }
}

#### Error Responses
- 400
  - { "success": false, "message": "Leetcode username not provided" }
- 401
  - { "success": false, "message": "Not logged in" }
- 400
  - { "success": false, "message": "Cannot unfollow yourself" }
- 400
  - { "success": false, "message": "You are not following this user" }
- 500
  - { "message": "<error.message>" }

---

### GET /api/friend/counts

Returns follower and following counts for the logged-in user.

#### Auth
Session required:
- `req.session.userId`
- `req.session.leetcodeUsername`

#### Request
- Params: none
- Query: none
- Body: none

#### Success Response (200)
Example:
{
  "success": true,
  "counts": {
    "followerCount": 42,
    "followingCount": 15
  }
}

#### Error Responses
- 401
  - { "success": false, "message": "Please log in to view friend counts" }
- 400
  - { "success": false, "message": "Please link your leetcode-account to view friend counts" }
- 500
  - { "message": "<error.message>" }

#### Notes
- followerCount: Friend documents where leetcodeUsername equals current user’s leetcodeUsername
- followingCount: Friend documents where leetnodeUser equals current userId

---

### GET /api/friend/is-following/:leetcodeUsername

Checks whether the logged-in user follows the given LeetCode username.

#### Auth
Session required:
- `req.session.userId`

#### Request
Path param:
- leetcodeUsername (required)

#### Success Response (200)
Example:
{ "isFollowing": true }

#### Error Responses
- 400
  - { "success": false, "message": "Please provide a leetcode username" }
- 401
  - { "success": false, "message": "Please log in to view isFollowing" }
- 500
  - { "message": "<error.message>" }

#### Notes
- Uses Friend.exists() for efficiency.
- Username normalized via trim + lowercase.

---

### GET /api/friend/followers

Returns Friend edges representing who follows the logged-in user.

#### Auth
Session required:
- `req.session.userId`
- `req.session.leetcodeUsername`

#### Success Response (200)
Example:
{
  "success": true,
  "message": "User Followers",
  "followers": [
    {
      "_id": "<objectId>",
      "leetnodeUser": "<userId>",
      "leetcodeUsername": "<lowercase>",
      "createdAt": "<ISO date>",
      "updatedAt": "<ISO date>"
    }
  ]
}

#### Error Responses
- 401
  - { "success": false, "message": "please log in to view folllowers" }
- 401
  - { "success": false, "message": "Please link your leetcode account" }
- 500
  - { "message": "<error.message>" }

#### Notes
- Typo in error message: "folllowers"
- No pagination

---

### GET /api/friend/following

Returns Friend edges representing who the logged-in user is following.

#### Auth
Session required:
- `req.session.userId`

#### Success Response (200)
Example:
{
  "success": true,
  "message": "User Following",
  "following": [
    {
      "_id": "<objectId>",
      "leetnodeUser": "<userId>",
      "leetcodeUsername": "<lowercase>",
      "createdAt": "<ISO date>",
      "updatedAt": "<ISO date>"
    }
  ]
}

#### Error Responses
- 401
  - { "success": false, "message": "Please log in to view following" }
- 500
  - { "message": "<error.message>" }

#### Notes
- No pagination

---

## Inconsistencies

1. Typo in getFollowers error message: "folllowers" (three l’s)
2. Typo in signin response field: "existingUSer"
3. Session bug in GET /api/leetcode/me: checks `req.session.user?.userId` but session stores `req.session.userId`
4. Inconsistent error response shapes:
   - sometimes { message }
   - sometimes { error }
   - sometimes { success, message }
5. Inconsistent error status codes across endpoints for similar issues
6. POST /api/auth/signout returns 401 even on success (unconventional but current behavior)
7. signup/signin endpoints exist but are not integrated with OAuth session login flow

---

## Missing / Not Found

- Pagination query parameters (limit/page/offset) are not implemented
- Rate limiting is not implemented
- Joi is present but not used for request validation
- identification middleware exists but is unused and checks a session field (`accessToken`) that is not set
- No structured request/response logging middleware
- No standardized error envelope across the API