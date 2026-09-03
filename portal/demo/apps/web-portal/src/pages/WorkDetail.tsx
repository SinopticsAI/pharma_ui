import { useRef, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ExternalLink, FileText, Lock } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import { describeError } from '@demo/api-client'
import type { CaseItem, ItemStatus } from '@demo/domain'
import { draftValue, l10n } from '@demo/domain'
import { useCase, useCaseItems, useProductDraft, useUploadDossierItem } from '../data/portal'
import { blockingWorks, isUnlocked } from '../data/work'
import { Button, Callout, Card, Empty, PageHeader, WorkStatusBadge } from '../components/Ui'
import { CardCheckPanel } from '../components/CardCheckPanel'
import { RegistryPanel } from '../components/RegistryPanel'
import { useI18n } from '../i18n'
import uiStyles from '../styles/ui.module.css'
import styles from '../styles/work.module.css'

/**
 * Тип документа в ядре и слот чеклиста — разные перечни: слотов больше, и они
 * привязаны к праву. Совпадающие сопоставлены, остальные уходят как `other`,
 * а опознаётся документ по названию слота.
 */
const SLOT_ITEM_TYPE: Record<string, string> = {
  poa: 'poa-upp',
  license: 'business-license',
  site: 'site-docs',
  trademark: 'trademark',
  iso: 'iso-13485',
  'iso-src': 'iso-13485',
  ifu: 'instruction-cn',
  'ifu-ru': 'instruction-ru',
  tech: 'tech-spec',
  'tech-ru': 'tech-spec',
  'other-certs': 'nmpa-certificate',
  gmp: 'gmp-cn',
  'gmp-legal': 'gmp-cn',
  'tech-report': 'lab-protocol',
  'emc-report': 'lab-protocol',
  'tox-report': 'lab-protocol',
  'qc-report': 'lab-protocol',
  'be-report': 'lab-protocol',
  'inspection-act': 'regulator-letter',
  'inspection-report': 'regulator-letter',
  'si-cert': 'regulator-letter',
}

function itemTypeOf(slotId: string): string {
  return SLOT_ITEM_TYPE[slotId] ?? 'other'
}

export function WorkDetailPage() {
  const { applicationId, workCode } = useParams({ from: '/applications/$applicationId/works/$workCode' })
  const caseQuery = useCase(applicationId)
  const items = useCaseItems(applicationId)
  const upload = useUploadDossierItem(applicationId)
  const { t, owner, work, product } = useI18n()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ itemType: string; title: string } | null>(null)

  const productId = caseQuery.data?.detail.case.productId ?? ''
  const draft = useProductDraft(workCode === '0.1' ? productId : '')

  if (caseQuery.isLoading) return <Empty>{t('session.loading')}</Empty>

  const view = caseQuery.data
  const item = view?.application.works.find((entry) => entry.code === workCode)

  if (!view || !item) {
    return (
      <>
        <PageHeader title={t('work.notFound')} />
        <Empty>
          {t('work.notFoundBody')} <Link to="/applications">{t('work.backCases')}</Link>
        </Empty>
      </>
    )
  }

  const application = view.application
  const unlocked = isUnlocked(item, application.works)
  const blockers = blockingWorks(item, application.works)
  const title = work.title(application.kind, item)
  const note = work.note(application.kind, item)

  const dossier = items.data ?? []
  const byTitle = new Map<string, CaseItem[]>()
  for (const entry of dossier) {
    const key = l10n(entry.title, entry.fileName).ru
    byTitle.set(key, [...(byTitle.get(key) ?? []), entry])
  }

  const statusLabel = (status: ItemStatus) => t(`documents.itemStatus.${status}`)

  return (
    <>
      <Link
        to="/applications/$applicationId"
        params={{ applicationId: application.id }}
        className={uiStyles.formHint}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}
      >
        <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
        {application.number} · {product(application.product)}
      </Link>

      <PageHeader
        title={`${item.code}. ${title}`}
        subtitle={work.summary(application.kind, item)}
        action={<WorkStatusBadge status={item.status} />}
      />

      {!unlocked ? (
        <Callout tone="warn">
          <Lock size={14} strokeWidth={1.75} aria-hidden="true" />{' '}
          {t('work.blocked', {
            list: blockers.map((blocker) => `${blocker.code}. ${work.title(application.kind, blocker)}`).join('; '),
          })}
        </Callout>
      ) : null}

      {note ? <Callout tone="quiet">{note}</Callout> : null}

      {item.portals && item.portals.length > 0 ? (
        <Card title={t('work.portals')}>
          <div className={uiStyles.list}>
            {item.portals.map((portal) => (
              <div key={portal.url} className={styles.portal}>
                <span className={styles.portalName}>{work.portalName(portal.url, portal.name)}</span>
                <span className={styles.portalMeta}>
                  {portal.when ? (
                    <span>{t('work.when', { when: work.portalWhen(portal.url, portal.when) ?? portal.when })}</span>
                  ) : null}
                  {portal.fee ? (
                    <span>{t('work.fee', { fee: work.portalFee(portal.url, portal.fee) ?? portal.fee })}</span>
                  ) : null}
                </span>
                {portal.notThis ? (
                  <ul className={styles.notThis}>
                    {(work.portalNotThis(portal.url, portal.notThis) ?? portal.notThis).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                <a href={portal.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={13} strokeWidth={1.75} aria-hidden="true" /> {t('work.openPortal')}
                </a>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Карточку продукта заполняет агент в диалоге интейка: здесь она на чтение. */}
      {item.code === '0.1' ? (
        <Card title={t('work.draft')} meta={t('work.draftHint')}>
          {!productId || draft.isLoading ? (
            <Empty>{t('work.draftEmpty')}</Empty>
          ) : (
            <div className={uiStyles.list}>
              {Object.keys(draft.data?.draft ?? {}).length === 0 ? <Empty>{t('work.draftEmpty')}</Empty> : null}
              {Object.entries(draft.data?.draft ?? {}).map(([key, value]) => {
                const source = typeof value === 'object' && value ? value.source : undefined
                return (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, fontSize: 13.5 }}>
                    <span className={uiStyles.formHint}>{key}</span>
                    <span>
                      {draftValue(draft.data?.draft, key) || t('common.dash')}
                      {source ? (
                        <span className={uiStyles.formHint} style={{ display: 'block' }}>
                          {t('work.source')}: {source}
                        </span>
                      ) : null}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      ) : null}

      {item.code === '0.2' ? (
        <Card title={t('work.cardCheck')}>
          <CardCheckPanel application={application} detail={view.detail} />
        </Card>
      ) : null}

      {item.code === '0.2.1' ? (
        <Card title={t('work.registryPanel')}>
          <RegistryPanel application={application} />
        </Card>
      ) : null}

      {item.slots.length > 0 ? (
        <Card title={t('work.docs')} meta={t('work.uploadHint')}>
          <div className={styles.slotList}>
            {item.slots.map((slot) => {
              const slotName = work.slotTitle(application.kind, item, slot.id, slot.title)
              const attached = byTitle.get(slotName) ?? []
              return (
                <div key={slot.id} className={`${styles.slot} ${attached.length > 0 ? styles.slotDone : ''}`}>
                  <div className={styles.slotHead}>
                    <div>
                      <div className={styles.slotTitle}>{slotName}</div>
                      {work.slotRequirement(application.kind, item, slot.id, slot.requirement) ? (
                        <div className={styles.slotReq}>
                          {work.slotRequirement(application.kind, item, slot.id, slot.requirement)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.tags}>
                    <span className={styles.tag}>{t('work.prepares', { owner: owner(slot.preparedBy) })}</span>
                    {slot.needsNotary ? (
                      <span className={`${styles.tag} ${styles.tagWarn}`}>{t('legal.notary')}</span>
                    ) : null}
                    {slot.needsApostille ? (
                      <span className={`${styles.tag} ${styles.tagWarn}`}>{t('legal.apostille')}</span>
                    ) : null}
                    {slot.needsTranslation ? <span className={styles.tag}>{t('legal.translationRu')}</span> : null}
                    {slot.optional ? <span className={styles.tag}>{t('legal.optional')}</span> : null}
                  </div>

                  {attached.length > 0 ? (
                    <div className={styles.files}>
                      {attached.map((file) => (
                        <span key={file.id} className={styles.file}>
                          <FileText size={13} strokeWidth={1.75} aria-hidden="true" />
                          {file.fileName}
                          <span className={styles.fileMeta}>· {statusLabel(file.status)}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className={styles.upload}>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!unlocked || upload.isPending}
                      onClick={() => {
                        setPending({ itemType: itemTypeOf(slot.id), title: slotName })
                        fileInput.current?.click()
                      }}
                    >
                      {upload.isPending ? t('work.uploading') : t('work.uploadDossier')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <input
            ref={fileInput}
            type="file"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file && pending) upload.mutate({ file, itemType: pending.itemType, title: pending.title })
            }}
          />
          {upload.isError ? <Callout tone="warn">{describeError(upload.error)}</Callout> : null}
        </Card>
      ) : null}

      <Card title={t('work.dossier')}>
        {items.isLoading ? <Empty>{t('session.loading')}</Empty> : null}
        {!items.isLoading && dossier.length === 0 ? <Empty>{t('work.dossierEmpty')}</Empty> : null}
        <div className={styles.journal}>
          {dossier.map((entry) => (
            <div key={entry.id} className={styles.journalItem}>
              <span className={styles.journalTime}>{entry.itemType}</span>
              <span>
                {l10n(entry.title, entry.fileName).ru}
                <span className={styles.journalActor} style={{ display: 'block' }}>
                  {entry.fileName} · {statusLabel(entry.status)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Статус работы идёт из карты кейса: подтверждения исполнения ядро не принимает. */}
      <Callout tone="quiet">{t('work.responsible', { owner: owner(item.owner) })}</Callout>
    </>
  )
}
