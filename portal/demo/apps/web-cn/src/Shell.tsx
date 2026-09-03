import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Locale } from '@demo/domain'
import { LOCALE_LABEL, useI18n } from '@demo/i18n'
import { resetDemo } from '@demo/mock'
import { AppShell, DemoBanner, LocaleSwitch } from '@demo/ui'

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
  const { t, locale, setLocale } = useI18n()
  const queryClient = useQueryClient()

  useEffect(() => {
    document.documentElement.dataset.locale = locale
    document.documentElement.dataset.contour = 'cn'
    document.documentElement.lang = locale === 'zh' ? 'zh' : locale
  }, [locale])

  return (
    <AppShell
      banner={
        <DemoBanner
          text={t('demo.banner')}
          resetLabel={t('demo.reset')}
          onReset={() => {
            resetDemo()
            void queryClient.invalidateQueries()
          }}
        />
      }
      brandTitle={t('app.title')}
      brandMeta={brandMeta}
      contour={t('app.contour')}
      actions={<LocaleSwitch value={locale} options={LOCALES} onChange={setLocale} />}
      nav={nav}
      sidebarNote={t('mandate.noCrypto')}
    >
      {children}
    </AppShell>
  )
}
