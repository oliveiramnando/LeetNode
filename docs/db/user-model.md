# User Model

This document describes the `User` data model used by the LeetNode backend, including schema fields, indexes, and relationships to other collections.

---

## Location

- **Model file:** `src/backend/models/User.js`

Related relationship models:
- `src/backend/models/Follow.js`
- `src/backend/models/Submissions.js`

---

## Purpose

The `User` collection represents a LeetNode user account identified primarily by GitHub identity, with an optional linked LeetCode username.

This model is used for:
- Creating/upserting a user on GitHub OAuth callback
- Linking a LeetCode account to an existing GitHub-based user
- Referencing the user from follow edges and stored submissions

---

## Schema

### Fields

| Field | Type | Required | Unique | Default | Constraints | Notes |
|------|------|----------|--------|---------|------------|------|
| `ghUsername` | `String` | Yes | Yes | — | `trim` | GitHub username (primary identity) |
| `githubUrl` | `String` | Yes | Yes | — | `trim` | GitHub profile URL |
| `leetcodeUsername` | `String` | No | Yes | — | `trim` | Linked LeetCode username (optional) |
| `createdAt` | `Date` | No | No | `now` | — | Timestamp |
| `updatedAt` | `Date` | No | No | `now` | — | Timestamp |

### Virtuals / Transforms

- **None found** in codebase:
  - No virtuals
  - No `toJSON` / `toObject` transforms
  - No custom getters/setters

---

## Indexes

Indexes defined in `src/backend/models/User.js`:

- **`ghUsername`**
  - `unique: true`
  - `index: true`

- **`githubUrl`**
  - `unique: true`
  - `index: true`

Notes:
- `leetcodeUsername` is marked unique at the schema level (per code scan), but no explicit `schema.index(...)` was reported for it in the scan output.

---

## Relationships

### Follow Graph (`Follow` collection)

- **Model file:** `src/backend/models/Follow.js`
- Represents a directed edge: `follower -> following`
- Fields (high-level):
  - `follower`: `ObjectId` → references `User`
  - `following`: `ObjectId` → references `User`

This means the backend models following using an **edge list** (separate collection), not embedded arrays on the user document.

### Submissions (`Submissions` collection)

- **Model file:** `src/backend/models/Submissions.js`
- Associates stored LeetCode submission data to a user:
  - `userId`: `ObjectId` → references `User`

---

## Where `User` is Read/Written

### GitHub OAuth callback
- **Controller:** `src/backend/controllers/authController.js`
- Behavior (current):
  - **Writes:** `ghUsername`, `githubUrl`
  - Uses **upsert** on `ghUsername` (create if missing, otherwise update)
  - Stores some user data in **session** as well

### Link LeetCode account
- **Controller:** `src/backend/controllers/leetcodeController.js`
- Behavior (current):
  - **Reads:** `githubUrl` (used for validation)
  - **Writes:** `leetcodeUsername` (after validation checks)

### Auth “me” endpoint
- **Route:** `/api/auth/me` (from `src/backend/routes/authRoutes.js`)
- Behavior (current):
  - Returns **`session.user`** (not necessarily a fresh DB read)

---

## Notes / Known Gaps in Current Codebase

- No `populate()` usage found (relationships exist but aren’t being populated via Mongoose in current code).
- No additional field validation via Joi or custom validation logic found (beyond schema constraints).
- Session stores user info separately from DB user reads, meaning responses from `/api/auth/me` reflect session state, not guaranteed current DB state.
