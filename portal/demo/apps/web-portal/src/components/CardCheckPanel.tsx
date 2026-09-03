import { Check, TriangleAlert } from 'lucide-react'
import type { Application } from '../data/types'
import { Callout } from './Ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

interface Rule {
  label: string
  ok: boolean
  hint: string
}

/** Работа 0.2: карточка проверяется по формальным правилам, без «магии квалификации». */
export function CardCheckPanel({ application }: { application: Application }) {
  const { t, kind } = useI18n()

  const rules: Rule[] = [
    {
      label: t('card.name'),
      ok: application.product.trim().length > 1,
      hint: t('card.nameHint'),
    },
    {
      label: t('card.kind'),
      ok: Boolean(application.kind),
      hint: t('card.kindHint', { kind: kind(application.kind) }),
    },
    {
      label: t('card.country'),
      ok: application.country.trim().length > 1,
      hint: t('card.countryHint'),
    },
    {
      label: t('card.manufacturer'),
      ok: application.manufacturer.trim().length > 2,
      hint: t('card.manufacturerHint'),
    },
    {
      label: t('card.sites'),
      ok: application.sites.trim().length > 2,
      hint: t('card.sitesHint'),
    },
  ]

  const failed = rules.filter((rule) => !rule.ok)

  return (
    <div className={styles.list}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rules.map((rule) => (
          <li key={rule.label} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10 }}>
            {rule.ok ? (
              <Check size={16} strokeWidth={2} aria-hidden="true" color="var(--ok)" />
            ) : (
              <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" color="var(--warn)" />
            )}
            <span>
              <strong style={{ fontSize: 13.5 }}>{rule.label}</strong>
              <span className={styles.formHint} style={{ display: 'block' }}>
                {rule.hint}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {failed.length > 0 ? (
        <Callout tone="warn">{t('card.missing', { list: failed.map((rule) => rule.label).join(', ') })}</Callout>
      ) : (
        <Callout>{t('card.ok')}</Callout>
      )}

      <Callout tone="quiet">{t('card.border')}</Callout>
    </div>
  )
}
