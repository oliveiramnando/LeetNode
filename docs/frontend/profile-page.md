# Profile Page

This document describes the frontend profile page route (`/profile/[username]`): how it fetches data, normalizes and derives metrics, composes UI sections, and where interactivity (follow system, filters, tooltips) lives.

---

## Route and Page Classification

- **Route:** `/profile/[username]`
- **Entry file:** `src/frontend/src/app/profile/[username]/page.tsx`
- **Component type:** **Server Component**
  - Not marked with `"use client"`
  - Implemented as an **async** function
  - Performs server-side `fetch()` + normalization + derivations, then passes props to subcomponents

- **Dynamic params:** Uses `await params` (Next.js dynamic params are treated as a Promise in the current implementation)

---

## Data Fetching Flow

### 1) Environment / Base URLs

- `APP_ORIGIN` (frontend origin)
  - Used by the profile page for internal fetch calls
  - Default: `http://localhost:3000`

- `BACKEND_URL` (backend origin)
  - Used only by the internal API route proxy
  - Default: `http://localhost:8080`

### 2) Step-by-step request path

1. **Profile page (Server Component)** calls:

   - `GET ${APP_ORIGIN}/api/leetcode/user/${encodeURIComponent(username)}`
   - Fetch config includes: `cache: "no-store"`

2. **Internal API Route Proxy** (`src/frontend/src/app/api/leetcode/user/[username]/route.ts`) forwards to backend:

   - `GET ${BACKEND_URL}/api/leetcode/user/${encodeURIComponent(username)}`
   - Also uses: `cache: "no-store"`

### 3) Cache behavior

- Both fetches use `cache: "no-store"`
- Result: **Every profile page load hits the backend** (no Next.js caching / ISR)

### 4) Failure behavior

- If the profile route does not receive a valid `username` param:
  - Renders `EmptyState` with:
    - title: `"Missing username"`

- If the fetch returns a non-OK response or normalization fails:
  - `getProfile()` returns `null`
  - Page renders `EmptyState` with:
    - title: `"Profile unavailable"`
    - description indicating backend payload is missing required fields

- There is **no global error boundary**; failures fall back to `EmptyState`.

---

## Data Normalization

### `normalizeBackendLeetCodeUser(input)` (lib/normalize.ts)

Purpose: make the UI resilient to payload shape differences and normalize badge icon URLs.

Key protections:

- Accepts both shapes:
  - Raw: `{ allQuestionsCount, matchedUser, recentSubmissionList }`
  - Wrapped: `{ user: { allQuestionsCount, matchedUser, recentSubmissionList } }`

- Validates required fields:
  - Requires `matchedUser` and `allQuestionsCount`
  - Returns `null` if missing

- Ensures `recentSubmissionList` is always an array:
  - Missing / invalid → replaced with `[]`

- Normalizes badge icon URLs:
  - Absolute (`http/https`) → unchanged
  - Relative starting with `/` → prepends `https://leetcode.com`
  - Other formats → passed through

Return type:

- `LeetNodeUserPayload | null`

---

## Data Derivation

All major derivations occur **server-side** in the profile page before rendering.

### 1) `deriveSolvedOverview(allQuestionsCount, submitStats)` (lib/derive.ts)

Computes `SolvedOverviewMetrics` including:

- Solved counts:
  - `solvedAll`, `solvedEasy`, `solvedMedium`, `solvedHard`
- Totals:
  - `totalAll`, `totalEasy`, `totalMedium`, `totalHard`
- Percentages:
  - `coveragePct` (solved / total)
  - `acceptancePct` (accepted submissions / total submissions)
- Per-difficulty progress data used by progress bars

### 2) `deriveYearHeatmap(submissionCalendar, now, weeks)` (lib/derive.ts)

Converts LeetCode’s `submissionCalendar` JSON string into a GitHub-style heatmap grid.

Outputs `HeatmapGrid` including:

- `weeks` (default 52)
- `cells`: 2D grid [dayOfWeek][weekIndex]
- Per cell:
  - `date`, `iso`, `count`, `level (0-4)`, `isFuture`
- Range metadata:
  - `maxCount`, `startDate`, `endDate`

Heatmap activity level mapping:

- 0: 0
- 1: 1–2
- 2: 3–5
- 3: 6–9
- 4: 10+

Future cells (`isFuture === true`) are rendered blank and are non-interactive.

---

## Page Composition

The profile page renders sections in this order:

1. `ProfileHeader`
2. Two-column grid (large screens):
   - `SolvedOverviewCard`
   - `BadgesSection`
3. `SubmissionHeatmap`
4. `AttemptsInsights`
5. `RecentSubmissionsTable`

Layout wrapper:

- `mx-auto w-full max-w-6xl px-6 py-10`
- Section spacing via `space-y-6`
- The two-card grid uses:
  - `grid grid-cols-1 gap-6 lg:grid-cols-2`

### Props flow

- `ProfileHeader`
  - `user: MatchedUser`
  - `heroAction: <ProfileSocialActions profileUsername={username} />`

- `SolvedOverviewCard`
  - `metrics: SolvedOverviewMetrics` (derived server-side)

- `BadgesSection`
  - `badges`
  - `upcomingBadges`
  - `activeBadgeId`

- `SubmissionHeatmap`
  - `grid: HeatmapGrid` (derived server-side)

- `AttemptsInsights`
  - `recent: RecentSubmission[]`

- `RecentSubmissionsTable`
  - `submissions: RecentSubmission[]`

---

## Subcomponents

## ProfileHeader

- **Type:** Server Component
- **Responsibility:** Hero section for the profile
  - Avatar, name, username pill, GitHub link, school/company, ranking/reputation/star rating
  - Uses `heroAction` slot for the social action pill/buttons
- **Data:** Pure props (no fetching)
- **State:** None

---

## SolvedOverviewCard

- **Type:** Server Component
- **Responsibility:** Difficulty breakdown + progress presentation
  - Coverage percentage pill
  - Acceptance stats
  - Progress bars for Easy/Medium/Hard
- **Data:** `metrics` computed server-side
- **State:** None

---

## BadgesSection

- **Type:** Server Component
- **Responsibility:** Earned + upcoming badges display
  - Earned badges grid
  - Upcoming (locked) badges grid
  - Shows active badge indicator if available
- **Data:** Pure props (no fetching)
- **State:** None

---

## SubmissionHeatmap

- **Type:** Client Component (`"use client"`)
- **Responsibility:** Interactive contribution heatmap (52 weeks)
  - Renders a 7xN grid with activity levels
  - Hover tooltips per cell (non-future cells)
- **Props:** `grid: HeatmapGrid`
- **State:** None (presentation + Tooltip composition)
- **Interactivity:** Tooltip hover per cell
- **Future cells:** blank + non-interactive

---

## RecentSubmissionsTable

- **Type:** Client Component (`"use client"`)
- **Responsibility:** Recent submissions table (top 15) + client-side filtering
  - Columns: Problem, Status, Language, When
  - Problem links to `https://leetcode.com/problems/{titleSlug}/`
  - Relative time via `timeAgoFromUnixSeconds()`
- **State:**
  - `filters` (status + language)
- **Memoization:**
  - `languages` list derived from visible submissions
  - `filtered` submissions recomputed only when inputs change
- **Empty filtered state:** `"No submissions match these filters"`

---

## SubmissionsFilterBar

- **Type:** Client Component (`"use client"`)
- **Responsibility:** Controlled UI for filters
  - Status tabs (All / Accepted / Wrong Answer / TLE / Runtime Error)
  - Language dropdown
- **State:** Controlled by parent (RecentSubmissionsTable)

---

## AttemptsInsights

- **Type:** Server Component
- **Responsibility:** Attempts-based insights derived from recent submissions
  - Recent acceptance rate
  - Retry → Accepted patterns
  - Most common non-AC error types
- **Data:** Pure props (`recentSubmissionList`)
- **State:** None

---

## ProfileSocialActions

- **Type:** Client Component (`"use client"`)
- **Responsibility:** Follow system UI + followers/following modal
- **Props:** `profileUsername: string`
- **Auth:** Uses `useAuth()` (AuthProvider context)

### Modes

- **Not logged in:** returns `null`
- **Auth loading:** shows a small `"..."` pill
- **Viewing someone else’s profile:** shows Follow/Unfollow pill
- **Viewing own profile:** shows `"X Followers • Y Following"` pill that opens modal

### API calls (backend)

All calls use `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:8080`) and `credentials: "include"`.

- Follow status (other profile):
  - `GET /api/friend/is-following/:leetcodeUsername`

- Toggle follow (other profile):
  - `POST /api/friend/:leetcodeUsername/follow`
  - `DELETE /api/friend/:leetcodeUsername/follow`

- Counts (own profile):
  - `GET /api/friend/counts`

- Lists (own profile, lazy-loaded on modal open):
  - `GET /api/friend/followers`
  - `GET /api/friend/following`

### State (key buckets)

- Follow state: `isFollowing`, `loadingFollowState`
- Counts: `counts`, `loadingCounts`
- Lists: `followers`, `following`, `loadedListsOnce`, `loadingLists`
- Modal: `openModal`, `tab`
- Actions: `busy`, `error`

### Modal behavior

- Rendered via `createPortal()` to `document.body`
- Uses tabs to switch between Followers / Following
- Lists are fetched only once (cached in component state after first load)
- Usernames in lists link to `/profile/{username}`

---

## Interactive Systems

### Follow/unfollow

- On other profiles:
  - `useEffect` checks follow status via `/is-following`
  - button toggles follow via POST/DELETE
  - errors display inline

### Followers/following modal

- Only on own profile
- Counts fetched automatically
- Lists fetched lazily on open
- Portal-based modal avoids stacking context issues

### Submission filters

- Client-side filters: status + language (AND logic)
- Derived `languages` from top 15 submissions

### Heatmap tooltip

- Tooltip per cell shows:
  - date
  - count
- Future cells: no tooltip / no interaction

---

## Error Handling and Edge Cases

- Missing route param → `EmptyState (Missing username)`
- Backend error / non-OK response → `EmptyState (Profile unavailable)`
- Malformed submissionCalendar JSON → parsed safely; heatmap becomes all zeros
- Missing timestamps in submissions → renders `"—"` instead of crashing
- Follow/unfollow network failure → sets `error` message, keeps UI usable
- Multiple async effects use cancellation flags to avoid setting state after unmount

---

## Known Limitations / Missing

- No pagination (recent submissions hard-limited to 15 client-side)
- No loading skeletons / Suspense boundaries
- No React Error Boundary for rendering failures
- No caching strategy (everything `no-store`)
- No rate-limit awareness or backoff UX
- Mixed JS/TS across components (can complicate tooling)
- Minimal accessibility labeling beyond modal role attributes
- Modal list loading has limited visible loading feedback (lists are fetched lazily without a strong loading UI)