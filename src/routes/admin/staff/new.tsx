import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/staff/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/staff/new"!</div>
}
