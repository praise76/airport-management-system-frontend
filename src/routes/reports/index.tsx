import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'
import {
  useExecutiveDashboard,
  useDocumentFlowReport,
  useTasksSummaryReport,
  useInspectionsSummaryReport,
  useStaffSummaryReport,
  useRosterSummaryReport,
} from '@/hooks/reports'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts'
import { useState } from 'react'

export const Route = createFileRoute('/reports/')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: Page,
})

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

function Page() {
  const [activeReport, setActiveReport] = useState<'executive' | 'tasks' | 'inspections' | 'staff' | 'roster'>('executive')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
          Analytics and performance insights
        </p>
      </div>

      {/* Report Selector */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'executive', label: 'Executive Dashboard' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'inspections', label: 'Inspections' },
          { id: 'staff', label: 'Staff' },
          { id: 'roster', label: 'Roster' },
        ].map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeReport === r.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-background)]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      {activeReport === 'executive' && <ExecutiveDashboard />}
      {activeReport === 'tasks' && <TasksReport />}
      {activeReport === 'inspections' && <InspectionsReport />}
      {activeReport === 'staff' && <StaffReport />}
      {activeReport === 'roster' && <RosterReport />}
    </div>
  )
}

function ExecutiveDashboard() {
  const { data, isLoading } = useExecutiveDashboard()

  if (isLoading) {
    return <LoadingState />
  }

  if (!data) {
    return <EmptyState message="No dashboard data available" />
  }

  const summary = data.summary || {}

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Documents" value={summary.documents?.total || 0} icon="📄" color="indigo" />
        <StatCard title="Tasks" value={summary.tasks?.total || 0} icon="✓" color="green" />
        <StatCard title="Inspections" value={summary.inspections?.total || 0} icon="🔍" color="yellow" />
        <StatCard title="Staff" value={summary.staff?.total || 0} icon="👤" color="blue" />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <DocumentFlowChart />
        <TaskStatusChart tasks={summary.tasks} />
      </div>

      {/* Generated */}
      <p className="text-xs text-[color-mix(in_oklab,var(--color-text)_40%,transparent)] text-right">
        Generated: {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : '-'}
      </p>
    </div>
  )
}

function DocumentFlowChart() {
  const { data } = useDocumentFlowReport()
  
  if (!data?.byStage) return null

  const chartData = Object.entries(data.byStage).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }))

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
      <h3 className="font-medium mb-4">Document Flow</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TaskStatusChart({ tasks }: { tasks?: any }) {
  if (!tasks?.byStatus) return null

  const chartData = Object.entries(tasks.byStatus).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }))

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
      <h3 className="font-medium mb-4">Tasks by Status</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TasksReport() {
  const { data, isLoading } = useTasksSummaryReport()

  if (isLoading) return <LoadingState />
  if (!data) return <EmptyState message="No task data" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={data.total} icon="📋" color="indigo" />
        <StatCard title="Overdue" value={data.overdue} icon="⚠️" color="red" />
        <StatCard title="Completion Rate" value={`${(data.completionRate * 100).toFixed(0)}%`} icon="✓" color="green" />
        <StatCard title="Done" value={data.byStatus?.done || 0} icon="✅" color="emerald" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <h3 className="font-medium mb-4">By Status</h3>
          <div className="space-y-2">
            {Object.entries(data.byStatus || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center py-1">
                <span className="capitalize">{status.replace('_', ' ')}</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <h3 className="font-medium mb-4">By Priority</h3>
          <div className="space-y-2">
            {Object.entries(data.byPriority || {}).map(([priority, count]) => (
              <div key={priority} className="flex justify-between items-center py-1">
                <span className="capitalize">{priority}</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InspectionsReport() {
  const { data, isLoading } = useInspectionsSummaryReport()

  if (isLoading) return <LoadingState />
  if (!data) return <EmptyState message="No inspection data" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Inspections" value={data.total} icon="🔍" color="indigo" />
        <StatCard title="Completion Rate" value={`${(data.completionRate * 100).toFixed(0)}%`} icon="✓" color="green" />
        <StatCard title="Submitted" value={data.byStatus?.submitted || 0} icon="✅" color="emerald" />
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <h3 className="font-medium mb-4">By Template</h3>
        <div className="space-y-2">
          {(data.byTemplate || []).map((t: any) => (
            <div key={t.templateId} className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0">
              <span>{t.templateName}</span>
              <span className="font-medium">{t.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StaffReport() {
  const { data, isLoading } = useStaffSummaryReport()

  if (isLoading) return <LoadingState />
  if (!data) return <EmptyState message="No staff data" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Staff" value={data.total} icon="👥" color="indigo" />
        <StatCard title="Active" value={data.active} icon="✓" color="green" />
        <StatCard title="Departments" value={data.byDepartment?.length || 0} icon="🏢" color="blue" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <h3 className="font-medium mb-4">By Role</h3>
          <div className="space-y-2">
            {Object.entries(data.byRole || {}).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center py-1">
                <span className="capitalize">{role.replace('_', ' ')}</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <h3 className="font-medium mb-4">By Department</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(data.byDepartment || []).map((d: any) => (
              <div key={d.departmentId} className="flex justify-between items-center py-1">
                <span>{d.departmentName}</span>
                <span className="font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RosterReport() {
  const { data, isLoading } = useRosterSummaryReport()

  if (isLoading) return <LoadingState />
  if (!data) return <EmptyState message="No roster data" />

  const attendanceData = data.shifts?.byAttendance || {}
  const chartData = Object.entries(attendanceData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Active Rosters" value={data.activeRosters} icon="📅" color="indigo" />
        <StatCard title="Scheduled Shifts" value={data.scheduledShifts} icon="🕐" color="blue" />
        <StatCard title="Late Entries" value={data.lateStats?.totalLateEntries || 0} icon="⚠️" color="yellow" />
        <StatCard title="Avg Late (min)" value={data.lateStats?.averageLateMinutes?.toFixed(0) || 0} icon="⏱️" color="red" />
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <h3 className="font-medium mb-4">Attendance Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    green: 'bg-green-500/20 text-green-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
    blue: 'bg-blue-500/20 text-blue-400',
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <span className="text-lg">{icon}</span>
        </div>
        <span className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">{title}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
      Loading report data...
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
      {message}
    </div>
  )
}
