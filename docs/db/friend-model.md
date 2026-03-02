# db/friend-model.md

=== Source of truth ===

- Friend schema and model: Friend.js  
  Key snippet (schema + indexes as implemented):
  - leetnodeUser field:
    leetnodeUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
  - leetcodeUsername field:
    leetcodeUsername: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    }
  - schema options:
    }, {
        timestamps: true
    });
  - explicit index declarations:
    FriendSchema.index({ leetnodeUser: 1 });
    FriendSchema.index({ leetcodeUsername: 1 });
    FriendSchema.index({ leetnodeUser: 1, leetcodeUsername: 1 }, { unique: true });
  - model creation:
    const Friend = mongoose.model('Friend', FriendSchema);

- Controller using Friend: friendController.js  
- Routes mounting friend endpoints: friendRoutes.js  
- Server mounts friend routes at `/api/friend`: server.js  
- Related user fields / constraints used for relationship context: User.js  
- Session behavior / where session keys are set: authController.js and leetcodeController.js  
- Session config (cookie maxAge etc): session.js

=== Schema ===

- Source file: Friend.js

- Fields exactly as implemented:
  - `leetnodeUser`
    - type: `mongoose.Schema.Types.ObjectId`
    - ref: `'User'`
    - required: true
    - inline index: `index: true`
  - `leetcodeUsername`
    - type: `String`
    - required: true
    - trim: true
    - lowercase: true (Mongoose lowercases on save)
    - inline index: `index: true`

- Schema options:
  - `timestamps: true` — documents include `createdAt` and `updatedAt`.

- Collection name:
  - Model defined as `mongoose.model('Friend', FriendSchema)` so Mongoose uses the default pluralized collection name (i.e., `friends`) — no explicit collection name provided.

=== Indexes & Constraints ===

- Inline per-field index flags (from schema):
  - `leetnodeUser` has `index: true`
  - `leetcodeUsername` has `index: true`

- Explicit schema indexes (calls to `FriendSchema.index(...)`) — exact declarations:
  - `FriendSchema.index({ leetnodeUser: 1 });`
  - `FriendSchema.index({ leetcodeUsername: 1 });`
  - `FriendSchema.index({ leetnodeUser: 1, leetcodeUsername: 1 }, { unique: true });`

- Uniqueness and sparse options:
  - Compound unique index on `{ leetnodeUser: 1, leetcodeUsername: 1 }` enforces: a given `leetnodeUser` cannot follow the same `leetcodeUsername` more than once.
  - No sparse option on Friend indexes.

- Duplicate scenarios & Mongo behavior:
  - Inserting a second document with the same `(leetnodeUser, leetcodeUsername)` fails with a duplicate key error (E11000).
  - The follow controller handles `error.code === 11000` by returning HTTP 409 (see friendController.js).
  - Case-only duplicates are prevented because:
    - the controller normalizes to `toLowerCase()`, and
    - the schema has `lowercase: true` on `leetcodeUsername`.

=== Relationships ===

- What a Friend document represents:
  - One Friend document represents: **a LeetNode user (actor) follows a LeetCode username (target)**.

- Directionality / meaning of fields:
  - `leetnodeUser` = actor (the logged-in LeetNode user’s `User._id`)
  - `leetcodeUsername` = target (the followed LeetCode username, stored as lowercase)

- Normalization rules:
  - Storage-level normalization:
    - `leetcodeUsername` is trimmed + lowercased automatically by Mongoose (`trim: true`, `lowercase: true`).
  - Controller-level normalization:
    - incoming route param is normalized with:
      - `String(leetcodeUsername).trim().toLowerCase()` (friendController.js)
  - Session-level normalization:
    - the user’s own linked LeetCode username is stored in session as `req.session.leetcodeUsername` (lowercased), set by link-account flow and sometimes during OAuth callback (authController.js + leetcodeController.js).

=== Query Patterns by Endpoint ===

Files scanned:
- friendController.js
- friendRoutes.js
- server.js
- User.js (relationship context)

No usage of `.populate()` is present in friendController.js; all reads return raw Friend documents.

1) POST `/api/friend/:leetcodeUsername/follow`
- Route: `router.post('/:leetcodeUsername/follow', follow)`
- Controller: `follow`

Queries:
- Existence check:
  - `Friend.findOne({ leetnodeUser: currentUserId, leetcodeUsername: target })`
- Insert:
  - `const follow = new Friend({ leetnodeUser: currentUserId, leetcodeUsername: target })`
  - `await follow.save()`

Notes:
- No `.lean()`, no projections, no sorting, no pagination.
- `target` is normalized (`trim().toLowerCase()`) before queries.

2) DELETE `/api/friend/:leetcodeUsername/follow`
- Route: `router.delete('/:leetcodeUsername/follow', unfollow)`
- Controller: `unfollow`

Queries:
- Existence check:
  - `Friend.findOne({ leetnodeUser: currentUserId, leetcodeUsername: target })`
- Delete:
  - `Friend.findOneAndDelete({ leetnodeUser: currentUserId, leetcodeUsername: target })`

Notes:
- No `.lean()`, no projections, no sorting, no pagination.

3) GET `/api/friend/counts`
- Route: `router.get('/counts', getFriendCounts)`
- Controller: `getFriendCounts`

Queries (parallel):
- Followers count (how many people follow me):
  - `Friend.countDocuments({ leetcodeUsername: lc })`
- Following count (how many I follow):
  - `Friend.countDocuments({ leetnodeUser: currentUserId })`

Notes:
- `lc` is derived from session `req.session.leetcodeUsername`.

4) GET `/api/friend/is-following/:leetcodeUsername`
- Route: `router.get('/is-following/:leetcodeUsername', isFollowing)`
- Controller: `isFollowing`

Queries:
- `Friend.exists({ leetnodeUser: currentUserId, leetcodeUsername: target })`

Notes:
- Returns a boolean-only payload shape (see Response Contracts).
- `target` is normalized before query.

5) GET `/api/friend/followers`
- Route: `router.get('/followers', getFollowers)`
- Controller: `getFollowers`

Queries:
- `Friend.find({ leetcodeUsername: currentLeetcodeUsername })`

Notes:
- No `.sort()`, `.limit()`, `.skip()`, `.lean()`.
- Returns all Friend docs for the linked username.

6) GET `/api/friend/following`
- Route: `router.get('/following', getFollowing)`
- Controller: `getFollowing`

Queries:
- `Friend.find({ leetnodeUser: currentUserId })`

Notes:
- No `.sort()`, `.limit()`, `.skip()`, `.lean()`.

=== Session Coupling ===

Friend endpoints depend on session-based auth and on whether the user has linked a LeetCode account.

- Session keys observed in friendController.js:
  - `req.session.userId`
    - required to identify the acting user (`leetnodeUser`)
  - `req.session.leetcodeUsername`
    - required for:
      - self-follow prevention in `follow`
      - follower counts and follower list queries (`/counts`, `/followers`)

- Where session keys are set (source-of-truth behavior):
  - `req.session.userId`:
    - set during GitHub OAuth callback in authController.js.
  - `req.session.leetcodeUsername`:
    - set during LeetCode link flow in leetcodeController.js:
      - `req.session.leetcodeUsername = user.leetcodeUsernameLower`
    - sometimes also set during OAuth callback if the DB user already has a linked `leetcodeUsernameLower` (authController.js).

- Behavior when keys are missing (observed in controllers):
  - Missing `userId`:
    - endpoints return HTTP 401 with `{ success: false, message: ... }` (message varies by endpoint).
  - Missing `leetcodeUsername`:
    - `/counts` returns HTTP 400 with `{ success: false, message: "Please link your leetcode-account to view friend counts" }`
    - `/followers` returns HTTP 401 with `{ success: false, message: "Please link your leetcode account" }`
  - Missing route param for `isFollowing`:
    - returns HTTP 400 with `{ success: false, message: "Please provide a leetcode username" }`

=== Error/Response Contracts ===

Routes are mounted at `/api/friend` in server.js, so paths below are relative to that prefix.

1) POST `/:leetcodeUsername/follow`
- Success:
  - HTTP 200
  - `{ success: true, message: "Successfully followed user", follow }`
- Failure cases (observed):
  - 400 `{ success: false, message: "Leetcode username not provided" }`
  - 401 `{ success: false, message: "Not logged in" }`
  - 400 `{ success: false, message: "Cannot follow yourself" }`
  - 400 `{ success: false, message: "Already following user" }` (pre-check)
  - 404 `{ success: false, message: "LeetCode user not found" }` (verification)
  - 503 `{ success: false, message: "LeetCode verification unavailable. Try again." }` (verification timeout/error)
  - 409 `{ success: false, message: "Already following user" }` (duplicate key / E11000)
  - 500 `{ message: error.message }` (note: no `success` key)

2) DELETE `/:leetcodeUsername/follow`
- Success:
  - HTTP 200
  - `{ success: true, message: "Successfully unfollowed user", unfollow }`
- Failure cases (observed):
  - 400 `{ success: false, message: "Leetcode username not provided" }`
  - 401 `{ success: false, message: "Not logged in" }`
  - 400 `{ success: false, message: "Cannot unfollow yourself" }`
  - 400 `{ success: false, message: "You are not following this user" }`
  - 500 `{ message: error.message }`

3) GET `/counts`
- Success:
  - HTTP 200
  - `{ success: true, counts: { followerCount, followingCount } }`
- Failure cases:
  - 401 `{ success: false, message: "Please log in to view friend counts" }`
  - 400 `{ success: false, message: "Please link your leetcode-account to view friend counts" }`
  - 500 `{ message: error.message }`

4) GET `/is-following/:leetcodeUsername`
- Success:
  - HTTP 200
  - `{ isFollowing: true|false }`  (note: no `success` wrapper)
- Failure cases:
  - 400 `{ success: false, message: "Please provide a leetcode username" }`
  - 401 `{ success: false, message: "Please log in to view isFollowing" }`
  - 500 `{ message: error.message }`

5) GET `/followers`
- Success:
  - HTTP 200
  - `{ success: true, message: "User Followers", followers }`
- Failure cases:
  - 401 `{ success: false, message: "please log in to view folllowers" }`
  - 401 `{ success: false, message: "Please link your leetcode account" }`
  - 500 `{ message: error.message }`

6) GET `/following`
- Success:
  - HTTP 200
  - `{ success: true, message: "User Following", following }`
- Failure cases:
  - 401 `{ success: false, message: "Please log in to view following" }`
  - 500 `{ message: error.message }`

Contract inconsistencies (as implemented):
- Some endpoints return `{ success: ... }`, while `/is-following/...` returns `{ isFollowing: ... }`.
- Some server errors return `{ message: error.message }` without `success`.
- Missing-link status code varies (400 in `/counts` vs 401 in `/followers`).

=== Example Documents ===

Example Friend document shape (schema + timestamps):
- {
    _id: ObjectId("..."),
    leetnodeUser: ObjectId("..."),     // reference to User._id
    leetcodeUsername: "someuser",      // trimmed + lowercased
    createdAt: "2026-03-02T12:00:00.000Z",
    updatedAt: "2026-03-02T12:00:00.000Z",
    __v: 0
  }

Example: "User A follows LeetCode username B"
- Inputs:
  - `leetnodeUser` = ObjectId("60a...123")
  - requested target = "LeetMaster"
- Stored Friend doc (normalization applied):
  - {
      _id: ObjectId("60f...abc"),
      leetnodeUser: ObjectId("60a...123"),
      leetcodeUsername: "leetmaster",
      createdAt: "2026-03-02T12:00:00.000Z",
      updatedAt: "2026-03-02T12:00:00.000Z",
      __v: 0
    }

=== Known Issues / Missing ===

- No pagination/sorting on list endpoints:
  - `/followers` and `/following` call `Friend.find(...)` with no `sort`, `limit`, or `skip`, returning unbounded results.

- Race window in follow:
  - Controller does a `findOne` pre-check then `save()`. Concurrent requests can still race; uniqueness is ultimately enforced by the compound unique index (E11000 handled as 409).

- Response/error inconsistency:
  - Mixed response shapes (`{ isFollowing }` vs `{ success }`) and mixed error bodies (`{ success:false,... }` vs `{ message }`) complicate client handling.

- Coupling to session correctness:
  - `getFollowers` and `getFriendCounts` rely on `req.session.leetcodeUsername` being present and lowercased. This is true when set via link-account flow, but the code assumes the session value is already normalized.

- No join / populate:
  - Controllers return raw Friend docs only; there is no population of `leetnodeUser` into User details in responses.

- Verification cost:
  - `follow` verifies the target LeetCode username via a helper (`verifyLeetcodeUser`) with a hard-coded 5-second timeout and returns 404/503 depending on reason; there is no caching of verification results.

- Unused auth middleware:
  - `middlewares/identification.js` exists but is not applied to friend routes (server.js mounts routes without this middleware).