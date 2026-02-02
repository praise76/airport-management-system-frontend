# Frontend Integration Guide (v1.0)

This document details the API changes and integration points for the new FAAN system features.

## 1. Attendance & Location Tracking

**Feature**: Capture exact location (lat/long) and shift details during clock-in/out.

### 1.1 Auto Clock (Geofence)

**Endpoint**: `POST /api/attendance/auto-clock`
**Payload Updates**:

```json
{
  "userId": "uuid",
  "organizationId": "uuid",
  "lat": 6.5774, // [NEW] Required for location log
  "lng": 3.3218 // [NEW] Required for location log
}
```

**Response**:
Returns `rosterInfo` which now includes validation of the shift location.

### 1.2 Manual Clock In

**Endpoint**: `POST /api/attendance/clock-in`
**Payload Updates**:

```json
{
  "lat": 6.5774, // [NEW]
  "lng": 3.3218, // [NEW]
  "terminalCode": "IT1",
  "zoneId": "optional-uuid"
}
```

### 1.3 Manual Clock Out

**Endpoint**: `POST /api/attendance/clock-out`
**Payload Updates**:

```json
{
  "lat": 6.5774, // [NEW]
  "lng": 3.3218 // [NEW]
}
```

---

## 2. Shift Reports

**Feature**: Staff must submit a report after clocking out.

### 2.1 Submit Report

**Endpoint**: `POST /api/shift-reports`
**Headers**: `Authorization: Bearer <token>`
**Trigger**: Call this _after_ a successful clock-out.
**Payload**:

```json
{
  "summary": "Shift went smoothly. No major incidents.",
  "passengersProcessed": "450", // Optional
  "incidentsCount": "0", // Optional
  "equipmentStatus": {
    // Optional JSON
    "scanners": "operational",
    "wtmd": "faulty"
  },
  "observations": "Passenger flow high at 10am.",
  "challenges": "Scanner 2 overheating.",
  "recommendations": "Service scanner 2.",
  "handoverNotes": "Key left with Supervisor A.",
  "urgentItems": "None",
  "attachments": [] // Array of file URLs
}
```

**Response (201 Created)**:

```json
{
  "id": "uuid",
  "registryNumber": "SR/AVSEC/2026/001234",
  "status": "submitted",
  "createdAt": "2026-02-01T10:00:00Z"
}
```

### 2.2 List My Reports

**Endpoint**: `GET /api/shift-reports/my-reports?page=1&limit=10`
**Use Case**: Show history of submitted reports involved in the "My Activities" or "History" tab.

### 2.3 View Report Details

**Endpoint**: `GET /api/shift-reports/:id`

---

## 3. Terminal Representatives (Terminal Groups)

**Feature**: Link officers from different departments to a terminal.

### 3.1 List Representatives

**Endpoint**: `GET /api/terminals/:terminalId/representatives`
**Response**:

```json
[
  {
    "id": "uuid",
    "role": "Terminal AVSEC Officer",
    "isPrimary": "Y",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "position": "Station Officer"
    },
    "department": {
      "name": "Aviation Security"
    }
  }
]
```

### 3.2 Add Representative

**Endpoint**: `POST /api/terminals/:terminalId/representatives`
**Payload**:

```json
{
  "userId": "uuid-of-user",
  "departmentId": "uuid-of-dept",
  "role": "Terminal Engineering Lead",
  "isPrimary": "N" // Optional, default N
}
```

### 3.3 Remove Representative

**Endpoint**: `DELETE /api/terminals/representatives/:id`
**Note**: The `:id` here is the _Representative Record ID_, not the User ID.

---

## 4. Task Visibility

**Feature**: Tasks can now be scoped to specific units or publicized.

### 4.1 Create Task

**Endpoint**: `POST /api/tasks`
**Payload Updates**:

```json
{
  "title": "Inspect Gate 5",
  "visibilityScope": "unit", // [NEW] assigned_only | unit | department | public
  "visibilityUnitId": "uuid-of-unit" // [NEW] Required if scope is 'unit'
}
```

---

## 5. Frontend Implementation Checklist

- [ ] **Attendance Screen**: Pass `lat/long` from `navigator.geolocation` to all clock-in/out calls.
- [ ] **Shift End Flow**: When user clocks out successfully, prompt "Do you want to submit your shift report now?" -> Navigate to Report Form.
- [ ] **Report Form**: Create a form matching the fields in section 2.1.
- [ ] **Terminal Dashboard**: Add a "Terminal Team" widget using the List Representatives endpoint.
- [ ] **Task Creation**: Add a dropdown for "Visibility" (Me, My Unit, My Department, Everyone).
