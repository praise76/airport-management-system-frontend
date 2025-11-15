import { createFileRoute, redirect, useParams, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getOrganization } from '@/api/organizations'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUpdateOrganizationMutation } from '@/hooks/organizations'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getAccessToken } from '@/utils/auth'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  industry: z.string().min(1, 'Industry is required'),
})

export const Route = createFileRoute('/organizations/$orgId/edit')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: EditOrganizationPage,
})

type FormValues = z.infer<typeof schema>

function EditOrganizationPage() {
  const { orgId } = useParams({ from: '/organizations/$orgId/edit' })
  const router = useRouter()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['organization', { id: orgId }],
    queryFn: () => getOrganization(orgId),
  })
  const update = useUpdateOrganizationMutation(orgId)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { name: data?.name ?? '', industry: data?.industry ?? '' },
  })

  if (isLoading) return <div>Loading…</div>
  if (isError || !data) return <div className="text-red-500">Failed to load</div>

  async function onSubmit(values: FormValues) {
    await update.mutateAsync(values)
    router.navigate({ to: '/organizations/$orgId', params: { orgId } })
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-4">Edit Organization</h1>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" {...form.register('industry')} />
          {form.formState.errors.industry && (
            <p className="text-xs text-red-500">{form.formState.errors.industry.message}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.navigate({ to: '/organizations/$orgId', params: { orgId } })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

