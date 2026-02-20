# Backend Overview

## Purpose
The LeetNode backend powers user-facing features like profile lookup, friend/follow functionality, and data retrieval from LeetCode-related sources. It exposes a small set of HTTP APIs used by the Next.js frontend and is designed to be extended as more data sources and features are added.

## High-Level Architecture
**Clients:** Next.js frontend  
**Backend:** Node.js (Express) API  
**Database:** MongoDB (users, relationships, cached lookups, etc.)  
**External Services:** LeetCode data (public profile lookups via backend endpoint(s))

Request flow:
1. Client calls an API route (e.g., `/api/...`)
2. Route validates input and auth (if required)
3. Controller calls a service layer function
4. Service reads/writes MongoDB and/or fetches external data
5. Response is normalized and returned to the client

## Responsibilities
- Provide stable API contracts for the frontend
- Encapsulate business logic in services (not in routes)
- Persist user data and relationships in MongoDB
- Support pagination and predictable response formats
- Handle errors consistently (status codes + error bodies)

## Code Structure
- `routes/` — HTTP route definitions
- `controllers/` — request/response glue (thin)
- `models/` — MongoDB schemas/models
- `lib/` — shared utilities (validation, http client, formatting)
- `middlewares/` — auth, rate limiting, error handler
- `config/` — environment + configuration

## Current Features
- **LeetCode user lookup:** fetch and return normalized profile data
- **Follow system (planned/partial):** represent follow relationships and counts
- **Pagination:** offset-based (limit/offset) for lists (e.g., followers, submissions cache)
- **Error model:** consistent JSON errors for client consumption

## API Summary
Core routes (examples):
- `GET /api/leetcode/user/:username` — fetch LeetCode user profile (public)
- `GET /api/leetcode/me` — fetch LeetNode user record (future)

Full details: see [`api-spec.md`](./api-spec.md)

## Data Model Summary
MongoDB stores:
- `users` — LeetNode users (GitHub details, Leetcode username)

More details: see [`../db/schema-overview.md`](../db/schema-overview.md)

## Error Handling
Errors are returned as JSON with a consistent shape:
- `message`
- `details` (optional)

Examples:
- `400` invalid input
- `404` user not found
- `429` rate limited
- `500` unexpected server error

## Local Development
### Requirements
- Node.js
- MongoDB (local or Docker)

### Environment Variables
Create a `.env` file:
- `PORT=...`
- `NODE_ENV=...`
- `MONGODB_URI=...`
- `GITHUB_CLIENT_ID=...`
- `GITHUB_CLIENT_SECRET=...`
- `REREDIRECT_URI=...`
- `FRONTEND_URL=...`
- `SESSION_SECRET=...`

### Run
- Install dependencies: `npm install`
- Start dev server: `npm run dev`

## Design Decisions
- **Service layer over “fat routes”:** keeps logic testable and reusable
- **Normalized responses:** frontend shouldn’t depend on raw third-party shapes
- **Clear separation of concerns:** routes/controllers/services/models reduce coupling
- **Pagination strategy:** predictable for lists; can migrate to cursor pagination later if needed

## Roadmap
- Implement lookup of leetcode username based on GitHub url
- Implement follow system end-to-end (DB model + routes + UI)
- Start data processing on leetcode submission