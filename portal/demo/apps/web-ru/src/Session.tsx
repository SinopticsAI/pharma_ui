import type { ReactNode } from 'react'
import { ApiProvider, IdentityProvider, describeError, useIdentityState } from '@demo/api-client'
import { AuthProvider, useAuth } from '@demo/auth'
import { Button, Callout, Card, Empty, KeyValue, PageHeader } from '@demo/ui'

/**
 * Вход и разрешение аккаунта для консоли оператора.
 *
 * Контур `ru`: ядро отдаёт мандат вместе с реквизитами ЕСИА, УКЭП и МЧД, и
 * маршрут ввода статуса открыт только роли оператора.
 */

function Notice({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <div style={{ maxWidth: 640, margin: '10vh auto', padding: '0 20px' }}>
      <PageHeader title={title} lead={lead} />
      <Card>{children}</Card>
    </div>
  )
}

function AuthGate({ children }: { children: ReactNode }) {
  const { status, error, logout } = useAuth()

  if (status === 'error') {
    return (
      <Notice title="Вход не завершён">
        <Callout tone="deadline">{describeError(error)}</Callout>
        <Button onClick={() => window.location.reload()}>Повторить</Button>{' '}
        <Button variant="secondary" onClick={logout}>
          Выйти
        </Button>
      </Notice>
    )
  }

  if (status !== 'ready') return <Empty>Проверяем вход</Empty>

  return <>{children}</>
}

function AccountGate({ children }: { children: ReactNode }) {
  const state = useIdentityState()
  const { logout } = useAuth()

  if (state.status === 'loading') return <Empty>Загружаем консоль</Empty>

  if (state.status === 'not-linked') {
    return (
      <Notice
        title="Пользователь не привязан к аккаунту"
        lead="Вход выполнен, но этот пользователь ещё не связан с аккаунтом. Аккаунты заводит менеджер: саморегистрации нет."
      >
        <KeyValue items={[{ key: 'Идентификатор пользователя', value: state.subject || '—' }]} />
        <Button variant="secondary" onClick={logout}>
          Выйти
        </Button>
      </Notice>
    )
  }

  if (state.status === 'error') {
    return (
      <Notice title="Ядро кабинета не ответило">
        <Callout tone="deadline">{describeError(state.error)}</Callout>
        <Button onClick={() => window.location.reload()}>Повторить</Button>{' '}
        <Button variant="secondary" onClick={logout}>
          Выйти
        </Button>
      </Notice>
    )
  }

  return <>{children}</>
}

function WithApi({ children }: { children: ReactNode }) {
  const { getAccessToken } = useAuth()
  return (
    <ApiProvider contour="ru" getToken={getAccessToken}>
      <IdentityProvider>
        <AccountGate>{children}</AccountGate>
      </IdentityProvider>
    </ApiProvider>
  )
}

export function Session({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <WithApi>{children}</WithApi>
      </AuthGate>
    </AuthProvider>
  )
}
