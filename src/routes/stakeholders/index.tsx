import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'
import { useAirlines, useVendors, useVendorRatings, useRegulatorySubmissions, useCreateAirline, useCreateVendor, useCreateVendorRating } from '@/hooks/stakeholders'
import type { Airline, Vendor, RegulatorySubmission, AirlineInput, VendorInput, VendorRatingInput } from '@/types/stakeholder'
import { useState } from 'react'
import { format } from 'date-fns'

export const Route = createFileRoute('/stakeholders/')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: Page,
})

function Page() {
  const [activeTab, setActiveTab] = useState<'airlines' | 'vendors' | 'regulatory'>('airlines')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Stakeholders</h1>
        <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
          Manage airlines, vendors, and regulatory submissions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-surface)] rounded-lg p-1 w-fit border border-[var(--color-border)]">
        {(['airlines', 'vendors', 'regulatory'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition capitalize ${
              activeTab === tab
                ? 'bg-[var(--color-primary)] text-white'
                : 'hover:bg-[var(--color-background)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'airlines' && <AirlinesTab />}
      {activeTab === 'vendors' && <VendorsTab />}
      {activeTab === 'regulatory' && <RegulatoryTab />}
    </div>
  )
}

function AirlinesTab() {
  const { data: airlines = [], isLoading } = useAirlines()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Airline
        </button>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Loading...</div>
        ) : airlines.length === 0 ? (
          <div className="p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">No airlines registered</div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--color-background)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">IATA</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">ICAO</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Country</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {airlines.map((airline) => (
                <tr key={airline.id} className="hover:bg-[var(--color-background)] transition">
                  <td className="px-4 py-3 font-medium">{airline.name}</td>
                  <td className="px-4 py-3 text-sm">{airline.iataCode}</td>
                  <td className="px-4 py-3 text-sm">{airline.icaoCode || '-'}</td>
                  <td className="px-4 py-3 text-sm">{airline.country || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      airline.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {airline.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateAirlineModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}

function VendorsTab() {
  const { data: vendors = [], isLoading } = useVendors()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Vendor
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Loading...</div>
        ) : vendors.length === 0 ? (
          <div className="col-span-full p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">No vendors registered</div>
        ) : (
          vendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => setSelectedVendor(vendor)}
              className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 cursor-pointer hover:border-[var(--color-primary)] transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium">{vendor.name}</h3>
                {vendor.averageRating && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm">{vendor.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {vendor.vendorType && (
                <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded mb-2">
                  {vendor.vendorType}
                </span>
              )}
              <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
                {vendor.contactEmail || 'No contact info'}
              </p>
            </div>
          ))
        )}
      </div>

      {showCreate && <CreateVendorModal onClose={() => setShowCreate(false)} />}
      {selectedVendor && <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />}
    </div>
  )
}

function RegulatoryTab() {
  const { data: submissions = [], isLoading } = useRegulatorySubmissions()

  const statusColors = {
    submitted: 'bg-blue-500/20 text-blue-400',
    accepted: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Loading...</div>
      ) : submissions.length === 0 ? (
        <div className="p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">No regulatory submissions</div>
      ) : (
        <table className="w-full">
          <thead className="bg-[var(--color-background)]">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Agency</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Report Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-[var(--color-background)] transition">
                <td className="px-4 py-3 font-medium">{sub.agency}</td>
                <td className="px-4 py-3 text-sm">{sub.reportType}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[sub.status]}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
                  {format(new Date(sub.submittedAt), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function CreateAirlineModal({ onClose }: { onClose: () => void }) {
  const createAirline = useCreateAirline()
  const [form, setForm] = useState<Partial<AirlineInput>>({ name: '', iataCode: '', organizationId: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createAirline.mutate(form as AirlineInput, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="font-semibold">Add Airline</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-background)] rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Airline Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">IATA Code</label>
              <input
                value={form.iataCode}
                onChange={(e) => setForm({ ...form, iataCode: e.target.value.toUpperCase() })}
                maxLength={2}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ICAO Code</label>
              <input
                value={form.icaoCode || ''}
                onChange={(e) => setForm({ ...form, icaoCode: e.target.value.toUpperCase() })}
                maxLength={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <input
              value={form.country || ''}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            />
          </div>
          <button
            type="submit"
            disabled={createAirline.isPending}
            className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {createAirline.isPending ? 'Creating...' : 'Add Airline'}
          </button>
        </form>
      </div>
    </div>
  )
}

function CreateVendorModal({ onClose }: { onClose: () => void }) {
  const createVendor = useCreateVendor()
  const [form, setForm] = useState<Partial<VendorInput>>({ name: '', organizationId: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createVendor.mutate(form as VendorInput, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="font-semibold">Add Vendor</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-background)] rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vendor Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vendor Type</label>
            <input
              value={form.vendorType || ''}
              onChange={(e) => setForm({ ...form, vendorType: e.target.value })}
              placeholder="e.g., Catering, Ground Handling"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Email</label>
            <input
              type="email"
              value={form.contactEmail || ''}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            />
          </div>
          <button
            type="submit"
            disabled={createVendor.isPending}
            className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {createVendor.isPending ? 'Creating...' : 'Add Vendor'}
          </button>
        </form>
      </div>
    </div>
  )
}

function VendorDetailModal({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const { data: ratings = [] } = useVendorRatings(vendor.id)
  const createRating = useCreateVendorRating()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault()
    createRating.mutate(
      { vendorId: vendor.id, rating, comment },
      { onSuccess: () => { setRating(5); setComment('') } }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="font-semibold">{vendor.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-background)] rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="text-sm">
            <span className="text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Type: </span>
            {vendor.vendorType || '-'}
          </div>

          <div>
            <h3 className="font-medium mb-2">Ratings ({ratings.length})</h3>
            <div className="space-y-2 mb-4">
              {ratings.map((r) => (
                <div key={r.id} className="bg-[var(--color-background)] rounded-lg p-3">
                  <div className="flex items-center gap-1 text-yellow-400 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-current' : 'fill-gray-600'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {r.comment && <p className="text-sm">{r.comment}</p>}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Rate this vendor</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={`w-8 h-8 ${n <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
                    >
                      <svg className="w-full h-full fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment (optional)"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={createRating.isPending}
                className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {createRating.isPending ? 'Submitting...' : 'Submit Rating'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
