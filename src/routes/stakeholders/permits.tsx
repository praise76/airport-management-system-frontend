import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/stakeholders/permits')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/stakeholders/permits"!</div>
}
