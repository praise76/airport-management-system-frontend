# Office tracking: live retest, 10 Nov 2026 (evening)

Setup added through the API: positions Regional General Manager (RGM, code `RGM`), Airport Chief
of Security (ACOS, code `ACOS`) and Crime Investigation and Intelligence (CII, code `CII`); test
staff assigned to each. New permits, activities and invoices now start at RGM, and Visitor
permits at ACOS. The worked example RGM -> ACOS -> CII -> back to ACOS -> approved passes.

## Fixed in this branch (frontend)

Staff who are not stakeholder officers could not reach the permit queue: the route guard sent
them to the dashboard and the menu had no link, so an RGM, ACOS or CII officer could act through
the API but not on screen. Now every staff member has "Permit applications"; people who are not
stakeholder officers see only the "With my office" tab, and the action buttons there follow the
server's list (the signed-in user record carries no position, so the screen could not tell).

## Still needed in the backend

1. **Staff names in the trail.** Staff steps return `actorUserId` and `toOfficerId` only. Add
   `actorName` and `toOfficerName` (staff responses only) so the staff timeline says who wrote
   each minute and which officer it was sent to.
2. **No notice on acknowledge.** Acknowledging receipt creates a concessionaire notice (5 notices
   for a permit with 2 forwards, 1 return, 1 decision). Notify on forward, return and decision only.
3. **Activities and invoices held by my office.** `GET /stakeholder-orgs/activities?heldByMyOffice=true`
   and `.../invoices?heldByMyOffice=true` return 500. An office that is forwarded an activity or
   invoice has no list to find it in. Add both (same shape as the permits list); the frontend
   will add them to the office's inbox.
4. **Officer picker for ordinary staff.** `GET /admin/staff?departmentId=` is 403 for staff who
   are not admins, so the optional "Named officer" list is empty for them. Offer a minimal
   "staff in this office" list (id and name) to any staff member.
5. **Items submitted before the offices existed** still sit with "Head of Department" or
   "Operations Officer" (7 test permits). Re-point pending items to RGM/ACOS, or leave them for
   a super admin to forward.
6. **Starting office is found by position code** (`RGM`, `ACOS`). If those positions are renamed
   or deleted, new items silently fall back to another position. Make the starting offices a
   setting, and refuse to delete a position that is one.
