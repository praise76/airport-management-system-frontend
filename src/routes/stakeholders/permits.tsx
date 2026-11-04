import { requireStaff, ROLE_GROUPS } from "@/lib/access";
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/stakeholders/permits')({
  beforeLoad: requireStaff(ROLE_GROUPS.stakeholderOfficers),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/stakeholders/permits"!</div>
}
