# Frontend Implementation Guide - Phase 2 Gap Closure

This document outlines the API endpoints and frontend requirements for the newly implemented features (Document Workflows, Shift Management, Terminal Reports).

## 1. Document Workflow (RGM & Registry)

### A. RGM Forwarding (To Departments)

Used when the RGM receives an external letter and forwards it to a specific department.

- **Endpoint:** `POST /api/documents/{id}/rgm-forward`
- **Input:**
  ```json
  {
    "targetDeptId": "uuid-of-dept",
    "comments": "Please treat efficiently."
  }
  ```
- **UI:** Add 'Forward to Dept' action button on RGM dashboard for incoming external docs.

### B. Internal Memo Broadcast

Used by RGM to send a circular/memo to multiple departments.

- **Endpoint:** `POST /api/documents/internal-broadcast`
- **Input:**
  ```json
  {
    "subject": "New Security Protocol",
    "fileUrl": "https://...",
    "priority": "high",
    "targetDepartmentIds": ["dept-uuid-1", "dept-uuid-2"],
    "deadline": "2024-02-10" // Optional
  }
  ```
- **UI:** 'Create Memo' form with multi-select for departments.

### C. HOD Acknowledgment

Used by HODs to acknowledge receipt/read status of an internal memo.

- **Endpoint:** `POST /api/documents/{id}/acknowledge`
- **Input:**
  ```json
  {
    "notes": "Noted, will brief staff."
  }
  ```
- **UI:** 'Acknowledge' button on the document view for receiving HODs.

## 2. Shift Reports (Approval & Consolidation)

### A. Supervisor Approval

Supervisors review submitted reports before they are final.

- **Endpoint:** `POST /api/shift-reports/{id}/approve`
- **Input:**
  ```json
  {
    "approved": true,
    "comments": "Good report."
  }
  ```
- **UI:** 'Approve/Reject' footer on Shift Report detail view (visible only to Supervisors).

### B. Daily Consolidation

Compiles all shift reports (Morning, Afternoon, Night) into one daily PDF/View.

- **Endpoint:** `POST /api/shift-reports/consolidate`
- **Input:**
  ```json
  {
    "date": "2024-02-02",
    "departmentId": "dept-uuid"
  }
  ```
- **UI:** 'Generate Daily Report' button on the Reports Dashboard.

## 3. Shift Management (Patterns & Rosters)

### A. Create Shift Pattern

Define recurring patterns (e.g., 5 days on, 2 days off).

- **Endpoint:** `POST /api/roster/patterns`
- **Input:**
  ```json
  {
    "patternName": "Security A (5 On, 2 Off)",
    "patternType": "rotating", // or 'permanent', 'custom'
    "cycleLengthDays": 7,
    "shiftSequenceJson": [
      { "day": 1, "shift": "morning" },
      { "day": 2, "shift": "morning" },
      { "day": 3, "shift": "afternoon" },
      { "day": 4, "shift": "afternoon" },
      { "day": 5, "shift": "night" },
      { "day": 6, "shift": "off" },
      { "day": 7, "shift": "off" }
    ]
  }
  ```
- **UI:** 'Shift Patterns' Settings Tab.

### B. Assign Pattern to User

Updates the user's schedule based on the pattern effectively from a date.

- **Endpoint:** `POST /api/roster/patterns/assign`
- **Input:**
  ```json
  {
    "userId": "user-uuid",
    "shiftPatternId": "pattern-uuid",
    "effectiveFrom": "2024-02-01"
  }
  ```
- **UI:** 'Assign Schedule' modal on Staff List.

### C. List Patterns

- **Endpoint:** `GET /api/roster/patterns`
- **UI:** Dropdown for pattern selection.

## 4. Terminal Operations

### A. Operational Reporting

Submit daily stats for a terminal (Passengers, Incidents, etc.).

- **Endpoint:** `POST /api/terminals/reports`
- **Input:**
  ```json
  {
    "terminalId": "terminal-uuid",
    "reportDate": "2024-02-02",
    "totalPassengers": 12500,
    "incidentsCount": 1,
    "achievements": "Smooth ops",
    "challenges": "Rain delay"
  }
  ```
- **UI:** Electronic Form for Terminal Managers.

### B. Performance Dashboard

Get aggregated stats.

- **Endpoint:** `GET /api/terminals/{id}/performance?startDate=...&endDate=...`
- **UI:** Dashboard charts.

## 5. Attendance (Device Tracking)

- **Endpoint:** `POST /api/attendance/check-in`
- **Update:** Now accepts `clockInMethod` and `deviceId`.
  ```json
  {
    "clockInMethod": "qr",
    "deviceId": "tablet-001"
  }
  ```
