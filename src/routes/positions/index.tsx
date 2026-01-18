import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'
import { usePositions, usePositionHierarchy, useCreatePosition, useUpdatePosition, useDeletePosition, useAssignPosition } from '@/hooks/positions'
import type { Position, PositionInput, PositionHierarchy } from '@/types/position'
import { useState } from 'react'

export const Route = createFileRoute('/positions/')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: Page,
})

function Page() {
  const [activeTab, setActiveTab] = useState<'list' | 'hierarchy'>('list')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Positions</h1>
          <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            Manage organizational positions and hierarchy
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Position
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-surface)] rounded-lg p-1 w-fit border border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'list'
              ? 'bg-[var(--color-primary)] text-white'
              : 'hover:bg-[var(--color-background)]'
          }`}
        >
          List View
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'hierarchy'
              ? 'bg-[var(--color-primary)] text-white'
              : 'hover:bg-[var(--color-background)]'
          }`}
        >
          Hierarchy
        </button>
      </div>

      {/* Content */}
      {activeTab === 'list' ? (
        <PositionsList onSelect={setSelectedPosition} />
      ) : (
        <HierarchyView />
      )}

      {showCreate && <CreatePositionModal onClose={() => setShowCreate(false)} />}
      {selectedPosition && (
        <PositionDetailModal position={selectedPosition} onClose={() => setSelectedPosition(null)} />
      )}
    </div>
  )
}

function PositionsList({ onSelect }: { onSelect: (p: Position) => void }) {
  const { data: positions = [], isLoading } = usePositions()

  const levelColors = ['bg-red-500/20 text-red-400', 'bg-orange-500/20 text-orange-400', 'bg-yellow-500/20 text-yellow-400', 'bg-green-500/20 text-green-400', 'bg-blue-500/20 text-blue-400']

  if (isLoading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
        Loading positions...
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
        No positions defined. Create your first position!
      </div>
    )
  }

  // Group by level
  const grouped = positions.reduce((acc, pos) => {
    const level = pos.level || 0
    if (!acc[level]) acc[level] = []
    acc[level].push(pos)
    return acc
  }, {} as Record<number, Position[]>)

  return (
    <div className="space-y-4">
      {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([level, positionsInLevel]) => (
        <div key={level}>
          <h3 className="text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)] mb-2">
            Level {level}
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {positionsInLevel.map((pos) => (
              <div
                key={pos.id}
                onClick={() => onSelect(pos)}
                className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 cursor-pointer hover:border-[var(--color-primary)] transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{pos.title}</h4>
                    {pos.description && (
                      <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)] mt-1 line-clamp-2">
                        {pos.description}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${levelColors[pos.level % levelColors.length]}`}>
                    L{pos.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function HierarchyView() {
  const { data: hierarchy = [], isLoading } = usePositionHierarchy()

  if (isLoading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
        Loading hierarchy...
      </div>
    )
  }

  if (hierarchy.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
        No hierarchy data available
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
      <div className="space-y-4">
        {hierarchy.map((node) => (
          <HierarchyNode key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}

function HierarchyNode({ node, depth }: { node: PositionHierarchy; depth: number }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className="flex items-center gap-2 py-2">
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-5 h-5 flex items-center justify-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)] hover:text-[var(--color-text)]"
          >
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[var(--color-border)]" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center text-sm font-medium text-[var(--color-primary)]">
            L{node.level}
          </div>
          <span className="font-medium">{node.title}</span>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="border-l-2 border-[var(--color-border)] ml-2.5">
          {node.children.map((child) => (
            <HierarchyNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function PositionDetailModal({ position, onClose }: { position: Position; onClose: () => void }) {
  const updatePosition = useUpdatePosition()
  const deletePosition = useDeletePosition()
  const assignPosition = useAssignPosition()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    title: position.title,
    description: position.description || '',
    level: position.level,
  })
  const [assignUserId, setAssignUserId] = useState('')

  const handleSave = () => {
    updatePosition.mutate(
      { id: position.id, input: form },
      { onSuccess: () => setIsEditing(false) }
    )
  }

  const handleDelete = () => {
    if (confirm('Delete this position?')) {
      deletePosition.mutate(position.id, { onSuccess: onClose })
    }
  }

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignUserId) return
    assignPosition.mutate(
      { positionId: position.id, input: { userId: assignUserId } },
      { onSuccess: () => setAssignUserId('') }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="font-semibold">{position.title}</h2>
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
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Level</label>
                <input
                  type="number"
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })}
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
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 bg-[var(--color-background)] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updatePosition.isPending}
                  className="flex-1 py-2 bg-[var(--color-primary)] text-white rounded-lg disabled:opacity-50"
                >
                  {updatePosition.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Level</span>
                  <p className="font-medium">{position.level}</p>
                </div>
                <div>
                  <span className="text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Department</span>
                  <p className="font-medium">{position.departmentId || '-'}</p>
                </div>
              </div>
              {position.description && (
                <div>
                  <span className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Description</span>
                  <p className="text-sm mt-1">{position.description}</p>
                </div>
              )}

              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2 bg-[var(--color-background)] rounded-lg"
              >
                Edit Position
              </button>

              {/* Assign User */}
              <div className="border-t border-[var(--color-border)] pt-4">
                <h4 className="text-sm font-medium mb-2">Assign User</h4>
                <form onSubmit={handleAssign} className="flex gap-2">
                  <input
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    placeholder="User ID"
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
                  />
                  <button
                    type="submit"
                    disabled={assignPosition.isPending}
                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Assign
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CreatePositionModal({ onClose }: { onClose: () => void }) {
  const createPosition = useCreatePosition()
  const { data: positions = [] } = usePositions()
  const [form, setForm] = useState<Partial<PositionInput>>({
    title: '',
    level: 1,
    organizationId: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createPosition.mutate(form as PositionInput, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="font-semibold">Add Position</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-background)] rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Terminal Manager"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Level</label>
            <input
              type="number"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })}
              min={1}
              max={10}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            />
            <p className="text-xs text-[color-mix(in_oklab,var(--color-text)_50%,transparent)] mt-1">
              1 = Top level (e.g., CEO), higher = lower in hierarchy
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reports To</label>
            <select
              value={form.reportsToId || ''}
              onChange={(e) => setForm({ ...form, reportsToId: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            >
              <option value="">None (Top Level)</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.title} (L{p.level})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Role responsibilities..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[60px]"
            />
          </div>
          <button
            type="submit"
            disabled={createPosition.isPending}
            className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {createPosition.isPending ? 'Creating...' : 'Add Position'}
          </button>
        </form>
      </div>
    </div>
  )
}
