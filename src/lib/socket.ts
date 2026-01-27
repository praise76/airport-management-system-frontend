import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

// Events we emit
interface ClientToServerEvents {
  'conversations:join': (conversationIds: string[]) => void;
  'typing:start': (conversationId: string) => void;
  'typing:stop': (conversationId: string) => void;
  'message:read': (payload: { messageId: string; conversationId: string }) => void;
}

// Events we receive
interface ServerToClientEvents {
  'message:new': (message: any) => void;
  'user:typing': (payload: { conversationId: string; userId: string; isTyping: boolean }) => void;
  'message:read': (payload: { messageId: string; userId: string; readAt: string }) => void;
  'user:online': (payload: { userId: string }) => void;
  'user:offline': (payload: { userId: string }) => void;
  'message:reaction:added': (data: any) => void;
  'message:reaction:removed': (data: any) => void;
  'emergency:alert': (alert: any) => void;
}

class MessagingSocket {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private static instance: MessagingSocket;

  private constructor() {}

  public static getInstance(): MessagingSocket {
    if (!MessagingSocket.instance) {
      MessagingSocket.instance = new MessagingSocket();
    }
    return MessagingSocket.instance;
  }

  public connect() {
    if (this.socket?.connected) return;

    const token = useAuthStore.getState().accessToken;
    const url = import.meta.env.VITE_API_URL || "http://localhost:3000"; // Fallback, should come from env

    // Adjust URL if needed (e.g. remove /api suffix if present in base URL)
    // For now assuming the socket is at the same domain/port root
    
    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
    });

    this.socket.on('connect', () => {
      console.log('Connected to messaging socket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from messaging socket');
    });

    this.socket.connect();
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket() {
    return this.socket;
  }

  public joinConversations(conversationIds: string[]) {
    this.socket?.emit('conversations:join', conversationIds);
  }

  public startTyping(conversationId: string) {
    this.socket?.emit('typing:start', conversationId);
  }

  public stopTyping(conversationId: string) {
    this.socket?.emit('typing:stop', conversationId);
  }

  public markAsRead(messageId: string, conversationId: string) {
    this.socket?.emit('message:read', { messageId, conversationId });
  }

  public on<E extends keyof ServerToClientEvents>(event: E, callback: ServerToClientEvents[E]) {
    this.socket?.on(event, callback);
  }

  public off<E extends keyof ServerToClientEvents>(event: E, callback?: ServerToClientEvents[E]) {
    this.socket?.off(event, callback);
  }
}

export const socketService = MessagingSocket.getInstance();
