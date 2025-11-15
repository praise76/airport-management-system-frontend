import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '@/utils/auth'

export const Route = createFileRoute('/auth/register')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (token && typeof window !== 'undefined') throw redirect({ to: '/' })
  },
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <div className="min-h-[70dvh] grid place-items-center">
      <div className="max-w-md w-full border border-[var(--color-border)] rounded-xl p-6 bg-[var(--color-surface)]">
        <h1 className="text-xl font-semibold mb-2">Register</h1>
        <p className="text-sm opacity-70">
          TODO: Implement registration form once backend endpoint is available.
        </p>
      </div>
    </div>
  )
}

