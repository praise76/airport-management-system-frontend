import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import './styles.css'

const router = getRouter()
const queryContext = TanstackQuery.getContext()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TanstackQuery.Provider queryClient={queryContext.queryClient}>
      <RouterProvider router={router} />
    </TanstackQuery.Provider>
  </StrictMode>,
)

