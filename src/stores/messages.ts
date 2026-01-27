import { create } from 'zustand';
import { socketService } from '@/lib/socket';
import { Message } from '@/types/messaging';

interface MessagingState {
  activeConversationId: string | null;
  typingUsers: Record<string, string[]>; // conversationId -> userIds
  onlineUsers: Set<string>;
  
  // Real-time message buffer (optional, if we want to append socket messages to RQ cache)
  // or we can use RQ's setQueryData in the socket listener.
  
  // Actions
  setActiveConversation: (conversationId: string | null) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setOnlineStatus: (userId: string, isOnline: boolean) => void;
  initializeSocket: (queryClient: any) => void; 
  cleanupSocket: () => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  activeConversationId: null,
  typingUsers: {},
  onlineUsers: new Set(),

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
  },

  setTyping: (conversationId, userId, isTyping) => {
    set((state) => {
      const currentTyping = state.typingUsers[conversationId] || [];
      let newTyping = [...currentTyping];
      if (isTyping && !newTyping.includes(userId)) {
        newTyping.push(userId);
      } else if (!isTyping) {
        newTyping = newTyping.filter(id => id !== userId);
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: newTyping,
        },
      };
    });
  },

  setOnlineStatus: (userId, isOnline) => {
    set((state) => {
      const newOnline = new Set(state.onlineUsers);
      if (isOnline) newOnline.add(userId);
      else newOnline.delete(userId);
      return { onlineUsers: newOnline };
    });
  },

  initializeSocket: (queryClient) => {
    socketService.connect();
    
    // Wire up socket events to React Query Cache updates
    socketService.on('message:new', (message: Message) => {
      const conversationId = message.conversationId;
      
      // Update Messages Cache
      queryClient.setQueryData(
          ["messaging", "messages", conversationId], 
          (old: any) => {
              if (!old) return [message];
              // Check for duplicates
              if (old.find((m: Message) => m.id === message.id)) return old;
              return [...old, message]; // Append new
          }
      );

      // Update Conversations List (bump to top, update preview)
      queryClient.invalidateQueries({ queryKey: ["messaging", "conversations"] });
    });

    socketService.on('user:typing', ({ conversationId, userId, isTyping }) => {
      get().setTyping(conversationId, userId, isTyping);
    });

    socketService.on('user:online', ({ userId }) => {
      get().setOnlineStatus(userId, true);
    });

    socketService.on('user:offline', ({ userId }) => {
      get().setOnlineStatus(userId, false);
    });
  },

  cleanupSocket: () => {
    socketService.disconnect();
  }
}));
