# Permit office tracking: what the backend must provide

Source: Permit Office Tracking Brief, 10 Nov 2026. The frontend in this branch
(`feat-permit-office-tracking`) is complete and calls the routes below. Until they exist it
degrades safely: no "Currently with" line, no Forward/Return buttons, and the timeline shows
"Submitted" plus the decision from the existing record.

`{kind}` is `permits`, `activities` or `invoices`. Build the routing once and share it.

## Data

- On each permit, activity and invoice: `currentOfficeId`, `currentOfficeName`,
  `currentOfficeSince`, `currentOfficerId` (nullable).
- One movement table: item kind, item id, `stepNumber`, `stepType`
  (`submitted | forwarded | returned | acknowledged | approved | rejected`), from office,
  to office, to officer (optional), acting staff user, `minute`, `createdAt`.
- On creation write the `submitted` step. First holder: RGM's office; ACOS for a Visitor permit.
  New activities and invoices start at RGM's office.
- Backfill every pending item with one `submitted` step dated `createdAt`, held by RGM's office
  (ACOS for Visitor permits).

## Fields the frontend reads on list and detail rows

```json
{ "currentOffice": { "id": "…", "name": "Airport Chief of Security" },
  "currentOfficeSince": "2026-11-12T13:20:00Z",
  "currentOfficerId": null }
```

`currentOffice` may also be a plain string with `currentOfficeId` beside it. Send
`currentOfficerId` to staff only. Add `?heldByMyOffice=true` to `GET /stakeholder-orgs/permits`
(the "With my office" tab).

## Routes

| Method and path | Who | Body | Result |
|---|---|---|---|
| `POST /api/stakeholder-orgs/{kind}/:id/forward` | Current holder, super admin | `{ toOfficeId, toOfficeType: "department"|"unit"|"position", toOfficerId?, minute }` | Moves the item, records the step |
| `POST /api/stakeholder-orgs/{kind}/:id/return` | Current holder, super admin | `{ minute }` | Back to the previous office |
| `POST /api/stakeholder-orgs/{kind}/:id/acknowledge` | Receiving office | none | Records receipt |
| `GET /api/stakeholder-orgs/{kind}/:id/trail` | Staff: full. Concessionaire: own company, redacted | | Ordered steps |
| `GET /api/stakeholder-orgs/:orgId/notifications?limit=30` | That company's users | | Notices, newest first |
| `POST /api/stakeholder-orgs/:orgId/notifications/read` | That company's users | `{ ids?: string[] }` (none = all) | Marks read |

Trail step, staff:

```json
{ "stepNumber": 2, "stepType": "forwarded",
  "fromOffice": { "id": "…", "name": "RGM's office" },
  "toOffice": { "id": "…", "name": "Airport Chief of Security" },
  "toOfficerName": "…", "actorName": "…", "minute": "…", "createdAt": "…" }
```

Trail step, concessionaire: `stepNumber`, `stepType`, `toOffice.name`, `createdAt` only.

Notice: `{ id, kind, itemId, itemLabel, stepType, office, createdAt, readAt }`, for example
`itemLabel: "Permit PER-2026-01627"`, `office: "CII"`.

## Rules

- **Redaction is enforced in the response.** A concessionaire token never receives the minute,
  the staff user's id or name, or a named officer (send that officer's office instead). The
  frontend strips them again, but that is a second guard, not the control.
- A concessionaire reads the trail only for its own company's items (403 otherwise), and gets
  403 on forward, return and acknowledge.
- Approve, reject and the activity/invoice review routes: current holder or super admin only;
  each writes a final step.
- `minute` is required on forward and return (400 without it). Forwarding to the office that
  already holds the item is refused. A decided item cannot be forwarded or returned.
- On every forward, return and final decision: one email and one in-app notice to the company,
  naming the item, the office it is now with and the time. No minute, no staff name.

## One thing to decide in the backend

The staff permit queue page is limited to stakeholder officers
(`ROLE_GROUPS.stakeholderOfficers` or `canManageStakeholders`). Once any office can hold a
permit (CII, for example), staff in that office need to reach the queue. Either grant them that
access when an item is forwarded to their office, or tell us which roles to admit and we will
widen the route guard.

## Acceptance tests

The 16 checks on pages 7 and 8 of the brief. The frontend tests in
`src/lib/routing.test.ts` and `src/components/stakeholders/PermitTrail.test.tsx` cover the
screen side: order of steps, no minute or staff name for a concessionaire, holder-only actions,
and minute required.
