import { I18nProvider } from '@demo/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@demo/ui/globals.css'
import { DemoProvider } from './demo/context'
import { router } from './router'
import { Session } from './Session'

/**
 * Обновления в кейсе приходят опросом: поток событий добавится, когда появится
 * нагрузка, и экраны от этого не изменятся.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <I18nProvider defaultLocale="zh">
      <DemoProvider>
        <Session>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </Session>
      </DemoProvider>
    </I18nProvider>
  </StrictMode>,
)
