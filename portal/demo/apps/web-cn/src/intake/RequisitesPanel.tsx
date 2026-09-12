import type { DraftFields } from '@demo/domain'
import { draftValue } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { Card, Empty, StatusBadge } from '../kit'

/**
 * Что агент вычитал из документов.
 *
 * Карточка `show-draft` в нити показывает тот же черновик на один ход диалога.
 * После перезагрузки нить поднимается из журнала, а этот сайдбар по-прежнему
 * читает draft компании или продукта, не сообщения чата.
 *
 * Значение без источника показывать нельзя — проверить его нечем. В узкой
 * колонке происхождение и уверенность идут строкой под значением, не таблицей.
 */

interface FieldRow {
  key: string
  label: MessageKey
  /** Без этого поля ядро не пустит дальше: профиль или классификацию. */
  required?: boolean
}

/** Порядок и состав — по `_ORG_FIELD_ALIASES` и `ORG_PROFILE_REQUIRED` ядра. */
const COMPANY_ROWS: FieldRow[] = [
  { key: 'legalName', label: 'orgField.legalName', required: true },
  { key: 'legalNameEn', label: 'orgField.legalNameEn' },
  { key: 'registrationNumber', label: 'orgField.registrationNumber', required: true },
  { key: 'legalRepresentative', label: 'orgField.legalRepresentative' },
  { key: 'address', label: 'orgField.address' },
  { key: 'establishedOn', label: 'orgField.establishedOn' },
  { key: 'businessScope', label: 'orgField.businessScope' },
  { key: 'capital', label: 'orgField.capital' },
]

/** По `_PRODUCT_FIELD_ALIASES`; обязательные — по `missing_product_fields`. */
const PRODUCT_ROWS: FieldRow[] = [
  { key: 'name', label: 'productField.name', required: true },
  { key: 'models', label: 'productField.models' },
  { key: 'intendedUse', label: 'productField.intendedUse', required: true },
  { key: 'manufacturer', label: 'productField.manufacturer' },
  { key: 'sites', label: 'productField.sites' },
  { key: 'composition', label: 'productField.composition' },
  { key: 'measuring', label: 'productField.measuring' },
  { key: 'software', label: 'productField.software' },
  { key: 'sterile', label: 'productField.sterile' },
  { key: 'nmpaNumber', label: 'productField.nmpaNumber' },
]

/** Одобренный профиль хранит голые значения: происхождения там уже нет. */
function provenance(
  draft: DraftFields | undefined,
  key: string,
): { source: string; confidence: number | null; unverified: boolean } {
  const entry = draft?.[key]
  if (!entry || typeof entry === 'string') return { source: '', confidence: null, unverified: false }
  return {
    source: entry.source ?? '',
    confidence: entry.confidence ?? null,
    unverified: entry.verified === false,
  }
}

export function RequisitesPanel({
  scope,
  draft,
  profile,
  approved = false,
}: {
  scope: 'company' | 'product'
  draft: DraftFields | undefined
  /** Значения после одобрения человеком. Есть только у компании. */
  profile?: DraftFields
  approved?: boolean
}) {
  const { t } = useI18n()
  const rows = scope === 'company' ? COMPANY_ROWS : PRODUCT_ROWS
  const source = approved && profile ? profile : draft
  const filled = rows.filter((row) => draftValue(source, row.key))

  return (
    <Card title={t(scope === 'company' ? 'intake.requisites.companyTitle' : 'intake.requisites.productTitle')}>
      <p className="text-sm text-muted-foreground">
        {t(approved ? 'intake.requisites.approvedLead' : 'intake.requisites.lead')}
      </p>

      {filled.length === 0 ? (
        <Empty>{t('intake.requisites.empty')}</Empty>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => {
            const value = draftValue(source, row.key)
            const { source: from, confidence, unverified } = provenance(draft, row.key)
            const meta =
              from || confidence !== null
                ? [from || '—', confidence === null ? null : `${Math.round(confidence * 100)}%`]
                    .filter(Boolean)
                    .join(' · ')
                : ''
            return (
              <li key={row.key} className="space-y-1 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{t(row.label)}</span>
                  {row.required ? <span>{t('intake.requisites.required')}</span> : null}
                </div>
                {value ? (
                  <p className="text-sm leading-snug wrap-break-word">{value}</p>
                ) : (
                  <StatusBadge tone="quiet">{t('intake.requisites.awaiting')}</StatusBadge>
                )}
                {/* Значение показываем как есть, но без пометки его нельзя принять за факт. */}
                {value && unverified ? (
                  <div className="space-y-1">
                    <StatusBadge tone="warm">{t('intake.requisites.unverified')}</StatusBadge>
                    <p className="text-xs text-muted-foreground">{t('intake.requisites.unverifiedHint')}</p>
                  </div>
                ) : null}
                {!approved && value && meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
