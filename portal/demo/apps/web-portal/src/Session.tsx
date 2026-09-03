import type { ReactNode } from 'react'
import { ApiProvider, IdentityProvider, describeError, useIdentityState } from '@demo/api-client'
import { AuthProvider, useAuth } from '@demo/auth'
import { Button, Callout, Card, Empty, KeyValue, PageHeader } from './components/Ui'
import { useI18n } from './i18n'

/**
 * Вход в кабинет.
 *
 * Контур запроса — `cn`: это клиентский кабинет, и реквизиты ЕСИА, УКЭП и МЧД
 * ядро в нём не отдаёт. Включение реквизитов зависит от заголовка контура, а не
 * от роли, поэтому заголовок здесь имеет силу запрета.
 */

function Notice({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div style={{ maxWidth: 640, margin: '10vh auto', padding: '0 20px' }}>
      <PageHeader title={title} subtitle={subtitle} />
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
        <Callout tone="warn">{describeError(error)}</Callout>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button type="button" onClick={() => window.location.reload()}>
            {t('session.retry')}
          </Button>
          <Button type="button" variant="secondary" onClick={logout}>
            {t('settings.logout')}
          </Button>
        </div>
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

  if (state.status === 'loading') return <Empty>{t('session.loading')}</Empty>

  if (state.status === 'not-linked') {
    return (
      <Notice title={t('session.notLinkedTitle')} subtitle={t('session.notLinkedLead')}>
        <KeyValue items={[{ key: t('settings.subject'), value: state.subject || t('common.dash') }]} />
        <div style={{ marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={logout}>
            {t('settings.logout')}
          </Button>
        </div>
      </Notice>
    )
  }

  if (state.status === 'error') {
    return (
      <Notice title={t('session.errorTitle')}>
        <Callout tone="warn">{describeError(state.error)}</Callout>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button type="button" onClick={() => window.location.reload()}>
            {t('session.retry')}
          </Button>
          <Button type="button" variant="secondary" onClick={logout}>
            {t('settings.logout')}
          </Button>
        </div>
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
