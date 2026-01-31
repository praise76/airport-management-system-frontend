# Frontend Changes for AVSEC Chat System

This document outlines the frontend changes required to implement the Station-based Chat and Handover features.

## 1. Chat Sidebar Groups (`src/routes/messages.tsx`)

The backend now creates "Unit" and "Station" channels automatically upon clock-in. These are returned in the conversation list with `type: 'unit'`.

**Task:**

- Update the sidebar in `routes/messages.tsx` to group conversations:
  - **Stations**: `conversations.filter(c => c.type === 'unit' && c.settings?.isStationChannel)`
  - **Units**: `conversations.filter(c => c.type === 'unit' && !c.settings?.isStationChannel)`
  - **Direct**: `conversations.filter(c => c.type === 'direct')`
- Add a visual indicator (icon) for Station channels (e.g., using `Briefcase` or `MapPin` icon).
- Display the `name` (e.g., "PC - T1 Gate 1 - Morning Shift") clearly.

## 2. Handover Message Template (`src/features/messaging/HandoverModal.tsx`)

Create a new modal component to structure the handover report.

**Task:**

- Create `HandoverModal` that collects:
  - Status (Select: 'All Clear', 'Issues Noted', 'Incident')
  - Passenger Count (Number)
  - Equipment Check (Multi-select or Checkbox list)
  - Notes (Textarea)
  - Urgent Items (Textarea)
- **Submit Action**:
  - Call `sendMessage` API.
  - Payload:
    ```typescript
    {
      conversationId,
      content: "🔄 Handover Report", // Fallback text
      messageType: 'handover', // Custom type
      metadata: {
        status: 'Issues Noted',
        passengers: 142,
        equipment: ['Scanner 1 - OK', 'Scanner 2 - Slow'],
        notes: '...',
        urgent: '...'
      }
    }
    ```

## 3. Render Handover Messages (`src/components/messaging/MessageBubble.tsx`)

Update the message bubble to display handover reports distinctively.

**Task:**

- In `MessageBubble.tsx`, check `if (message.messageType === 'handover')`.
- Render a card style:
  - **Header**: "🔄 Handover Report" (Blue background)
  - **Body**: Table or list of metadata fields.
  - **Highlight**: If `metadata.urgent` exists, show a red alert box within the card.

## 4. Attendance Integration (`src/routes/attendance.tsx`)

Ensure chat list refreshes after clock-in.

**Task:**

- In the `Attendance` component (where clock-in happens), after a successful clock-in mutation:
  - Invalidate the `['conversations']` query key.
  - This ensures the new Station Channel appears immediately in the messages sidebar.

## 5. API Types (`src/types/messaging.ts`)

Update types to include new message variants.

```typescript
export interface Message {
  // ... existing fields
  messageType: 'text' | 'file' | 'emergency' | 'handover'; // Add handover
  metadata?: {
    status?: string;
    passengers?: number;
    equipment?: string[];
    notes?: string;
    urgent?: string;
    // ... any other fields
  };
}
```
