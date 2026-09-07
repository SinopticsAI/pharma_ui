import type { DraftFields } from '@demo/domain'
import { draftValue } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { Card, Empty, StatusBadge, Table } from '../kit'

/**
 * Что агент вычитал из документов.
 *
 * Карточка `show-draft` в нити показывает тот же черновик, но живёт одним ходом
 * диалога: после перезагрузки нить пуста, а профиль остаётся. Поэтому реквизиты
 * читаются из карточки компании или продукта, а не из сообщения агента.
 *
 * Значение без источника показывать нельзя — проверить его нечем, — поэтому
 * происхождение стоит отдельной колонкой, а не подписью под значением.
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
function provenance(draft: DraftFields | undefined, key: string): { source: string; confidence: number | null } {
  const entry = draft?.[key]
  if (!entry || typeof entry === 'string') return { source: '', confidence: null }
  return { source: entry.source ?? '', confidence: entry.confidence ?? null }
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
        <Table
          head={
            approved
              ? [t('intake.requisites.field'), t('intake.requisites.value')]
              : [
                  t('intake.requisites.field'),
                  t('intake.requisites.value'),
                  t('intake.requisites.source'),
                  t('intake.requisites.confidence'),
                ]
          }
        >
          {rows.map((row) => {
            const value = draftValue(source, row.key)
            const { source: from, confidence } = provenance(draft, row.key)
            return (
              <tr key={row.key}>
                <td>
                  {t(row.label)}
                  {row.required ? (
                    <div className="text-xs text-muted-foreground">{t('intake.requisites.required')}</div>
                  ) : null}
                </td>
                <td>{value ? value : <StatusBadge tone="quiet">{t('intake.requisites.awaiting')}</StatusBadge>}</td>
                {approved ? null : (
                  <>
                    <td className="text-xs text-muted-foreground">{from || '—'}</td>
                    <td className="text-xs text-muted-foreground">
                      {confidence === null ? '—' : `${Math.round(confidence * 100)}%`}
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </Table>
      )}
    </Card>
  )
}
