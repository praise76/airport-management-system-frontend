# Frontend fixes from the 8 Nov 2026 QA run

Branch `qa-fixes-2026-11-08`, based on `3b2c471`. Backend work is in
`QA_BACKEND_FIXES_2026-11-08.md`.

| Finding | What changed | Files |
|---|---|---|
| LV-01 | Leave review sends `approved` as well as `decision` | `src/api/leave.ts` |
| LV-02 | A refused approval queue shows an error, not "All caught up" | `src/api/leave.ts`, `src/routes/admin/leave/approvals.tsx` |
| LV-06 | Specific form messages; handover uses the colleague search; applicants can cancel pending requests | `src/components/leave/*` |
| RST-05 | Direct-swap colleague search; swap reason and names shown; approvals don't spin on 403 | `src/features/swaps/*`, `src/api/swaps.ts`, `src/types/swaps.ts` |
| TSK-01 | Task due date sent as ISO date-time | `src/routes/tasks/index.tsx` |
| RST-01 | Roster end date can't be before start | `src/features/roster/components/CreateRosterModal.tsx` |
| RST-03 | Rotation Pattern shows an error when the request fails; theme colours | `RotationCycleTable.tsx`, `routes/admin/roster/planner.tsx` |
| RST-04 | Preset sets Shift Type | `ManageEntryModal.tsx` |
| RST-06 | Zone names instead of ids; roles instead of "Staff" | `src/hooks/geofence.ts`, `ShiftCard.tsx`, `routes/roster/my-shifts.tsx`, `routes/attendance/index.tsx`, `RosterGrid.tsx` |
| ATT-01 | Check in disabled when the location check says outside (server must also enforce) | `routes/attendance/index.tsx` |
| ATT-03 | Lateness message shows the shift's start time | `routes/attendance/index.tsx` |
| GEO-02 | Maps no longer draw over dialogs | `components/geofence/GeofenceMapEditor.tsx` |
| STK-01, STK-05 | Tenant type list; password rule; Review shows all fields and the server's errors | `routes/stakeholder/register.tsx` |
| STK-02 | Permit "valid until" checked on apply and on admin approval | `routes/stakeholder/permits.tsx`, `routes/stakeholders/*` |
| STK-05 | Invoice quantity, price and due-date checks with messages | `routes/stakeholder/invoices.tsx` |
| DOC-01, DOC-03 | Assign-to-officer uses colleague search, filters eligible roles, sends `toRole` | `routes/documents/$docId.tsx` |
| PLAT-01 | Failed token refresh settles queued requests and redirects to sign-in | `src/api/client.ts` |

New shared component: `src/components/staff/ColleaguePicker.tsx`. It searches
`GET /messages/users/search`, which every signed-in user may call. `/admin/staff` returns 403
for anyone who isn't an admin, so the old pickers were always empty.

New tests: `src/api/leave.test.ts`, `src/api/swaps.test.ts`.

**Not yet verified:** the session that made these changes wasn't allowed to install
dependencies or run `pnpm build` / `pnpm test` on this repository. Run them before merging:

    pnpm install && pnpm build && pnpm test && pnpm check
