# Frontend Architecture

This document describes the architecture of the LeetNode frontend: framework/runtime, folder structure, routing, rendering model (Server vs Client Components), data flow, state management, auth handling, UI system, and known limitations.

---

## Framework and Runtime

- Framework: Next.js 16.1.6 (App Router)
- React: 19.2.3
- TypeScript: 5.9.3 (`strict: false`)
- Language mix:
  - TypeScript for most components and logic (`.ts`, `.tsx`)
  - JavaScript for some pages/components (`.js`, `.jsx`)
- Path alias:
  - `@/*` is configured (tsconfig + jsconfig) and used for imports
- Rendering strategy:
  - Mixed Server Components + Client Components
  - Root layout and most page shells are Server Components
  - Interactivity and auth/session-driven UI are implemented as Client Components
- API routes:
  - One App Router API route present for proxying backend LeetCode profile requests:
    - `/api/leetcode/user/[username]` (Next route handler)

---

## Project Structure

High-level directory layout under `src/frontend/src/`:

- app/
  - App Router pages, layouts, and route handlers
  - Includes root layout, home page, dynamic profile page, and proxy API route
- components/
  - Reusable UI components and feature components
  - auth/ holds AuthProvider (context)
  - profile/ holds profile page subcomponents
  - ui/ holds design system primitives
- lib/
  - Pure utilities and derivation logic (normalize, derive, date, auth utilities)
- types/
  - Domain type definitions (LeetCode payloads, submissions, badges, etc.)
- styles/
  - Present but empty (no custom CSS beyond Tailwind)
- globals.css
  - Tailwind import and global styles

Notable folders under app/:
- app/layout.js (root layout)
- app/page.js (home page)
- app/profile/[username]/page.tsx (dynamic profile page)
- app/api/leetcode/user/[username]/route.ts (proxy to backend)
- app/auth/callback/ (exists; content not fully inspected)
- app/link-account/ (exists; content not inspected)

---

## Routing Architecture

### Static Routes

- `/` (home)
- `/auth/callback/` (OAuth callback handler route exists)

### Dynamic Routes

- `/profile/[username]` (profile page; `username` is a route param)

### Layout Hierarchy

- `app/layout.js` wraps the entire application
  - Provides global structure
  - Wraps the app with `<AuthProvider>`
  - Renders `<Navbar />` across all pages
  - Renders the current route content inside `<main>`

---

## Rendering Model

The frontend uses a deliberate split between Server Components (for data fetching and static composition) and Client Components (for interactivity and auth/session-driven UI).

### Server Components (no "use client")

Commonly Server Components include:
- Root layout: `app/layout.js`
- Home page: `app/page.js`
- Profile page: `app/profile/[username]/page.tsx` (async Server Component with server-side fetching)
- Presentational UI primitives in `components/ui/` that do not require browser APIs
- Pure display profile sections such as ProfileHeader and SolvedOverviewCard (presentational composition)

### Client Components ("use client")

Client components are used for:
- Auth session state and React context:
  - `components/auth/AuthProvider.tsx`
- Navigation and interactive UI:
  - `components/Navbar.jsx`
  - `components/ProfileButton.jsx`
  - `components/FriendSearch.jsx`
- Profile interactivity:
  - `components/profile/ProfileSocialActions.tsx` (follow/unfollow + lists modal)
  - `components/profile/RecentSubmissionsTable.tsx` (filtering)
  - `components/profile/SubmissionHeatmap.tsx` (hover behavior)
- DOM-dependent UI:
  - `components/ui/Tooltip.tsx`
  - `components/ui/Tabs.tsx`

### Why this split

- Server Components:
  - Keep initial page loads lighter (less hydration)
  - Perform data fetching before render
  - Compute derived metrics server-side where possible
- Client Components:
  - Handle events, state, DOM measurements, portals/modals, and auth-driven UI updates

---

## Data Flow

### Auth Data Flow

1. `AuthProvider.tsx` runs on the client
2. On mount, it calls the backend `GET /api/auth/me` with `credentials: "include"`
3. Response is normalized to handle shape variance (e.g., `{ loggedIn, user }` vs other shapes)
4. Auth context state is set:
   - `loading`
   - `loggedIn`
   - `user`
   - `refresh()`
   - `signOutLocal()`
5. Components (Navbar, ProfileSocialActions, etc.) consume auth state via `useAuth()`

### Profile Data Flow

Profile page is server-rendered and does server-side data fetching:

1. `app/profile/[username]/page.tsx` calls `getProfile(username)` (server-side)
2. It fetches from the internal Next API route:
   - `${APP_ORIGIN}/api/leetcode/user/[username]`
3. The Next route handler proxies to backend:
   - `${BACKEND_URL}/api/leetcode/user/[username]`
4. The payload is normalized in `lib/normalize.ts`:
   - Handles flexible backend response shapes
   - Normalizes badge icon URLs (relative to absolute)
5. Derived metrics are computed server-side using `lib/derive.ts`, e.g.:
   - solved overview metrics
   - submission heatmap grid
6. Derived props are passed into profile subcomponents

### Friend Search Flow (client)

1. User submits a username in `FriendSearch.jsx`
2. Client fetches the internal API route `/api/leetcode/user/${username}`
3. If successful, routes to `/profile/${username}`
4. If not, displays inline error state

### Follow/Unfollow Flow (client)

1. `ProfileSocialActions.tsx` calls backend friend endpoints (session cookie required)
2. Uses `credentials: "include"` for session-authenticated requests
3. Updates local state for:
   - isFollowing
   - follower/following counts
   - follower/following lists
   - modal open state and current tab

---

## State Management

### Global State

- Auth is the only global state implemented:
  - React Context via `AuthProvider.tsx`
  - Accessed via `useAuth()` hook
- No global state libraries detected (no Redux/Zustand/Jotai/etc.)

### Local Component State

Implemented using `useState`, `useEffect`, and `useMemo` patterns:

- Navbar:
  - reads AuthProvider state for conditional rendering
- FriendSearch:
  - tracks query input and error/loading state
- RecentSubmissionsTable:
  - tracks filter state (status/language)
  - uses memoized filtering
- ProfileSocialActions:
  - manages follow status, lists, counts, modal + tab state
- Tooltip/Tabs:
  - local UI state for interactions and DOM positioning

---

## Authentication Handling

### Login Flow

- Home page links to backend OAuth start route:
  - `${NEXT_PUBLIC_BACKEND_URL}/api/auth/github/start`
- Backend redirects back to frontend route after OAuth:
  - `/link-account` or `/profile/[username]` depending on link state
- Frontend determines logged-in state by calling:
  - `GET /api/auth/me` (via AuthProvider) with `credentials: "include"`

### Auth-Gated UI

- Navbar conditionally renders:
  - Login/Signup actions if not logged in
  - Username + logout if logged in
- Some components render only when logged in (e.g., FriendSearch)

### Logout Flow

- Navbar calls backend:
  - `POST /api/auth/signout` with `credentials: "include"`
- Then calls `signOutLocal()` for immediate UI update
- Uses router navigation to return to home and/or refresh server-rendered state

---

## UI System and Styling

### Tailwind CSS

- Tailwind CSS is used throughout
- `globals.css` imports Tailwind (Tailwind v4 style import)
- No additional custom stylesheets are used (styles folder exists but empty)

### Design System Primitives (components/ui)

- Card: card container + header/content composition
- Pill: tone variants for status labels (success/warning/danger/info/neutral)
- ProgressBar: visual progress meter used for difficulty breakdown
- SectionHeader: standard section title/subtitle layout
- Tooltip: client-side tooltip with positioning logic
- Tabs: client-side tab switcher UI

### Layout Patterns

- Responsive grid layouts on profile pages (single column on mobile, multi-column on larger screens)
- Consistent spacing, borders, and background transparency for a dark-themed UI
- next/image used for external images; next.config allows LeetCode domains

---

## Type System

- TypeScript is used broadly, but with `strict: false`
- Domain types are defined in `types/leetnode.ts`
  - Includes payload types for:
    - matched user profile
    - solved stats
    - badges
    - recent submissions
- Utilities in `lib/` output typed derived objects consumed by components

---

## Environment and Configuration

### Environment Variables

- `NEXT_PUBLIC_BACKEND_URL`
  - Public client-side base URL for backend requests
  - Fallbacks to localhost values appear in multiple files
- `BACKEND_URL`
  - Used server-side in Next route handler to proxy requests
- `APP_ORIGIN`
  - Used in server component profile page to call internal API route

### Config Files

- next.config.mjs
  - remote image domains enabled for LeetCode asset hosts
- tsconfig.json + jsconfig.json
  - path alias configuration for `@/*`

No `.env*` files were found in the repo snapshot (local env likely gitignored or set by deployment).

---

## Architectural Patterns

- Server-first data loading for profile pages (async Server Components)
- Proxy API route pattern:
  - Frontend API route proxies to backend to keep private backend URL server-side
- Normalize → derive → render pipeline:
  - normalize backend payload shape in `lib/normalize.ts`
  - compute derived metrics in `lib/derive.ts`
  - pass clean props into presentational components
- Auth as a single global context:
  - avoids prop drilling and standardizes auth checks across UI
- Portals for layered UI:
  - Tooltip and modal-style UI use client-side DOM capabilities to avoid layout clipping

---

## Known Limitations and Missing Pieces

- No global error boundary observed for render-time failures
- Limited loading UX on server-fetched pages (no skeleton/loading patterns detected)
- No pagination patterns for large datasets (filters are client-side; lists can grow)
- No caching strategy on profile fetch (profile page uses no-store to avoid stale data)
- Mixed JS and TS file types may lead to inconsistent typing and linting coverage
- No explicit theme toggle (dark theme appears default, no user switch)
- Some routes exist but were not fully inspected in this source of truth:
  - `/auth/callback`
  - `/link-account`