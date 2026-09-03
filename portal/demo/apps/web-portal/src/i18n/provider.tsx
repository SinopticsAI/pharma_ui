import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Certificate, Message, NotificationItem } from '../data/types'
import type { JournalEntry, ProductKind, WorkField, WorkItem, WorkOwner, WorkStatus } from '../data/work'
import type { AppStatus, ProcedureType } from '../data/types'
import { catalogs, type MessageKey } from './catalog'
import { contentText, messageCopy, notificationCopy } from './content'
import {
  fieldHint,
  fieldLabel,
  optionLabel,
  portalFee,
  portalName,
  portalNotThis,
  portalWhen,
  slotRequirement,
  slotTitle,
  workNote,
  workSummary,
  workTitle,
} from './work-copy'
import { LOCALES, LOCALE_LABEL, LOCALE_TAG, type Locale } from './types'

export type { Locale, MessageKey }
export { LOCALES, LOCALE_LABEL }

const STORAGE_KEY = 'pharma-portal-cabinet-locale'

type Vars = Record<string, string | number>

interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey, vars?: Vars) => string
  date: (iso: string) => string
  dateTime: (iso: string) => string
  due: (iso: string) => string
  kind: (value: ProductKind) => string
  kindShort: (value: ProductKind) => string
  workStatus: (value: WorkStatus) => string
  owner: (value: WorkOwner) => string
  status: (value: AppStatus) => string
  procedure: (value: ProcedureType) => string
  certStatus: (value: Certificate['status']) => string
  text: (value: string) => string
  product: (value: string) => string
  form: (value: string) => string
  country: (value: string) => string
  sites: (value: string) => string
  expert: (value: string) => string
  work: {
    title: (kind: ProductKind, work: WorkItem) => string
    summary: (kind: ProductKind, work: WorkItem) => string
    note: (kind: ProductKind, work: WorkItem) => string | undefined
    slotTitle: (kind: ProductKind, work: WorkItem, slotId: string, fallback: string) => string
    slotRequirement: (kind: ProductKind, work: WorkItem, slotId: string, fallback?: string) => string | undefined
    fieldLabel: (kind: ProductKind, work: WorkItem, field: WorkField) => string
    fieldHint: (kind: ProductKind, work: WorkItem, field: WorkField) => string | undefined
    option: (value: string) => string
    portalName: (url: string, fallback: string) => string
    portalWhen: (url: string, fallback?: string) => string | undefined
    portalFee: (url: string, fallback?: string) => string | undefined
    portalNotThis: (url: string, fallback?: string[]) => string[] | undefined
  }
  message: (item: Message) => { role: string; preview: string }
  notification: (item: NotificationItem) => { title: string; body: string }
  journal: (entry: JournalEntry, kind?: ProductKind, workTitleFallback?: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`))
}

function parseJournal(action: string): { key: string; parts: string[] } | null {
  if (!action.startsWith('journal.')) return null
  const [key, ...parts] = action.split('|')
  return { key, parts }
}

export function I18nProvider({
  children,
  defaultLocale = 'ru',
}: {
  children: ReactNode
  defaultLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'zh' || stored === 'en' || stored === 'ru' ? stored : defaultLocale
  })

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  useEffect(() => {
    const catalog = catalogs[locale]
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en' : 'ru'
    document.documentElement.dataset.locale = locale
    document.title = catalog['html.title']
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', catalog['html.description'])
  }, [locale])

  const value = useMemo<I18nValue>(() => {
    const catalog = catalogs[locale]
    const tag = LOCALE_TAG[locale]
    const t = (key: MessageKey, vars?: Vars) => interpolate(catalog[key], vars)
    const date = (iso: string) => {
      if (!iso || iso === '—') return '—'
      return new Intl.DateTimeFormat(tag, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
        new Date(iso.length === 10 ? `${iso}T00:00:00` : iso),
      )
    }
    const dateTime = (iso: string) =>
      new Intl.DateTimeFormat(tag, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))

    const due = (iso: string) => {
      const target = new Date(`${iso.slice(0, 10)}T00:00:00`)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const days = Math.round((target.getTime() - today.getTime()) / 86400000)
      if (days < 0) return t('due.overdue', { n: Math.abs(days) })
      if (days === 0) return t('due.today')
      if (days === 1) return t('due.tomorrow')
      return t('due.in', { n: days })
    }

    const workStatus = (status: WorkStatus) => t(`workStatus.${status}` as MessageKey)

    return {
      locale,
      setLocale,
      t,
      date,
      dateTime,
      due,
      kind: (value) => t(`kind.${value}` as MessageKey),
      kindShort: (value) => t(`kindShort.${value}` as MessageKey),
      workStatus,
      owner: (value) => t(`owner.${value}` as MessageKey),
      status: (value) => t(`status.${value}` as MessageKey),
      procedure: (value) => t(`procedure.${value}` as MessageKey),
      certStatus: (value) => t(`certStatus.${value}` as MessageKey),
      text: (value) => contentText(value, locale),
      product: (value) => contentText(value, locale),
      form: (value) => contentText(value, locale),
      country: (value) => contentText(value, locale),
      sites: (value) => contentText(value, locale),
      expert: (value) => contentText(value, locale),
      work: {
        title: (kind, work) => workTitle(kind, work.code, work.title, locale),
        summary: (kind, work) => workSummary(kind, work.code, work.summary, locale),
        note: (kind, work) => workNote(kind, work.code, work.note, locale),
        slotTitle: (kind, work, slotId, fallback) => slotTitle(kind, work.code, slotId, fallback, locale),
        slotRequirement: (kind, work, slotId, fallback) => slotRequirement(kind, work.code, slotId, fallback, locale),
        fieldLabel: (kind, work, field) => fieldLabel(kind, work.code, field.id, field.label, locale),
        fieldHint: (kind, work, field) => fieldHint(kind, work.code, field.id, field.hint, locale),
        option: (value) => optionLabel(value, locale),
        portalName: (url, fallback) => portalName(url, fallback, locale),
        portalWhen: (url, fallback) => portalWhen(url, fallback, locale),
        portalFee: (url, fallback) => portalFee(url, fallback, locale),
        portalNotThis: (url, fallback) => portalNotThis(url, fallback, locale),
      },
      message: (item) => {
        const copy = messageCopy(item.id, locale)
        return { role: copy.role || contentText(item.role, locale), preview: copy.preview || item.preview }
      },
      notification: (item) => {
        const copy = notificationCopy(item.id, locale)
        return { title: copy.title || item.title, body: copy.body || item.body }
      },
      journal: (entry, kind, workTitleFallback) => {
        const parsed = parseJournal(entry.action)
        if (!parsed) {
          const translated = contentText(entry.action, locale)
          return translated
        }
        const { key, parts } = parsed
        if (key === 'journal.caseCreated') return t('journal.caseCreated')
        if (key === 'journal.statusChanged') return t('journal.statusChanged', { status: workStatus(parts[0] as WorkStatus) })
        if (key === 'journal.workConfirmed') return t('journal.workConfirmed', { actor: contentText(parts[0] ?? '', locale) })
        if (key === 'journal.fileUploaded') return t('journal.fileUploaded', { file: parts[0] ?? '' })
        if (key === 'journal.fieldChanged') {
          return t('journal.fieldChanged', { field: parts[0] ?? '', value: optionLabel(parts[1] ?? '—', locale) || parts[1] || '—' })
        }
        if (key === 'journal.remarkSet') return t('journal.remarkSet', { remark: contentText(parts[0] ?? '', locale) })
        if (key === 'journal.remarkCleared') return t('journal.remarkCleared')
        if (key === 'journal.registryFound') return t('journal.registryFound', { number: parts[0] || t('case.numberMissing') })
        if (key === 'journal.registryNotFound') return t('journal.registryNotFound')
        if (key === 'journal.workMoved') {
          const title =
            kind && parts[0]
              ? workTitle(kind, parts[0], workTitleFallback ?? parts[0], locale)
              : (workTitleFallback ?? parts[0] ?? '')
          return t('journal.workMoved', { title, status: workStatus((parts[1] ?? 'not_started') as WorkStatus) })
        }
        if (key === 'journal.caseUpdated') return t('journal.caseUpdated')
        return entry.action
      },
    }
  }, [locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n вызван вне I18nProvider')
  return value
}
