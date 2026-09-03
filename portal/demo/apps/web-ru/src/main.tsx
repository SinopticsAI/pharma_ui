import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { useDemoSync } from '@demo/mock'
import '@demo/ui/tokens.css'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 0, refetchOnWindowFocus: false } },
})

function DemoSync({ children }: { children: ReactNode }) {
  useDemoSync(useQueryClient())
  return <>{children}</>
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DemoSync>
        <RouterProvider router={router} />
      </DemoSync>
    </QueryClientProvider>
  </StrictMode>,
)
