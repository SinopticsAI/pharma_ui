import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import { AppShell, Button } from '@demo/ui'
import { ROLE_LABEL } from './labels'

export function Shell({ nav, brandMeta, children }: { nav: ReactNode; brandMeta?: string; children: ReactNode }) {
  const identity = useIdentity()
  const { logout } = useAuth()

  useEffect(() => {
    document.documentElement.dataset.locale = 'ru'
    document.documentElement.dataset.contour = 'ru'
  }, [])

  return (
    <AppShell
      brandTitle="Консоль оператора РФ"
      brandMeta={brandMeta ?? `${identity.displayName || identity.subject} · ${ROLE_LABEL[identity.role]}`}
      contour="Контур РФ"
      actions={
        <Button variant="secondary" onClick={logout}>
          Выйти
        </Button>
      }
      nav={nav}
      sidebarNote="Подписание идёт на рабочем месте оператора: портал хранит подписанный пакет и квитанции, но не ключи."
    >
      {children}
    </AppShell>
  )
}
