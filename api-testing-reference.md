# API Testing Reference — Smart College Club Platform

Base URL: `http://localhost:5000/api/v1`

## How auth works here
- Login returns an `accessToken` in the JSON body — copy it and send it as
  `Authorization: Bearer <token>` on every protected request below.
- It also sets an httpOnly `refreshToken` cookie automatically (curl: add `-c cookies.txt -b cookies.txt`
  to persist it across requests; Postman/Insomnia handle cookies automatically).
- Access tokens expire in 15 minutes — call `/auth/refresh-token` to get a new one, or just log in again.
- Every response follows: `{ "success": true|false, "message": "...", "data": {...} | "errors": [...] }`

Replace `<TOKEN>`, `<ID>` placeholders with real values from previous responses as you go.

---

## 1. Auth (`/auth`)

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jaison Kurian",
    "email": "jaison@sxcce.edu",
    "password": "password123",
    "studentId": "21CS045",
    "department": "CSE",
    "year": 3
  }'
```
Every self-registered account starts as `role: "student"`.

### Login
```bash
curl -i -X POST http://localhost:5000/api/v1/auth/login \
  -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{ "email": "jaison@sxcce.edu", "password": "password123" }'
```
Copy `data.accessToken` from the response for the next requests.

### Refresh token
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh-token -b cookies.txt -c cookies.txt
```

### Current user
```bash
curl http://localhost:5000/api/v1/auth/me -H "Authorization: Bearer <TOKEN>"
```

### Logout
```bash
curl -X POST http://localhost:5000/api/v1/auth/logout -H "Authorization: Bearer <TOKEN>" -b cookies.txt
```

---

## 2. Clubs (`/clubs`)

### List clubs — public
```bash
curl "http://localhost:5000/api/v1/clubs?search=robot&category=Technical&page=1&limit=12"
```
Query params: `category`, `tag`, `search`, `page`, `limit`. `status` filtering to anything
other than the default `active` requires an admin token.

### Get one club by slug — public (unless pending/rejected/suspended, then coordinator/admin only)
```bash
curl http://localhost:5000/api/v1/clubs/robotics-club
```

### Create a club — any logged-in user (they become its coordinator; starts `pending`)
```bash
curl -X POST http://localhost:5000/api/v1/clubs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "Robotics Club",
    "category": "Technical",
    "description": "We build robots.",
    "vision": "A campus where every student can build something that moves.",
    "mission": "Weekly build sessions and a spring showcase.",
    "tags": ["robotics", "arduino", "AI"],
    "logoUrl": "https://example.com/logo.png",
    "socialLinks": { "instagram": "https://instagram.com/roboticsclub", "github": "https://github.com/roboticsclub" }
  }'
```

### Update a club — coordinator (own club) or admin
```bash
curl -X PATCH http://localhost:5000/api/v1/clubs/<CLUB_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{ "description": "Updated description" }'
```
Any subset of the create-club fields is accepted (partial update).

### Delete a club — admin
```bash
curl -X DELETE http://localhost:5000/api/v1/clubs/<CLUB_ID> -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Approval workflow — admin only
```bash
curl -X PATCH http://localhost:5000/api/v1/clubs/<CLUB_ID>/approve -H "Authorization: Bearer <ADMIN_TOKEN>"

curl -X PATCH http://localhost:5000/api/v1/clubs/<CLUB_ID>/reject \
  -H "Content-Type: application/json" -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{ "reason": "Please add a faculty advisor before resubmitting." }'

curl -X PATCH http://localhost:5000/api/v1/clubs/<CLUB_ID>/suspend -H "Authorization: Bearer <ADMIN_TOKEN>"
curl -X PATCH http://localhost:5000/api/v1/clubs/<CLUB_ID>/restore -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Coordinators — admin only
```bash
curl -X POST http://localhost:5000/api/v1/clubs/<CLUB_ID>/coordinators \
  -H "Content-Type: application/json" -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{ "userId": "<USER_ID>" }'

curl -X DELETE http://localhost:5000/api/v1/clubs/<CLUB_ID>/coordinators/<USER_ID> -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Members — coordinator (own club) or admin
```bash
curl http://localhost:5000/api/v1/clubs/<CLUB_ID>/members -H "Authorization: Bearer <TOKEN>"
curl -X POST http://localhost:5000/api/v1/clubs/<CLUB_ID>/members/<USER_ID> -H "Authorization: Bearer <TOKEN>"
curl -X DELETE http://localhost:5000/api/v1/clubs/<CLUB_ID>/members/<USER_ID> -H "Authorization: Bearer <TOKEN>"
```

---

## 3. Recruitment Drives (`/clubs/:clubId/drives`, `/drives`)

### Create a drive — coordinator (own club) or admin
```bash
curl -X POST http://localhost:5000/api/v1/clubs/<CLUB_ID>/drives \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "title": "Fall Recruitment 2026",
    "description": "Join the Robotics Club",
    "formFields": [
      { "label": "Why do you want to join?", "type": "textarea", "required": true },
      { "label": "Portfolio link", "type": "url", "required": false },
      { "label": "Experience level", "type": "select", "required": true, "options": ["Beginner", "Intermediate", "Advanced"] }
    ],
    "openDate": "2026-08-01",
    "closeDate": "2026-09-30"
  }'
```

### List drives for a club — public
```bash
curl "http://localhost:5000/api/v1/clubs/<CLUB_ID>/drives?status=open"
```

### Get / update a drive
```bash
curl http://localhost:5000/api/v1/drives/<DRIVE_ID>

curl -X PATCH http://localhost:5000/api/v1/drives/<DRIVE_ID> \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{ "status": "closed" }'
```

### Apply — student only
```bash
curl -X POST http://localhost:5000/api/v1/drives/<DRIVE_ID>/apply \
  -H "Content-Type: application/json" -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{
    "responses": [
      { "field": "Why do you want to join?", "value": "I love building things" },
      { "field": "Experience level", "value": "Intermediate" }
    ],
    "resumeUrl": "https://example.com/resume.pdf"
  }'
```

### Review applications for a drive — coordinator (own club) or admin
```bash
curl "http://localhost:5000/api/v1/drives/<DRIVE_ID>/applications?status=submitted" -H "Authorization: Bearer <TOKEN>"
```

---

## 4. Applications (`/applications`)

```bash
curl http://localhost:5000/api/v1/applications/<APPLICATION_ID> -H "Authorization: Bearer <TOKEN>"

curl -X PATCH http://localhost:5000/api/v1/applications/<APPLICATION_ID>/status \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{ "status": "accepted", "reviewNotes": "Great answers" }'
```
`status` must be one of `shortlisted`, `interview`, `accepted`, `rejected`. Setting `accepted`
automatically creates/reactivates the applicant's club membership.

---

## 5. Events (`/clubs/:clubId/events`, `/events`)

### Create an event — coordinator (own club) or admin
```bash
curl -X POST http://localhost:5000/api/v1/clubs/<CLUB_ID>/events \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "title": "Robotics Showcase",
    "description": "Annual demo day",
    "venue": "Main Auditorium",
    "startTime": "2026-10-15T17:00:00Z",
    "endTime": "2026-10-15T20:00:00Z",
    "registrationRequired": true,
    "capacity": 100
  }'
```

### List / get events
```bash
curl "http://localhost:5000/api/v1/clubs/<CLUB_ID>/events?status=scheduled"
curl http://localhost:5000/api/v1/events/<EVENT_ID>
```

### Update / cancel — coordinator (own club) or admin
```bash
curl -X PATCH http://localhost:5000/api/v1/events/<EVENT_ID> \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{ "venue": "Room 204" }'

curl -X DELETE http://localhost:5000/api/v1/events/<EVENT_ID> -H "Authorization: Bearer <TOKEN>"
```

### Register / cancel registration — any logged-in user
```bash
curl -X POST http://localhost:5000/api/v1/events/<EVENT_ID>/register -H "Authorization: Bearer <TOKEN>"
curl -X DELETE http://localhost:5000/api/v1/events/<EVENT_ID>/register -H "Authorization: Bearer <TOKEN>"
```

### View registrations — coordinator (own club) or admin
```bash
curl http://localhost:5000/api/v1/events/<EVENT_ID>/registrations -H "Authorization: Bearer <TOKEN>"
```

---

## 6. Attendance (`/events/:eventId/attendance`)

### Generate a code — coordinator (own club) or admin
```bash
curl -X POST http://localhost:5000/api/v1/events/<EVENT_ID>/attendance/session -H "Authorization: Bearer <TOKEN>"
```
Returns `{ "session": { "code": "a1b2c3d4e5f6", "expiresAt": "..." } }` — valid for 5 minutes.

### Mark attendance with the code — the registered student
```bash
curl -X POST http://localhost:5000/api/v1/events/<EVENT_ID>/attendance/scan \
  -H "Content-Type: application/json" -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{ "code": "a1b2c3d4e5f6" }'
```

### Manual mark — coordinator (own club) or admin
```bash
curl -X POST http://localhost:5000/api/v1/events/<EVENT_ID>/attendance/manual/<USER_ID> -H "Authorization: Bearer <TOKEN>"
```

### View attendance log — coordinator (own club) or admin
```bash
curl http://localhost:5000/api/v1/events/<EVENT_ID>/attendance/logs -H "Authorization: Bearer <TOKEN>"
```

---

## 7. Certificates

### Generate — coordinator (own club) or admin
```bash
# For every attendee of the event who doesn't already have one:
curl -X POST http://localhost:5000/api/v1/events/<EVENT_ID>/certificates/generate-all -H "Authorization: Bearer <TOKEN>"

# For one specific attendee:
curl -X POST http://localhost:5000/api/v1/events/<EVENT_ID>/certificates/<USER_ID> -H "Authorization: Bearer <TOKEN>"
```
Fails with `400` if the target user has no attendance record for that event.

### Verify — public, no auth
```bash
curl http://localhost:5000/api/v1/certificates/verify/CERT-A1B2C3D4E5
```

### Download PDF — owner, issuing club's coordinator, or admin
```bash
curl -L http://localhost:5000/api/v1/certificates/CERT-A1B2C3D4E5/download \
  -H "Authorization: Bearer <TOKEN>" -o certificate.pdf
```

---

## 8. Users (`/users/:id/...`) — self or admin

```bash
curl http://localhost:5000/api/v1/users/<USER_ID>/applications -H "Authorization: Bearer <TOKEN>"
curl http://localhost:5000/api/v1/users/<USER_ID>/events -H "Authorization: Bearer <TOKEN>"
curl http://localhost:5000/api/v1/users/<USER_ID>/certificates -H "Authorization: Bearer <TOKEN>"
```

---

## 9. Admin (`/admin`) — admin only

```bash
curl "http://localhost:5000/api/v1/admin/users?role=student&search=jaison&page=1&limit=20" -H "Authorization: Bearer <ADMIN_TOKEN>"
curl http://localhost:5000/api/v1/admin/users/<USER_ID> -H "Authorization: Bearer <ADMIN_TOKEN>"

curl -X PATCH http://localhost:5000/api/v1/admin/users/<USER_ID>/role \
  -H "Content-Type: application/json" -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{ "role": "coordinator" }'

curl -X PATCH http://localhost:5000/api/v1/admin/users/<USER_ID>/disable -H "Authorization: Bearer <ADMIN_TOKEN>"
curl -X PATCH http://localhost:5000/api/v1/admin/users/<USER_ID>/enable -H "Authorization: Bearer <ADMIN_TOKEN>"
```
An admin cannot change their own role or disable their own account (blocked server-side).

---

## 10. Full end-to-end test script (the required workflow, in order)

Run these in sequence, swapping in real IDs/tokens as each response gives them to you.
This walks through *every* required workflow from your spec in one pass.

```bash
BASE=http://localhost:5000/api/v1

# --- Bootstrap an admin (first admin has to be set directly in MongoDB) ---
# mongosh: db.users.updateOne({email:"admin@sxcce.edu"}, {$set:{role:"admin"}})

# 1. Student registers and logs in
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Student One","email":"student1@sxcce.edu","password":"password123"}'
STUDENT_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student1@sxcce.edu","password":"password123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")

# 2. Same student creates a club (becomes its coordinator, club is pending)
CLUB_ID=$(curl -s -X POST $BASE/clubs -H "Content-Type: application/json" -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{"name":"Robotics Club","description":"We build robots","tags":["robotics"]}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['club']['_id'])")

# 3. Admin approves it
ADMIN_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@sxcce.edu","password":"adminpass123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")
curl -s -X PATCH $BASE/clubs/$CLUB_ID/approve -H "Authorization: Bearer $ADMIN_TOKEN"

# 4. Coordinator (the student from step 1/2, now promoted) creates a recruitment drive
DRIVE_ID=$(curl -s -X POST $BASE/clubs/$CLUB_ID/drives -H "Content-Type: application/json" -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{"title":"Fall Drive","formFields":[{"label":"Why join?","type":"textarea","required":true}],"openDate":"2026-01-01","closeDate":"2026-12-31"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['drive']['_id'])")

# 5. A second student applies
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Student Two","email":"student2@sxcce.edu","password":"password123"}'
STUDENT2_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student2@sxcce.edu","password":"password123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")
APP_ID=$(curl -s -X POST $BASE/drives/$DRIVE_ID/apply -H "Content-Type: application/json" -H "Authorization: Bearer $STUDENT2_TOKEN" \
  -d '{"responses":[{"field":"Why join?","value":"I love robots"}]}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['application']['_id'])")

# 6. Coordinator accepts the application -> student2 becomes a club member
curl -s -X PATCH $BASE/applications/$APP_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{"status":"accepted"}'

# 7. Coordinator creates an event
EVENT_ID=$(curl -s -X POST $BASE/clubs/$CLUB_ID/events -H "Content-Type: application/json" -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{"title":"Kickoff Meetup","startTime":"2026-09-20T17:00:00Z","endTime":"2026-09-20T19:00:00Z"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['event']['_id'])")

# 8. Student2 registers for the event
curl -s -X POST $BASE/events/$EVENT_ID/register -H "Authorization: Bearer $STUDENT2_TOKEN"

# 9. Coordinator generates an attendance code
CODE=$(curl -s -X POST $BASE/events/$EVENT_ID/attendance/session -H "Authorization: Bearer $STUDENT_TOKEN" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['session']['code'])")

# 10. Student2 marks attendance
curl -s -X POST $BASE/events/$EVENT_ID/attendance/scan -H "Content-Type: application/json" -H "Authorization: Bearer $STUDENT2_TOKEN" \
  -d "{\"code\":\"$CODE\"}"

# 11. Coordinator generates certificates for all attendees
curl -s -X POST $BASE/events/$EVENT_ID/certificates/generate-all -H "Authorization: Bearer $STUDENT_TOKEN"

# 12. Student2 lists and downloads their certificate
STUDENT2_ID=$(curl -s $BASE/auth/me -H "Authorization: Bearer $STUDENT2_TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['user']['_id'])")
CERT_ID=$(curl -s $BASE/users/$STUDENT2_ID/certificates -H "Authorization: Bearer $STUDENT2_TOKEN" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['certificates'][0]['certificateId'])")
curl -s -L $BASE/certificates/$CERT_ID/download -H "Authorization: Bearer $STUDENT2_TOKEN" -o certificate.pdf
echo "Certificate saved to certificate.pdf"

# 13. Anyone can verify it publicly, no token needed
curl -s $BASE/certificates/verify/$CERT_ID
```

---

## Quick reference: who can do what

| Action | Student | Coordinator (own club) | Admin |
|---|---|---|---|
| Create club | ✅ (becomes coordinator, pending) | ✅ | ✅ (auto-active) |
| Approve/reject/suspend club | ❌ | ❌ | ✅ |
| Edit club | ❌ | ✅ own only | ✅ |
| Create drive / event | ❌ | ✅ own club | ✅ |
| Apply to drive | ✅ | ❌ | ❌ |
| Review applications | ❌ | ✅ own club | ✅ |
| Register for event | ✅ | ✅ | ✅ |
| Generate attendance code | ❌ | ✅ own club | ✅ |
| Mark own attendance | ✅ (if registered) | — | — |
| Generate certificates | ❌ | ✅ own club | ✅ |
| Manage users / roles | ❌ | ❌ | ✅ |

## Common error responses you'll see while testing

| Status | Meaning |
|---|---|
| `401` | Missing/expired/invalid token |
| `403` | Logged in, but wrong role or not the resource owner |
| `404` | Not found (or, for non-active clubs, hidden from you on purpose) |
| `409` | Duplicate (already applied / already registered / already a member) |
| `422` | Validation failed — check `errors` array in the response for field-level messages |
