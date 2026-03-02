# User Model

This document describes the **MongoDB/Mongoose `User` model** used by the LeetNode backend: schema fields, indexes/constraints, how the model participates in auth + LeetCode linking flows, and how sessions depend on user fields.

---

## Source of truth

Backend files referenced in analysis:

- `src/backend/models/User.js`
- `src/backend/controllers/authController.js`
- `src/backend/controllers/leetcodeController.js`
- `src/backend/config/session.js`
- `src/backend/models/Friend.js` (references `User`)
- `src/backend/routes/*.js`
- `src/backend/server.js`

---

## Schema

**Model:** `User`  
**Collection:** `users` (default Mongoose pluralization)

### Definition (as implemented)

- Fields: `name`, `githubID`, `githubUsername`, `githubUrl`, `leetcodeUsername`, `leetcodeUsernameLower`
- Options: `{ timestamps: true }` → `createdAt`, `updatedAt`

---

## Fields

### `_id`

- **Type:** `ObjectId` (MongoDB default)
- **Created:** Automatically on insert
- **Used for:** Primary backend identity (`req.session.userId`)

---

### `name`

- **Type:** `String`
- **Constraints:** none
- **Written by:** legacy `signup` endpoint
- **Notes:** Not part of the primary OAuth flow and not referenced by the main app behavior.

---

### `githubID`

- **Type:** `Number`
- **Constraints:** `index: true` (not unique)
- **Written by:** GitHub OAuth callback flow (upsert)
- **Used for:** OAuth upsert lookup key (`findOneAndUpdate({ githubID }, ...)`)

---

### `githubUsername`

- **Type:** `String`
- **Constraints:** `trim: true`, `unique: true`, `index: true`
- **Written by:** GitHub OAuth callback flow
- **Used for:** User identity/display (backend returns it from `/api/auth/me`)
- **Notes:** Unique constraint means `E11000 duplicate key` is possible if violated.

---

### `githubUrl`

- **Type:** `String`
- **Constraints:** `trim: true`, `index: true` (not unique)
- **Written by:** GitHub OAuth callback flow
- **Used for:** LeetCode link validation (LeetCode profile GitHub URL must match OAuth GitHub URL)

---

### `leetcodeUsername`

- **Type:** `String`
- **Constraints:** `trim: true`
- **Written by:** `POST /api/leetcode/link-account`
- **Used for:** Display/routing (backend returns it from `/api/auth/me`, and OAuth callback redirects to `/profile/:username` when linked)

---

### `leetcodeUsernameLower`

- **Type:** `String`
- **Constraints:** `trim: true`, `sparse: true`, plus an explicit unique+sparse index (see Indexes)
- **Written by:** `POST /api/leetcode/link-account` (lowercased copy of `leetcodeUsername`)
- **Used for:**
  - Stored in session as `req.session.leetcodeUsername`
  - Used by Friend system as the canonical “who am I on LeetCode?” handle
- **Notes:**
  - This is the “uniqueness field” for LeetCode linkage across accounts.
  - It is intentionally nullable for users who have not linked yet.

---

## Indexes and constraints

### Inline indexes / constraints

- `githubID` → indexed (non-unique)
- `githubUsername` → indexed + **unique**
- `githubUrl` → indexed (non-unique)
- `leetcodeUsernameLower` → `sparse: true` at field-level (and also indexed explicitly as unique+sparse)

### Explicit index

- `leetcodeUsernameLower` → `{ unique: true, sparse: true }`

**Behavior of unique + sparse:**
- Multiple documents may omit `leetcodeUsernameLower` or have it unset (sparse index ignores missing values).
- Once a user links a LeetCode account, `leetcodeUsernameLower` must be unique across all users.
- Duplicate link attempts surface as Mongo error code `11000` and are mapped to HTTP `409` in `link-account`.

---

## Relationships

### Outbound references from `User`

- None (User does not reference other collections).

### Inbound references to `User`

`Friend` model references `User`:

- `Friend.leetnodeUser` is an `ObjectId` with `ref: "User"`.

**Important note:** friend controllers do not populate User documents; they store and query ObjectIds and LeetCode usernames.

---

## Lifecycle flows that read/write `User`

### 1) GitHub OAuth callback (creates/updates User)

**Route:** `GET /api/auth/github/callback`

**Writes:**
- `githubID`
- `githubUsername`
- `githubUrl`

**Reads:**
- `_id` (for session)
- `leetcodeUsername` / `leetcodeUsernameLower` (to decide redirect and whether to set session lc name)

**DB behavior:**
- Upsert pattern: “find by githubID; create if missing; update fields”

**Session coupling created here:**
- `req.session.userId = user._id`
- If user already linked: `req.session.leetcodeUsername = user.leetcodeUsernameLower`

**Redirect logic:**
- If not linked → frontend `/link-account`
- If linked → frontend `/profile/:leetcodeUsername`

---

### 2) Link LeetCode account (updates User)

**Route:** `POST /api/leetcode/link-account`

**Preconditions:**
- Must have `req.session.userId` (logged in)
- The LeetCode profile must exist
- The LeetCode profile must have a GitHub URL
- LeetCode GitHub URL must match User’s `githubUrl`

**Writes:**
- `leetcodeUsername` (original case)
- `leetcodeUsernameLower` (lowercase)
- Persists via `user.save()`

**Session update:**
- `req.session.leetcodeUsername = user.leetcodeUsernameLower`

**Uniqueness enforcement:**
- If `leetcodeUsernameLower` is already taken, Mongo throws `E11000` → API returns `409` with message that the username is already linked.

---

### 3) Current user endpoint (reads User)

**Route:** `GET /api/auth/me`

**Reads:**
- User by `_id` using `req.session.userId`

**Returns:**
- `id`, `githubID`, `githubUsername`, `githubUrl`, `leetcodeUsername` (nullable)

**Safety behavior:**
- If session has userId but DB user missing → session destroyed and `{ loggedIn: false }` returned.

---

### 4) Legacy signup/signin endpoints (exist but not part of primary flow)

**Routes:**
- `POST /api/auth/signup` (creates User with `name` only)
- `POST /api/auth/signin` (looks up User by `name`)

**Notes:**
- These flows do not create session state and appear unused compared to GitHub OAuth.

---

## Session coupling

Session is the **primary auth mechanism** (no JWT). Key session values derived from User:

- `userId` ← `User._id`
- `leetcodeUsername` ← `User.leetcodeUsernameLower`
- `oAuthState` ← generated during OAuth start (not from User)

### Session cookie configuration (high-level)

- Cookie name: `sid`
- `httpOnly: true`
- `sameSite: "lax"`
- `secure` toggles with `NODE_ENV === "production"`
- Current `maxAge` set to ~5 minutes (commented/used as testing value)

---

## Example documents

These are illustrative examples using only schema fields.

### A) After GitHub OAuth, before linking LeetCode

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": null,
  "githubID": 12345678,
  "githubUsername": "octocat",
  "githubUrl": "https://github.com/octocat",
  "leetcodeUsername": null,
  "leetcodeUsernameLower": null,
  "createdAt": "2026-03-02T10:15:00.000Z",
  "updatedAt": "2026-03-02T10:15:00.000Z"
}
```
### B) After linking LeetCode

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": null,
  "githubID": 12345678,
  "githubUsername": "octocat",
  "githubUrl": "https://github.com/octocat",
  "leetcodeUsername": "LeetCodeUser123",
  "leetcodeUsernameLower": "leetcodeuser123",
  "createdAt": "2026-03-02T10:15:00.000Z",
  "updatedAt": "2026-03-02T10:22:45.000Z"
}
```

---

## Known Issues and Inconsistencies

### `/api/leetcode/me` — Session Lookup Bug

In `leetcodeController.me()`, the code is inconsistent with the actual session shape:

- It checks `req.session.user?.userId`, even though the session stores `req.session.userId` (there is **no nested `user` object**).
- It attempts to query a `userId` field in the `User` collection, which is **not part of the schema** (`User` uses `_id`).

**Expected pattern:**

```js
User.findById(req.session.userId);
```
---

## Practical Invariants

### After Successful GitHub OAuth

The following conditions must hold:

- `githubID` exists on the `User` document.
- `githubUsername` exists on the `User` document.
- `githubUrl` exists on the `User` document.
- `req.session.userId` is defined and references the authenticated user’s `_id`.

---

### After Successful Link Account

The following conditions must hold:

- `leetcodeUsername` exists on the `User` document.
- `leetcodeUsernameLower` exists on the `User` document.
- `req.session.leetcodeUsername` is set and equals `leetcodeUsernameLower`.

---

## Database Constraints

- `leetcodeUsernameLower` must be globally unique across all users.
- This uniqueness is enforced at the MongoDB index level.
