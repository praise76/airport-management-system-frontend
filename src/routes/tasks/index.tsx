import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useTaskComments, useAddTaskComment } from '@/hooks/tasks'
import type { Task, TaskStatus, TaskPriority, TaskInput, TaskCommentInput } from '@/types/task'
import { useState } from 'react'
import { format } from 'date-fns'

export const Route = createFileRoute('/tasks/')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: Page,
})

const statusColors: Record<TaskStatus, string> = {
  open: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-yellow-500/20 text-yellow-400',
  blocked: 'bg-red-500/20 text-red-400',
  done: 'bg-green-500/20 text-green-400',
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  normal: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
}

function Page() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  const { data: tasksData, isLoading } = useTasks({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  })
  const tasks = tasksData?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            Manage and track airport operations tasks
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
          className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Task List */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            No tasks found. Create your first task!
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} onSelect={setSelectedTask} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
      
      {/* Detail Drawer */}
      {selectedTask && <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  )
}

function TaskRow({ task, onSelect }: { task: Task; onSelect: (t: Task) => void }) {
  return (
    <div
      onClick={() => onSelect(task)}
      className="p-4 flex items-center gap-4 hover:bg-[var(--color-background)] cursor-pointer transition"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{task.title}</p>
        {task.description && (
          <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)] truncate">
            {task.description}
          </p>
        )}
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status]}`}>
        {task.status.replace('_', ' ')}
      </span>
      <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
        {task.priority}
      </span>
      {task.dueAt && (
        <span className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
          {format(new Date(task.dueAt), 'MMM d')}
        </span>
      )}
    </div>
  )
}

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const createTask = useCreateTask()
  const [form, setForm] = useState<TaskInput>({
    title: '',
    description: '',
    priority: 'normal',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTask.mutate(form, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="font-semibold">Create Task</h2>
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
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={form.dueAt || ''}
              onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            />
          </div>
          <button
            type="submit"
            disabled={createTask.isPending}
            className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {createTask.isPending ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  )
}

function TaskDetailDrawer({ task, onClose }: { task: Task; onClose: () => void }) {
  const { data: comments = [] } = useTaskComments(task.id)
  const addComment = useAddTaskComment()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const [comment, setComment] = useState('')

  const handleStatusChange = (status: TaskStatus) => {
    updateTask.mutate({ id: task.id, input: { status } })
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    addComment.mutate({ taskId: task.id, input: { content: comment } }, {
      onSuccess: () => setComment('')
    })
  }

  const handleDelete = () => {
    if (confirm('Delete this task?')) {
      deleteTask.mutate(task.id, { onSuccess: onClose })
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-xl z-50 flex flex-col">
      <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
        <h2 className="font-semibold truncate">{task.title}</h2>
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <div className="flex gap-2 flex-wrap">
            {(['open', 'in_progress', 'blocked', 'done'] as TaskStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  task.status === s ? statusColors[s] : 'bg-[var(--color-background)] text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_80%,transparent)]">
              {task.description}
            </p>
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Priority</span>
            <p className="font-medium capitalize">{task.priority}</p>
          </div>
          {task.dueAt && (
            <div>
              <span className="text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">Due</span>
              <p className="font-medium">{format(new Date(task.dueAt), 'MMM d, yyyy')}</p>
            </div>
          )}
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium mb-2">Comments ({comments.length})</label>
          <div className="space-y-3 mb-4">
            {comments.map((c) => (
              <div key={c.id} className="bg-[var(--color-background)] rounded-lg p-3">
                <div className="flex justify-between text-xs text-[color-mix(in_oklab,var(--color-text)_60%,transparent)] mb-1">
                  <span>{c.user ? `${c.user.firstName} ${c.user.lastName}` : 'User'}</span>
                  <span>{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                </div>
                <p className="text-sm">{c.content}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
            />
            <button
              type="submit"
              disabled={addComment.isPending}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
