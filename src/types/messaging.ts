export type ConversationType = 'direct' | 'group' | 'emergency' | 'unit' | 'department';
export type MessageType = 'text' | 'file' | 'emergency' | 'handover';
export type MessagePriority = 'normal' | 'critical';
export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';

export interface User {
  id: string; // uuid
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  role?: string;
  departmentId?: string;
  employeeId?: string;
}

export interface Member {
  id?: string; // membership uuid
  userId: string;
  role: 'admin' | 'member';
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string | null;
  description?: string | null;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  memberCount: number;
  isActive: boolean;
  settings?: {
    isStationChannel?: boolean;
    whoCanPost?: 'everyone' | 'admins' | 'supervisors';
    allowFileSharing?: boolean;
    // New fields for Enhanced Chat
    isStationMasterChannel?: boolean;
    /** Emergency alert group: every person in the department, can't be muted or left; supervisors and heads post. */
    isEmergencyAlertGroup?: boolean;
    /** Day or Night shift group, and team chat: people are in them while checked in. */
    isShiftGroup?: boolean;
    isTeamChat?: boolean;
    shiftType?: string; // e.g. "Morning", "Afternoon", "Night"
    channelCode?: string; // e.g. "AVSEC-PC-T1-GATE1-MORNING"
  };
  membership?: {
    role: 'admin' | 'member';
    unreadCount: number;
    isMuted: boolean;
    notificationsEnabled?: boolean;
    canPost?: boolean;
  };
  otherUser?: User | null; // For direct messages
  members?: Member[]; // Optional, for detailed view
}

export interface Attachment {
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface MessageReaction {
  type: ReactionType;
  count: number;
  userParams?: string[]; // IDs of users who reacted
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  metadata?: {
    status?: string;
    passengers?: number;
    equipment?: string[];
    notes?: string;
    urgent?: string;
  };
  attachments: Attachment[];
  parentMessageId?: string | null;
  replyCount: number;
  priority: MessagePriority;
  /** Set on an emergency alert: everyone in the chat is asked to acknowledge it. */
  requiresAcknowledgment?: boolean;
  /** How many people have acknowledged it so far. */
  acknowledgmentCount?: number;
  reactionCount: number;
  reactions?: MessageReaction[];
  isEdited: boolean;
  isPinned: boolean;
  readAt?: string; // For self or checking if others read
  createdAt: string;
  editedAt?: string;
  sender: User;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  memberIds: string[]; // User IDs
  type: 'group';
  settings?: {
    whoCanPost: 'everyone' | 'admins';
    allowFileSharing: boolean;
  };
}

// WebSocket Payload Types
export interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface MessageReadPayload {
  messageId: string;
  conversationId: string;
  userId: string;
  readAt: string;
}

export interface OnlineStatusPayload {
  userId: string;
  isOnline: boolean;
}

/** One person's acknowledgment of an alert (GET /messages/:id/acknowledgments). */
export interface MessageAcknowledgment {
  id: string;
  userId: string;
  acknowledgedAt: string;
  response?: string;
  firstName?: string;
  lastName?: string;
}
