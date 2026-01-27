# Messaging System - Frontend Integration Guide

## UI Pages Overview

### Recommended Page Structure

```
/messages                     → Messaging Hub (conversation list)
/messages/:conversationId     → Conversation View
/messages/new                 → New Conversation
```

---

## API Endpoints Quick Reference

| Endpoint                                   | Method      | Description              |
| ------------------------------------------ | ----------- | ------------------------ |
| `/api/messages/conversations`              | GET         | List conversations       |
| `/api/messages/conversations/direct`       | POST        | Start/get direct message |
| `/api/messages/conversations/group`        | POST        | Create group             |
| `/api/messages/conversations/:id`          | GET         | Get conversation         |
| `/api/messages/conversations/:id`          | PATCH       | Update settings          |
| `/api/messages/conversations/:id/messages` | GET         | Get messages             |
| `/api/messages/conversations/:id/messages` | POST        | Send message             |
| `/api/messages/conversations/:id/read`     | POST        | Mark as read             |
| `/api/messages/conversations/:id/leave`    | POST        | Leave group              |
| `/api/messages/users/search`               | GET         | Search users             |
| `/api/messages/unread`                     | GET         | Get unread counts        |
| `/api/messages/:messageId`                 | PATCH       | Edit message             |
| `/api/messages/:messageId`                 | DELETE      | Delete message           |
| `/api/messages/:messageId/pin`             | POST/DELETE | Pin/unpin                |
| `/api/messages/:messageId/reactions`       | GET/POST    | Reactions                |
| `/api/messages/:messageId/acknowledge`     | POST        | Acknowledge              |

---

## Sample Requests & Responses

### 1. List Conversations

```http
GET /api/messages/conversations?type=all&page=1&limit=20
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "type": "direct",
        "name": null,
        "lastMessageAt": "2026-01-27T22:30:00.000Z",
        "lastMessagePreview": "Thanks!",
        "memberCount": 2,
        "membership": { "role": "member", "unreadCount": 2 },
        "otherUser": { "userId": "uuid", "firstName": "John", "lastName": "Doe" }
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

### 2. Search Users

```http
GET /api/messages/users/search?q=john&limit=5
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@airport.com",
      "role": "staff",
      "photoUrl": "https://..."
    }
  ]
}
```

### 3. Start Direct Conversation

```http
POST /api/messages/conversations/direct
Authorization: Bearer <token>
Content-Type: application/json

{ "targetUserId": "user-uuid" }
```

### 4. Create Group

```http
POST /api/messages/conversations/group
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Security Team",
  "description": "Team chat",
  "memberIds": ["uuid1", "uuid2"],
  "type": "group"
}
```

### 5. Get Messages

```http
GET /api/messages/conversations/:id/messages?limit=50
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid",
      "content": "Hello!",
      "messageType": "text",
      "createdAt": "2026-01-27T22:30:00.000Z",
      "sender": { "id": "uuid", "firstName": "John", "lastName": "Doe" }
    }
  ]
}
```

### 6. Send Message

```http
POST /api/messages/conversations/:id/messages
Authorization: Bearer <token>
Content-Type: application/json

{ "content": "Hello!", "messageType": "text" }
```

**With Attachments:**

```json
{
  "content": "Check this file",
  "messageType": "file",
  "attachments": [
    {
      "fileName": "doc.pdf",
      "originalName": "Document.pdf",
      "fileUrl": "https://...",
      "fileSize": 12345,
      "mimeType": "application/pdf"
    }
  ]
}
```

### 7. Add Reaction

```http
POST /api/messages/:messageId/reactions
Authorization: Bearer <token>
Content-Type: application/json

{ "reactionType": "like" }
```

**Types:** `like`, `love`, `laugh`, `wow`, `sad`, `angry`

---

## WebSocket Integration

### Connect

```typescript
import { io } from 'socket.io-client';

const socket = io('http://api-url', {
  auth: { token: accessToken },
});
```

### Events to Emit

```typescript
// Join conversation rooms
socket.emit('conversations:join', ['conv-id-1', 'conv-id-2']);

// Typing indicator
socket.emit('typing:start', conversationId);
socket.emit('typing:stop', conversationId);

// Mark read
socket.emit('message:read', { messageId, conversationId });

// Reactions
socket.emit('message:react', { messageId, conversationId, reactionType: 'like' });
```

### Events to Listen

```typescript
// New message
socket.on('message:new', (message) => {
  /* Add to list */
});

// Typing indicator
socket.on('user:typing', ({ conversationId, userId, isTyping }) => {});

// Read receipts
socket.on('message:read', ({ messageId, userId, readAt }) => {});

// Online status
socket.on('user:online', ({ userId }) => {});
socket.on('user:offline', ({ userId }) => {});

// Emergency
socket.on('emergency:alert', (alert) => {
  /* Show alert */
});
```

---

## Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```
