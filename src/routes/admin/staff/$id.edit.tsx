import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/staff/$id/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/staff/$id/edit"!</div>
}
