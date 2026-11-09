# Backend fixes from the 8 Nov 2026 QA run

The frontend fixes for these findings are on branch `qa-fixes-2026-11-08` of this repo.
The items below need changes in the **backend** repository, which wasn't available to the
person who did the testing. Each item lists what was observed against the live API
(`airport-management-system-backend-ed7t.onrender.com`), the likely cause, and a concrete
fix. The code is written for an Express + zod service; adapt names to the real modules.

Finding IDs match the QA report (ATT-01, LV-02, …).

---

## Critical

### ATT-01 / ATT-02: Check-in ignores the geofence

**Observed:** `POST /api/attendance/location-status` returned `{inside:false, zone:null}`,
then `POST /api/attendance/check-in` returned `200 clocked_in` from 2.4 km away. An officer
rostered at IT1 also checked in at MMA2.

**Fix:** run the point-in-zone test on the server, in the check-in handler, against the
rostered zone.

```ts
// attendance/check-in.handler.ts
const body = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  accuracy: z.number().nonnegative().max(500).optional(),
  terminalCode: z.string().optional(),
  clockInMethod: z.enum(['geofence', 'manual']).default('geofence'),
  deviceId: z.string().optional(),
}).parse(req.body);

const entry = await rosterRepo.findEntryForDuty(req.user.id, nowInOrgTz(org));   // see ATT-03
const candidates = entry?.dutyLocation && isUuid(entry.dutyLocation)
  ? [await zonesRepo.getActive(entry.dutyLocation)].filter(Boolean)
  : await zonesRepo.listActive(req.user.organizationId);

const hit = candidates.find(z => isInsideZone(z, body.lat, body.lng, body.accuracy ?? 0));
if (!hit) {
  return res.status(403).json({
    success: false,
    error: entry?.dutyLocation
      ? 'You are outside your rostered check-in zone'
      : 'You are outside every check-in zone',
    code: 'OUTSIDE_ZONE',
  });
}
// only privileged roles may use clockInMethod 'manual', and it must be audited
await attendanceRepo.clockIn({ userId: req.user.id, zoneId: hit.id, ...body });
```

`isInsideZone` should allow for GPS accuracy, e.g. `distance <= radius + min(accuracy, 50)`,
and handle polygons with a point-in-polygon test. Store the zone id on the log, not only the
zone name.

**Tests:** check-in outside every zone → 403; inside a zone other than the rostered one → 403;
inside the rostered zone → 200; not rostered and inside any active zone → 200.

### SEC-01: Officers receive other people's attendance

**Observed:** `GET /api/attendance?pageSize=30` with an officer token returned the CEO's,
the System Administrator's and a manager's records.

```ts
const canSeeAll = hasAnyRole(req.user, ['super_admin', 'org_admin', 'hr', 'hod', 'rgm', 'acos'])
  || hasPermission(req.user, 'attendance.view_all');
const where = { organizationId: req.user.organizationId, ...(canSeeAll ? {} : { userId: req.user.id }) };
```

HODs should probably be limited to their own department and its child units.

### SEC-02: Any officer can create terminals

**Observed:** `POST /api/terminals` with an officer token returned 201.

```ts
router.post('/terminals', requireRole('super_admin', 'org_admin'), createTerminal);
router.patch('/terminals/:id', requireRole('super_admin', 'org_admin'), updateTerminal);
router.delete('/terminals/:id', requireRole('super_admin', 'org_admin'), deleteTerminal);
router.post('/terminals/seed-mmia', requireRole('super_admin'), seedMmia);
```

Add a test that loops over every non-GET route and calls it as `officer`, expecting 403
unless the route is on an explicit allow-list.

### LV-01: Leave review contract mismatch

**Observed:** the API validates `{approved: boolean}`, but `api.json` documents
`{decision: "approve"|"reject"}`. The frontend now sends both. Make the backend accept either,
and update `api.json` to match.

```ts
const ReviewLeaveInput = z.object({
  decision: z.enum(['approve', 'reject']).optional(),
  approved: z.boolean().optional(),
  comments: z.string().max(2000).optional(),
}).refine(v => v.decision !== undefined || v.approved !== undefined, 'decision is required')
  .transform(v => ({ approved: v.approved ?? v.decision === 'approve', comments: v.comments }));
```

Also, once a request is final (`approved`, `rejected` or `cancelled`), reject further reviews
with 409. In QA the HR stage accepted an approval on an already-approved request. Return
400 "Invalid level" only for unknown levels.

### LV-02: Approvers are refused their own queue

**Observed:** `GET /self-service/leave/pending/hod` → 403 for the HOD; `/hr` → 403 for HR;
`/supervisor` → 403 for the supervisor.

```ts
const LEVEL_ROLES = {
  supervisor: ['supervisor', 'hou', 'manager'],
  hod: ['hod', 'acos', 'rgm'],
  hr: ['hr'],
} as const;
const ADMIN = ['super_admin', 'org_admin'];

router.get('/self-service/leave/pending/:level', (req, res, next) => {
  const level = req.params.level as keyof typeof LEVEL_ROLES;
  if (!LEVEL_ROLES[level]) return res.status(400).json({ success: false, error: 'Invalid level' });
  if (!hasAnyRole(req.user, [...LEVEL_ROLES[level], ...ADMIN])) return res.status(403).json({ success: false, error: 'Forbidden' });
  next();
}, listPendingLeave);
```

Scope the list to the approver's department (and child units) unless they're an admin or HR.
Include `user: {id, firstName, lastName}` in each item; the screen showed "Unknown Staff".
If managers should approve at supervisor level, also add `MANAGER` to `approvalLevelsFor`
in `src/hooks/leave.ts` and to the route guard of `/admin/leave/approvals` (the manager was
redirected away from that page).

---

## High

### LV-03: Approved leave doesn't touch the roster
When a request becomes `approved`, mark overlapping roster entries (same user, dutyDate
between startDate and endDate) as `on_leave`, or release them, inside the same transaction.
Add a `leave_conflict` rule to the roster's publish checks.

### LV-04: Overlapping leave accepted
```ts
const clash = await leaveRepo.findFirst({
  userId, status: { in: ['pending', 'approved'] },
  startDate: { lte: endDate }, endDate: { gte: startDate },
});
if (clash) return res.status(409).json({ success: false,
  error: `You already have ${clash.leaveType} leave from ${clash.startDate} to ${clash.endDate}` });
```

### LV-05: No leave balances
`GET /self-service/leave/balance` returns `[]` for every user. Create entitlement rows when a
user is created (including through the Excel import), using the organisation's leave policy.
Check `remaining >= totalDays` on apply (warn) and on final approval (block, or allow with
override).

### ATT-03: Shift times treated as UTC
`scheduledStart` was `2026-11-08T06:00:00.000Z` for a 06:00 Lagos shift, so lateness was
238 minutes instead of 298. Build the instant from the duty date and the shift's wall-clock
time in the organisation's timezone:

```ts
import { fromZonedTime } from 'date-fns-tz';
const tz = org.timezone ?? 'Africa/Lagos';
const scheduledStart = fromZonedTime(`${entry.dutyDate}T${entry.shiftStartTime}`, tz);
// a night shift that ends before it starts finishes the next day
```

Use the same helper for the registry, the duty board, reports and the swap rest-time rule.

### ATT-04: Attendance Registry duplicates and misses check-ins
The registry listed people twice (System Administrator, Chidi Okafor, Emeka Eze), showed no
shift, and showed Emeka "Not clocked in" while he was checked in. Likely a join that fans out
(roster entries × group memberships) and a date match done in UTC. Group by `user.id`, join
roster entries on `(userId, dutyDate)`, and match attendance logs on the local duty date.

### RST-02: Roster silently attached to a unit
With no unit chosen, `POST /roster` saved `unitDepartmentId` = Operations Registry. Remove
the fallback to the department's first child unit; a department-level roster should have
`unitDepartmentId: null`. Shift definitions created for it inherited the wrong unit too.

### RST-03: `GET /roster/patterns` returns 500
It fails on every call. Check the server log; a missing table or column after a migration is
the most likely cause. Add a smoke test that calls it on an empty organisation.

### RST-05: Swaps
1. `GET /roster/swaps/approvals` → 403 for `supervisor`; allow `supervisor`, `hou`,
   `manager`, `hod`, scoped to their unit.
2. A marketplace post approved by a manager became `approved` with no taker, and never
   appeared in `GET /roster/swaps/marketplace`. Approval of a marketplace post should set
   `open_marketplace` (listed), and only a claim should move the shift and set `completed`.
3. `GET /roster/swaps?status=all` → 500.
4. Include `requestingStaff` and `targetStaff` `{id, firstName, lastName}` in swap responses.
   The frontend now reads them via `normalizeSwap`.

### DOC-01: Forwarded documents invisible to the department
After "Forward to department: Operations", the Operations HOD's `GET /documents` list was
empty; the document only opened by direct link. Include
`currentDepartmentId IN (user's department + child units)` in the list filter for HODs,
managers and registry clerks.

### DOC-02: Sender fields dropped on register
`senderOrg`, `senderName` and `senderRef` were sent but the document shows "Not recorded".
Align the zod schema keys with the form, or map them, and add a round-trip test
(register → GET shows the same sender).

### DOC-03: Forward needs `toRole`
`POST /documents/:id/forward` returns 400 `toRole: expected hod|manager|officer` when it's
missing. The frontend now sends it, but the server can derive it from `toUserId`'s role and
should reject ineligible users with a readable message.

### INV-01: Requisition status changes even when submit fails
`POST /inventory/requisitions/:id/submit` returned 400 "Requester has no position in the
approval hierarchy above them", yet the requisition then showed status `submitted`. Run the
approval-route lookup **before** changing the status, in one transaction. Fall back to the
department HOD when the requester has no position. Imported staff have no position because
the import template has no Position column (STF-02).

### TSK-01: Task due dates
`dueAt` is `date-time`. The frontend now sends one; also consider accepting a plain date
(`z.union([z.string().datetime(), z.string().date()])`) and treating it as end of day in the
organisation's timezone.

### STK-01: Tenant type enum
Fine as an enum. Return the allowed values in the error message, which the frontend now
shows, or expose them through `GET /stakeholder-orgs/meta`.

### STK-02: Permit dates
Validate `validUntil >= validFrom` in both the create and approve handlers. In QA the admin
approved a permit valid from 31 Dec 2026 until 15 Nov 2026.

### STK-03: Unverified companies and verification without documents
* Add `requireVerifiedStakeholder` to permit, invoice and activity create routes. An
  unverified company applied for an **airside** permit minutes after registering.
* `POST /stakeholder-orgs/:id/verify` succeeded with 0 of 4 required documents approved.
  Return 409 with the outstanding list unless `{override: true, reason}` is sent, and audit
  the override.

### STK-04: No admin actions for partner activities
Add `POST /stakeholder-orgs/activities/:id/review` `{decision, comments}` (and an assign
endpoint if needed), following the permit and invoice pattern. The UI then needs buttons on
the stakeholder's Activities tab.

---

## Medium / Low

* **STF-01:** set `mustChangePassword = true` for imported and admin-created users. Return
  403 `PASSWORD_CHANGE_REQUIRED` from protected routes until it's changed.
* **STF-02:** add a `Position Code` column to the import template. After import, add users to
  their department's and units' chat channels (the Operations Registry "All Staff" channel
  had 1 member after 8 Operations staff were imported). Insert in one transaction; 12 rows
  took more than 8 s.
* **GEO-01:** `seed-mmia` creates terminals without coordinates, omits MMA2, and lists
  Bi-Courtney as MMA1's operator (Bi-Courtney runs MMA2). Coordinates from OpenStreetMap
  terminal outlines (centre, radius covering the building + 40 m):

  | Terminal | Lat | Lng | Radius |
  |---|---|---|---|
  | International Terminal 1 (IT1) | 6.578953 | 3.321075 | 280 m |
  | International Terminal 2 (IT2) | 6.576957 | 3.323516 | 200 m |
  | MMA1 Domestic Terminal | 6.590091 | 3.331905 | 120 m |
  | MMA2 Domestic Terminal (Bi-Courtney) | 6.584775 | 3.332757 | 180 m |
  | Cargo Terminal & Apron | 6.568633 | 3.317434 | 200 m |

  GAT, Hajj and Presidential aren't mapped in OpenStreetMap; get their coordinates on site.
  Consider a `terminalId` on geofence zones so a roster entry's terminal implies its zone.
* **ATT-05:** dashboard "Attendance today" is always 0/0, and "Unread 0" sits next to
  "14 conversations with new messages". Reuse the duty-board query; count unread messages,
  not conversations.
* **ATT-06:** record the check-out location and flag out-of-zone check-outs. The duty board
  should show the rostered terminal name, not "Main Terminal".
* **PERF-01:** creating a shift definition took about 30 s and assigning a shift about 7 s;
  a cold start took more than 90 s. The client timeout is 20 s, so slow calls can fail on
  screen while succeeding on the server. Index `organizationId`, `unitDepartmentId`,
  `rosterId` and `(userId, dutyDate)`, and keep the service warm (paid plan, or a scheduled
  ping of `/health`).
* **Messaging search** (`GET /messages/users/search`) is now used by the colleague pickers.
  It requires `q` (1+ characters) and caps `limit` at 20. That's fine for type-to-search,
  but it should respect `departmentId`, which the pickers send.

---

## Roster patterns: 4-shift 2-2-2-2, 12-hour 2-2-2 and permanent morning

The frontend now has presets for these three patterns (`src/features/roster/patternPresets.ts`)
and tells planners how to stagger crews. The backend needs to:

1. **Fix `GET /roster/patterns` (500, RST-03).** Nothing pattern-related works until it does.
2. **Accept a `day` shift type** (12-hour day, e.g. 07:00-19:00) in patterns and roster
   entries. Today `shiftType` is `morning | afternoon | night | off`. Add `day` to the enum,
   and map it in reports, the duty board and the rest-time rules.
3. **Generate entries from assignments.** `POST /roster/patterns/assign {userId, shiftPatternId,
   effectiveFrom}` should, for a roster's date range, create one entry per day using
   `pattern.shiftSequenceJson[(daysSince(effectiveFrom) mod cycleLengthDays)]`, taking the
   times from the unit's shift definitions. Skip days with approved leave (LV-03).
4. **Crew staggering** works through `effectiveFrom`:
   * 12-hour 2-2-2 (D D N N O O): 3 crews, start dates 0, +2 and +4 days. Exactly one crew on
     days and one on nights every day.
   * 4-shift 2-2-2-2 (A A M M N N O O): 4 crews, start dates 0, +2, +4 and +6 days.
     The afternoon-to-morning changeover leaves only 8 h rest (22:00 to 06:00); the rest-time
     check will flag it. The forward version (M M A A N N O O) avoids this.
   * Permanent morning: assign from a Monday; no staggering.
5. **Night shifts cross midnight.** Book a 19:00-07:00 night to its start date. The rest-time
   check must use the real end time (07:00 the next day). Attendance lateness and "on duty"
   must also handle it (see ATT-03 on timezones).
6. **Working hours.** 2-2-2 averages **56 hours a week** (4 × 12 h every 6 days), compared with
   42 h for the 4-shift 2-2-2-2 and 40 h for permanent morning. Confirm this is within FAAN's
   conditions of service and any union agreement before rolling it out.

---

## Crews and crew / shift groups

The frontend now has **Patterns & crews** (`/roster/patterns`). A crew is a named team in a
department (Crew A, B, C …) that works one pattern from one start date. Planners add and remove
people, apply the pattern to everyone's roster, open a crew chat, and see "On duty today",
which lists the crews on each shift.

**How it works today (no backend change needed):** crews are stored as Groups
(`groupType: "cross_functional"`). The pattern id, start date and chat id sit in a tagged line
at the end of the group description (`[crew:v1]{…}`). Applying a pattern calls
`POST /roster/patterns/assign` for each member with `effectiveFrom` = the crew's start date.
The crew chat is a messaging group conversation, and adding a member to the crew also adds them
to the chat.

**Recommended backend changes** (the frontend already reads these fields when they exist):
1. Add `groupType: "crew"` and nullable columns `shiftPatternId`, `crewStartDate` (date) and
   `conversationId` to groups, returned by `GET /groups`. Then drop the description tag.
2. A person should be in at most one crew per department. Enforce this on
   `POST /groups/:id/members` for crew groups.
3. When membership changes, update that person's pattern assignment and the crew chat members on
   the server, so nothing depends on the browser doing it.
4. `GET /roster/crews/on-duty?date=&departmentId=` that returns, for each shift, the crews and
   their members. This drives the duty board and lets notices go to "everyone on Night today".
5. Generate roster entries from crew assignments (see "Roster patterns" above), skipping
   approved leave.

---

# Retest of 9 Nov 2026: backend work still needed

Ranked by urgency. Each was reproduced against the live API on 9 Nov.

## 1. NEW-01 (critical): nobody can apply for leave

`POST /self-service/leave/apply` now returns
`409 "No annual leave entitlement is configured for this staff member"` (and the same for sick
leave) for every user. `GET /self-service/leave/balance` returns `[]`,
`GET /self-service/leave/entitlements` returns **500**, and there's no admin route to set
entitlements.

**Fix, in this order:**
1. One-off migration: create entitlement rows for every active user for the current leave year,
   from the organisation's leave policy. Example for Postgres, adjust names and days:
   ```sql
   INSERT INTO leave_entitlements (id, organization_id, user_id, leave_type, year, entitled_days, used_days)
   SELECT gen_random_uuid(), u.organization_id, u.id, t.leave_type, 2026, t.days, 0
   FROM users u
   CROSS JOIN (VALUES ('annual', 30), ('sick', 10), ('compassionate', 5),
                      ('maternity', 112), ('paternity', 14), ('unpaid', 0)) AS t(leave_type, days)
   WHERE u.is_active
   ON CONFLICT (user_id, leave_type, year) DO NOTHING;
   ```
   Set the real figures from FAAN's conditions of service; maternity and paternity may depend on
   gender or eligibility.
2. Create the same rows whenever a user is created (admin form and Excel import).
3. Add HR endpoints: `GET /admin/leave/entitlements?userId=` and
   `PUT /admin/leave/entitlements/:userId/:leaveType {entitledDays}`, restricted to HR and admins.
   Fix the 500 on `GET /self-service/leave/entitlements`.
4. Leave `unpaid` uncapped, or skip the entitlement check for it.
5. Until 1-3 are live, consider turning the 409 into a warning so staff aren't blocked.

The frontend (branch `qa-fixes-2026-11-09`) now warns users when they have no balances.

## 2. ATT-02 (critical): wrong-zone check-in still accepted

With `terminalCode: "IT1"` (as the app always sends), Emeka, rostered at IT1 (zone
`2cca8bb8…`), checked in at MMA2 (6.584775, 3.332757) and got 200. The rostered-zone check
seems to run only when `terminalCode` is absent, and in that case it crashes (item 3).

**Fix:** always compare against the roster entry's zone, whatever the request contains:
```ts
const entry = await rosterRepo.findEntryForDuty(user.id, localDutyDate(org));
const rosteredZoneId = isUuid(entry?.dutyLocation) ? entry!.dutyLocation : null;
const zone = rosteredZoneId
  ? await zonesRepo.findActive(rosteredZoneId)            // may be null if the zone was deleted
  : null;
const candidates = zone ? [zone] : await zonesRepo.listActive(user.organizationId);
const hit = candidates.find(z => isInsideZone(z, lat, lng, accuracy));
if (!hit) return res.status(403).json({ success: false, code: 'OUTSIDE_ZONE',
  error: zone ? `You're not at your rostered post (${zone.name})` : 'You are outside every check-in zone' });
```
`terminalCode` should only label the session. It shouldn't decide which zones are allowed.

## 3. NEW-02 (high): check-in crashes when no terminal is sent

For a rostered user, `POST /attendance/check-in` without `terminalCode` returns **500**, both
inside the rostered zone and outside it. This is probably a null dereference on the terminal
lookup. The code in item 2 removes the dependency. Also wrap the handler so unexpected errors are
logged with the request id and never surface as a bare 500 to staff.

**Tests:** rostered + inside rostered zone, with and without `terminalCode` → 200; rostered + in
another zone → 403; unrostered + inside any zone → 200; outside every zone → 403.

## 4. RST-03 / NEW-03 (high): patterns can be saved but not listed

`POST /roster/patterns` now returns 201, but `GET /roster/patterns` still returns 500, so
Patterns & crews and the Rotation Pattern tab can't show anything. Two patterns were saved in
the retest (“QA RETEST 12-hour 2-2-2” with `day` shifts, and “QA RETEST 4-shift 2-2-2-2”).
Since writes work and reads fail, look at the list query: an `include` of a relation that
doesn't exist, an `orderBy` on a missing column, or a serializer choking on
`shiftSequenceJson` values such as `"day"` (if `shift` is validated against an enum on the way
out). Return the rows as stored, and add a test that creates a pattern and lists it.

## 5. ATT-04 (high): Attendance Registry duplicates

Still lists Emeka Eze, Segun Afolabi, the CEO and the System Administrator twice. Group by
`user.id`, and join roster entries and attendance on `(user_id, local duty date)`. Don't join
through group or position memberships, which fan out.

## 6. DOC-01 (high): HODs can't see documents forwarded to their department

The forwarded document OPS-B1239793/2026/11/0001 still doesn't appear in the Operations HOD's
`GET /documents` list (it opens by direct link). Include
`current_department_id IN (:userDept, ...childUnits)` for HOD, manager and registry clerk.

## 7. NEW-04 (medium): requisition stuck in "submitted"

REQ/2026/11/0004 was set to `submitted` although its submit failed. Data fix:
```sql
UPDATE requisitions r SET status = 'draft', updated_at = now()
WHERE r.status = 'submitted'
  AND NOT EXISTS (SELECT 1 FROM requisition_approvals a WHERE a.requisition_id = r.id);
```
Then make submit transactional (INV-01): resolve the approver first, change the status only on
success.

## 8. PERF-01: cold starts

The API took 42 s to answer after being idle, and a login timed out at 30 s in the browser.
Move to an always-on instance, or ping `/api/health` on a schedule. `/api/health` currently
returns 404, so add one.

---

# Grade-based leave (FAAN policy, 9 Nov 2026)

Replaces the flat figures in "NEW-01" above.

**Rules**
* Every staff member has a **grade level from 1 to 16** on their profile.
* **Annual leave:** Grade 1-7 → **21 working days** a year; Grade 8-16 → **30 working days**.
* **Sick leave** and **exam leave** are open to all staff and **don't come out of the annual
  balance**. The approver may ask for a medical certificate or exam timetable. (Set caps or
  certificate thresholds here if FAAN has any; none were given.)
* Compassionate, maternity, paternity and unpaid leave stay as they are.

**Backend changes**
1. `users.grade_level smallint NULL CHECK (grade_level BETWEEN 1 AND 16)`. Accept and return
   `gradeLevel` on `POST/PUT /admin/staff`, `GET /admin/staff`, `GET /self-service/profile` and
   the login `user` object. The frontend branch `qa-fixes-2026-11-09` already sends and shows it.
2. Staff import: add a **Grade Level** column to the template (1-16, validated in preview with
   "Grade Level must be a whole number from 1 to 16").
3. Add `exam` to the leave-type enum (apply, list, review, reports).
4. Annual entitlement is derived, not typed in:
   ```ts
   export const annualDaysForGrade = (g?: number | null) =>
     g == null ? null : g >= 1 && g <= 7 ? 21 : g >= 8 && g <= 16 ? 30 : null;
   ```
   Create or update the user's annual entitlement for the current leave year whenever a user
   is created, imported, or their grade changes. If the grade changes mid-year, keep
   `used_days` and set `entitled_days` to the new figure (or pro-rate, if HR prefers).
5. One-off migration for existing staff:
   ```sql
   INSERT INTO leave_entitlements (id, organization_id, user_id, leave_type, year, entitled_days, used_days)
   SELECT gen_random_uuid(), u.organization_id, u.id, 'annual', 2026,
          CASE WHEN u.grade_level BETWEEN 1 AND 7 THEN 21 WHEN u.grade_level BETWEEN 8 AND 16 THEN 30 END, 0
   FROM users u
   WHERE u.is_active AND u.grade_level IS NOT NULL
   ON CONFLICT (user_id, leave_type, year) DO UPDATE SET entitled_days = EXCLUDED.entitled_days;
   ```
   Staff without a grade get no annual entitlement until HR sets their grade. Report how many
   active staff are missing a grade so HR can fill them in.
6. `POST /self-service/leave/apply`:
   * `annual`: refuse with 409 when `totalDays > remaining`, with a message that includes the
     remaining days. If the grade or entitlement is missing, say "Your grade level isn't set; ask
     HR to add it".
   * `sick` and `exam`: **no entitlement check**. Record the days for reporting.
7. Working days are Monday to Friday, excluding public holidays. Keep a public-holiday table for
   Nigeria and use it in `/leave/calculate-days` and the balance deduction.
