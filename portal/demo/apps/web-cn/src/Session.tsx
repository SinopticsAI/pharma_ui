import type { ReactNode } from 'react'
import { ApiProvider, IdentityProvider, describeError, useIdentityState } from '@demo/api-client'
import { AuthProvider, useAuth } from '@demo/auth'
import { useI18n } from '@demo/i18n'
import { Button, Callout, Card, Empty, KeyValue, PageHeader } from '@demo/ui'

/**
 * Вход и разрешение аккаунта.
 *
 * Контур `cn` — маска без реквизитов УКЭП и ЕСИА: их включение в ответе ядра
 * зависит от этого заголовка, а не от роли, поэтому кабинет производителя
 * обязан ходить именно так.
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
  const { t } = useI18n()

  if (status === 'error') {
    return (
      <Notice title={t('session.signInFailed')}>
        <Callout tone="deadline">{describeError(error)}</Callout>
        <Button onClick={() => window.location.reload()}>{t('common.retry')}</Button>{' '}
        <Button variant="secondary" onClick={logout}>
          {t('session.logout')}
        </Button>
      </Notice>
    )
  }

  if (status !== 'ready') return <Empty>{t('session.signingIn')}</Empty>

  return <>{children}</>
}

function AccountGate({ children }: { children: ReactNode }) {
  const state = useIdentityState()
  const { logout } = useAuth()
  const { t } = useI18n()

  if (state.status === 'loading') return <Empty>{t('common.loading')}</Empty>

  if (state.status === 'not-linked') {
    return (
      <Notice title={t('session.notLinkedTitle')} lead={t('session.notLinkedLead')}>
        <KeyValue items={[{ key: t('session.subject'), value: state.subject || '—' }]} />
        <Button variant="secondary" onClick={logout}>
          {t('session.logout')}
        </Button>
      </Notice>
    )
  }

  if (state.status === 'error') {
    return (
      <Notice title={t('session.errorTitle')}>
        <Callout tone="deadline">{describeError(state.error)}</Callout>
        <Button onClick={() => window.location.reload()}>{t('common.retry')}</Button>{' '}
        <Button variant="secondary" onClick={logout}>
          {t('session.logout')}
        </Button>
      </Notice>
    )
  }

  return <>{children}</>
}

function WithApi({ children }: { children: ReactNode }) {
  const { getAccessToken } = useAuth()
  return (
    <ApiProvider contour="cn" getToken={getAccessToken}>
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
