export type Locale = 'ru' | 'en' | 'zh'

export type L10n = Record<Locale, string>

export const LOCALES: Locale[] = ['ru', 'en', 'zh']

export const LOCALE_TAG: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-GB',
  zh: 'zh-CN',
}

export const LOCALE_LABEL: Record<Locale, string> = {
  ru: 'RU',
  en: 'EN',
  zh: '中文',
}

export function pickL10n(value: L10n | undefined, locale: Locale, fallback: string): string {
  if (!value) return fallback
  return value[locale] || value.ru || fallback
}
