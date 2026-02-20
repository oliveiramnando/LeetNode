# Frontend Architecture

This document describes the architecture of the LeetNode frontend: routing, rendering model, data flow, state management, authentication handling, and UI composition.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** JavaScript + TypeScript (mixed; pages/components include both `.js/.jsx` and `.ts/.tsx`)
- **Styling:** Tailwind CSS (via `globals.css` + PostCSS)
- **HTTP:** Native `fetch` (no axios)
- **State:** React local state (`useState`, `useEffect`) only

---

## Rendering Model

The project uses a **mix of Server Components and Client Components**:

- **Server Components**
  - Root layout: `src/app/layout.js`
  - Profile page: `src/app/profile/[username]/page.tsx` (server-side fetching during render)

- **Client Components**
  - Navbar: `src/components/Navbar.jsx` (`"use client"`)
  - Friend search: `src/components/FriendSearch.jsx` (`"use client"`)
  - Profile button: `src/components/ProfileButton.jsx` (`"use client"`)

General rule in this codebase:
- Use **server components** for page-level data fetching and initial render.
- Use **client components** for interactive UI (auth state, inputs, navigation).

---

## Routing

### Pages (App Router)
- Home: `src/app/page.js`
- Profile (dynamic): `src/app/profile/[username]/page.tsx`

### API Routes (App Router)
- Proxy route(s): `src/app/api/leetcode/user/[username]/route.ts`

The frontend uses both:
- **internal Next API routes** under `/api/...` (frontend-side)
- **direct backend calls** to the backend server (via `NEXT_PUBLIC_BACKEND_URL`)

---

## Folder Structure

### `src/app/`
Responsibilities:
- Page rendering (server-side by default)
- Server-side data fetching for page routes
- Next.js API routes for proxying backend calls

Notable files:
- `src/app/layout.js` — root layout wrapper + navbar
- `src/app/page.js` — home page
- `src/app/profile/[username]/page.tsx` — dynamic profile route
- `src/app/api/leetcode/user/[username]/route.ts` — API proxy to backend

### `src/components/`
Responsibilities:
- Reusable UI components
- Interactive UI (client components)
- Composition of page sections

Notable groupings:
- `src/components/profile/` — profile-page specific components
- `src/components/ui/` — shared UI primitives (Card, Pill, etc.)

### `src/lib/`
Responsibilities:
- Pure utility functions and data transformation
- Derived metrics, normalization, formatting

Notable files:
- `src/lib/derive.ts` — derives metrics from user data
- (Also referenced): normalization utilities (e.g., normalize from backend shape)

### `src/types/`
Responsibilities:
- TypeScript interfaces for LeetNode/LeetCode shapes
- Improves safety and documentation of data structures

Notable file:
- `src/types/leetnode.ts`

### `src/styles/`
- Present but effectively unused (no custom stylesheets in use)

---

## Data Flow

The frontend fetches data in three main ways:

### 1) Server-side data fetching in pages
Example:
- `src/app/profile/[username]/page.tsx` fetches user data during render

Benefits:
- Better initial load (SSR)
- Page can render with data immediately

### 2) Client-side fetching for interactive UI
Example:
- Navbar checks login state on mount (`/api/auth/me`)
- FriendSearch validates username and navigates

Client requests include credentials when needed:
- `credentials: "include"` is used for session-based auth endpoints.

### 3) API proxy routes (Next.js API route)
Example:
- `src/app/api/leetcode/user/[username]/route.ts` proxies requests (frontend → backend)

This pattern can be used to:
- Hide backend base URL from client usage
- Normalize headers/caching behavior
- Centralize error handling (future)

---

## Backend Endpoints Used

Frontend references these backend routes:

- `GET /api/auth/me` — determine session/login state
- `POST /api/auth/signout` — logout
- `GET /api/auth/github/start` — begin GitHub OAuth
- `GET /api/leetcode/user/:username` — fetch LeetCode profile data

The base backend URL is typically provided via:
- `NEXT_PUBLIC_BACKEND_URL`

There are also fallback hardcoded localhost URLs in the codebase (e.g., `http://localhost:8080`, `http://localhost:3000`).

---

## State Management

State management is intentionally simple:

- Local component state via `useState`
- Side effects via `useEffect`
- No global state library (Redux/Zustand/etc.)
- No React context providers detected
- No `hooks/` folder (aside from a small local helper pattern)

Examples:
- Navbar holds auth state locally
- FriendSearch holds query/loading/error state locally

---

## Authentication Handling

Auth is **session-based** (cookies).

### Where auth is checked
- `Navbar.jsx` checks login state on mount by calling:
  - `GET /api/auth/me` with `credentials: "include"`

### Conditional rendering
- If authenticated:
  - Navbar displays the logged-in user and logout
  - FriendSearch is shown
- If not authenticated:
  - Navbar displays login/signup options

### Session vs local storage
- A helper in `ProfileButton.jsx` uses local storage (e.g., storing a username)
- Source of truth for authentication is still the backend session check (`/api/auth/me`)

---

## Major UI Systems

### Navbar
- **File:** `src/components/Navbar.jsx`
- Role:
  - Top-level navigation
  - Auth-aware UI
  - Contains FriendSearch (only when logged in)
  - Contains ProfileButton

### Friend Search
- **File:** `src/components/FriendSearch.jsx`
- Role:
  - Input + validation for navigating to other users
  - Calls API to validate user existence before navigation

### Profile Page
- **File:** `src/app/profile/[username]/page.tsx`
- Role:
  - Server-rendered profile view
  - Composes profile-specific UI components in a grid layout

Profile UI is decomposed into components under:
- `src/components/profile/`

Shared UI primitives live under:
- `src/components/ui/`

---

## Styling System

- Tailwind CSS is the primary styling approach.
- `globals.css` imports Tailwind (`@import "tailwindcss";`)
- PostCSS is configured (`postcss.config.mjs`)
- No CSS modules detected
- No explicit dark/light theme system detected

---

## Environment & Configuration

### Environment variables
- `NEXT_PUBLIC_BACKEND_URL` — base URL for backend requests

### Base URL usage patterns
- Backend URL used directly in pages/components
- Internal API route uses backend URL server-side

### Hardcoded fallbacks
- Some code paths include hardcoded localhost defaults

---

## Missing / Not Implemented (Current)

Not found in the codebase:
- Global state library (Redux/Zustand/etc.)
- React context providers for app-wide state
- Dedicated `hooks/` directory
- Dark/light mode support
- Server Actions (uses `fetch` instead)
- Additional Next.js API routes beyond `/api/leetcode/user/[username]`
- `populate()` or client-side relational fetching patterns (not applicable to frontend, but noted in overall system behavior)

---