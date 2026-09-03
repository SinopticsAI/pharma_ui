import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import type { Locale } from '@demo/domain'
import { l10n } from '@demo/domain'
import { LOCALE_LABEL, useI18n } from '@demo/i18n'
import { AppShell, Button, LocaleSwitch } from '@demo/ui'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'zh', label: LOCALE_LABEL.zh },
  { value: 'en', label: LOCALE_LABEL.en },
  { value: 'ru', label: LOCALE_LABEL.ru },
]

export function Shell({
  nav,
  brandMeta,
  children,
}: {
  nav: ReactNode
  brandMeta?: string
  children: ReactNode
}) {
  const { t, locale, setLocale, text } = useI18n()
  const identity = useIdentity()
  const { logout } = useAuth()

  useEffect(() => {
    document.documentElement.dataset.locale = locale
    document.documentElement.dataset.contour = 'cn'
    document.documentElement.lang = locale === 'zh' ? 'zh' : locale
  }, [locale])

  const account = text(l10n(identity.account.name, identity.accountId)).value

  return (
    <AppShell
      brandTitle={t('app.title')}
      brandMeta={brandMeta ?? `${account} · ${identity.displayName || identity.subject}`}
      contour={t('app.contour')}
      actions={
        <>
          <LocaleSwitch value={locale} options={LOCALES} onChange={setLocale} />
          <Button variant="secondary" onClick={logout}>
            {t('session.logout')}
          </Button>
        </>
      }
      nav={nav}
      sidebarNote={t('mandate.noCrypto')}
    >
      {children}
    </AppShell>
  )
}
