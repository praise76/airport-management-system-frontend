import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useCreateOrganizationMutation } from '@/hooks/organizations'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getAccessToken } from '@/utils/auth'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  industry: z.string().min(1, 'Industry is required'),
})

export const Route = createFileRoute('/organizations/new')({
  beforeLoad: () => {
    const token = getAccessToken()
    if (!token && typeof window !== 'undefined') throw redirect({ to: '/auth/login' })
  },
  component: NewOrganizationPage,
})

type FormValues = z.infer<typeof schema>

function NewOrganizationPage() {
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useCreateOrganizationMutation()
  const { handleSubmit, register, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', industry: '' },
  })

  async function onSubmit(values: FormValues) {
    const created = await mutateAsync(values)
    navigate({ to: '/organizations' })
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-4">New Organization</h1>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {formState.errors.name && (
            <p className="text-xs text-red-500">{formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" {...register('industry')} />
          {formState.errors.industry && (
            <p className="text-xs text-red-500">{formState.errors.industry.message}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/organizations' })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
