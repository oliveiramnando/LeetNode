# DB Schema Overview

Source of truth: `src/backend/models/**` (Mongoose schemas) plus controller usage in `src/backend/controllers/**` and route mounting in `src/backend/server.js`.

---

## Collections (MongoDB)

These Mongoose models exist in the backend codebase:

- `User`
- `Friend`
- `lc_daily_activity`
- `lc_problems`
- `lc_stats_snapshot`

---

## Collection: `users` (Model: `User`)

**Source:** `src/backend/models/User.js`  
**Options:** `timestamps: true`

### Purpose
Stores LeetNode’s authenticated user identity (GitHub OAuth) and the linked LeetCode username. Used heavily by auth + account linking flows.

### Fields
- `name`: String
- `githubID`: Number (**index: true**)
- `githubUsername`: String (**trim: true**, **unique: true**, **index: true**)
- `githubUrl`: String (**trim: true**, **index: true**)
- `leetcodeUsername`: String (**trim: true**)
- `leetcodeUsernameLower`: String (**trim: true**, **sparse: true**)

### Indexes / Constraints
- Inline:
  - `githubID` indexed
  - `githubUsername` unique + indexed
  - `githubUrl` indexed
- Schema-level:
  - `{ leetcodeUsernameLower: 1 }` with `{ unique: true, sparse: true }`

### Relationships
- No explicit `ObjectId` references from `User` to other collections.

---

## Collection: `friends` (Model: `Friend`)

**Source:** `src/backend/models/Friend.js`  
**Options:** `timestamps: true`

### Purpose
Represents the “follow” relation: a LeetNode user (local `User`) follows a LeetCode username (string). Powers follow/unfollow, follower/following counts, and follower/following lists.

### Fields
- `leetnodeUser`: ObjectId (**ref: "User"**, **required: true**, **index: true**)
- `leetcodeUsername`: String (**required: true**, **trim: true**, **lowercase: true**, **index: true**)

### Indexes / Constraints
- `FriendSchema.index({ leetnodeUser: 1 })`
- `FriendSchema.index({ leetcodeUsername: 1 })`
- Compound unique (prevents duplicate follows):
  - `FriendSchema.index({ leetnodeUser: 1, leetcodeUsername: 1 }, { unique: true })`

### Relationships
- `leetnodeUser` references `User`.
- `leetcodeUsername` is an external identifier (not a `User` ref).

---

## Collection: `lc_daily_activity` (Model: `lc_daily_activity`)

**Source:** `src/backend/models/submissions/lc_daily_activity.js`  
**Options:** `timestamps: true`

### Purpose
Stores per-user daily submission counts (intended for heatmaps / streaks / “activity over time” style UI).

### Fields
- `userId`: ObjectId (**ref: "User"**, **required: true**)
- `date`: String (**required: true**)  
  - Comment indicates format: `YYYY-MM-DD`
- `submissions`: Number (**required: true**, **min: 0**)

### Indexes / Constraints
- Unique per user/day:
  - `{ userId: 1, date: 1 }` unique
- Additional index for sorting:
  - `{ userId: 1, date: -1 }`

### Relationships
- `userId` references `User`.

---

## Collection: `lc_problems` (Model: `lc_problems`)

**Source:** `src/backend/models/submissions/lc_problems.js`  
**Options:** (none specified)

### Purpose
A dictionary/catalog of LeetCode problems with difficulty + topic tags (intended to support topic/difficulty breakdowns).

### Fields
- `titleSlug`: String (**required: true**, **unique: true**)
- `title`: String (**unique: true**)
- `difficulty`: String (**required: true**)  
  - Comment indicates: `Easy | Medium | Hard`
- `topicTags`: Array of objects:
  - `{ name: String, slug: String }`

### Indexes / Constraints
- `titleSlug` unique
- `title` unique

### Relationships
- No `ObjectId` references.

### Known issue (in source)
The file contains an observed typo: it uses `moongoose.Schema` (instead of `mongoose.Schema`), which would prevent the model from compiling correctly unless fixed.

---

## Collection: `lc_stats_snapshot` (Model: `lc_stats_snapshot`)

**Source:** `src/backend/models/submissions/lc_stats_snapshot.js`  
**Options:** `timestamps: true`

### Purpose
Time-series snapshots of solved counts per user (intended for progress over time).

### Fields
- `userId`: ObjectId (**ref: "User"**, **required: true**)
- `capturedAt`: String (**required: true**)  
  - Comment indicates format: `YYYY-MM-DD`
- `totalSolved`: Number
- `easySolved`: Number
- `mediumSolved`: Number
- `hardSolved`: Number

### Indexes / Constraints
- `{ userId: 1, capturedAt: -1 }` with `{ unique: true }`

### Relationships
- `userId` references `User`.

### Known issue (in source)
The file contains an observed typo: `capturedAt` uses `types: String` (instead of `type: String`), which would prevent correct schema compilation unless fixed.

---

## Endpoint → Collection Access Map

Routes are mounted in `src/backend/server.js` with these base prefixes:
- `/api/auth`
- `/api/leetcode`
- `/api/friend`

Below is the controller-level mapping of which collections are read/written.

### Auth (`/api/auth/*`)

- `GET /api/auth/me` → `authController.me`
  - Reads: `User`
  - Query: `User.findById(req.session?.userId).lean()`

- `GET /api/auth/github/start` → `authController.startGithubOAuth`
  - DB: none (session write only)

- `GET /api/auth/github/callback` → `authController.githubOAuthCallback`
  - Writes: `User` (upsert)
  - Query: `User.findOneAndUpdate({ githubID }, {...}, { upsert: true, new: true })`
  - Session writes: `userId`, possibly `leetcodeUsername` (lowercased)

- `POST /api/auth/signout` → `authController.logout`
  - DB: none (session destroy)

- `POST /api/auth/signup` → `authController.signup`
  - Writes: `User`
  - Query: `new User({ name }).save()`

- `POST /api/auth/signin` → `authController.signin`
  - Reads: `User`
  - Query: `User.findOne({ name })`

### LeetCode (`/api/leetcode/*`)

- `GET /api/leetcode/me` → `leetcodeController.me`
  - Reads: `User` (but see “Known issues / inconsistencies”)
  - Also calls external LeetCode API: `leetcode.user(username)`

- `GET /api/leetcode/user/:username` → `leetcodeController.getUser`
  - DB: none
  - External call: `leetcode.user(username)`

- `POST /api/leetcode/link-account` → `leetcodeController.linkLeetcode`
  - Reads/Writes: `User`
  - Query: `User.findById(req.session?.userId)`, then set `leetcodeUsername` + `leetcodeUsernameLower`, then `user.save()`
  - Duplicate handling: checks Mongo error code `11000` (unique constraint collisions)
  - Session write: `req.session.leetcodeUsername = user.leetcodeUsernameLower`

### Friend / Follow System (`/api/friend/*`)

- `POST /api/friend/:leetcodeUsername/follow` → `friendController.follow`
  - Reads/Writes: `Friend`
  - Queries:
    - `Friend.findOne({ leetnodeUser: sessionUserId, leetcodeUsername: target })`
    - `new Friend({ leetnodeUser: sessionUserId, leetcodeUsername: target }).save()`
  - Duplicate handling: checks Mongo error code `11000`
  - External validation: calls LeetCode API via `verifyLeetcodeUser`

- `DELETE /api/friend/:leetcodeUsername/follow` → `friendController.unfollow`
  - Reads/Writes: `Friend`
  - Queries:
    - `Friend.findOne({ leetnodeUser: sessionUserId, leetcodeUsername: target })`
    - `Friend.findOneAndDelete({ leetnodeUser: sessionUserId, leetcodeUsername: target })`

- `GET /api/friend/counts` → `friendController.getFriendCounts`
  - Reads: `Friend`
  - Queries:
    - `Friend.countDocuments({ leetcodeUsername: currentLeetcodeUsername })` (followers)
    - `Friend.countDocuments({ leetnodeUser: sessionUserId })` (following)

- `GET /api/friend/is-following/:leetcodeUsername` → `friendController.isFollowing`
  - Reads: `Friend`
  - Query: `Friend.exists({ leetnodeUser: sessionUserId, leetcodeUsername: target })`

- `GET /api/friend/followers` → `friendController.getFollowers`
  - Reads: `Friend`
  - Query: `Friend.find({ leetcodeUsername: currentLeetcodeUsername })`

- `GET /api/friend/following` → `friendController.getFollowing`
  - Reads: `Friend`
  - Query: `Friend.find({ leetnodeUser: sessionUserId })`

---

## Session Keys That Affect DB Reads/Writes

These session keys are referenced by controllers and influence how DB queries are formed:

- `userId`
  - Meaning: logged-in `User._id`
  - Set in GitHub callback (`authController.githubOAuthCallback`)
  - Read by: `authController.me`, `friendController.*`, `leetcodeController.linkLeetcode`

- `oAuthState`
  - Meaning: GitHub OAuth CSRF state value
  - Set by: `authController.startGithubOAuth`
  - Read + cleared by: `authController.githubOAuthCallback`

- `leetcodeUsername`
  - Meaning: normalized lowercase LeetCode username for the logged-in user
  - Set by: `authController.githubOAuthCallback` (if present on user), and `leetcodeController.linkLeetcode`
  - Read by: friend controllers (counts, followers list, etc.)

- `accessToken`
  - Referenced by `src/backend/middlewares/identification.js`
  - Observed: middleware checks `req.session.accessToken`, but no setter for this key was found in the inspected backend code.

---

## Known Issues / Inconsistencies Observed In Source

- `lc_problems` schema file contains a typo (`moongoose.Schema`) that would break model initialization unless corrected.
- `lc_stats_snapshot` schema file contains a typo (`types: String` instead of `type: String`) that would break schema compilation unless corrected.
- `leetcodeController.me` appears to query `User.findOne({ userId: req.session.user?.userId })`, but the `User` schema does not define a `userId` field (and other controllers use `req.session.userId` + `User.findById`), suggesting a mismatch.
- List endpoints return unbounded arrays:
  - `getFollowers`: `Friend.find(...)` with no limit/skip
  - `getFollowing`: `Friend.find(...)` with no limit/skip

---

## DB Connection + Session Config Notes (Relevant to Data Layer)

- DB connection uses `mongoose.connect(process.env.MONGO_URI)` in `src/backend/config/db.js`.
- Session config in `src/backend/config/session.js` sets:
  - `name: "sid"`
  - `cookie.maxAge` currently set to 5 minutes
  - `cookie.secure` toggled by `NODE_ENV`

---