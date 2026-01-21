import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'
import { useTerminals, useTerminalStats, useCreateTerminal, useUpdateTerminal, useDeleteTerminal } from '@/hooks/terminals'
import type { Terminal, TerminalInput, TerminalUpdate } from '@/types/terminal'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'

export const Route = createFileRoute('/terminals/')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: Page,
})

const typeColors: Record<string, string> = {
  domestic: 'bg-blue-500/20 text-blue-400',
  international: 'bg-purple-500/20 text-purple-400',
  cargo: 'bg-orange-500/20 text-orange-400',
  general_aviation: 'bg-green-500/20 text-green-400',
}

function Page() {
  const { data: terminals = [], isLoading } = useTerminals()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Terminals</h1>
          <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            Manage airport terminals and facilities
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Terminal
        </button>
      </div>

      {/* Terminal Grid */}
      {isLoading ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
          Loading terminals...
        </div>
      ) : terminals.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
          No terminals registered. Add your first terminal!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {terminals.map((terminal) => (
            <TerminalCard 
              key={terminal.id} 
              terminal={terminal} 
              onClick={() => setSelectedTerminal(terminal)}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateTerminalModal onClose={() => setShowCreate(false)} />}
      {selectedTerminal && (
        <TerminalDetailModal 
          terminal={selectedTerminal} 
          onClose={() => setSelectedTerminal(null)} 
        />
      )}
    </div>
  )
}

function TerminalCard({ terminal, onClick }: { terminal: Terminal; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 cursor-pointer hover:border-[var(--color-primary)] transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center">
            <span className="text-xl font-bold text-[var(--color-primary)]">{terminal.code}</span>
          </div>
          <div>
            <h3 className="font-semibold">{terminal.name}</h3>
            {terminal.location && (
              <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
                {terminal.location}
              </p>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          terminal.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
        }`}>
          {terminal.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      {terminal.type && (
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${typeColors[terminal.type] || 'bg-gray-500/20 text-gray-400'}`}>
          {terminal.type.replace('_', ' ')}
        </span>
      )}
      
      {terminal.description && (
        <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_70%,transparent)] mt-3 line-clamp-2">
          {terminal.description}
        </p>
      )}
    </div>
  )
}

function TerminalDetailModal({ terminal, onClose }: { terminal: Terminal; onClose: () => void }) {
  const { data: stats } = useTerminalStats(terminal.id)
  const updateTerminal = useUpdateTerminal()
  const deleteTerminal = useDeleteTerminal()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<TerminalUpdate>({
    name: terminal.name,
    code: terminal.code,
    description: terminal.description || '',
    location: terminal.location || '',
    isActive: terminal.isActive,
  })

  const handleSave = () => {
    updateTerminal.mutate(
      { id: terminal.id, input: form },
      { onSuccess: () => setIsEditing(false) }
    )
  }

  const handleDelete = () => {
    if (confirm('Delete this terminal?')) {
      deleteTerminal.mutate(terminal.id, { onSuccess: onClose })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-lg border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center">
              <span className="font-bold text-[var(--color-primary)]">{terminal.code}</span>
            </div>
            <h2 className="font-semibold">{terminal.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="p-2 hover:bg-red-500/10 text-red-400 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-[var(--color-background)] rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-background)] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold">{stats.assignedStaff}</p>
                <p className="text-xs text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Staff</p>
              </div>
              <div className="bg-[var(--color-background)] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold">{stats.activeRosters}</p>
                <p className="text-xs text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Rosters</p>
              </div>
              <div className="bg-[var(--color-background)] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold">{stats.activeInspections}</p>
                <p className="text-xs text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Inspections</p>
              </div>
              <div className="bg-[var(--color-background)] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold">{stats.activeTasks}</p>
                <p className="text-xs text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Tasks</p>
              </div>
            </div>
          )}

          {/* Details / Edit Form */}
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[60px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm">Active</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 bg-[var(--color-background)] rounded-lg hover:opacity-80 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateTerminal.isPending}
                  className="flex-1 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  {updateTerminal.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Type</span>
                  <p className="font-medium capitalize">{terminal.type?.replace('_', ' ') || '-'}</p>
                </div>
                <div>
                  <span className="text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Location</span>
                  <p className="font-medium">{terminal.location || '-'}</p>
                </div>
              </div>
              {terminal.description && (
                <div>
                  <span className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Description</span>
                  <p className="text-sm">{terminal.description}</p>
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2 bg-[var(--color-background)] rounded-lg hover:opacity-80 transition"
              >
                Edit Terminal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateTerminalModal({ onClose }: { onClose: () => void }) {
  const createTerminal = useCreateTerminal()
  const user = useAuthStore((s) => s.user)
  const [form, setForm] = useState<Partial<TerminalInput>>({
    name: '',
    code: '',
    organizationId: user?.organizationId || '',
    airportCode: '', // initialize airport code
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTerminal.mutate(form as TerminalInput, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="font-semibold">Add Terminal</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-background)] rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Terminal Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Terminal 1"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g., T1"
                maxLength={5}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Airport Code</label>
                <input
                value={form.airportCode || ''}
                onChange={(e) => setForm({ ...form, airportCode: e.target.value.toUpperCase() })}
                placeholder="e.g., LOS"
                maxLength={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                required
                />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.type || ''}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              required
            >
              <option value="">Select type...</option>
              <option value="domestic">Domestic</option>
              <option value="international">International</option>
              <option value="cargo">Cargo</option>
              <option value="general_aviation">General Aviation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              value={form.location || ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., North Wing"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[60px]"
            />
          </div>
          <button
            type="submit"
            disabled={createTerminal.isPending}
            className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {createTerminal.isPending ? 'Creating...' : 'Add Terminal'}
          </button>
        </form>
      </div>
    </div>
  )
}
