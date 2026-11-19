import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // A request the server refused (400-499) will be refused again: show the problem at once
        // instead of retrying for ~15 seconds. Only network and server faults retry, twice.
        retry: (failureCount, error) => {
          const status = (error as { status?: number } | null)?.status ?? 0
          if (status >= 400 && status < 500) return false
          return failureCount < 2
        },
      },
    },
  })
  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
