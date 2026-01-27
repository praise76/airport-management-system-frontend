# Public Duty Board - Frontend Implementation Guide

## Overview

The Public Duty Board API provides real-time data for "Who's On Duty" displays. It aggregates:

1.  **Internal Staff**: From the Duty Roster, filtered by current shift time.
2.  **Contractors**: From Permission Passes (people currently clocked in via entry/exit logs).

## API Reference

### Get Duty Board Data

**Endpoint:** `GET /api/public/duty-board`
**Auth:** Public (No token required)
**Query Parameters:**

- `departmentId` (optional): Filter results by specific department UUID.

### Sample Request

```bash
curl "http://localhost:3000/api/public/duty-board?departmentId=all"
```

### Sample Response

```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Security Operations",
        "onDutyCount": 12,
        "scheduledCount": 15,
        "currentShift": "Morning",
        "units": [
          {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Terminal 1 Gate A",
            "location": "T1-A-01",
            "minStaff": 3,
            "coverageStatus": "adequate",
            "onDutyStaff": [
              {
                "id": "user-uuid-1",
                "name": "John Doe",
                "avatar": "https://example.com/photo.jpg",
                "position": "Officer",
                "shiftStart": "08:00:00",
                "shiftEnd": "16:00:00",
                "checkedIn": true,
                "checkedInAt": "2024-01-27T08:05:00.000Z",
                "isLate": false
              }
            ]
          }
        ]
      }
    ],
    "contractors": [
      {
        "orgId": "org-uuid-1",
        "organizationName": "CleanCo Services",
        "contractType": "Janitorial",
        "onDutyPersonnel": [
          {
            "id": "person-uuid-1",
            "name": "Jane Smith",
            "photo": null,
            "role": "Supervisor",
            "currentLocation": "Terminal 2 Restrooms",
            "entryTime": "2024-01-27T07:30:00.000Z"
          }
        ]
      }
    ],
    "lastUpdated": "2024-01-27T10:30:00.000Z",
    "totalOnDuty": 45,
    "totalScheduled": 50
  }
}
```

---

## Frontend Integration (React + TypeScript)

### 1. Types

Copy these types to your project (e.g., `src/types/dutyBoard.ts`).

```typescript
export interface DutyStaff {
  id: string;
  name: string;
  avatar: string | null;
  position: string;
  shiftStart: string;
  shiftEnd: string;
  checkedIn: boolean;
  checkedInAt: string | null; // ISO Date
  isLate: boolean;
}

export interface DutyUnit {
  id: string;
  name: string;
  location: string;
  minStaff: number;
  coverageStatus: 'adequate' | 'understaffed' | 'critical';
  onDutyStaff: DutyStaff[];
}

export interface DutyDepartment {
  id: string;
  name: string;
  onDutyCount: number;
  scheduledCount: number;
  currentShift: string;
  units: DutyUnit[];
}

export interface ContractorPerson {
  id: string;
  name: string;
  photo: string | null;
  role: string;
  currentLocation: string;
  entryTime: string; // ISO Date
}

export interface ContractorOrg {
  orgId: string;
  organizationName: string;
  contractType: string;
  onDutyPersonnel: ContractorPerson[];
}

export interface DutyBoardResponse {
  departments: DutyDepartment[];
  contractors: ContractorOrg[];
  lastUpdated: string;
  totalOnDuty: number;
  totalScheduled: number;
}
```

### 2. Data Fetching Hook

Example hook to fetch data with polling (`src/hooks/useDutyBoard.ts`).

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';
import { DutyBoardResponse } from '../types/dutyBoard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useDutyBoardData = (departmentId = 'all') => {
  const [data, setData] = useState<DutyBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Note: Endpoint aligns with backend changes
      const response = await axios.get(`${API_URL}/api/public/duty-board`, {
        params: { departmentId },
      });
      if (response.data.success) {
        setData(response.data.data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch duty board data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [departmentId]);

  return { data, loading, error, refetch: fetchData };
};
```

### 3. Coverage Helper (CSS)

Add these styles to your CSS module or global CSS for the coverage badges.

```css
.coverage-status.adequate {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.coverage-status.understaffed {
  background-color: #fef9c3;
  color: #854d0e;
  border: 1px solid #fde047;
}

.coverage-status.critical {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
```
