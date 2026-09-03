import { useRef, useState } from 'react'
import { describeError } from '@demo/api-client'
import type { ItemStatus } from '@demo/domain'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Button, Callout, Card, Empty, PageHeader, StatusBadge, Table, ui } from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { useCaseItems, useUploadDossierItem } from '../queries'

const STATUS_TONE: Record<ItemStatus, 'accent' | 'warm' | 'quiet'> = {
  pending_upload: 'quiet',
  uploaded: 'accent',
  confirmed: 'accent',
  parsed: 'accent',
  rejected: 'warm',
}

export function DossierPage() {
  const caseId = useCaseId()
  const { t, text } = useI18n()
  const items = useCaseItems(caseId)
  const upload = useUploadDossierItem(caseId)
  const fileInput = useRef<HTMLInputElement>(null)
  const [itemType, setItemType] = useState('other')

  if (items.isLoading) return <Empty>{t('common.loading')}</Empty>

  const list = items.data ?? []

  return (
    <>
      <PageHeader title={t('dossier.title')} lead={t('dossier.lead')} />

      <Card>
        <div className={ui.row}>
          {/* Тип документа задаётся до загрузки: ядро проверяет его по списку. */}
          <select
            value={itemType}
            onChange={(event) => setItemType(event.target.value)}
            aria-label={t('dossier.preparedBy')}
          >
            <option value="instruction-cn">instruction-cn</option>
            <option value="instruction-ru">instruction-ru</option>
            <option value="tech-spec">tech-spec</option>
            <option value="nmpa-certificate">nmpa-certificate</option>
            <option value="iso-13485">iso-13485</option>
            <option value="lab-protocol">lab-protocol</option>
            <option value="regulator-letter">regulator-letter</option>
            <option value="poa-upp">poa-upp</option>
            <option value="other">other</option>
          </select>
          <Button onClick={() => fileInput.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? t('dossier.uploading') : t('dossier.upload')}
          </Button>
          <input
            ref={fileInput}
            type="file"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) upload.mutate({ file, itemType })
            }}
          />
        </div>
        {upload.isError ? <Callout tone="deadline">{describeError(upload.error)}</Callout> : null}
      </Card>

      <Card>
        {list.length === 0 ? (
          <Empty>{t('dossier.empty')}</Empty>
        ) : (
          <Table head={['', t('dossier.date'), t('ledger.status')]}>
            {list.map((item) => (
              <tr key={item.id}>
                <td>
                  {text(l10n(item.title, item.fileName)).value}
                  <div className={ui.muted}>{item.itemType}</div>
                </td>
                <td>{item.fileName}</td>
                <td>
                  <StatusBadge tone={STATUS_TONE[item.status] ?? 'quiet'}>
                    {t(`dossier.itemStatus.${item.status}`)}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}
