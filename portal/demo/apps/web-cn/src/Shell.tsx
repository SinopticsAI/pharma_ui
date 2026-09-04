import { useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import type { Locale } from '@demo/domain'
import { l10n } from '@demo/domain'
import { LOCALE_LABEL, useI18n } from '@demo/i18n'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Button, LocaleSwitch } from './kit'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'zh', label: LOCALE_LABEL.zh },
  { value: 'en', label: LOCALE_LABEL.en },
  { value: 'ru', label: LOCALE_LABEL.ru },
]

export function Shell({ nav, brandMeta, children }: { nav: ReactNode; brandMeta?: string; children: ReactNode }) {
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
    <div className="grid min-h-screen grid-cols-[224px_1fr] grid-rows-[auto_1fr]">
      <header className="col-span-2 flex h-14 items-center justify-between gap-4 bg-primary px-5 text-primary-foreground">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid size-7 place-items-center rounded-md bg-primary-foreground text-sm font-bold text-primary"
            aria-hidden="true"
          >
            S
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{t('app.title')}</span>
            <span className="truncate text-xs text-primary-foreground/80">
              {brandMeta ?? `${account} · ${identity.displayName || identity.subject}`}
            </span>
          </span>
          <span className="rounded-full border border-primary-foreground/35 px-2.5 py-0.5 text-xs">
            {t('app.contour')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitch value={locale} options={LOCALES} onChange={setLocale} />
          <Button variant="secondary" onClick={logout}>
            {t('session.logout')}
          </Button>
        </div>
      </header>
      <nav className="flex flex-col gap-0.5 border-r bg-muted/40 py-4">
        {nav}
        <div className="mt-auto px-4 text-xs text-muted-foreground">{t('mandate.noCrypto')}</div>
      </nav>
      <main className="bg-background">
        <div className="mx-auto max-w-5xl p-6">{children}</div>
      </main>
    </div>
  )
}
