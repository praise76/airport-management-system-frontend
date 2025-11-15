import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'
import { getAccessToken } from '@/utils/auth'

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    const token = getAccessToken()
    const isClient = typeof window !== 'undefined'
    if (!token && isClient) throw redirect({ to: '/auth/login' })
    if (isClient) {
      const user = useAuthStore.getState().user
      if (!user?.roles?.includes('SUPER_ADMIN')) throw redirect({ to: '/' })
    }
  },
  component: Page,
})

function Page() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Admin</h1>
      <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_70%,transparent)]">
        TODO: global dashboard, RBAC management, system settings
      </p>
    </div>
  )
}

