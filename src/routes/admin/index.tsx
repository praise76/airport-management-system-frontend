import { requireStaff, ROLE_GROUPS } from "@/lib/access";
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  beforeLoad: requireStaff(ROLE_GROUPS.admins),
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

