# Smart College Club Platform — Frontend

React + Tailwind CSS + React Router + Lucide Icons. Talks to the Express/MongoDB
backend built in earlier phases.

## Setup

```bash
cd client
npm install
cp .env.example .env
# edit .env if your backend isn't on http://localhost:5000
npm run dev
```

Opens on `http://localhost:5173`. Make sure the backend's `CLIENT_URL` in its `.env`
matches this origin (CORS is locked to it, `credentials: true`).

## Design system

A "varsity" identity -- deep collegiate green + gold, chosen to fit a college club
platform rather than defaulting to generic SaaS indigo/blue. All tokens live in one
place:

- **`src/index.css`** -- CSS custom properties (`--color-primary`, `--color-accent`, etc.)
- **`tailwind.config.js`** -- maps those variables into Tailwind's color/font/radius scales

To rebrand, edit `index.css` only -- every component reads colors through Tailwind
classes like `bg-primary` or `text-accent`, never a hardcoded hex value.

Fonts: `Sora` (display/headers), `Inter` (body/UI), `IBM Plex Mono` (data -- dates,
IDs, badge-adjacent text). Loaded via Google Fonts in `index.html`.

Signature element: a left-edge "stripe" (`<Card accent>`) used consistently on
dashboard stat tiles and highlighted list items -- not applied everywhere, so it
still reads as a highlight rather than decoration.

## Folder structure

```
src/
├── api/              Axios instance (token refresh handling) + one file per resource
├── context/           AuthContext -- session state, login/register/logout
├── routes/             ProtectedRoute (auth + role gating), AppRoutes (route map)
├── config/nav.js        Role -> sidebar nav items (single source of truth)
├── components/
│   ├── ui/              Button, Card, Badge, StatCard, Input, EmptyState, Spinner
│   └── layout/           Sidebar, TopBar, DashboardLayout
└── pages/
    ├── auth/             Login, Register
    ├── student/           StudentDashboard
    ├── coordinator/        CoordinatorDashboard
    ├── admin/               AdminDashboard
    ├── clubs/                ClubDirectory, ClubDetails
    └── recruitment/            RecruitmentPage, ApplyToDrive
```

## Route map

| Path | Access | Page |
|---|---|---|
| `/login` | public (redirects away if logged in) | Login |
| `/register` | public (redirects away if logged in) | Register |
| `/student` | student only | StudentDashboard |
| `/coordinator` | coordinator, admin | CoordinatorDashboard |
| `/admin` | admin only | AdminDashboard |
| `/clubs` | any logged-in role | ClubDirectory |
| `/clubs/:slug` | any logged-in role | ClubDetails |
| `/recruitment` | any logged-in role | RecruitmentPage |
| `/recruitment/:driveId/apply` | student only | ApplyToDrive |

`ProtectedRoute` handles both layers: no `roles` prop means "any authenticated user";
a `roles` array restricts further. A logged-in coordinator hitting `/admin` gets
redirected to `/coordinator` rather than shown a blank/error page.

## How auth works on the frontend

- Access token lives in memory only (`api/axiosInstance.js`), never localStorage --
  matches the backend's XSS-mitigation design. It's lost on a hard refresh by design.
- On app load, `AuthProvider` calls `GET /auth/me`. If the browser still has the
  backend's httpOnly refresh cookie, this silently restores the session; if not,
  the user just sees the login page. Either way this happens before any protected
  route renders (`ProtectedRoute` shows a spinner during that check).
- A 401 on any request triggers one automatic refresh attempt (coalesced -- concurrent
  401s share a single refresh call) before failing through to the caller.

## Testing steps

### 1. Build & lint (already verified, but to reproduce)
```bash
npm run lint    # 0 errors, 1 expected warning (AuthContext exporting both
                 # the provider and the useAuth hook -- standard React pattern)
npm run build   # produces dist/, ~101 KB gzipped JS
```

### 2. Manual walkthrough against the live backend
1. Start the backend (see `server/README.md`) and this dev server.
2. Register a student at `/register`, log in.
3. Confirm you land on `/student` and the sidebar shows Student nav items only.
4. Visit `/clubs`, open a club's `/clubs/:slug` page.
5. If the club has an open drive, click **Apply** -- confirm the dynamic form
   renders exactly the fields the coordinator configured on the backend, and that
   omitting a required field surfaces the backend's validation message.
6. Log in as a coordinator (promoted per the backend README) -- confirm `/coordinator`
   shows their club's stats and drives, and that visiting `/admin` redirects them
   back to `/coordinator` rather than erroring.
7. Log in as admin -- confirm `/admin` shows pending club approvals.
8. Refresh the page while logged in -- confirm the session survives (no bounce to
   `/login`) via the silent `/auth/me` restore.

## What I verified without a live backend
Since this environment has no live MongoDB/API to hit at runtime, every page's data
fetching (`useEffect` + API calls) is written but untested end-to-end here. What I did
verify:
- `npm run build` succeeds (1871 modules, no bundler errors)
- `npm run lint` -- 0 errors
- Booted the actual Vite dev server and fetched every page/route module directly --
  all returned `200` with no transform errors (confirms imports resolve, JSX is
  valid, and there are no circular/missing-module issues across the whole route tree)
- Fixed a real issue this way: the installed `lucide-react` version doesn't export
  brand icons (`Instagram`, `Linkedin`) -- swapped for a generic link icon

I don't have a browser in this sandbox to screenshot the rendered UI, so the visual
result (spacing, alignment, actual color rendering) hasn't been eyeballed -- worth a
quick look on your end before treating the design as final.

## Not yet implemented
- Toast/notification system for action feedback (currently inline error banners only)
- Coordinator drive creation/edit forms (dashboard links to `/recruitment/new`, which
  isn't built yet -- natural next slice alongside Events)
- Admin user management and club-approval action pages (dashboard displays the data;
  the approve/reject actions aren't wired to buttons yet)
