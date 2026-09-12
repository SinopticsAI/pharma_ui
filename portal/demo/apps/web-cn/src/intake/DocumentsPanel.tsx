import { describeError } from '@demo/api-client'
import type { ItemStatus, OrganizationItem } from '@demo/domain'
import { l10n } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { Button } from '@demo/ui/components/button'
import { cn } from '@demo/ui/lib/utils'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Callout, Card, Empty, StatusBadge } from '../kit'
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
 *
 * В узкой колонке чата таблица ломает CJK по символу — поэтому список карточками:
 * тип и статус сверху, имя файла на всю ширину, открытие иконкой.
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

export type DocumentGroup = {
  id: string
  title: MessageKey
  lead?: MessageKey
  items: OrganizationItem[]
  canPromote?: boolean
}

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

function DocumentCard({
  item,
  canPromote,
  opening,
  moving,
  onOpen,
  onPromote,
  openBusy,
  promoteBusy,
}: {
  item: OrganizationItem
  canPromote: boolean
  opening: boolean
  moving: boolean
  onOpen: () => void
  onPromote: () => void
  openBusy: boolean
  promoteBusy: boolean
}) {
  const { t, text } = useI18n()
  const fields = extraction(item.parcedData)
  const fileName = text(l10n(item.title, item.fileName)).value

  return (
    <article className="space-y-1.5 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium leading-snug">
          {t(ITEM_TYPE_LABEL[item.itemType] ?? 'itemType.other')}
        </p>
        <StatusBadge tone={STATUS_TONE[item.status] ?? 'quiet'}>{t(`intake.itemStatus.${item.status}`)}</StatusBadge>
      </div>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-all text-xs text-muted-foreground">{fileName}</p>
        {item.status === 'pending_upload' ? null : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            disabled={openBusy}
            aria-label={opening ? t('intake.documents.opening') : t('intake.documents.open')}
            onClick={onOpen}
          >
            {opening ? <Loader2 className="animate-spin" /> : <ExternalLink />}
          </Button>
        )}
      </div>
      {canPromote && item.level === 'product' ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          title={t('intake.documents.promoteHint')}
          disabled={promoteBusy}
          onClick={onPromote}
        >
          {moving ? t('intake.documents.promoting') : t('intake.documents.promote')}
        </Button>
      ) : null}
      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('intake.documents.noExtraction')}</p>
      ) : (
        <details>
          <summary className="cursor-pointer text-xs text-muted-foreground">{t('intake.documents.extracted')}</summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            {fields.map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="m-0 break-all">{asText(value)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </article>
  )
}

export function DocumentsPanel({
  organizationId,
  items,
  title,
  lead,
  groups,
  /** Подъём документа продукта в профиль компании: только на экране продукта. */
  canPromote = false,
}: {
  organizationId: string
  items?: OrganizationItem[]
  title?: MessageKey
  lead?: MessageKey
  groups?: DocumentGroup[]
  canPromote?: boolean
}) {
  const { t } = useI18n()
  const download = useOrgItemDownloadUrl(organizationId)
  const promote = usePromoteOrgItem(organizationId)
  const failure = download.error ?? promote.error
  const tabs = groups ?? []
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '')
  const active = tabs.find((group) => group.id === activeId) ?? tabs[0]
  const listed = active?.items ?? items ?? []
  const listLead = active?.lead ?? lead
  const listCanPromote = active?.canPromote ?? canPromote

  return (
    <Card title={active ? undefined : title ? t(title) : undefined}>
      {active ? (
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
          {tabs.map((group) => {
            const selected = group.id === active.id
            return (
              <button
                key={group.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={cn(
                  'rounded-md px-2 py-1.5 text-center text-sm leading-snug',
                  selected ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground',
                )}
                onClick={() => setActiveId(group.id)}
              >
                {t(group.title)} · {group.items.length}
              </button>
            )
          })}
        </div>
      ) : null}
      <p className="text-sm text-muted-foreground">{t(listLead ?? 'intake.documents.lead')}</p>
      {failure ? <Callout tone="deadline">{describeError(failure)}</Callout> : null}

      {listed.length === 0 ? (
        <Empty>{t('intake.documents.empty')}</Empty>
      ) : (
        <div className="space-y-2">
          {listed.map((item) => (
            <DocumentCard
              key={item.id}
              item={item}
              canPromote={listCanPromote}
              opening={download.isPending && download.variables === item.id}
              moving={promote.isPending && promote.variables === item.id}
              openBusy={download.isPending}
              promoteBusy={promote.isPending}
              onOpen={() => download.mutate(item.id)}
              onPromote={() => promote.mutate(item.id)}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
