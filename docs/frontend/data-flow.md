# Frontend Data Flow

This document describes **how data moves through the LeetNode frontend**, including:
- where requests originate (Server Component vs Client Component)
- which endpoints are called (frontend API routes vs backend)
- how responses are normalized/derived
- where state lives
- how errors/caching behave

---

## High-Level Pipelines

### Profile Page Data Flow (Viewing any profile)

1. User navigates to:
   - `/profile/[username]`

2. The profile page is a **Server Component**:
   - `src/frontend/src/app/profile/[username]/page.tsx`

3. Server-side data fetch:
   - `getProfile(username)` calls the **frontend** API proxy:
     - `${APP_ORIGIN}/api/leetcode/user/${encodeURIComponent(username)}`
   - Fetch uses:
     - `cache: "no-store"`

4. Frontend API proxy route:
   - `src/frontend/src/app/api/leetcode/user/[username]/route.ts`
   - Forwards to backend:
     - `${BACKEND_URL}/api/leetcode/user/${encodeURIComponent(username)}`
   - Fetch uses:
     - `cache: "no-store"`
   - Proxy returns JSON to the profile page.

5. Server-side normalization:
   - `normalizeBackendLeetCodeUser()` in `src/frontend/src/lib/normalize.ts`
   - Handles payload shape variations and ensures required fields exist.
   - Normalizes badge icon URLs (e.g., prefixing `https://leetcode.com` for relative icons).

6. Server-side derivation:
   - `deriveSolvedOverview(allQuestionsCount, submitStats)` → solved metrics
   - `deriveYearHeatmap(submissionCalendar, now, weeks=52)` → heatmap grid

7. Render composition (props-driven):
   - `ProfileHeader` ← raw `matchedUser`
   - `SolvedOverviewCard` ← derived solved metrics
   - `BadgesSection` ← raw badges/upcoming badges/active badge id
   - `SubmissionHeatmap` ← derived heatmap grid (**Client Component**)
   - `AttemptsInsights` ← raw recent submissions (insights derived inside lib)
   - `RecentSubmissionsTable` ← raw recent submissions (**Client Component**)
   - `ProfileSocialActions` ← username only (**Client Component**, fetches follow data)

---

### Auth Data Flow

1. Global auth state is managed by:
   - `src/frontend/src/components/auth/AuthProvider.tsx` (**Client Component**)

2. On mount, AuthProvider calls `refresh()`:
   - `GET ${NEXT_PUBLIC_BACKEND_URL}/api/auth/me`
   - Uses:
     - `credentials: "include"`
     - `cache: "no-store"`

3. Backend responds with either:
   - `{ loggedIn: false }`
   - `{ loggedIn: true, user: { ... } }`

4. AuthProvider normalizes with `normalizeMe()` (in AuthProvider):
   - Supports slightly different response shapes.
   - Stores:
     - `loading`, `loggedIn`, `user`

5. Components consume auth state via `useAuth()`:
   - `Navbar.jsx`
   - `ProfileSocialActions.tsx`
   - `link-account/page.tsx`

6. Logout flow (Navbar):
   - `POST ${NEXT_PUBLIC_BACKEND_URL}/api/auth/signout`
   - Uses `credentials: "include"`
   - UI updates immediately via `signOutLocal()` (optimistic)
   - Navigates: `router.push("/")` and `router.refresh()`

---

### Follow System Data Flow

#### Viewing someone else’s profile

1. `ProfileSocialActions.tsx` mounts (**Client Component**)
2. Computes:
   - `target = normalizeLc(profileUsername)`
   - `isMyProfile = normalizeLc(user?.leetcodeUsernameLower || user?.leetcodeUsername) === target`

3. If NOT your profile:
   - Fetch follow state:
     - `GET ${NEXT_PUBLIC_BACKEND_URL}/api/friend/is-following/${target}`
     - Uses `credentials: "include"` and `cache: "no-store"`
   - Response: `{ isFollowing: boolean }`
   - Sets local state: `isFollowing`

4. Toggle follow:
   - If `isFollowing === false`:
     - `POST ${NEXT_PUBLIC_BACKEND_URL}/api/friend/${target}/follow`
   - If `isFollowing === true`:
     - `DELETE ${NEXT_PUBLIC_BACKEND_URL}/api/friend/${target}/follow`
   - Uses `credentials: "include"` and `cache: "no-store"`
   - On success: toggles local `isFollowing`
   - On error: shows message under the action pill

#### Viewing your own profile

1. `ProfileSocialActions` detects `isMyProfile === true`
2. Fetch counts eagerly:
   - `GET ${NEXT_PUBLIC_BACKEND_URL}/api/friend/counts`
   - Uses `credentials: "include"` and `cache: "no-store"`
   - Response:
     - `{ success: true, counts: { followerCount, followingCount } }`

3. Lazy-load lists when modal opens (only once per mount):
   - `GET ${NEXT_PUBLIC_BACKEND_URL}/api/friend/followers`
   - `GET ${NEXT_PUBLIC_BACKEND_URL}/api/friend/following`
   - Uses `credentials: "include"` and `cache: "no-store"`
   - Lists persist in component state (no refetch on reopen during same mount)

---

### Submission Filtering Flow (Client-side)

Component:
- `src/frontend/src/components/profile/RecentSubmissionsTable.tsx` (**Client Component**)

Flow:
1. Receives `submissions: RecentSubmission[]` as props (already fetched server-side)
2. Takes top 15:
   - `top15 = submissions.slice(0, 15)`
3. Derives available languages:
   - `languages = useMemo(() => listLanguages(top15), [top15])`
4. Filters are stored in local state:
   - `{ status: "All"|..., lang: "All"|... }`
5. Derives filtered list:
   - `filtered = useMemo(() => filterSubmissions(top15, filters), [top15, filters])`
6. Renders:
   - filtered table
   - empty UI when no matches

---

### Heatmap Derivation Flow (Server-side)

1. Server page calls:
   - `deriveYearHeatmap(matchedUser.submissionCalendar, new Date(), 52)`

2. Calendar parsing:
   - JSON string → map of `unixSeconds -> submissionCount`

3. Grid build:
   - 7 rows (Sun–Sat) × 52 weeks
   - each cell includes:
     - date/iso
     - count
     - level (0–4)
     - isFuture

4. Rendering:
   - `SubmissionHeatmap.tsx` uses the derived grid for tooltip + cell styling

---

## Server vs Client Boundaries

### Server Responsibilities
- Fetch profile payload once per request
- Normalize backend payload shape
- Compute deterministic derived data:
  - solved overview metrics
  - heatmap grid

Why:
- Less client JS/hydration work
- Derivations are pure and can be computed before rendering

### Client Responsibilities
- Auth status (session-cookie dependent per browser)
- Follow system interactions (requires credentials)
- UI-only derivations (filters, selections, modal state)

Why:
- Depends on current session/user
- Requires event handlers and local state

---

## Internal API Proxy Pattern

### What is proxied
- LeetCode user fetch:
  - Frontend calls: `/api/leetcode/user/[username]`
  - Proxy calls backend: `/api/leetcode/user/:username`

### Why this exists
- Keeps backend URL private in server context (`BACKEND_URL`)
- Provides a stable internal fetch surface for Server Components
- Allows centralized error mapping for profile fetch

### Env variables involved
- `APP_ORIGIN` (server page uses this to call internal API route)
- `BACKEND_URL` (used only inside the frontend API route)
- `NEXT_PUBLIC_BACKEND_URL` (used by client components to call backend directly)

---

## Normalize → Derive → Render Pattern

### Normalize
- `normalizeBackendLeetCodeUser(input)`
  - ensures required fields exist (`matchedUser`, `allQuestionsCount`)
  - defaults `recentSubmissionList` to `[]` if missing
  - normalizes badge icon URLs

### Derive (server)
- `deriveSolvedOverview(allQuestionsCount, submitStats)`
- `deriveYearHeatmap(submissionCalendar, now, weeks)`

### Derive (client)
- `listLanguages(top15)`
- `filterSubmissions(top15, filters)`
- (Attempts insights are derived via utilities; the page passes `recentSubmissionList` down)

### Render
- Server components receive precomputed props
- Client components use props + local state to render interactive UI

---

## Auth Data Flow Details

### When `/api/auth/me` is called
- AuthProvider calls it once on mount via `useEffect`
- Additional refresh can be triggered manually (e.g., after link-account)

### Where cookies are included
- All auth + friend requests from client use:
  - `credentials: "include"`

### Logout propagation
- Backend call fires
- `signOutLocal()` immediately clears UI auth state
- `router.push("/")` and `router.refresh()` are executed regardless of request outcome

---

## Error Propagation

### Profile load failures
- If the proxy returns non-OK:
  - server page returns `null`
  - profile page renders `<EmptyState />`

### Normalization failures
- If payload is missing required fields:
  - normalizer returns `null`
  - page renders `<EmptyState />`

### FriendSearch failures
- Displays an inline error message on non-OK or network error

### Follow failures
- Shows an inline error near the follow/unfollow UI
- Some background fetch failures (counts/lists) fall back silently to empty UI states

---

## Caching Strategy

### Network caching
- Most fetches intentionally disable caching:
  - `cache: "no-store"` used on:
    - profile fetch (server page)
    - frontend proxy to backend
    - auth/me
    - friend endpoints
    - auth/signout

### In-memory caching
- Client components use `useMemo` for small derivations (filters, normalization helpers)
- Follow lists are cached per mount (`loadedListsOnce` prevents refetch on modal reopen)

### Not found in codebase
- ISR / revalidation strategy
- SWR/React Query caching
- polling/websocket updates

---

## Performance Implications

### Extra hop for profile fetching
- Profile page uses:
  - Server Component → internal API route → backend → LeetCode
- Adds one proxy layer, but keeps backend URL private

### No caching means repeat visits are expensive
- Every profile view triggers backend fetch (and likely an external LeetCode fetch downstream)
- Good for freshness, worse for latency

### Good: lazy loading follower/following lists
- Lists are only fetched when the modal opens
- Lists are fetched in parallel (`Promise.all`)

### Potential inefficiencies
- Recent submissions table slices to 15 but receives the full array (if backend returns more)
- Counts/list failures can degrade silently into “empty” UX, masking backend issues