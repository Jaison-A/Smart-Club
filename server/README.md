# Smart College Club Platform — Backend (Phase 1: Auth Foundation)

Express + MongoDB backend covering: server setup, DB connection, User model,
JWT authentication (access + refresh tokens), and role-based authorization.

## Setup

```bash
cd server
npm install
cp .env.example .env
# edit .env: set MONGO_URI to your local or Atlas connection string,
# and set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET to long random strings
npm run dev
```

Server starts on `http://localhost:5000` (or your configured `PORT`).

## Testing Steps

### 1. Sanity checks (no DB required)
```bash
node scripts/smoke-test.js
```
Verifies password hashing, JWT sign/verify, and validation schemas in isolation.

### 2. Health check
```bash
curl http://localhost:5000/health
# { "status": "ok", "env": "development" }
```

### 3. Register a student
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jaison","email":"jaison@sxcce.edu","password":"password123"}'
```
Expect `201` with the created user (no password field in the response).

### 4. Login
```bash
curl -i -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jaison@sxcce.edu","password":"password123"}'
```
Expect `200` with `accessToken` in the body and a `Set-Cookie: refreshToken=...`
header (httpOnly). Save the access token for the next steps.

### 5. Access a protected route
```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```
Expect `200` with the logged-in user. Omitting the header should return `401`.

### 6. Test role-based authorization
```bash
curl http://localhost:5000/api/v1/admin/ping \
  -H "Authorization: Bearer <accessToken>"
```
A freshly registered user has `role: 'student'`, so this should return `403`.
To test the success path, manually update a user's role in MongoDB:
```js
// in mongosh
db.users.updateOne({ email: "jaison@sxcce.edu" }, { $set: { role: "admin" } })
```
Log in again to get a fresh token carrying the new role, then re-run the
request — expect `200` with `{ adminId: "..." }`.

### 7. Refresh the access token
```bash
curl -i -X POST http://localhost:5000/api/v1/auth/refresh-token \
  -b "refreshToken=<cookie value from login response>"
```
Expect a new `accessToken` and a rotated `refreshToken` cookie. Reusing the
old refresh token afterward should now fail with `401` (rotation + reuse
detection).

### 8. Logout
```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -b "refreshToken=<cookie value>"
```
Expect `200`. The refresh token is now removed from the user's stored list,
so a subsequent refresh attempt with it will fail.

## Phase 2: Club Management Module

### Endpoints
```
GET    /api/v1/clubs                          public — list clubs (filter by category/tag/search/status, paginated)
GET    /api/v1/clubs/:slug                     public — club profile
POST   /api/v1/clubs                           admin — create club (starts status: 'pending')
PATCH  /api/v1/clubs/:id                       coordinator (own club) or admin — edit club
DELETE /api/v1/clubs/:id                       admin — delete club (cascades memberships)
POST   /api/v1/clubs/:id/coordinators          admin — assign a coordinator (auto-promotes user.role)
DELETE /api/v1/clubs/:id/coordinators/:userId  admin — remove a coordinator
GET    /api/v1/clubs/:id/members               coordinator (own club) or admin — list members
POST   /api/v1/clubs/:id/members/:userId       coordinator (own club) or admin — add member
DELETE /api/v1/clubs/:id/members/:userId       coordinator (own club) or admin — remove member (soft)
```

### How ownership works
`loadClubById` fetches the club and attaches it as `req.club`. `requireClubCoordinatorOrAdmin`
then checks: admins pass automatically; coordinators pass only if their own `_id` is in
`club.coordinators`. This is what enforces the "coordinator can only manage their own club"
rule from the RBAC matrix — everyone else gets `403`.

### Testing steps (continuing from Phase 1)

1. **Log in as an admin** (see Phase 1 step 6 for promoting a user to admin) and save the `accessToken`.

2. **Create a club:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/clubs \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <adminAccessToken>" \
     -d '{"name":"Robotics Club","description":"Builds robots","category":"Technical","tags":["robotics","hardware","AI"]}'
   ```
   Expect `201` with the club, including an auto-generated `slug: "robotics-club"` and
   `status: "pending"`.

3. **Activate it** (directly in MongoDB for now, until the admin-approval endpoint is added
   in a later phase):
   ```js
   db.clubs.updateOne({ slug: "robotics-club" }, { $set: { status: "active" } })
   ```

4. **List clubs (public, no token needed):**
   ```bash
   curl http://localhost:5000/api/v1/clubs
   ```
   Expect `200` with the active club in the list.

5. **View the club profile:**
   ```bash
   curl http://localhost:5000/api/v1/clubs/robotics-club
   ```

6. **Assign a coordinator** — register a second user first (e.g. `coord@sxcce.edu`), grab
   their `_id` from MongoDB, then:
   ```bash
   curl -X POST http://localhost:5000/api/v1/clubs/<clubId>/coordinators \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <adminAccessToken>" \
     -d '{"userId":"<coordUserId>"}'
   ```
   Expect `200`. That user's `role` is now `coordinator` in the DB — they'll need to log in
   again to get a token reflecting it.

7. **Coordinator edits their own club:**
   ```bash
   curl -X PATCH http://localhost:5000/api/v1/clubs/<clubId> \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <coordinatorAccessToken>" \
     -d '{"description":"Updated description"}'
   ```
   Expect `200`.

8. **Confirm ownership is enforced** — try the same request with a token for a *different*
   coordinator (not assigned to this club). Expect `403`.

9. **Add and remove a member:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/clubs/<clubId>/members/<studentUserId> \
     -H "Authorization: Bearer <coordinatorAccessToken>"

   curl http://localhost:5000/api/v1/clubs/<clubId>/members \
     -H "Authorization: Bearer <coordinatorAccessToken>"
   # club.memberCount should now be 1

   curl -X DELETE http://localhost:5000/api/v1/clubs/<clubId>/members/<studentUserId> \
     -H "Authorization: Bearer <coordinatorAccessToken>"
   # memberCount decrements; membership status becomes 'removed' (soft delete, not erased)
   ```

### What I verified without a live DB
Since this sandbox has no MongoDB instance and can't reach MongoDB's binary download
servers (needed for an in-memory test DB), I verified everything that doesn't require a
live connection:
- All 43 source files pass `node --check`
- `slugify()` unit-tested directly (handles spaces, punctuation, underscores, repeated
  hyphens) — 4/4 passed
- Booted the real Express app and confirmed: unauthenticated requests are rejected by
  `protect` before ever reaching the database (proving the middleware order is correct —
  auth failures short-circuit before any DB call)

You'll want to run through the numbered steps above once against your own `MONGO_URI` to
confirm the DB-dependent logic (slug collisions, membership upserts, coordinator
promotion) end-to-end — I'd recommend doing that before building the next module on top
of it.

## Phase 3: Recruitment & Application Module

### Endpoints
```
GET    /api/v1/clubs/:clubId/drives            public — list a club's drives (filter by status)
POST   /api/v1/clubs/:clubId/drives            coordinator (own club) or admin — create drive
GET    /api/v1/drives/:driveId                 public — drive detail
PATCH  /api/v1/drives/:driveId                 coordinator (own club) or admin — edit drive
POST   /api/v1/drives/:driveId/apply           student only — submit application
GET    /api/v1/drives/:driveId/applications    coordinator (own club) or admin — review queue
GET    /api/v1/applications/:id                applicant themself, or coordinator/admin
PATCH  /api/v1/applications/:id/status         coordinator (own club) or admin — decide
GET    /api/v1/users/:id/applications          self or admin — application history
```

### Design notes

**Dynamic form fields, validated server-side.** Each drive defines its own `formFields`
(label/type/required). On submission, `validateResponsesAgainstForm` checks every
`required` field has a non-blank matching response — coordinators can build different
application forms per drive without any backend changes.

**A drive only accepts applications when *both* conditions hold:** `status === 'open'`
*and* the current date falls within `[openDate, closeDate]`. Status is coordinator-
controlled (not auto-computed) so a drive can be manually closed early once enough
applications come in, without waiting for `closeDate`. `isAcceptingApplications()` in
`drive.service.js` is the single source of truth for this check.

**Acceptance auto-creates club membership.** When a coordinator sets an application's
status to `accepted`, `ensureActiveMembership()` upserts a `Membership` record and
increments `Club.memberCount` — reactivating a past membership if the student had left,
rather than duplicating it. This fulfills the "membership wired to accepted applications"
requirement from the original roadmap.

**Ownership chains through the drive/application to its club.** Neither a
`RecruitmentDrive` nor an `Application` carries a "coordinator" field of its own —
`loadClubFromDrive` and `loadClubFromApplication` resolve the owning club, then reuse the
same `requireClubCoordinatorOrAdmin` middleware from the Clubs module. One authorization
rule, enforced consistently everywhere a club is the resource boundary.

**Duplicate applications are rejected at the DB layer**, not just in application code — a
unique index on `{drive, applicant}` means even a race condition (two rapid double-clicks)
can't create two applications; the service just translates the resulting Mongo error 11000
into a clean `409`.

### Testing steps (continuing from Phase 2)

1. **Create a drive** as the club's coordinator:
   ```bash
   curl -X POST http://localhost:5000/api/v1/clubs/<clubId>/drives \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <coordinatorAccessToken>" \
     -d '{
       "title": "Fall Recruitment 2026",
       "description": "Join the Robotics Club",
       "formFields": [
         { "label": "Why do you want to join?", "type": "textarea", "required": true },
         { "label": "Portfolio link", "type": "url", "required": false }
       ],
       "openDate": "2026-08-01",
       "closeDate": "2026-09-01"
     }'
   ```
   Expect `201`. If today's date falls inside that window, `status` will already be
   `"open"` — otherwise `"upcoming"`.

2. **List drives for the club (public):**
   ```bash
   curl http://localhost:5000/api/v1/clubs/<clubId>/drives
   ```

3. **Student applies:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/drives/<driveId>/apply \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <studentAccessToken>" \
     -d '{"responses":[{"field":"Why do you want to join?","value":"I love building things"}]}'
   ```
   Expect `201`. Omitting the required field should return `422` listing it by name.
   Submitting a second time should return `409` ("You have already applied").

4. **Coordinator reviews the queue:**
   ```bash
   curl http://localhost:5000/api/v1/drives/<driveId>/applications \
     -H "Authorization: Bearer <coordinatorAccessToken>"
   ```

5. **Accept the application:**
   ```bash
   curl -X PATCH http://localhost:5000/api/v1/applications/<applicationId>/status \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <coordinatorAccessToken>" \
     -d '{"status":"accepted","reviewNotes":"Great answers"}'
   ```
   Then check the club — `memberCount` should have incremented, and
   `GET /api/v1/clubs/<clubId>/members` should list the student.

6. **Student checks their own application history:**
   ```bash
   curl http://localhost:5000/api/v1/users/<studentUserId>/applications \
     -H "Authorization: Bearer <studentAccessToken>"
   ```
   Try it with a *different* student's `<userId>` in the URL — expect `403`.

7. **Confirm a drive outside its window rejects applications** — create a drive with
   `openDate`/`closeDate` both in the past, then try to apply. Expect `400`
   ("not currently accepting applications").

### What I verified without a live DB
- All 52 source files pass `node --check`
- Unit-tested `isAcceptingApplications()` directly — 4/4 passed (open+in-window,
  open+expired, upcoming, closed)
- Unit-tested the Zod schemas' date refinement (`closeDate` must be after `openDate`) and
  the application-submission schema — 8/8 passed
- Unit-tested `validateResponsesAgainstForm()` directly — 4/4 passed, including a
  whitespace-only value correctly being treated as missing
- Booted the real app and confirmed the nested route (`/clubs/:clubId/drives`) resolves
  through to a real DB call rather than a 404 — proving the `mergeParams` wiring across
  `driveClub.routes.js` is correct — and that unauthenticated requests are still rejected
  before any DB access

As before, DB-dependent behavior (auto-membership on acceptance, the unique-index
duplicate-application rejection, date-window transitions) needs a run against your own
`MONGO_URI` — steps above walk through exactly that.

## What's implemented in this phase
- Express app with security middleware (Helmet, CORS w/ credentials, rate
  limiting on `/api/v1/auth`, JSON body limits)
- MongoDB connection via Mongoose with fail-fast startup behavior
- `User` model: bcrypt password hashing, `comparePassword`, sanitized JSON output
- JWT auth: short-lived access tokens + rotating, hashed refresh tokens
  stored server-side (max 5 concurrent sessions per user)
- `protect` middleware (authentication) and `authorize(...roles)` middleware
  (authorization), composable per-route
- Centralized error handling (Mongoose validation errors, duplicate key
  errors, cast errors, JWT errors all normalized to a consistent JSON shape)
- Zod-based request validation
- `Club` and `Membership` models, CRUD, coordinator assignment (auto-promotes
  `user.role`), member add/remove (soft delete via `status`), server-generated
  unique slugs, text search index on name/description/tags for the future
  recommendation engine to reuse
- Ownership-based authorization (`loadClubById` + `requireClubCoordinatorOrAdmin`)
  layered on top of role-based `authorize()` — coordinators can only manage
  clubs they're assigned to
- `RecruitmentDrive` and `Application` models with dynamic per-drive form
  fields, server-side required-field validation, and a unique index
  preventing duplicate applications
- Drive lifecycle (`upcoming` → `open` → `closed`, coordinator-controlled)
  gated by both status and date window before applications are accepted
- Application review workflow (`submitted` → `shortlisted`/`interview` →
  `accepted`/`rejected`), with acceptance auto-creating/reactivating club
  membership and incrementing `memberCount`
- `requireSelfOrAdmin` RBAC helper for user-scoped resources (application
  history)

## Not yet implemented (future phases)
- Password reset / forgot-password flow
- Email verification
- Admin endpoint to activate a pending club (currently done directly in the
  DB, as shown in Club Management testing step 3)
- Notifications on application status change (student isn't currently
  notified when accepted/rejected — the roadmap's Notifications module
  will cover this)
- Events & QR Attendance (next logical module)

---

## Latest build — what changed

### Staying logged in after a page refresh (read this if it ever breaks again)
The access token lives in memory only; the browser keeps a 7-day **httpOnly refresh cookie**. On every page load the
frontend calls `POST /auth/refresh-token` once to get a fresh access token. For that to work in *your* environment:

| Setting | Must be |
|---|---|
| backend `CLIENT_URL` | the **exact** origin the frontend is served from, e.g. `http://localhost:5173` (scheme + host + port, no trailing slash) |
| frontend `VITE_API_URL` | the backend API base, e.g. `http://localhost:5000/api/v1` |
| backend `COOKIE_SECURE` | `false` on plain `http://localhost`; `true` only when served over HTTPS |
| browser | must not block cookies for localhost |

Root causes fixed: (1) `/auth/me` was never retried after a reload; (2) React `StrictMode` fired the rotating refresh
call twice, racing the token rotation and orphaning the browser's cookie; (3) rotation is now atomic
(`findOneAndUpdate` + `$pull`) and every refresh token carries a unique `jti`.
Regression tests: `npm test` (backend: race + replay; frontend: `AuthProvider` under StrictMode makes exactly one call).

### New / changed endpoints
```
POST   /auth/login                       email OR register number (studentId; must match exactly one account)
PATCH  /auth/me                          update own profile (name, department, year, skills, interests, bio, github, linkedin, website, resumeUrl)
POST   /auth/me/avatar                   multipart field "avatar" (jpeg/png/webp/gif, <= 5MB, validated server-side)
GET    /uploads/avatars/<file>           static, served with Cross-Origin-Resource-Policy: cross-origin
GET    /clubs/mine                       clubs I coordinate, ANY status (pending/rejected/suspended included)
GET    /clubs?status=all                 admin only
GET    /admin/users/:id/overview         profile + memberships + applications + counts (admin)
GET    /users/:id/memberships            self or admin
POST   /clubs/:id/coordinators           admin: assign a coordinator immediately (body: { userId })
DELETE /clubs/:id/coordinators/:userId   admin: remove (membership role is downgraded to member)
POST   /clubs/:id/members/:userId        coordinator/admin: add a member directly
```
Clubs also accept `facultyAdvisor: { name, email, designation }`.

### Avatars / file storage
Uploads are stored on local disk in `server/uploads/avatars` (no cloud credentials needed). **On hosts with an
ephemeral filesystem (Render/Heroku free tiers) these files vanish on redeploy** — mount a persistent disk, or swap
the storage engine in `src/config/upload.js` for S3/Cloudinary (only that file and the URL built in
`auth.controller.js#uploadAvatar` change).

### Not implemented (needs infrastructure/decisions I did not fake)
Password reset + email verification (need an SMTP service), Socket.io push (notifications are polled every 30s),
Cloudinary, analytics dashboards, camera-based QR scanning (code entry is used).
