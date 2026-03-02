# 2-2-2-2 Rotating Roster Implementation Guide

This guide explains how to implement the **2-2-2-2 Rotating Shift Pattern** using the existing **Roster Templates** feature, which is designed specifically for this use case.

## 1. The Concept

The 2-2-2-2 pattern repeats every **8 days** with the sequence:
`['MORNING', 'MORNING', 'AFTERNOON', 'AFTERNOON', 'NIGHT', 'NIGHT', 'OFF', 'OFF']`

To achieve 24/7 coverage with 4 groups (A, B, C, D), we assign them to the same template but with **offset days**.

## 2. Implementation Steps

### Step 1: Create the Pattern Template

Call `POST /api/roster/templates` once to create the reusable definition.

```json
{
  "name": "2-2-2-2 Rotation (8 Day)",
  "type": "custom",
  "description": "Standard 4-group rotating shift pattern",
  "minStaffPerShift": 1,
  "minRestHoursBetweenShifts": 8,

  // Define shift times
  "shiftDefinitions": {
    "MORNING": {
      "name": "Morning Shift",
      "startTime": "07:00",
      "endTime": "14:00",
      "duration": 7
    },
    "AFTERNOON": {
      "name": "Afternoon Shift",
      "startTime": "14:00",
      "endTime": "17:00",
      "duration": 3
    },
    "NIGHT": {
      "name": "Night Shift",
      "startTime": "17:00",
      "endTime": "07:00",
      "duration": 14
    }
  },

  // Define the 8-day cycle keys matching above
  "rotationCycle": ["MORNING", "MORNING", "AFTERNOON", "AFTERNOON", "NIGHT", "NIGHT", "OFF", "OFF"]
}
```

### Step 2: Generate the Roster

Call `POST /api/roster/templates/generate` to create the actual roster entries for a specific period (e.g., month).

You map your "Shift Groups" to **Teams** with specific **offsets**.

```json
{
  "unitDepartmentId": "uuid-of-unit",
  "templateId": "uuid-of-created-template",
  "startDate": "2024-03-01",
  "endDate": "2024-03-31",
  "saveRoster": true,
  "rosterName": "March 2024 Roster",

  "teams": [
    {
      "name": "Shift Group A (Starts Morning)",
      "offsetDays": 0,
      "memberIds": ["user-uuid-1", "user-uuid-2"]
    },
    {
      "name": "Shift Group B (Starts Afternoon)",
      "offsetDays": 2, // Skip 2 mornings -> Start at Afternoon
      "memberIds": ["user-uuid-3", "user-uuid-4"]
    },
    {
      "name": "Shift Group C (Starts Night)",
      "offsetDays": 4, // Skip 2 M + 2 A -> Start at Night
      "memberIds": ["user-uuid-5", "user-uuid-6"]
    },
    {
      "name": "Shift Group D (Starts Off)",
      "offsetDays": 6, // Skip 2 M + 2 A + 2 N -> Start at Off
      "memberIds": ["user-uuid-7", "user-uuid-8"]
    }
  ]
}
```

## 3. Frontend Implementation

You do **not** need complex local logic. Your frontend should:

1.  **Check if template exists**: `GET /api/roster/templates`
2.  **Create it if missing**: `POST /api/roster/templates` (using JSON from Step 1)
3.  **Deploy Roster**: `POST /api/roster/templates/generate` (using JSON from Step 2)

### Example Frontend Service

```typescript
// frontend/services/roster-service.ts
import axios from 'axios';

export const deployRotatingRoster = async (
  unitId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,
  groups: { A: string[]; B: string[]; C: string[]; D: string[] }
) => {
  // 1. Get Template
  const templateId = await getOrCreateTemplate();

  // 2. Prepare Teams Payload
  const teams = [
    { name: 'Group A', offsetDays: 0, memberIds: groups.A },
    { name: 'Group B', offsetDays: 2, memberIds: groups.B },
    { name: 'Group C', offsetDays: 4, memberIds: groups.C },
    { name: 'Group D', offsetDays: 6, memberIds: groups.D },
  ];

  // 3. Generate
  return axios.post('/api/roster/templates/generate', {
    unitDepartmentId: unitId,
    templateId,
    startDate,
    endDate,
    saveRoster: true,
    teams,
  });
};

async function getOrCreateTemplate() {
  const { data: templates } = await axios.get('/api/roster/templates');
  const existing = templates.data.find((t) => t.name === '2-2-2-2 Rotation (8 Day)');
  if (existing) return existing.id;

  const { data: created } = await axios.post('/api/roster/templates', {
    name: '2-2-2-2 Rotation (8 Day)',
    type: 'custom',
    shiftDefinitions: {
      MORNING: { name: 'Morning', startTime: '07:00', endTime: '14:00', duration: 7 },
      AFTERNOON: { name: 'Afternoon', startTime: '14:00', endTime: '17:00', duration: 3 },
      NIGHT: { name: 'Night', startTime: '17:00', endTime: '07:00', duration: 14 },
    },
    rotationCycle: ['MORNING', 'MORNING', 'AFTERNOON', 'AFTERNOON', 'NIGHT', 'NIGHT', 'OFF', 'OFF'],
    minStaffPerShift: 1,
  });
  return created.data.id;
}
```
