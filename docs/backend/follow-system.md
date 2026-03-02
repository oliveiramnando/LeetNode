# Follow System

This document describes the Follow system in the LeetNode backend.

The Follow system allows authenticated LeetNode users to follow and unfollow other users by their LeetCode username. It is implemented as a directed relationship using a separate collection (`Friend`) to represent follow edges.

## Overview

- Relationship type: Directed (A follows B)
- Storage model: Edge list (separate `Friend` collection)
- Current user identification: `req.session.userId`
- Target identification: `:leetcodeUsername` route parameter (normalized to lowercase)
- Duplicate prevention: runtime check + unique compound index

## File Map

### Models

- src/backend/models/Friend.js  
- src/backend/models/User.js (referenced by ObjectId)

### Routes

- src/backend/routes/friendRoutes.js

### Controllers

- src/backend/controllers/friendController.js

### Server Registration

Routes are mounted under:

    /api/friend

## Data Model

### Friend Schema

Each document in the Friend collection represents one follow edge:

    leetnodeUser (ObjectId) → leetcodeUsername (String)

There are no status fields (no pending, blocked, requested). A follow either exists or does not exist.

### Fields

#### leetnodeUser

- Type: ObjectId (ref User)
- Required: true
- Indexed: true
- Meaning: the LeetNode user who is following someone

#### leetcodeUsername

- Type: String
- Required: true
- Indexed: true
- Normalization: trim + lowercase
- Meaning: the target LeetCode username being followed

#### createdAt, updatedAt

- Auto-generated timestamps

## Indexes

The following indexes exist in Friend.js:

- `{ leetnodeUser: 1 }`
- `{ leetcodeUsername: 1 }`
- `{ leetnodeUser: 1, leetcodeUsername: 1 }` with `unique: true`

### Index Purpose

- Fast lookup for “who I follow” using `leetnodeUser`
- Fast lookup for “who follows me” using `leetcodeUsername`
- Prevent duplicates using the unique compound index

## Endpoints

All endpoints are mounted under `/api/friend`.

### POST /api/friend/:leetcodeUsername/follow

Creates a follow relationship from the logged-in user to the target LeetCode username.

#### Auth Requirements

- Requires `req.session.userId`
- Uses `req.session.leetcodeUsername` for self-follow prevention

#### Route Parameters

- `leetcodeUsername` (string)
- Normalized: trim + lowercase

#### Success Response (200)

Returns:

- `success: true`
- `message: Successfully followed user`
- `follow`: created Friend document

#### Error Responses

- 400: Leetcode username not provided
- 401: Not logged in
- 400: Cannot follow yourself
- 400: Already following user (pre-check)
- 404: LeetCode user not found
- 503: LeetCode verification unavailable. Try again.
- 409: Already following user (duplicate key race condition)
- 500: Internal server error

### DELETE /api/friend/:leetcodeUsername/follow

Deletes a follow relationship between the logged-in user and the target LeetCode username.

#### Auth Requirements

- Requires `req.session.userId`

#### Route Parameters

- `leetcodeUsername` (string)
- Normalized: trim + lowercase

#### Success Response (200)

Returns:

- `success: true`
- `message: Successfully unfollowed user`
- `unfollow`: deleted Friend document

#### Error Responses

- 400: Leetcode username not provided
- 401: Not logged in
- 400: Cannot unfollow yourself
- 400: You are not following this user
- 500: Internal server error

### GET /api/friend/counts

Returns follower and following counts for the logged-in user.

#### Auth Requirements

- Requires `req.session.userId`
- Requires `req.session.leetcodeUsername`

#### Success Response (200)

Returns:

- `success: true`
- `counts`:
  - `followerCount`
  - `followingCount`

Counts are computed dynamically using `countDocuments`.

#### Error Responses

- 401: Please log in to view friend counts
- 400: Please link your leetcode-account to view friend counts
- 500: Internal server error

### GET /api/friend/is-following/:leetcodeUsername

Checks whether the logged-in user is following the given LeetCode username.

#### Auth Requirements

- Requires `req.session.userId`

#### Success Response (200)

Returns:

- `isFollowing: true` or `false`

#### Error Responses

- 400: Please provide a leetcode username
- 401: Please log in to view isFollowing
- 500: Internal server error

### GET /api/friend/followers

Returns the list of follow edges representing who follows the logged-in user.

#### Auth Requirements

- Requires `req.session.userId`
- Requires `req.session.leetcodeUsername`

#### Logic

Finds Friend documents where:

    leetcodeUsername === current user's lowercase username

Returns an array of Friend documents.

No pagination implemented.

### GET /api/friend/following

Returns the list of follow edges representing who the logged-in user follows.

#### Auth Requirements

- Requires `req.session.userId`

#### Logic

Finds Friend documents where:

    leetnodeUser === current userId

Returns an array of Friend documents.

No pagination implemented.

## Business Logic Summary

### Follow Flow

1. Normalize target username (trim + lowercase)
2. Validate session `userId`
3. Prevent self-follow
4. Check duplicate edge
5. Verify LeetCode username exists
6. Insert Friend document
7. Handle duplicate key race condition (11000)

### Unfollow Flow

1. Normalize target username
2. Validate session
3. Prevent self-unfollow
4. Ensure follow edge exists
5. Delete Friend document

### Counts

- followerCount: `countDocuments({ leetcodeUsername: currentUserLc })`
- followingCount: `countDocuments({ leetnodeUser: currentUserId })`

## Pagination and Sorting

- No pagination
- No limit/skip
- No explicit sorting
- MongoDB default insertion order

## Known Limitations

- No blocking system
- No follow request states
- No mutual follow detection
- No rate limiting
- No pagination on lists
- No denormalized follower counts stored on User