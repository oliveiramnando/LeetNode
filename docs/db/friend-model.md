# db/friend-model.md

## Source of Truth

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

---

## Schema

- Source file: Friend.js

- Fields exactly as implemented:

  - leetnodeUser
    - type: mongoose.Schema.Types.ObjectId
    - ref: 'User'
    - required: true
    - inline index: index: true

  - leetcodeUsername
    - type: String
    - required: true
    - trim: true
    - lowercase: true (Mongoose lowercases on save)
    - inline index: index: true

- Schema options:
  - timestamps: true — documents include createdAt and updatedAt.

- Collection name:
  - Model defined as mongoose.model('Friend', FriendSchema)
  - Mongoose uses default pluralized collection name: friends

---

## Indexes & Constraints

- Inline per-field index flags (from schema):
  - leetnodeUser has index: true
  - leetcodeUsername has index: true

- Explicit schema indexes (exact declarations):
  - FriendSchema.index({ leetnodeUser: 1 });
  - FriendSchema.index({ leetcodeUsername: 1 });
  - FriendSchema.index({ leetnodeUser: 1, leetcodeUsername: 1 }, { unique: true });

- Uniqueness and sparse options:
  - Compound unique index on { leetnodeUser: 1, leetcodeUsername: 1 } enforces:
    A given leetnodeUser cannot follow the same leetcodeUsername more than once.
  - No sparse option on Friend indexes.

- Duplicate scenarios & Mongo behavior:
  - Inserting a second document with the same (leetnodeUser, leetcodeUsername) fails with E11000 duplicate key error.
  - The follow controller handles error.code === 11000 by returning HTTP 409.
  - Case-only duplicates are prevented because:
    - the controller normalizes to toLowerCase()
    - the schema has lowercase: true on leetcodeUsername

---

## Relationships

- What a Friend document represents:
  - One Friend document represents:
    A LeetNode user (actor) follows a LeetCode username (target).

- Directionality / meaning of fields:
  - leetnodeUser = actor (logged-in LeetNode user’s User._id)
  - leetcodeUsername = target (followed LeetCode username, stored lowercase)

- Normalization rules:

  - Storage-level normalization:
    - leetcodeUsername is trimmed and lowercased automatically by Mongoose (trim: true, lowercase: true).

  - Controller-level normalization:
    - Incoming route param is normalized using:
      String(leetcodeUsername).trim().toLowerCase()

  - Session-level normalization:
    - The user’s own linked LeetCode username is stored in session as:
      req.session.leetcodeUsername
    - It is lowercased and set by link-account flow and sometimes during OAuth callback.

---

## Query Patterns by Endpoint

Files scanned:
- friendController.js
- friendRoutes.js
- server.js
- User.js (relationship context)

No usage of .populate() is present in friendController.js.  
All reads return raw Friend documents.

---

### 1) POST /api/friend/:leetcodeUsername/follow

- Route:
  router.post('/:leetcodeUsername/follow', follow)

- Controller: follow

Queries:

- Existence check:
  Friend.findOne({ leetnodeUser: currentUserId, leetcodeUsername: target })

- Insert:
  const follow = new Friend({ leetnodeUser: currentUserId, leetcodeUsername: target })
  await follow.save()

Notes:
- No .lean(), no projections, no sorting, no pagination.
- target is normalized (trim().toLowerCase()) before queries.

---

### 2) DELETE /api/friend/:leetcodeUsername/follow

- Route:
  router.delete('/:leetcodeUsername/follow', unfollow)

- Controller: unfollow

Queries:

- Existence check:
  Friend.findOne({ leetnodeUser: currentUserId, leetcodeUsername: target })

- Delete:
  Friend.findOneAndDelete({ leetnodeUser: currentUserId, leetcodeUsername: target })

Notes:
- No .lean(), no projections, no sorting, no pagination.

---

### 3) GET /api/friend/counts

- Route:
  router.get('/counts', getFriendCounts)

- Controller: getFriendCounts

Queries (parallel):

- Followers count (how many people follow me):
  Friend.countDocuments({ leetcodeUsername: lc })

- Following count (how many I follow):
  Friend.countDocuments({ leetnodeUser: currentUserId })

Notes:
- lc is derived from req.session.leetcodeUsername.

---

### 4) GET /api/friend/is-following/:leetcodeUsername

- Route:
  router.get('/is-following/:leetcodeUsername', isFollowing)

- Controller: isFollowing

Queries:

- Friend.exists({ leetnodeUser: currentUserId, leetcodeUsername: target })

Notes:
- Returns boolean-only payload shape.
- target is normalized before query.

---

### 5) GET /api/friend/followers

- Route:
  router.get('/followers', getFollowers)

- Controller: getFollowers

Queries:

- Friend.find({ leetcodeUsername: currentLeetcodeUsername })

Notes:
- No .sort(), .limit(), .skip(), .lean().
- Returns all Friend docs for the linked username.

---

### 6) GET /api/friend/following

- Route:
  router.get('/following', getFollowing)

- Controller: getFollowing

Queries:

- Friend.find({ leetnodeUser: currentUserId })

Notes:
- No .sort(), .limit(), .skip(), .lean().

---

## Session Coupling

Friend endpoints depend on session-based auth and on whether the user has linked a LeetCode account.

- Session keys used in friendController.js:
  - req.session.userId
  - req.session.leetcodeUsername

- req.session.userId:
  - Identifies acting user (leetnodeUser)
  - Set during GitHub OAuth callback in authController.js

- req.session.leetcodeUsername:
  - Used for:
    - self-follow prevention
    - follower counts
    - follower list queries
  - Set during LeetCode link flow in leetcodeController.js:
    req.session.leetcodeUsername = user.leetcodeUsernameLower
  - Sometimes also set during OAuth callback if DB user already has linked leetcodeUsernameLower.

- Behavior when keys are missing:

  - Missing userId:
    - HTTP 401 with { success: false, message: ... }

  - Missing leetcodeUsername:
    - /counts → HTTP 400
    - /followers → HTTP 401

  - Missing route param for isFollowing:
    - HTTP 400

---

## Error / Response Contracts

Routes mounted at /api/friend.

---

### POST /:leetcodeUsername/follow

Success:
- HTTP 200
- { success: true, message: "Successfully followed user", follow }

Failure cases:
- 400 Leetcode username not provided
- 401 Not logged in
- 400 Cannot follow yourself
- 400 Already following user (pre-check)
- 404 LeetCode user not found
- 503 LeetCode verification unavailable
- 409 Duplicate key (E11000)
- 500 { message: error.message }

---

### DELETE /:leetcodeUsername/follow

Success:
- HTTP 200
- { success: true, message: "Successfully unfollowed user", unfollow }

Failure cases:
- 400 Username not provided
- 401 Not logged in
- 400 Cannot unfollow yourself
- 400 Not following
- 500 { message: error.message }

---

### GET /counts

Success:
- HTTP 200
- { success: true, counts: { followerCount, followingCount } }

Failure:
- 401 Not logged in
- 400 Not linked
- 500 { message: error.message }

---

### GET /is-following/:leetcodeUsername

Success:
- HTTP 200
- { isFollowing: true|false }

Failure:
- 400 Username missing
- 401 Not logged in
- 500 { message: error.message }

---

### GET /followers

Success:
- HTTP 200
- { success: true, message: "User Followers", followers }

Failure:
- 401 Not logged in
- 401 Not linked
- 500 { message: error.message }

---

### GET /following

Success:
- HTTP 200
- { success: true, message: "User Following", following }

Failure:
- 401 Not logged in
- 500 { message: error.message }

---

## Example Documents

Example Friend document:

{
  _id: ObjectId("..."),
  leetnodeUser: ObjectId("..."),
  leetcodeUsername: "someuser",
  createdAt: "2026-03-02T12:00:00.000Z",
  updatedAt: "2026-03-02T12:00:00.000Z",
  __v: 0
}

Example normalization:

Input:
- leetnodeUser = ObjectId("60a...123")
- target = "LeetMaster"

Stored:

{
  _id: ObjectId("60f...abc"),
  leetnodeUser: ObjectId("60a...123"),
  leetcodeUsername: "leetmaster",
  createdAt: "...",
  updatedAt: "...",
  __v: 0
}

---

## Known Issues / Missing

- No pagination or sorting on /followers and /following.
- Race condition window in follow (pre-check + save); uniqueness enforced by compound index.
- Response shape inconsistencies across endpoints.
- Some 500 responses lack success flag.
- Strong coupling to correct session normalization.
- No populate() usage.
- No caching of LeetCode verification.
- identification middleware exists but not applied to friend routes.