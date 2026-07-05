Meridian Employee Hub — Frontend
Internal employee portal for Meridian, covering onboarding, HR self-service, desk booking, training, and internal knowledge sharing. This repository contains the frontend application; the backend (.NET 8 Web API) lives in a separate repository.

Tech Stack
Build tool: Vite
Framework: React 18 + TypeScript (strict mode)
Styling: Tailwind CSS + shadcn/ui (style: new-york, base color: slate)
HTTP client: Axios (centralized instance with auth interceptors)
Routing: React Router
State management: Zustand (auth/UI state), TanStack Query (server state/caching)
Auth: JWT access tokens (memory-only, never persisted to storage) + refresh tokens via HttpOnly cookie
Other: jwt-decode (reading role/user-id claims client-side), qrcode.react (virtual employee badge)
No enum-based type declarations are used anywhere in this codebase (export enum is incompatible with this project's erasableSyntaxOnly TypeScript setting). Fixed-value types use the const + as const pattern instead:

export const BookingStatus = { Confirmed: 0, Cancelled: 1 } as const;
export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];
Getting Started
Prerequisites
Node.js (v18+, tested on v22.14.0)
npm
The backend API running separately (see the backend repository) — by default this app expects it at https://localhost:7193
Setup
npm install
Create a .env file at the project root (see .env.example):

VITE_API_BASE_URL=https://localhost:7193/api/v1
Running
npm run dev
The app runs at http://localhost:5173. The backend must be running and reachable at the URL configured above, with CORS enabled for http://localhost:5173 and credentials allowed (required for the refresh-token cookie flow).

Building
npm run build
Project Structure
src/
├── api/            # Axios instance + per-domain API call modules
├── components/
│   ├── ui/         # shadcn/ui components
│   ├── layout/     # Navbar, Sidebar, AppLayout
│   └── features/   # Feature-specific shared components
├── pages/          # Route-level page components
│   ├── auth/       # Login, Change Password
│   └── admin/      # Admin-only screens (Departments, Teams, Wiki Categories)
├── hooks/          # Custom React hooks
├── store/          # Zustand stores (authStore, etc.)
├── router/         # AppRouter, ProtectedRoute, RoleGuard
├── types/          # Shared TypeScript types/interfaces
├── utils/          # Utilities (jwt.ts for token/role/user-id decoding, cn.ts)
├── constants/      # App-wide constants
└── styles/
    └── globals.css # Tailwind directives
Authentication Flow
User logs in via /login with email + password.
If requiresPasswordChange is true (first login), the user is force-redirected to /change-password and cannot access any other route until the password is changed. New password must contain an uppercase letter, a digit, and a special character (enforced server-side).
Access token is stored in memory only (Zustand, no persistence). Refresh token lives in an HttpOnly cookie, sent automatically via withCredentials: true.
On a 401 response, the Axios interceptor attempts exactly one silent refresh before giving up and redirecting to /login?sessionExpired=true.
Known limitation: a full page reload currently logs the user out even though the refresh cookie is still valid, because there is no silent-refresh-on-mount flow yet — only refresh-on-request-failure is implemented.
Roles
Four roles exist: Admin, HR, Manager, Employee. The JWT role claim uses the .NET default URI (http://schemas.microsoft.com/ws/2008/06/identity/claims/role), read via getCurrentUserRoles() in src/utils/jwt.ts. The user id comes from the standard sub claim, read via getCurrentUserId().

Role-based access is enforced both by hiding UI controls (via hasRole()) and by the backend rejecting unauthorized requests — the frontend should never rely solely on hiding a button as its only line of defense, but every screen in this app does hide controls the current user isn't allowed to use.

Modules
Module	Route	Notes
Auth	/login, /change-password	Forced password change on first login
Dashboard	/	Quick Links widget; more widgets planned
Directory	/directory	Search, department filter, "Add Employee" (HR/Admin)
Profile	/profile	Self-editable fields vs. HR/Admin-only fields; includes virtual QR badge
Onboarding	/onboarding	3-phase checklist; some tasks auto-complete server-side
Buddy System	/buddy	Self view + HR/Admin management (edit is HR-only, not Admin)
Announcements	/news	Any user can post; edit/delete by author or HR/Admin
Quick Links	/links	Admin-managed shortcuts
Desk Booking	/desk-booking	Daily availability grid; "who's booked" view for Manager/HR/Admin
Calendar	/calendar	Month view; event creation by Manager/HR/Admin
HR Tickets	/hr-tickets	Any user can open a ticket; status/assignment by HR/Admin
Leave Management	/leave	Balance view, request flow, approval by Manager/HR/Admin (irreversible once decided)
Training Center	/training	Course catalog, enrollment, manual progress tracking
Internal Wiki	/wiki/:category/:slug	Article routing by slug (not id); category tree; admin category management at /admin/wiki-categories
Admin	/admin/departments, /admin/teams	Admin-only CRUD
Adding shadcn/ui Components
npx shadcn@latest add <component-name>
Confirmed working against this project's components.json configuration.

Known Issues / Open Items
Silent refresh on app mount not implemented (see Authentication Flow above).
POST /employees does not accept a roleId; the "Add Employee" form works around this with two sequential requests (create, then update with role) — a backend change to accept roleId directly at creation was considered but not adopted.
Department edit form may not correctly support clearing an assigned headEmployeeId back to null.
The assignee dropdown in HR Tickets fetches employees with pageSize=1000, which will silently truncate if the company grows past that number.
