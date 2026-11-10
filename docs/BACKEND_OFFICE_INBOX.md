# Backend change: office inbox for requests and invoices

Written 10 Nov 2026 against the live API. The frontend half is in this branch
(`fix-office-inbox`) and is already safe to deploy: it shows the new lists as soon as the routes
below answer, and shows nothing while they return 404 or 500.

I do not have the backend repository, so this is a specification with reference code, not a
patch. Names follow what the live API already returns.

## 1. Two list routes (the main change)

```
GET /api/stakeholder-orgs/activities?heldByMyOffice=true&limit=100
GET /api/stakeholder-orgs/invoices?heldByMyOffice=true&limit=100
```

Today both return **500**. `GET /api/stakeholder-orgs/permits?heldByMyOffice=true` works and is
the model to copy.

**Likely cause of the 500:** `/stakeholder-orgs/activities` is being matched by a
`/stakeholder-orgs/:id` (or `/:orgId`) route, so `"activities"` is parsed as a UUID. Register
the two static routes **before** any `/:id` route on that router, exactly as `/permits` is.

**Who may call:** any signed-in staff member (not concessionaire tokens: 403 "Staff access only").

**What to return:** open items whose current holder is the caller's office:

- activities with `status IN ('submitted','under_review')`
- invoices with `reviewStatus` not approved/rejected and `paymentStatus <> 'paid'`
- and `currentOfficeId` is one of the caller's offices, or `currentOfficerId = caller.id`

The caller's offices are the same set the permits list already uses: their department, their
unit, and every position they are assigned to (active assignments). A super admin gets items
held by their own offices only, like everyone else; they already see everything on each
company's page.

**Row shape:** the same row the per-company lists return
(`GET /stakeholder-orgs/:orgId/activities` and `.../invoices`), including
`currentOfficeId`, `currentOfficeName`, `currentOfficeType`, `currentOfficeSince`,
`currentOfficerId`, plus **`organizationName`** (join the stakeholder organisation), newest
`currentOfficeSince` first. Envelope: `{ success: true, data: { items: [...] } }`.

Reference (adapt to your query layer; this mirrors the permits handler):

```ts
// routes: declare BEFORE router.get("/:id", ...)
router.get("/activities", requireStaff, listHeldActivities);
router.get("/invoices", requireStaff, listHeldInvoices);

async function officeIdsOf(user) {
  const positions = await db.positionAssignment.findMany({
    where: { userId: user.id, endDate: null }, select: { positionId: true },
  });
  return [user.departmentId, user.unitDepartmentId, ...positions.map((p) => p.positionId)]
    .filter(Boolean);
}

async function listHeldActivities(req, res) {
  if (req.query.heldByMyOffice !== "true") return res.status(400).json({ success: false, error: "heldByMyOffice=true is required" });
  const offices = await officeIdsOf(req.user);
  const items = await db.stakeholderActivity.findMany({
    where: {
      organizationId: req.user.organizationId,            // tenant scope
      status: { in: ["submitted", "under_review"] },
      OR: [{ currentOfficeId: { in: offices } }, { currentOfficerId: req.user.id }],
    },
    include: { stakeholderOrganization: { select: { organizationName: true } } },
    orderBy: { currentOfficeSince: "desc" },
    take: Math.min(Number(req.query.limit) || 50, 100),
  });
  res.json({ success: true, data: { items: items.map(withOrganizationName) } });
}
// listHeldInvoices: the same, on invoices, with the invoice "open" condition above.
```

## 2. Let the holding office review activities and invoices

Already correct on the live API: `POST /stakeholder-orgs/activities/:id/review` and
`POST /stakeholder-orgs/invoices/:id/review` answer 403 "This submission is held by another
office" to other offices. Please confirm they **accept** the holding office even when that
staff member is not a stakeholder officer (no `canManageStakeholders`). The inbox shows Approve
and Reject to the holder.

## 3. Read access the inbox needs

For staff who are not stakeholder officers, when the item is held by their office:

- `GET /stakeholder-orgs/{permits|activities|invoices}/:id/trail` (the Timeline button)
- `GET /stakeholder-orgs/documents/:documentId/file` when that document is the letter attached
  to an activity their office holds (`data.documentId`) (the View letter button)

## 3a. The chain of offices (product owner, 10 Nov 2026)

The route is a chain that goes down and comes back up:

> A cleaning contractor's payment voucher is submitted at the RGM's office. The RGM minutes it
> to the HOD Environment. The HOD minutes it to the head of unit, Facility Maintenance. The head
> of unit treats it and minutes back to the HOD. The HOD treats it and tells the RGM to find the
> treated job completion attached. The RGM then minutes it to Accounts.

Visitor permits go directly to ACOS (already the case). Everything else starts at the RGM.

The frontend now works this way: "Minute to…" offers the RGM the departments (their HODs), an
HOD the department's units or its own staff, and a head of unit the unit's own staff; "Return
to <office>" names the office above in the chain. Three backend changes make it complete:

1. **Return must go up the chain, not to the last sender.** Today `POST .../return` sends the
   item to the office the last move came from. Tested live on voucher PV-QA-385480: RGM ->
   Environmental Services -> Facility Maintenance; Facility Maintenance returns (goes to
   Environmental Services, correct); Environmental Services returns and it goes **back to
   Facility Maintenance** instead of the RGM. Keep the chain as a stack: a forward to a new
   office pushes it, a return pops the current office and delivers to the one beneath. Refuse a
   return at the top of the chain. Until then the frontend works around it: when the server's
   target is not the office above, it sends a forward to that office, so the step is recorded
   as "forwarded" rather than "returned".
2. **Minuting to a named person inside the holding office.** An HOD minutes to a member of
   staff in their own department, and a head of unit to someone in the unit. Today a forward to
   the office that already holds the item is refused (409 "That office already holds this
   submission") even when `toOfficerId` is set. Allow it when `toOfficerId` is given and differs
   from the current officer: record an `assigned` (or `forwarded`) step, set `currentOfficerId`,
   keep the office. The concessionaire sees no new step and gets no notice, since the office
   has not changed. That person then returns it to the head of the office (clear
   `currentOfficerId`), who returns it up the chain.
3. **Attachments on a minute.** "Find attached treated job completion": a step needs optional
   files. Accept `attachments` (uploaded file ids) on forward and return, return them to staff
   in the trail, never to the concessionaire. The frontend will add an attach control when the
   field exists.

Also: a department should resolve to its HOD and a unit to its head. Today anyone in the office
may act. If only the head should, enforce it on forward/return/review and expose the head on the
office (`headUserId` is null for most departments on the live site).

## 4. Smaller fixes found in the same retest

- **Names in the staff trail.** Steps return `actorUserId` and `toOfficerId` only. Add
  `actorName` and `toOfficerName` to the **staff** response (never to the concessionaire's).
- **No notice on acknowledge.** Acknowledging receipt creates a concessionaire notice. Notify on
  forward, return and decision only.
- **Officer picker.** `GET /admin/staff?departmentId=` is 403 for ordinary staff, so "Named
  officer" is empty for them. Offer `GET /departments/:id/staff` (id, firstName, lastName) to
  any staff member, or relax the existing route to that minimal shape.
- **Starting office.** It is found by position code (`RGM`, `ACOS`). Make it a setting and
  refuse to delete or re-code a position that is a starting office. Re-point the 7 pending
  test permits still held by "Head of Department" / "Operations Officer".

## How to check

Test data already on the live site: request **OTH-2026-667883** ("Request to move out junk",
QA Test Skyline Cafe Ltd) is with **Passenger Screening**; invoice **QA-TRK-829917** is with
Passenger Screening too.

1. Sign in as a Passenger Screening officer (for example chika.nwankwo@nams-demo.test).
2. `GET /api/stakeholder-orgs/activities?heldByMyOffice=true` returns 200 with OTH-2026-667883,
   including `organizationName`. The invoices route returns QA-TRK-829917.
3. In the app: Permit applications, "With my office" shows Permits, Requests and Invoices.
   The request row has View letter, Timeline, Return, Forward, Reject, Approve, and each works.
4. Sign in as a Facility Maintenance officer: neither item is listed, and review/forward on
   them is 403.
5. A concessionaire token gets 403 on both list routes.
