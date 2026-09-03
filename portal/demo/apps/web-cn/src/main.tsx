import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { I18nProvider } from '@demo/i18n'
import '@demo/ui/tokens.css'
import { Session } from './Session'
import { router } from './router'

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
      <Session>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </Session>
    </I18nProvider>
  </StrictMode>,
)
