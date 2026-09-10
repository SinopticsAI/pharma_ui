import { describeError } from '@demo/api-client'
import { dossierUploadSchema } from '@demo/contracts'
import type { ItemStatus } from '@demo/domain'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Button } from '@demo/ui/components/button'
import { Input } from '@demo/ui/components/input'
import { Label } from '@demo/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@demo/ui/components/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Callout, Card, Empty, PageHeader, PlaneToggle, StatusBadge, Table } from '../kit'
import { usePlaneEnabled } from '../planeToggle'
import { useCaseItems, useUploadDossierItem } from '../queries'
import { useCaseId } from '../workspace'

const STATUS_TONE: Record<ItemStatus, 'accent' | 'warm' | 'quiet'> = {
  pending_upload: 'quiet',
  uploaded: 'accent',
  confirmed: 'accent',
  parsed: 'accent',
  rejected: 'warm',
}

const ITEM_TYPES = [
  'instruction-cn',
  'instruction-ru',
  'tech-spec',
  'nmpa-certificate',
  'iso-13485',
  'lab-protocol',
  'regulator-letter',
  'poa-upp',
  'other',
] as const

export function DossierPage() {
  const caseId = useCaseId()
  const { t, text } = useI18n()
  const [usePlane, setUsePlane] = usePlaneEnabled()
  const items = useCaseItems(caseId)
  const upload = useUploadDossierItem(caseId)
  const fileInput = useRef<HTMLInputElement>(null)
  const form = useForm({
    resolver: zodResolver(dossierUploadSchema),
    defaultValues: { itemType: 'other' },
  })

  if (items.isLoading) return <Empty>{t('common.loading')}</Empty>

  const list = items.data ?? []

  return (
    <>
      <PageHeader
        title={t('dossier.title')}
        lead={t('dossier.lead')}
        actions={
          <PlaneToggle
            checked={usePlane}
            onChange={setUsePlane}
            label={t('intake.plane.toggle')}
            hint={t('intake.plane.toggleHint')}
          />
        }
      />

      <Card>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={form.handleSubmit((values) => {
            upload.mutate({ file: values.file, itemType: values.itemType })
            form.reset({ itemType: values.itemType })
            if (fileInput.current) fileInput.current.value = ''
          })}
        >
          <div className="space-y-1">
            <Label htmlFor="itemType">{t('dossier.preparedBy')}</Label>
            <Select value={form.watch('itemType')} onValueChange={(value) => form.setValue('itemType', value)}>
              <SelectTrigger id="itemType" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="dossier-file">{t('dossier.upload')}</Label>
            <Input
              id="dossier-file"
              ref={fileInput}
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) form.setValue('file', file, { shouldValidate: true })
              }}
            />
          </div>
          <Button type="submit" disabled={upload.isPending}>
            {upload.isPending ? t('dossier.uploading') : t('dossier.upload')}
          </Button>
        </form>
        {form.formState.errors.file ? (
          <p className="text-sm text-destructive">{form.formState.errors.file.message}</p>
        ) : null}
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
                  <div className="text-xs text-muted-foreground">{item.itemType}</div>
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
