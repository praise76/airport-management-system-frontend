# Frontend Changes for Roster, Roles, and Shifts Implementation

The following changes are required on the frontend to support the recent backend updates.

## 1. User Management & Roles

- **Update Role Selectors**: Ensure the `Role` dropdown in the "Add User" and "Edit User" forms includes the new roles:
  - `HOU` (Head of Unit)
  - `SUPERVISOR` (Supervisor)
- **Role Hierarchy**: If implementing hierarchy-based access in the frontend, note that:
  - `HOD` (Head of Department) overlooks multiple Units.
  - `HOU` overlooks a specific Unit.
  - `SUPERVISOR` reports to `HOU` or `HOD`.

## 2. Roster Management (Restricted Access)

- **Create Roster Button**:
  - The "Create New Roster" button should **ONLY** be visible/enabled for users with the following roles:
    - `Super Admin`
    - `Org Admin`
    - `HOD`
    - `HOU`
  - _Note_: Other staff (including Supervisors) cannot create rosters.
- **Roster Creation Form**:
  - Ensure the form sends the correct `departmentId` and `unitDepartmentId`.

## 3. Roster Entries (Shift Assignment) with Terminals

- **New Field: Terminal**:
  - When adding a staff member to a shift (creating a roster entry), add a **Terminal Selection** dropdown.
  - **Data Source**: Fetch terminals from `GET /api/terminals`.
  - **Payload**: Send the selected `terminalId` in the `POST /api/roster/:id/entries` payload.
  ```json
  {
    "staffId": "...",
    "unitDepartmentId": "...",
    "terminalId": "UUID_OF_SELECTED_TERMINAL", // [NEW OPTIONAL FIELD]
    "dutyDate": "2024-01-01",
    "shift": "morning"
  }
  ```
- **Display in Grid**: Show the assigned Terminal in the Roster Grid view (e.g., "Morning - GAT").

## 4. Shift Swaps

- **Swap Request UI**:
  - Ensure any staff member can initiate a swap on their own shift (`POST /api/roster/swap`).
  - Target staff should see a "Pending Swaps" list and be able to Accept/Reject (`POST /api/roster/swap/:id/respond`).
- **Supervisor Review**:
  - `HOD`, `HOU` (and potentially `SUPERVISOR` if permission allows) should have a "Swap Approvals" dashboard.
  - They review accepted swaps and Approve/Reject (`POST /api/roster/swap/:id/review`).

## 5. Public Display Board (Duty Board)

- **Terminal Filtering**:
  - The Public Display page should capture which Terminal it is displaying for.
  - Add a **Settings** modal or query parameter to the public display URL (e.g., `/public/duty-board?terminalId=...`).
- **API Integration**:
  - Pass the `terminalId` to the backend when fetching board data:
  - `GET /api/public/duty-board?departmentId=...&terminalId=...`
- **HOD View**:
  - If an HOD logs in to view the board, they generally want to see _all_ terminals or select one.
  - Provide a filter dropdown for HODs to switch between Terminals on the dashboard.

## Checkpoint Summary

- [ ] Add `HOU`, `SUPERVISOR` roles to User forms.
- [ ] Restrict Roster Creation to HOD/HOU/Admins.
- [ ] Add `Terminal` dropdown to Roster Entry form.
- [ ] Update Public Display to support `terminalId` filtering.
