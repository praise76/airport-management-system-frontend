import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'
import { useGeofenceZones, useCreateGeofenceZone, useUpdateGeofenceZone, useDeleteGeofenceZone } from '@/hooks/geofence'
import type { GeofenceZone, GeofenceZoneInput } from '@/types/geofence'
import { useState } from 'react'

export const Route = createFileRoute('/geofence/')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: Page,
})

const zoneTypeColors: Record<string, string> = {
  office: 'bg-blue-500/20 text-blue-400',
  terminal: 'bg-purple-500/20 text-purple-400',
  restricted: 'bg-red-500/20 text-red-400',
  parking: 'bg-green-500/20 text-green-400',
}

const zoneTypeIcons: Record<string, string> = {
  office: '🏢',
  terminal: '🛫',
  restricted: '⛔',
  parking: '🅿️',
}

function Page() {
  const { data: zones, isLoading } = useGeofenceZones()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedZone, setSelectedZone] = useState<GeofenceZone | null>(null)

  // console.log('zones', zones)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Geofence Zones</h1>
          <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            Define attendance and access control zones
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Zone
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['office', 'terminal', 'restricted', 'parking'] as const).map((type) => {
          const count = zones?.filter(z => z.zoneType === type).length
          return (
            <div key={type} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${zoneTypeColors[type]}`}>
                  <span className="text-lg">{zoneTypeIcons[type]}</span>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{count}</p>
                  <p className="text-xs text-[color-mix(in_oklab,var(--color-text)_60%,transparent)] capitalize">{type}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Zone List */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            Loading zones...
          </div>
        ) : zones?.length === 0 ? (
          <div className="p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            No geofence zones defined. Add your first zone!
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--color-background)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Zone</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Coordinates</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {zones?.map((zone) => (
                <tr
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className="hover:bg-[var(--color-background)] cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{zoneTypeIcons[zone.zoneType]}</span>
                      <div>
                        <p className="font-medium">{zone.name}</p>
                        {zone.description && (
                          <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)] truncate max-w-[200px]">
                            {zone.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${zoneTypeColors[zone.zoneType]}`}>
                      {zone.zoneType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
                    {zone.coordinates?.length || 0} points
                    {zone.radius && ` • ${zone.radius}m radius`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      zone.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateZoneModal onClose={() => setShowCreate(false)} />}
      {selectedZone && <ZoneDetailModal zone={selectedZone} onClose={() => setSelectedZone(null)} />}
    </div>
  )
}

function ZoneDetailModal({ zone, onClose }: { zone: GeofenceZone; onClose: () => void }) {
  const updateZone = useUpdateGeofenceZone()
  const deleteZone = useDeleteGeofenceZone()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: zone.name,
    description: zone.description || '',
    zoneType: zone.zoneType,
    radius: zone.radius || undefined,
    isActive: zone.isActive,
  })

  const handleSave = () => {
    updateZone.mutate(
      { id: zone.id, input: form },
      { onSuccess: () => setIsEditing(false) }
    )
  }

  const handleDelete = () => {
    if (confirm('Delete this zone?')) {
      deleteZone.mutate(zone.id, { onSuccess: onClose })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{zoneTypeIcons[zone.zoneType]}</span>
            <h2 className="font-semibold">{zone.name}</h2>
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
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={form.zoneType}
                  onChange={(e) => setForm({ ...form, zoneType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                >
                  <option value="office">Office</option>
                  <option value="terminal">Terminal</option>
                  <option value="restricted">Restricted</option>
                  <option value="parking">Parking</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Radius (meters)</label>
                <input
                  type="number"
                  value={form.radius || ''}
                  onChange={(e) => setForm({ ...form, radius: e.target.value ? parseInt(e.target.value) : undefined })}
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
                  className="flex-1 py-2 bg-[var(--color-background)] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateZone.isPending}
                  className="flex-1 py-2 bg-[var(--color-primary)] text-white rounded-lg disabled:opacity-50"
                >
                  {updateZone.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Type</span>
                  <p className="font-medium capitalize">{zone.zoneType}</p>
                </div>
                <div>
                  <span className="text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Radius</span>
                  <p className="font-medium">{zone.radius ? `${zone.radius}m` : '-'}</p>
                </div>
              </div>

              {zone.description && (
                <div>
                  <span className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Description</span>
                  <p className="text-sm mt-1">{zone.description}</p>
                </div>
              )}

              {/* Coordinates Preview */}
              <div>
                <span className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Coordinates</span>
                <div className="mt-2 bg-[var(--color-background)] rounded-lg p-3 max-h-32 overflow-y-auto">
                  {zone.coordinates && zone.coordinates.length > 0 ? (
                    <div className="space-y-1 text-xs font-mono">
                      {zone.coordinates.map((coord, i) => (
                        <div key={i}>
                          {i + 1}. ({coord.lat.toFixed(6)}, {coord.lng.toFixed(6)})
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">No coordinates defined</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2 bg-[var(--color-background)] rounded-lg"
              >
                Edit Zone
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateZoneModal({ onClose }: { onClose: () => void }) {
  const createZone = useCreateGeofenceZone()
  const [form, setForm] = useState<Partial<GeofenceZoneInput>>({
    name: '',
    zoneType: 'office',
    coordinates: [],
    organizationId: '',
  })
  const [coordInput, setCoordInput] = useState({ lat: '', lng: '' })

  const addCoordinate = () => {
    const lat = parseFloat(coordInput.lat)
    const lng = parseFloat(coordInput.lng)
    if (!isNaN(lat) && !isNaN(lng)) {
      setForm({
        ...form,
        coordinates: [...(form.coordinates || []), { lat, lng }]
      })
      setCoordInput({ lat: '', lng: '' })
    }
  }

  const removeCoordinate = (index: number) => {
    setForm({
      ...form,
      coordinates: (form.coordinates || []).filter((_, i) => i !== index)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createZone.mutate(form as GeofenceZoneInput, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)] max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center sticky top-0 bg-[var(--color-surface)]">
          <h2 className="font-semibold">Add Geofence Zone</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-background)] rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Zone Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Main Office"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.zoneType}
              onChange={(e) => setForm({ ...form, zoneType: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            >
              <option value="office">Office</option>
              <option value="terminal">Terminal</option>
              <option value="restricted">Restricted</option>
              <option value="parking">Parking</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Radius (meters, optional)</label>
            <input
              type="number"
              value={form.radius || ''}
              onChange={(e) => setForm({ ...form, radius: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g., 100"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Zone details..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[60px]"
            />
          </div>

          {/* Coordinates */}
          <div>
            <label className="block text-sm font-medium mb-2">Coordinates</label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                step="any"
                value={coordInput.lat}
                onChange={(e) => setCoordInput({ ...coordInput, lat: e.target.value })}
                placeholder="Latitude"
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
              />
              <input
                type="number"
                step="any"
                value={coordInput.lng}
                onChange={(e) => setCoordInput({ ...coordInput, lng: e.target.value })}
                placeholder="Longitude"
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
              />
              <button
                type="button"
                onClick={addCoordinate}
                className="px-3 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm"
              >
                Add
              </button>
            </div>
            {form.coordinates && form.coordinates.length > 0 && (
              <div className="bg-[var(--color-background)] rounded-lg p-2 space-y-1">
                {form.coordinates.map((coord, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-mono">({coord.lat.toFixed(6)}, {coord.lng.toFixed(6)})</span>
                    <button
                      type="button"
                      onClick={() => removeCoordinate(i)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={createZone.isPending}
            className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {createZone.isPending ? 'Creating...' : 'Add Zone'}
          </button>
        </form>
      </div>
    </div>
  )
}
