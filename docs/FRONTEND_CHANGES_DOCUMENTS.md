# Frontend Changes: Document Registration & Routing

## Overview

The document system now supports explicit "Destination Types" (routing paths) and tracking of the document journey.

### New Features:

1.  **Destination Selection**: When registering a document, users can now select a specific `destinationType` (e.g., Department, User, Position, or External).
2.  **Journey Visualization**: You can now fetch the full routing "journey" (both the history and planned steps) for a document.

## 1. Document Registration Updates

The `POST /api/documents/register` endpoint now accepts additional fields for routing.

### New Fields in `FormData`

| Field Name             | Type     | Description                                                                             |
| :--------------------- | :------- | :-------------------------------------------------------------------------------------- |
| `destinationType`      | `string` | One of: `department`, `position`, `user`, `external`, `registry`.                       |
| `finalDestinationId`   | `uuid`   | ID of the target User or Department (required if type is `department` or `user`).       |
| `finalDestinationName` | `string` | Name of the external entity or registry (required if type is `external` or `registry`). |

### Updated Implementation Example

```typescript
const registerDocument = async (param: {
  file: File | null;
  organizationId: string;
  subject: string;
  documentType: string;
  priority: string;

  // New Routing Fields
  destinationType: 'department' | 'user' | 'position' | 'external' | 'registry';
  finalDestinationId?: string; // If Department/User ID
  finalDestinationName?: string; // If External Name

  token: string;
}) => {
  const formData = new FormData();

  formData.append('organizationId', param.organizationId);
  formData.append('subject', param.subject);
  formData.append('documentType', param.documentType);
  formData.append('priority', param.priority);

  // Append Routing Info
  formData.append('destinationType', param.destinationType);
  if (param.finalDestinationId) {
    formData.append('finalDestinationId', param.finalDestinationId);
    // Legacy support: also map to destinationDepartmentId if it is a department
    if (param.destinationType === 'department') {
      formData.append('destinationDepartmentId', param.finalDestinationId);
    }
  }
  if (param.finalDestinationName) {
    formData.append('finalDestinationName', param.finalDestinationName);
  }

  if (param.file) {
    formData.append('file', param.file);
  }

  const response = await fetch('/api/documents/register', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${param.token}`,
    },
    body: formData,
  });

  return response.json();
};
```

## 2. Document Journey Visualization

Use the new endpoint to display a timeline or stepper of where the document has been and where it is going.

- **Endpoint**: `GET /api/documents/:id/journey`
- **Response**: Array of journey steps

### Sample Response

```json
{
  "success": true,
  "data": [
    {
      "stepNumber": 1,
      "status": "completed",
      "actionTaken": "registered",
      "comments": "Document registered",
      "completedAt": "2023-10-27T10:00:00Z",
      "positionCode": "REGISTRY",
      "assignedToUserFirstName": "John",
      "assignedToUserLastName": "Doe"
    },
    {
      "stepNumber": 2,
      "status": "pending",
      "departmentName": "Security",
      "assignedToUserFirstName": null, // Might be null if assigned to a department generally
      "assignedAt": "2023-10-27T10:00:00Z"
    }
  ]
}
```

### UI Implementation Tip

Render this data as a vertical timeline.

- **Completed** steps (status="completed") should be green/checked.
- **Pending** steps (status="pending") should be blue/active.
- Display `assignedAt` as "Arrived" time.
- Display `completedAt` as "Departed/Actioned" time.
