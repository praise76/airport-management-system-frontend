---
title: MMIA Test Pack - Developer Brief
subtitle: Frontend fixes in this bundle, and the backend work still needed
date: 20 November 2026
---

## Summary

The MMIA system test pack scored **9 of 54** on the live system on 20 November 2026 (frontend build 3d91461). The branch is rebased on the newer `main` (a8d666d, "Today home screen and a short menu per role…"). This brief comes with a git bundle of **8 frontend commits** (plus this brief, in `docs/`) that fix what can be fixed in the frontend. It also lists the **backend work**, in priority order, that the rest of the failures need.

**Do first: the backend document leak (B1).** Any signed-in staff member can open any document in full by its link, whatever their department or rank. Until it is fixed the system should not go to a pilot.

Each backend item names the test-pack cases it fixes and how to check it. Rerunning the 54-case pack after the backend work is the acceptance test.

## How to apply the frontend bundle

Base: `main` at `a8d666d` (20 November 2026, "feat: Today home screen and a short menu per role…"). Branch: `feat/test-pack-fixes`: 9 commits, the 8 code changes and this brief.

```bash
git fetch nams-test-pack-fixes.bundle feat/test-pack-fixes:feat/test-pack-fixes
```

or, as patches:

```bash
git am patches/*.patch
```

Then:

```bash
pnpm install && pnpm test && pnpm build
```

Checked before packaging:

- `pnpm test`: 220 tests pass (192 on `main`; 28 new).
- `tsc --noEmit`: 29 errors, all present on `main` before; none added.
- `biome check`: 689 errors (692 on `main`); the changed files add none.
- `pnpm build` succeeds.
- Each change was tried in a browser against the live backend with QA-TEST accounts (see the last column of the table below).

## Frontend changes in the bundle

| Commit | Test pack | What changed | Checked in the browser |
|---|---|---|---|
| fix(errors): plain words when refused from a chat | 2 | "Not a member of this conversation" becomes "You aren't in this chat. A station chat opens to you when you check in at that station." "Not authorized to add members" is explained too. (Server faults are already covered on `main` by `SERVER_PROBLEM`.) | Unit tests |
| feat(messages): emergency alerts that everyone must acknowledge | 28, 29 | Supervisors and above get an **Alert** toggle in chat; an alert is sent as emergency, critical, acknowledgment required (the server already supports this). Recipients get **Acknowledge**; everyone sees "N of M acknowledged · K pending" and who. | Yes: the ACOS saw "2 of 3 acknowledged · 1 pending"; an officer acknowledged and it became "3 of 3"; officers have no Alert toggle |
| fix(messages): recognise your own messages and alerts | First system test | Staff sign-in stores the user id as `id`; chat compared with `userId` only, so your own messages looked like everyone else's and an alert's sender was offered Acknowledge. Now uses `userId ?? id`. | Yes |
| fix(messages): readable text on your own alerts | 28 | Your own alert had white text on light red. Alerts now use dark red text whoever sent them. | Yes |
| feat(auth): sign out after 30 minutes without activity | 54 | Staff app and partner portal sign out after 30 minutes without activity, across tabs, with a message. Wall displays under /public are exempt. | Yes: 31 minutes idle signed out with the message; 20 minutes did not; signing straight back in worked |
| feat(portal): keep an unfinished permit application on the device | 53 | The permit form keeps what was typed (per company, 7 days) until submitted, and says so. | Yes: a name typed, the phone taken offline and reloaded, and the name was still there |
| feat(attendance): keep a check-in made offline and send it on reconnect | 31 | Offline, Check in saves the check-in on the phone with the time pressed and shows a banner; it is sent on reconnect with that time in `notes`. Works with the new guided check-in on `main`. Needs backend B6 to record the original time. | Yes: saved offline at 07:17, sent automatically on reconnect |
| fix(acting): banner names the role being covered and until when | 20 | "Acting Role Active: manager" becomes "You are acting Head of Department … until the end of 21 Nov 2026". The "View Handover" button linked to a page that does not exist; removed. | Yes |

## Backend work, in priority order

### B1. Document access control (critical; tests 15, 17, 21)

**Problem.** `GET /api/documents/:id` returns the full document (subject, sender, content, file link) to any signed-in staff member. Eight QA-TEST accounts in four departments, from officer to HOD, all opened ENVSC/2026/11/0005, ENVSC/2026/11/0004 and AVSEC/2026/11/0001. Lists and search are filtered correctly, so this only needs the document's link, but links travel in chat and notifications.

**Change.** On the detail route, the file download and any route that returns document content, allow only:

- people on the document's path (registered by, forwarded to or from, current handler);
- the head of the holding department and the department line above it;
- the RGM's office for incoming mail;
- an acting HOD, during their delegation, for their own department;
- auditors.

Return 404 to everyone else.

**Check.** Open ENVSC/2026/11/0005 as `qa.claude.off.pc`, `qa.claude.hod.avsec` and `qa.claude.hod.com`: each must get 404. The ENV head still gets it.

### B2. Group records and members (critical, privacy; test 13)

**Problem.** `GET /api/groups/:id` and `/groups/:id/members` answer anyone. An ENV officer listed the AVSEC Passenger Screening group's 25 members with names and email addresses.

**Change.** Limit both routes to the group's members, its department's managers and admins.

**Check.** `qa.claude.off.wbc` gets 403 for the AVSEC groups, and `qa.claude.off.pc` gets 403 for the ENV groups.

### B3. Partner portal sign-in (high; tests 47, 54)

1. **Lockout.** Lock the account for 15 minutes after 5 failed passwords and tell the user. 6 failures in a row are accepted today.
2. **OTP sign-in.** Add it as an option; there is no route now.
3. **Refresh token.** It lives 7 days. Expire it after 30 minutes without use, to match the new frontend idle sign-out, and rotate it on use.
4. **Removing a user.** Let a company admin deactivate their own users: `PATCH /stakeholder-orgs/users/:id` returns "Staff access only" to them today. Deactivation must end that user's sessions.

### B4. Station check-in rules (high; tests 3 to 6, 11)

1. **One active check-in per person.** Refuse a second, naming the current station: "You're checked in at LOS-DOM1. Check out there first." Today an officer was checked in at LOS-DOM1, LOS-DOM2 and LOS-CARGO at the same time.
2. **Unit-to-station assignment.** Store which stations each unit covers (seed data in the test pack). Refuse, or flag for the supervisor, a check-in at a station the person's unit does not cover (AVSEC-PC at LOS-CARGO, ENV-FAC at LOS-RWY).
3. **Check-out removes station channels.** It does not today: officers stayed in every station channel they had ever checked in to.
4. **Posting rule.** When a non-member posts in a station channel, return a clear reason, for example "Check in at LOS-DOM1 to post here". The frontend now has a plain fallback for "Not a member of this conversation".

### B5. Geofence and no-show alerts (tests 7, 30)

- **Geofence refusal.** When a check-in is refused for being outside the geofence, notify the person's supervisor, with the distance.
- **No-show job.** 30 minutes after a rostered shift starts, mark anyone not clocked in as `no_show` and alert their supervisor. At 07:28 on 20 November, 22 people due at 06:00 still showed "scheduled".

### B6. Original time for offline check-ins (test 31)

Accept an optional `capturedAt` (ISO time) on `POST /attendance/check-in`. If it is in the last 12 hours and before the time received, record it as the check-in time and keep both times. The frontend already sends the original time in `notes` and is ready to send `capturedAt` as soon as the field exists. Also return `notes` in `GET /attendance`, which it does not today.

### B7. Roster weekday patterns (tests 26, 27)

"Permanent morning (Mon-Fri)" counts days from the start date instead of using weekdays. With a start on Saturday 14 November, the test supervisor was rostered Sat, Sun, Mon, Tue, Wed and the next Sat, and missed Thu and Fri. Weekday patterns must use the calendar day of the week. The 2-2-2 rotation is correct and needs no change.

### B8. Document registration and routing (tests 14, 16, 18)

1. **Registration.** Limit incoming registration to the RGM's registry. An HOD could register incoming mail.
2. **Numbering.** Number incoming mail `LOS/IN/{DEPT}/{YEAR}/{NNN}`, one counter per department per year. It is `ENVSC/2026/11/0005` today.
3. **Who receives it.** Mail goes to the person set as the department's head (ENV: Chinedu Okeke, role "Head of Unit"), not to users with the HOD role. Either route by the HOD role, or show the set head in Staff management so admins can see and change it.
4. **History.** Add who acted to each step of `GET /documents/:id/journey`. The UI history shows times and offices but no names.

### B9. Acting HOD (tests 19 to 23)

1. **Automatic start and end.** A scheduled job moves `scheduled` to `active` on the start date and `active` to `completed` after the end date. Today an HOD must activate a delegation by hand.
2. **Handover checklist.** Create one from a template when a delegation is created.
3. **No overlaps.** Refuse a delegation that overlaps another one for the same HOD.
4. **Documents.** While active, give the acting user the HOD's document view for that department only. The acting manager saw 0 documents.
5. **Action log.** Log every action taken while acting (approvals, forwards, views).
6. **Summary.** When the delegation ends, send the HOD a summary of what was done.
7. **List route.** Add `GET /acting-hod/assignments` (returns 404 today) so a handover page can be built.

### B10. Department-wide emergency broadcast (test 28)

Create an "AVSEC Emergency Alert" group per department (and an airport-wide one). It includes every member of the department whether on duty or not, cannot be muted or left, and accepts posts only from supervisors and above. ENV staff must never be in AVSEC's. The frontend's new Alert toggle works in any chat, so it works in this group as soon as it exists.

### B11. Concessionaire approval and suspension (tests 32, 33, 46)

1. **Registration.** Add requested stations (from the station list) and a signed agreement upload.
2. **Approval.** Let the Commercial HOD verify a company. It is refused even with "Can review stakeholder submissions" switched on, and without that flag their document review is refused too. On approval, assign a concessionaire code and approved stations, and send SMS and email.
3. **Suspension.** Suspension must also suspend the company's permits and cards, and show the reason at sign-in. The 8 approved permits stayed "approved". Let Commercial suspend. Note that re-verifying a suspended company shows it as "active" while its users stay blocked; only "unsuspend" restores them.

### B12. On-Duty Card (ODC) module (tests 36 to 45)

Not built. Permits stand in for part of it. Needed:

- A staff register (name, job, 11-digit NIN, phone, passport photo, stations, start date), with checks and bulk upload with an error report.
- ODC applications and renewals for selected staff, with a request letter, going to the RGM's registry as "Pending Registration".
- Registration and assignment to the Pass Office.
- Per-person approve or reject by the Pass Office. Today only the RGM and ACOS can decide permits.
- A fee invoice for approved staff, and payment through Remita or Paystack with receipts.
- Card stages: Printed, Ready for Collection, Issued, each with SMS; 12-month expiry.
- Expiry alerts at 90, 60 and 30 days.
- A gate lookup by card number for Access Control, showing photo, company, stations, expiry and status.

### B13. Company messaging, notices and audit log (tests 49 to 52)

- **Messaging.** Companies to Commercial and the Pass Office only, with replies. Today companies get "Staff access only".
- **Notices.** By company category, with read receipts.
- **Agreement expiry.** Reminders 60 days before the lease or agreement ends, to the company and Commercial, and an automatic flag after a grace period.
- **Audit log.** Every company action with user, time, device and change, exportable to CSV. No audit route exists.

## Seed data to add or correct

- AVSEC units missing: Baggage Screening (AVSEC-BAG), Cargo Inspection (AVSEC-CAR), Terminal Patrol (AVSEC-PAT), Supervisors / Station Heads (AVSEC-SUP).
- Teams named Alpha, Bravo and Charlie with chat channels; Day and Night shift groups.
- Unit-to-station assignments, as in the test pack tables.
- The Pass Office as a unit of HR.
- Concessionaire categories as in the test pack: Food and Beverage, Retail, Ground Handling, Cleaning Contractor, Car Rental and Transport, Banking and Forex, Airline Office, Catering.

## Also noticed

- **Requisitions.** `src/routes/inventory/requisitions/$requisitionId.tsx` compares with `user.userId` only, which is empty for staff (see the own-messages fix). If the server's `canDecide` / `canIssue` is missing, approvers would not see their buttons. Use `userId ?? id` there too.
- **Usability.** Today screens, short menus per role and guided check-in are now on `main` (a8d666d). Guided minuting from the usability plan is still to do.

## Test data left on the live system

Listed in full in "MMIA Test Pack - Results" (20 November 2026). In short:

- 15 `qa.claude.*@nams-demo.test` staff accounts.
- QA-TEST Concessionaire A Ltd and B Ltd (Claude).
- Two ENV letters.
- 9 permits.
- One message in the International Terminal station channel, and the "QA-TEST Emergency drill (Claude)" group, now acknowledged by all three officers.
- Acting HOD delegations (all ended or cancelled).
- One permanent-morning pattern assignment.

The QA accounts can be reused to rerun the pack after the backend work.
