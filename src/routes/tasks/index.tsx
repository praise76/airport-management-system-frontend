import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'

export const Route = createFileRoute('/tasks/')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: Page,
})

function Page() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Tasks</h1>
      <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_70%,transparent)]">
        TODO: list view and quick editor, optional kanban later
      </p>
    </div>
  )
}

