import { OFFLINE_DEMO, useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import type { Locale } from '@demo/domain'
import { l10n } from '@demo/domain'
import { LOCALE_LABEL, useI18n } from '@demo/i18n'
import { useParams } from '@tanstack/react-router'
import { Bell, Menu, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { CabinetNav } from './cabinet-nav'
import { demoNotifications, mh200Name, minghuName } from './demo/catalog'
import { useDemo } from './demo/context'
import { Button, fill, LocaleSwitch } from './kit'
import { useAllProducts, useCases, useOrganizations } from './queries'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'zh', label: LOCALE_LABEL.zh },
  { value: 'en', label: LOCALE_LABEL.en },
  { value: 'ru', label: LOCALE_LABEL.ru },
]

export function Shell({
  nav,
  brandMeta,
  children,
  wide = false,
}: {
  nav?: ReactNode
  brandMeta?: string
  children: ReactNode
  wide?: boolean
}) {
  const { t, locale, setLocale, text } = useI18n()
  const identity = useIdentity()
  const { logout } = useAuth()
  const { state, pending } = useDemo()
  const params = useParams({ strict: false })
  const caseId = typeof params.caseId === 'string' ? params.caseId : undefined
  const organizations = useOrganizations()
  const products = useAllProducts((organizations.data ?? []).map((item) => item.id))
  const cases = useCases()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.locale = locale
    document.documentElement.dataset.contour = 'cn'
    document.documentElement.lang = locale === 'zh' ? 'zh' : locale
  }, [locale])

  const account = text(l10n(identity.account.name, identity.accountId)).value
  const userName = identity.displayName || text(l10n(undefined, t('brand.userFallback'))).value
  const currentCase = (cases.data ?? []).find((item) => item.id === caseId) ?? (cases.data ?? [])[0]
  const currentOrg =
    (organizations.data ?? []).find((item) => item.id === currentCase?.organizationId) ?? (organizations.data ?? [])[0]
  const currentProduct =
    (products.data ?? []).find((item) => item.id === currentCase?.productId) ?? (products.data ?? [])[0]
  const companyLabel = brandMeta ?? (currentOrg ? text(l10n(currentOrg.name, currentOrg.id)).value : '')
  const productLabel = currentCase
    ? text(l10n(currentCase.product)).value
    : currentProduct
      ? text(l10n(currentProduct.name, currentProduct.id)).value
      : ''
  const caseCode = currentCase?.code
  const headerCompany = companyLabel || (OFFLINE_DEMO ? text(minghuName).value : '—')
  const headerProduct = productLabel || (OFFLINE_DEMO ? text(mh200Name).value : '—')
  const headerCode = caseCode || (OFFLINE_DEMO ? 'RU-0417' : '')
  const notes = OFFLINE_DEMO ? demoNotifications(state) : []
  const waiting = OFFLINE_DEMO ? pending : (products.data ?? []).filter((item) => !item.caseId).length

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] md:grid-cols-[220px_1fr] md:grid-rows-[auto_1fr]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:px-3 focus:py-2"
      >
        {t('nav.skip')}
      </a>

      <header className="z-20 col-span-full border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md border border-primary-foreground/30 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="cabinet-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            <span className="sr-only">{menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}</span>
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid size-8 place-items-center rounded-md bg-primary-foreground text-sm font-bold text-primary"
              aria-hidden="true"
            >
              M
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">
                {t('app.title')}
                <span className="ml-1.5 font-normal text-primary-foreground/75">{t('brand.product')}</span>
              </span>
              <span className="truncate text-xs text-primary-foreground/80">{t('brand.corridor')}</span>
            </span>
          </div>

          <span className="hidden rounded-full border border-primary-foreground/35 px-2.5 py-0.5 text-xs lg:inline">
            {t('brand.accountBadge')}
          </span>

          <div className="hidden min-w-0 flex-1 flex-col text-xs leading-tight xl:flex">
            <span className="truncate text-primary-foreground/75">
              {t('shell.currentCompany')} · {headerCompany}
            </span>
            <span className="truncate font-medium">
              {t('shell.currentProduct')} · {headerProduct}
              {headerCode ? ` · #${t('app.caseCode')} ${headerCode}` : ''}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs sm:inline">
              {fill(t('shell.pending'), { n: waiting })}
            </span>

            <div className="relative">
              <button
                type="button"
                className="relative grid size-9 place-items-center rounded-md border border-primary-foreground/30"
                aria-expanded={notesOpen}
                aria-label={t('shell.notifications')}
                onClick={() => setNotesOpen((open) => !open)}
              >
                <Bell className="size-4" />
                {notes.length > 0 ? (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-warning" aria-hidden="true" />
                ) : null}
              </button>
              {notesOpen ? (
                <div className="absolute top-full right-0 z-30 mt-2 w-80 rounded-md border bg-card p-3 text-card-foreground shadow-md">
                  <p className="mb-2 text-xs font-medium">{t('shell.notifications')}</p>
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('shell.notificationsEmpty')}</p>
                  ) : (
                    <ul className="space-y-2">
                      {notes.map((note) => (
                        <li key={note.id}>
                          <a
                            href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}${note.href}`}
                            className="block text-sm hover:underline"
                            onClick={() => setNotesOpen(false)}
                          >
                            {text(note.title).value}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>

            <LocaleSwitch value={locale} options={LOCALES} onChange={setLocale} />

            <div className="hidden items-center gap-2 sm:flex">
              <span className="max-w-36 truncate text-xs" title={`${account} · ${userName}`}>
                {userName}
              </span>
              <Button variant="secondary" onClick={logout}>
                {t('session.logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav
        id="cabinet-nav"
        className={`${menuOpen ? 'flex' : 'hidden'} flex-col gap-0.5 border-r bg-muted/40 py-3 md:flex`}
      >
        {nav ?? <CabinetNav onNavigate={() => setMenuOpen(false)} />}
        <p className="mt-auto px-4 pt-4 text-xs text-muted-foreground">{t('mandate.noCrypto')}</p>
      </nav>

      <main id="content" className="bg-background">
        <div className={wide ? 'p-4 md:p-6' : 'mx-auto max-w-6xl p-4 md:p-6'}>{children}</div>
      </main>
    </div>
  )
}
