# Backend change: need-to-know on minutes and files

Decided by the product owner, 11 Nov 2026: an item's minutes, the names of who acted, and the
files attached to minutes are visible only to the offices the item has passed through, plus a
short list of read-only exceptions. This follows need-to-know and is easier to justify in an
audit.

The frontend in this branch (`need-to-know`) is ready: when the server refuses a trail or a file
with 403, staff see "Only the offices this item has passed through can read its minutes and
files. It is with <office>. Ask that office if you need it." instead of an error. Until the
backend change is deployed, nothing changes on screen.

## What happens today (tested on the live API, 11 Nov)

A Passenger Screening officer, whose office the item never reached, can read every minute and
staff name on voucher PV-QA-026488 (`GET .../invoices/:id/trail` -> 200) and download the
job-completion report attached by Facility Maintenance (`GET .../attachments/:id/file` -> 200).
Any member of staff can do the same for any permit, request or invoice.

## The rule

A staff user may read the **staff** trail of an item, and open the files attached to its
minutes, when any of these is true:

1. **Their office is on the item's chain.** The item has at some point been with one of their
   offices: any step's `toOffice` or `fromOffice`. A user's offices are the same set the
   "held by my office" lists use: their department, their unit, and every position they hold
   (active assignments). Membership is exact: a department does not cover its units, and a unit
   does not cover its parent department. The HOD sees a unit's work because the HOD minuted it
   down, so the department is already on the chain.
2. **They were named on it.** Any step's `toOfficerId` is the user (an `assigned` step, or a
   forward to a named officer).
3. **They acted on it.** Any step's `actorUserId` is the user (covers a super admin or acting
   officer who moved it from outside the office).
4. **They are an exception** (read-only, see below).

Once an office is on the chain it stays on: an office that has passed the item on can still read
it, read-only, to follow up and for the record.

**An office the item is forwarded to later sees the whole history**, including minutes written
before it arrived. Like a paper file jacket, the minutes travel with the file; the receiving
office needs them to act.

Write actions are unchanged: only the current holder (or the named officer, or a super admin)
may forward, return, assign or decide.

## Exceptions (read-only)

| Who | Why | How it is recognised |
|---|---|---|
| Super admin | Runs the system | `role = super_admin` |
| Auditor | Internal audit, investigations | New role `auditor` (read-only everywhere) |
| Named readers | For example a director who must see everything in a stream | A list on the Routing settings screen: positions that may read all items of a kind (permits, requests, invoices). Empty by default. |

Not exceptions, deliberately:

- Staff flagged `canManageStakeholders`, and roles such as RGM, ACOS or HOD, keep seeing the
  **lists** (each item's status and where it is now), which carry no minutes. They read minutes
  only under the rule above. The RGM sees almost everything anyway, because new items start
  there.
- Directors, unless added as named readers.

## Every exception read is logged

When a user reads a trail or opens a minute file **only** because of an exception (not because
their office is on the chain), write an access record: user, item kind and id, what was read
(trail, file id), which exception allowed it, time. Show it to super admins and auditors
(`GET /stakeholder-orgs/access-log?kind=&itemId=`). This is what makes the exceptions defensible
in an audit. Logging ordinary chain reads is optional.

## Endpoints to gate

| Endpoint | Staff rule | Concessionaire (unchanged) |
|---|---|---|
| `GET /stakeholder-orgs/{permits,activities,invoices}/:id/trail` | The rule above; otherwise **403** | Own company only, redacted |
| `GET /stakeholder-orgs/{kind}/:id/attachments/:attachmentId/file` | The rule above; otherwise **403** | 403 always |
| `POST /stakeholder-orgs/{kind}/:id/attachments` | Current holder only (unchanged) | 403 |
| `GET /stakeholder-orgs/documents/:id/file` for a request letter (the document an activity points to in `data.documentId`) | The rule above for that activity, **or** the existing stakeholder-officer rule for compliance documents | Own company |
| List routes (`/stakeholder-orgs/{kind}`, `/:orgId/{kind}`, `heldByMyOffice`) | Unchanged; they carry no minutes. Check they don't embed trail steps. | Unchanged |
| `/notifications` | Unchanged | Unchanged |

403 body, so the screen can tell it apart from other refusals:

```json
{ "success": false, "code": "NEED_TO_KNOW",
  "error": "Only the offices this item has passed through can read its minutes" }
```

Reference:

```ts
async function canReadTrail(user, item, steps) {
  if (user.role === "super_admin" || user.role === "auditor") return { ok: true, via: user.role };
  if (await isNamedReader(user, item.kind)) return { ok: true, via: "named_reader" };
  const offices = new Set(await officeIdsOf(user));       // dept, unit, active positions
  const onChain = steps.some((s) =>
    offices.has(s.toOfficeId) || offices.has(s.fromOfficeId) ||
    s.toOfficerId === user.id || s.actorUserId === user.id);
  return { ok: onChain, via: onChain ? "chain" : null };
}
// in the trail and file handlers:
const access = await canReadTrail(req.user, item, steps);
if (!access.ok) return res.status(403).json({ success: false, code: "NEED_TO_KNOW", error: "Only the offices this item has passed through can read its minutes" });
if (access.via !== "chain") await logExceptionRead(req.user, item, what, access.via);
```

## Acceptance tests (live test data)

Voucher **PV-QA-026488** went RGM -> Environmental Services -> Facility Maintenance (assigned to
Peter Udo) -> back up to the RGM -> Finance & Accounts.

| User | Office | Trail | Attachment file |
|---|---|---|---|
| emeka.eze | RGM (position) | 200 | 200 |
| chinedu.okeke | Environmental Services | 200 | 200 |
| kunle.ade | Facility Maintenance | 200 | 200 |
| peter.udo | Facility Maintenance, named | 200 | 200 |
| joy.effiong | Facility Maintenance (office on chain) | 200 | 200 |
| chika.nwankwo | Passenger Screening (never on chain) | **403 NEED_TO_KNOW** | **403** |
| musa.danjuma | ACOS (never on chain) | **403** | **403** |
| a user with role `auditor` | none | 200, and an access-log row | 200, and an access-log row |
| super admin | none | 200, and an access-log row | 200, and an access-log row |
| the cleaning company | | 200, redacted (no minutes, names, files) | 403 |

Then forward it from Finance & Accounts to Passenger Screening: chika.nwankwo now gets 200 for
the whole trail, including the RGM's first minute.
