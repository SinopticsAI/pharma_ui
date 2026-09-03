import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { L10n, Locale, Translatable } from '@demo/domain'
import { resolveText } from '@demo/domain'
import { catalogs, type MessageKey } from './messages'

export type { MessageKey } from './messages'
export { catalogs } from './messages'

const LOCALE_TAG: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en-GB',
  ru: 'ru-RU',
}

export const LOCALE_LABEL: Record<Locale, string> = {
  zh: '中文',
  en: 'EN',
  ru: 'RU',
}

interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey) => string
  text: (value: Translatable | L10n) => { value: string; translated: boolean }
  money: (amount: number, currency: string) => string
  date: (iso: string) => string
  dateTime: (iso: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

const STORAGE_KEY = 'pharma-portal-demo-locale'

export function I18nProvider({
  children,
  defaultLocale = 'zh',
  locked = false,
}: {
  children: ReactNode
  defaultLocale?: Locale
  locked?: boolean
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (locked) return defaultLocale
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'zh' || stored === 'en' || stored === 'ru' ? stored : defaultLocale
  })

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const value = useMemo<I18nValue>(() => {
    const tag = LOCALE_TAG[locale]
    return {
      locale,
      setLocale,
      t: (key) => catalogs[locale][key],
      text: (input) => resolveText(input, locale),
      money: (amount, currency) =>
        new Intl.NumberFormat(tag, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(amount),
      date: (iso) => new Intl.DateTimeFormat(tag, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)),
      dateTime: (iso) =>
        new Intl.DateTimeFormat(tag, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(iso)),
    }
  }, [locale, setLocale])

  return createElement(I18nContext.Provider, { value }, children)
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n вызван вне I18nProvider')
  return value
}

/** Форматирование для консоли оператора: она русскоязычная и без переключателя. */
export const ruFormat = {
  money: (amount: number, currency: string) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount),
  date: (iso: string) => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)),
  dateTime: (iso: string) =>
    new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso)),
}
