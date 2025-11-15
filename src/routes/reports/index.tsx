import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export const Route = createFileRoute('/reports/')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: Page,
})

function Page() {
  const data = [
    { name: 'Mon', docs: 24, attendance: 86 },
    { name: 'Tue', docs: 31, attendance: 90 },
    { name: 'Wed', docs: 18, attendance: 82 },
    { name: 'Thu', docs: 27, attendance: 88 },
    { name: 'Fri', docs: 33, attendance: 91 },
  ]
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reports</h1>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="text-sm opacity-70 mb-2">Weekly Overview</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="docs" fill="#4F46E5" name="Documents" radius={[6, 6, 0, 0]} />
              <Bar dataKey="attendance" fill="#10B981" name="Attendance %" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

