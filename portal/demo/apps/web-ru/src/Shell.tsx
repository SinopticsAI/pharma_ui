import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { resetDemo } from '@demo/mock'
import { AppShell, DemoBanner } from '@demo/ui'

export function Shell({ nav, brandMeta, children }: { nav: ReactNode; brandMeta?: string; children: ReactNode }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    document.documentElement.dataset.locale = 'ru'
    document.documentElement.dataset.contour = 'ru'
  }, [])

  return (
    <AppShell
      banner={
        <DemoBanner
          text="Демонстрация на условных данных: кейсы, счета и статусы вымышлены"
          resetLabel="Сбросить демо"
          onReset={() => {
            resetDemo()
            void queryClient.invalidateQueries()
          }}
        />
      }
      brandTitle="Консоль оператора РФ"
      brandMeta={brandMeta}
      contour="Контур РФ"
      nav={nav}
      sidebarNote="Подписание идёт на рабочем месте оператора: портал хранит подписанный пакет и квитанции, но не ключи."
    >
      {children}
    </AppShell>
  )
}
