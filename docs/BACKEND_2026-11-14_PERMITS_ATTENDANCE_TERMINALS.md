# Backend changes: permits, attendance registry, routing, terminals (14 Nov 2026)

Decided by the product owner on 14 Nov. The frontend in this branch is ready and degrades
safely until each item below is deployed. I do not have the backend repository, so this is a
specification with the exact routes and fields the frontend calls.

## 1. Access permits: the RGM approves, ACOS issues

Today any office holding a permit can approve or reject it. The rule now:

| Holder | May do |
|---|---|
| Regional General Manager (position code `RGM`) | Reject, or **approve and send to ACOS** |
| Airport Chief of Security (position code `ACOS`) | Reject, or **issue** (`POST /approve`) once the RGM has approved; visitor permits: issue directly |
| Anyone else (any HOD, unit, CII, ...) | Read, minute on, return. **No approve or reject.** |
| Super admin | Anything, logged |

Server changes:

1. `POST /stakeholder-orgs/permits/:id/approve` and `/reject`: allow only the RGM or ACOS
   position holders (and super admin). Others get 403 "Only the RGM and the Airport Chief of
   Security decide access permits".
2. `/approve` by ACOS on a non-visitor permit is refused (409) unless the RGM has approved.
3. Record the RGM's approval: when the RGM forwards a permit to ACOS, either add a step
   `stepType: "rgm_approved"` (preferred) or set `rgmApprovedAt` on the permit and return it.
   The frontend accepts either, and falls back to "a forward from the RGM office to ACOS".
4. Concessionaire trail: `rgm_approved` shows as "Approved by the RGM, sent to ACOS".

## 2. Contractors: confirmed by their HOD with a letter of introduction

A contractor names the department it works for when applying. **The permit still goes to the
RGM** (it is not routed through the HOD). The HOD of that department is notified and confirms
the contractor by sending a letter of introduction. The RGM can approve a contractor's permit
only after that.

1. `POST /stakeholder-orgs/:orgId/permits` accepts `sponsorDepartmentId` (and, while the list
   below is missing, `sponsorDepartmentName` as free text). Required when the company's
   `stakeholderType` is `contractor`; 400 otherwise. Store both; return them on every permit row
   with `introducedAt` (null until confirmed).
2. `GET /stakeholder-orgs/sponsor-departments` for portal users: top-level departments,
   `[{ id, name }]`.
3. **Notify the HOD** of the sponsor department when a contractor applies: in-app (staff
   notifications) and email: "QA-TEST Contractor Ltd has applied for an access permit as a
   contractor for Environmental Services. Confirm them with a letter of introduction."
4. `GET /stakeholder-orgs/permits?awaitingIntroduction=true`: pending permits whose
   `sponsorDepartmentId` is the caller's department (HOD) and `introducedAt` is null.
5. `POST /stakeholder-orgs/permits/:id/introduce` with `{ note, attachments: [fileId] }`, by the
   HOD of the sponsor department only (at least one attachment). Sets `introducedAt`, adds a
   step `stepType: "introduced"` with `toOffice` = the sponsor department (the permit's holder
   does **not** change), and notifies the RGM office.
6. Let the sponsor HOD upload to `POST /stakeholder-orgs/permits/:id/attachments` for that
   permit (today only the holder may), so the letter can be attached.
7. `/approve`-to-ACOS by the RGM on a contractor permit with `introducedAt` null: 409 "Waiting
   for the letter of introduction from <department>".
8. Concessionaire trail shows "Confirmed by Environmental Services (letter of introduction)";
   the letter itself and the note stay staff-only.

## 3. Starting offices are fixed by the system

The Routing settings screen no longer offers a choice. Remove (or restrict to a migration
script) `PUT /stakeholder-orgs/routing-settings/:routeKey`. Fixed rules:

- Permits, requests and invoices start at the position with code `RGM`.
- Visitor permits start at the position with code `ACOS`.
- A position with either code cannot be deleted or re-coded.

The named-readers list (who may read all minutes) stays, as "Minute access" for super admins.

## 4. Attendance Registry: HR and heads only, scoped down the hierarchy

`GET /attendance?date=&include_roster=true` (the registry) must enforce:

| Caller | Sees |
|---|---|
| super admin, org admin, HR, GM, RGM | everyone |
| HOD, ACOS (head of AVSEC) | their department and every unit below it |
| Unit Head (HOU / manager) | their unit |
| Station Head, Team Head (supervisor) | their unit (better: the staff of their station or team) |
| anyone else | 403 |

The frontend already filters by the same rule, but that is display only. Add the roles the
product owner named that do not exist yet: `gm`, `hou`, `supervisor` (station or team head);
today only `hr, rgm, hod, manager, officer, staff, acos, auditor, registry_clerk, org_admin,
super_admin` exist. Also return `departmentId` on each registry row.

## 5. One officer, several terminals

`assignedTerminals` already holds several codes (`'["IT1","IT2"]'`) and check-in works with it.
To finish:

1. A roster entry should be able to cover more than one terminal for a shift: add
   `dutyTerminalIds: string[]` (keep `terminalId` for one). The rostered-zone check at check-in
   accepts any of them.
2. When the person is not rostered, refuse check-in outside their assigned terminals' zones
   ("You are not assigned to MMA2"), at least for AVSEC.
3. Return `assignedTerminals` on `GET /auth/me` too (today only on `/self-service/profile`).

## 6. Found while testing

- **A deactivated account can still sign in and use the API.** On 14 Nov the 14 QA-TEST staff
  were deactivated (`isActive=false`); Test Officer PC could still sign in, read documents and
  check in at a station. Refuse inactive users at sign-in and in the auth middleware.
- **One officer cannot check in at all.** `femi.oladipo@nams-demo.test`:
  `POST /attendance/check-in` returns 500 at any terminal, with or without a terminal code, while
  other officers in the same unit check in fine. Check the server log for that user.
- The roster planner still shows the unit's old Morning/Afternoon shift rows as "Shift with
  nobody on it" when a 12-hour roster is built; consider hiding shift rows the roster's pattern
  does not use.
