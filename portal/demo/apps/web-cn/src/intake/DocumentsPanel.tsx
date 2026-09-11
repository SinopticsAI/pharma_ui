import { describeError } from '@demo/api-client'
import type { ItemStatus, OrganizationItem } from '@demo/domain'
import { l10n } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { Button } from '@demo/ui/components/button'
import { Fragment } from 'react'
import { Callout, Card, Empty, StatusBadge, Table } from '../kit'
import { useOrgItemDownloadUrl, usePromoteOrgItem } from '../queries'

/**
 * Инвентарь документов интейка.
 *
 * Загрузка живёт в композере диалога, здесь — только то, что уже дошло до ядра:
 * какой документ получен, разобран ли он и что из него вычитано. Без этого
 * экрана факт загрузки виден лишь строкой в нити и пропадает после перезагрузки.
 *
 * Байты файла кабинет не проксирует: ссылка подписывается ядром на час и
 * открывается новой вкладкой, поэтому CORS хранилища здесь не участвует.
 */

const STATUS_TONE: Record<ItemStatus, 'accent' | 'warm' | 'quiet'> = {
  pending_upload: 'quiet',
  uploaded: 'quiet',
  confirmed: 'quiet',
  parsed: 'accent',
  rejected: 'warm',
}

/** Значения `ITEM_TYPES` ядра. Незнакомый тип показываем как прочий документ. */
const ITEM_TYPE_LABEL: Record<string, MessageKey> = {
  'business-license': 'itemType.business-license',
  'company-registry': 'itemType.company-registry',
  'iso-13485': 'itemType.iso-13485',
  'instruction-cn': 'itemType.instruction-cn',
  'instruction-ru': 'itemType.instruction-ru',
  'tech-spec': 'itemType.tech-spec',
  'poa-upp': 'itemType.poa-upp',
  signatory: 'itemType.signatory',
  'bank-account': 'itemType.bank-account',
  'lab-protocol': 'itemType.lab-protocol',
  'regulator-letter': 'itemType.regulator-letter',
  'nmpa-certificate': 'itemType.nmpa-certificate',
  'site-docs': 'itemType.site-docs',
  'gmp-cn': 'itemType.gmp-cn',
  trademark: 'itemType.trademark',
  other: 'itemType.other',
}

/** Служебная обёртка Plane вокруг результата OCR: показывать её незачем. */
const PIPELINE_KEYS = new Set(['case_id', 'item_id', 'status', 'merge_meta', '_ref', 'item_type'])

/** Повторяет `extraction_of` ядра: та же выборка, что попала в черновик. */
function extraction(parcedData: Record<string, unknown> | null | undefined): [string, unknown][] {
  if (!parcedData) return []
  for (const key of ['extracted', 'ocr_json']) {
    const inner = parcedData[key]
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      return Object.entries(inner as Record<string, unknown>)
    }
  }
  return Object.entries(parcedData).filter(([key]) => !PIPELINE_KEYS.has(key))
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

export function DocumentsPanel({
  organizationId,
  items,
  title,
  lead,
  /** Подъём документа продукта в профиль компании: только на экране продукта. */
  canPromote = false,
}: {
  organizationId: string
  items: OrganizationItem[]
  title: MessageKey
  lead?: MessageKey
  canPromote?: boolean
}) {
  const { t, text } = useI18n()
  const download = useOrgItemDownloadUrl(organizationId)
  const promote = usePromoteOrgItem(organizationId)
  const failure = download.error ?? promote.error

  return (
    <Card title={t(title)}>
      <p className="text-sm text-muted-foreground">{t(lead ?? 'intake.documents.lead')}</p>
      {failure ? <Callout tone="deadline">{describeError(failure)}</Callout> : null}

      {items.length === 0 ? (
        <Empty>{t('intake.documents.empty')}</Empty>
      ) : (
        <Table
          head={[
            t('intake.documents.type'),
            t('intake.documents.file'),
            t('intake.documents.level'),
            t('intake.documents.status'),
            '',
          ]}
        >
          {items.map((item) => {
            const fields = extraction(item.parcedData)
            const opening = download.isPending && download.variables === item.id
            const moving = promote.isPending && promote.variables === item.id

            return (
              <Fragment key={item.id}>
                <tr>
                  <td>{t(ITEM_TYPE_LABEL[item.itemType] ?? 'itemType.other')}</td>
                  <td>{text(l10n(item.title, item.fileName)).value}</td>
                  <td className="text-xs text-muted-foreground">{t(`intake.documents.level.${item.level}`)}</td>
                  <td>
                    <StatusBadge tone={STATUS_TONE[item.status] ?? 'quiet'}>
                      {t(`intake.itemStatus.${item.status}`)}
                    </StatusBadge>
                  </td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-2">
                      {/* До подтверждения загрузки в хранилище открывать нечего. */}
                      {item.status === 'pending_upload' ? null : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={download.isPending}
                          onClick={() => download.mutate(item.id)}
                        >
                          {opening ? t('intake.documents.opening') : t('intake.documents.open')}
                        </Button>
                      )}
                      {canPromote && item.level === 'product' ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          title={t('intake.documents.promoteHint')}
                          disabled={promote.isPending}
                          onClick={() => promote.mutate(item.id)}
                        >
                          {moving ? t('intake.documents.promoting') : t('intake.documents.promote')}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="pb-2">
                    {fields.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t('intake.documents.noExtraction')}</p>
                    ) : (
                      <details>
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          {t('intake.documents.extracted')}
                        </summary>
                        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                          {fields.map(([key, value]) => (
                            <div key={key} className="contents">
                              <dt className="text-muted-foreground">{key}</dt>
                              <dd className="m-0">{asText(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    )}
                  </td>
                </tr>
              </Fragment>
            )
          })}
        </Table>
      )}
    </Card>
  )
}
