import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'
import { useInspections, useInspectionTemplates, useCreateInspection, useSubmitInspection } from '@/hooks/inspections'
import type { Inspection, InspectionTemplate, InspectionResponse, InspectionStatus } from '@/types/inspection'
import { useState } from 'react'
import { format } from 'date-fns'

export const Route = createFileRoute('/inspections/')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: Page,
})

const statusColors: Record<InspectionStatus, string> = {
  in_progress: 'bg-yellow-500/20 text-yellow-400',
  submitted: 'bg-green-500/20 text-green-400',
}

function Page() {
  const [activeTab, setActiveTab] = useState<'inspections' | 'templates'>('inspections')
  const [showStartInspection, setShowStartInspection] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inspections</h1>
          <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            Conduct and manage safety inspections
          </p>
        </div>
        <button
          onClick={() => setShowStartInspection(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Start Inspection
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-surface)] rounded-lg p-1 w-fit border border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('inspections')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'inspections'
              ? 'bg-[var(--color-primary)] text-white'
              : 'hover:bg-[var(--color-background)]'
          }`}
        >
          Inspections
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'templates'
              ? 'bg-[var(--color-primary)] text-white'
              : 'hover:bg-[var(--color-background)]'
          }`}
        >
          Templates
        </button>
      </div>

      {/* Content */}
      {activeTab === 'inspections' ? (
        <InspectionsList onSelect={setSelectedInspection} />
      ) : (
        <TemplatesList />
      )}

      {showStartInspection && <StartInspectionModal onClose={() => setShowStartInspection(false)} />}
      {selectedInspection && (
        <InspectionDetailModal inspection={selectedInspection} onClose={() => setSelectedInspection(null)} />
      )}
    </div>
  )
}

function InspectionsList({ onSelect }: { onSelect: (i: Inspection) => void }) {
  const { data, isLoading } = useInspections()
  const inspections = data?.data || []

  if (isLoading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
        Loading inspections...
      </div>
    )
  }

  if (inspections.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
        No inspections yet. Start your first inspection!
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--color-background)]">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Template</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Location</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Status</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {inspections.map((inspection) => (
            <tr
              key={inspection.id}
              onClick={() => onSelect(inspection)}
              className="hover:bg-[var(--color-background)] cursor-pointer transition"
            >
              <td className="px-4 py-3 font-medium">
                {inspection.template?.name || 'Custom Inspection'}
              </td>
              <td className="px-4 py-3 text-sm text-[color-mix(in_oklab,var(--color-text)_80%,transparent)]">
                {inspection.location || inspection.terminalCode || '-'}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[inspection.status]}`}>
                  {inspection.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
                {format(new Date(inspection.createdAt), 'MMM d, yyyy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TemplatesList() {
  const { data: templates = [], isLoading } = useInspectionTemplates()

  if (isLoading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
        Loading templates...
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
        No templates available
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <div key={template.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium">{template.name}</h3>
            {template.isActive !== false && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)] mb-3">
              {template.description}
            </p>
          )}
          <div className="text-xs text-[color-mix(in_oklab,var(--color-text)_50%,transparent)]">
            {template.questions?.length || 0} questions
          </div>
        </div>
      ))}
    </div>
  )
}

function StartInspectionModal({ onClose }: { onClose: () => void }) {
  const { data: templates = [] } = useInspectionTemplates()
  const createInspection = useCreateInspection()
  const [templateId, setTemplateId] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createInspection.mutate(
      { templateId: templateId || undefined, location },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="font-semibold">Start Inspection</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-background)] rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Template (Optional)</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Terminal 1, Gate A3"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            />
          </div>
          <button
            type="submit"
            disabled={createInspection.isPending}
            className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {createInspection.isPending ? 'Starting...' : 'Start Inspection'}
          </button>
        </form>
      </div>
    </div>
  )
}

function InspectionDetailModal({ inspection, onClose }: { inspection: Inspection; onClose: () => void }) {
  const submitInspection = useSubmitInspection()
  const [responses, setResponses] = useState<InspectionResponse[]>([])

  const template = inspection.template
  const questions = template?.questions || []

  const handleResponseChange = (questionId: string, answer: string) => {
    setResponses((prev) => {
      const existing = prev.findIndex((r) => r.questionId === questionId)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], answer }
        return updated
      }
      return [...prev, { questionId, answer }]
    })
  }

  const handleSubmit = () => {
    submitInspection.mutate(
      { id: inspection.id, input: { responses } },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-lg border border-[var(--color-border)] my-8">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <div>
            <h2 className="font-semibold">{template?.name || 'Inspection'}</h2>
            <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
              {inspection.location}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-background)] rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {inspection.status === 'submitted' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium">Inspection Submitted</p>
              <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
                Submitted on {inspection.submittedAt ? format(new Date(inspection.submittedAt), 'MMM d, yyyy h:mm a') : '-'}
              </p>
            </div>
          ) : questions.length === 0 ? (
            <p className="text-center text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
              No questions in this template
            </p>
          ) : (
            questions.map((q, idx) => (
              <div key={q.id || idx} className="bg-[var(--color-background)] rounded-lg p-4">
                <p className="font-medium mb-2">{q.question}</p>
                {q.questionType === 'boolean' ? (
                  <div className="flex gap-4">
                    {['Yes', 'No'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={q.id || String(idx)}
                          value={opt}
                          onChange={(e) => handleResponseChange(q.id || String(idx), e.target.value)}
                          className="text-[var(--color-primary)]"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : q.questionType === 'choice' && q.options ? (
                  <select
                    onChange={(e) => handleResponseChange(q.id || String(idx), e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
                  >
                    <option value="">Select...</option>
                    {q.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    onChange={(e) => handleResponseChange(q.id || String(idx), e.target.value)}
                    placeholder="Enter your answer..."
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
                  />
                )}
              </div>
            ))
          )}
        </div>

        {inspection.status !== 'submitted' && questions.length > 0 && (
          <div className="p-4 border-t border-[var(--color-border)]">
            <button
              onClick={handleSubmit}
              disabled={submitInspection.isPending}
              className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {submitInspection.isPending ? 'Submitting...' : 'Submit Inspection'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
