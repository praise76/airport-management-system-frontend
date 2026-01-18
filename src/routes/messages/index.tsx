import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'
import { useConversations, useMessages, useSendMessage, useCreateConversation } from '@/hooks/messaging'
import type { Conversation, Message, MessageInput, ConversationInput } from '@/types/messaging'
import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/auth'

export const Route = createFileRoute('/messages/')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: Page,
})

function Page() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const { data: conversations = [], isLoading } = useConversations()

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            Internal communication hub
          </p>
        </div>
        <button
          onClick={() => setShowNewConversation(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Split Pane */}
      <div className="flex-1 flex rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
        {/* Conversation List */}
        <div className="w-80 border-r border-[var(--color-border)] flex flex-col">
          <div className="p-3 border-b border-[var(--color-border)]">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={selectedId === conv.id}
                  onClick={() => setSelectedId(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col">
          {selectedId ? (
            <MessageThread conversationId={selectedId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewConversation && <NewConversationModal onClose={() => setShowNewConversation(false)} />}
    </div>
  )
}

function ConversationItem({ conversation, isActive, onClick }: { conversation: Conversation; isActive: boolean; onClick: () => void }) {
  const displayName = conversation.isGroup
    ? conversation.groupName
    : conversation.participants.map(p => `${p.firstName} ${p.lastName}`).join(', ')

  return (
    <div
      onClick={onClick}
      className={`p-3 cursor-pointer border-b border-[var(--color-border)] transition ${
        isActive ? 'bg-[var(--color-primary)]/10' : 'hover:bg-[var(--color-background)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          conversation.isGroup ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          {conversation.isGroup ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{displayName || 'Unknown'}</p>
          {conversation.lastMessageAt && (
            <p className="text-xs text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
              {format(new Date(conversation.lastMessageAt), 'MMM d, h:mm a')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageThread({ conversationId }: { conversationId: string }) {
  const { data: messages = [] } = useMessages(conversationId)
  const sendMessage = useSendMessage()
  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUser = useAuthStore((s) => s.user)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage.mutate(
      { conversationId, input: { content: text, messageType: 'text' } },
      { onSuccess: () => setText('') }
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)] py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUser?.id} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-[var(--color-border)] flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full bg-[var(--color-background)] border border-[var(--color-border)]"
        />
        <button
          type="submit"
          disabled={sendMessage.isPending || !text.trim()}
          className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </>
  )
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && message.sender && (
          <p className="text-xs text-[color-mix(in_oklab,var(--color-text)_60%,transparent)] mb-1 ml-3">
            {message.sender.firstName} {message.sender.lastName}
          </p>
        )}
        <div className={`px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-[var(--color-primary)] text-white rounded-br-sm'
            : 'bg-[var(--color-background)] rounded-bl-sm'
        }`}>
          <p className="text-sm">{message.content}</p>
        </div>
        <p className={`text-xs text-[color-mix(in_oklab,var(--color-text)_40%,transparent)] mt-1 ${isOwn ? 'text-right mr-3' : 'ml-3'}`}>
          {format(new Date(message.createdAt), 'h:mm a')}
        </p>
      </div>
    </div>
  )
}

function NewConversationModal({ onClose }: { onClose: () => void }) {
  const createConversation = useCreateConversation()
  const [participantId, setParticipantId] = useState('')
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!participantId) return
    const input: ConversationInput = {
      participantIds: [participantId],
      isGroup,
      groupName: isGroup ? groupName : undefined,
    }
    createConversation.mutate(input, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="font-semibold">New Conversation</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-background)] rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Participant User ID</label>
            <input
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              placeholder="Enter user ID..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isGroup"
              checked={isGroup}
              onChange={(e) => setIsGroup(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isGroup" className="text-sm">Create as group chat</label>
          </div>
          {isGroup && (
            <div>
              <label className="block text-sm font-medium mb-1">Group Name</label>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={createConversation.isPending}
            className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {createConversation.isPending ? 'Creating...' : 'Start Conversation'}
          </button>
        </form>
      </div>
    </div>
  )
}
