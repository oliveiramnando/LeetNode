# Navbar

This document describes the `Navbar` component in the LeetNode frontend: its responsibilities, rendering behavior, auth integration, API calls, and styling.

---

## Purpose and Responsibilities

The `Navbar` component renders the site’s top navigation bar.

It is responsible for:

- Rendering the brand link (`LeetNode`) that navigates to `/`
- Providing authentication UI:
  - When logged out: “signup” and “login” links that start GitHub OAuth
  - When logged in: showing the current user’s LeetCode handle, logout, and profile navigation
- Rendering the friend search UI when authenticated
- Handling logout behavior (backend call + clearing local auth context + redirect)

It does not:

- Define routing configuration (it only uses Next navigation primitives)
- Perform server-side rendering (it is a Client Component)
- Persist auth state itself (it consumes the global auth context)

---

## Component Type

- Client Component (`"use client"` present at top of file)
- Reasons it must be client-side:
  - Uses hooks (`useRouter`)
  - Consumes auth context (`useAuth()`)
  - Performs `fetch()` and client navigation

---

## Rendered Structure

### High-level layout

- Root element: `<header>`
  - Dark background
  - Bottom border
- Inside: `<Container>` wrapper
  - Flex row layout (`justify-between`)
  - Fixed navbar height (`h-14`)

### Regions

1. Left region
   - Brand link: “LeetNode” → `/`
   - Friend search:
     - Renders `<FriendSearch />` only when authenticated

2. Right region
   - `<nav>` containing authentication-dependent actions

### Branding

- Text-only link: `LeetNode`
- No logo image or icon present in source of truth

---

## Conditional Rendering

### Loading state

- If auth is still loading:
  - Nav content is suppressed (`loading ? null : ...`)
  - Navbar still renders header + brand region

### Logged out state

When `loggedIn === false`:

- Shows two anchors:
  - “signup”
  - “login”
- Both point to the same OAuth entry URL:
  - `${backend}/api/auth/github/start`

### Logged in state

When `loggedIn === true`:

- Shows:
  - Username text (`user?.leetcodeUsername`)
  - Logout button
  - `<ProfileButton />`

Friend search (`<FriendSearch />`) is also rendered in the left region only when logged in.

---

## Auth Integration

Navbar consumes auth state via:

- `useAuth()` from `components/auth/AuthProvider.tsx`

Fields used:

- `loading` — controls whether nav content renders at all
- `loggedIn` — controls which nav UI renders
- `user` — displays `user.leetcodeUsername`
- `signOutLocal()` — used to clear auth state immediately on logout

Navbar does not call `refresh()` from the auth context; it relies on router refresh after logout.

---

## API Calls

### Logout

Navbar makes one direct backend call in `handleLogout`:

- Endpoint: `POST ${backend}/api/auth/signout`
- Credentials: included
- Cache: no-store
- Accept header set to JSON

Behavior notes:

- The response is not inspected
- Errors are not surfaced to the user
- Cleanup and navigation happen in the `finally` path (UI updates regardless of backend outcome)

### Other calls

Navbar does not directly call `/api/auth/me`. That request is handled by `AuthProvider`.

FriendSearch (child component) performs its own API call (not from Navbar itself), described in the next section.

---

## Related Child Components

### FriendSearch

- Rendered only when logged in
- On submit:
  - GET `/api/leetcode/user/${username}`
  - If successful: navigates to `/profile/${username}`
  - If not: shows inline error message

### ProfileButton

- Renders a clickable profile icon/button
- Navigates the user to their profile page (based on auth/session context)

### Container

- Layout wrapper that constrains width and applies consistent horizontal padding

---

## Logout Flow

1. User clicks “logout” button
2. `handleLogout()` runs:
   - Sends `POST /api/auth/signout` with cookies
   - In `finally`:
     - calls `signOutLocal()` to clear auth context immediately
     - `router.push("/")`
     - `router.refresh()`
3. No explicit error handling:
   - If logout request fails, UI still logs out locally and redirects home

---

## Styling and UX Notes

### Tailwind classes (observed patterns)

- Header:
  - bottom border + dark background (`border-white/10`, `bg-[#1E1E1E]`)
- Container row:
  - `flex`, `h-14`, `items-center`, `justify-between`, `gap-4`
- Brand link:
  - white text, semibold, tight tracking
- Nav text:
  - small size and muted color (`text-sm`, `text-zinc-300`)
- Interactive elements:
  - hover + transition (`hover:text-white`, `transition-colors`)

### Positioning

- Navbar is not sticky/fixed (scrolls with page)
- No explicit z-index usage in the Navbar source of truth

---

## Dependencies

### Imports used by Navbar

- Next:
  - `Link` (client-side navigation)
  - `useRouter` from `next/navigation`
- Local components:
  - `Container`
  - `FriendSearch`
  - `ProfileButton`
- Auth:
  - `useAuth()` from `AuthProvider`

### Environment usage

- Backend base URL:
  - `process.env.NEXT_PUBLIC_BACKEND_URL`
  - Fallback: `http://localhost:8080`

---

## Missing / Not Found

- Navbar does not use helpers from `lib/auth.ts` directly
- Navbar does not call auth context `refresh()` directly
- No custom CSS beyond Tailwind (globals.css is Tailwind import)
- No explicit accessibility labels or ARIA attributes were identified in the Navbar source of truth