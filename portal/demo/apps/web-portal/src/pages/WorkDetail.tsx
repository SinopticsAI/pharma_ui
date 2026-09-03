import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink, FileText, Lock } from 'lucide-react'
import { useApplication, usePortalStore } from '../data/store'
import { blockingWorks, isUnlocked, type WorkStatus } from '../data/work'
import { Button, Callout, Card, Empty, PageHeader, WorkStatusBadge } from '../components/Ui'
import { CardCheckPanel } from '../components/CardCheckPanel'
import { RegistryPanel } from '../components/RegistryPanel'
import { useI18n } from '../i18n'
import uiStyles from '../styles/ui.module.css'
import styles from '../styles/work.module.css'

const AGENTS = [
  'Е. Смирнова, офицер УПП',
  'А. Ветров, координатор испытаний',
  'М. Кириллов, редактор переводов',
  'Li Wei, RA HQ',
]

const EDITABLE_STATUSES: WorkStatus[] = ['not_started', 'waiting_client', 'with_agent', 'in_review']

export function WorkDetailPage() {
  const { applicationId, workCode } = useParams({ from: '/applications/$applicationId/works/$workCode' })
  const application = useApplication(applicationId)
  const { addSlotFile, setWorkField, setWorkStatus, setWorkRemark, confirmWork } = usePortalStore()
  const { t, owner, workStatus, work, dateTime, expert, text, product, journal } = useI18n()

  const [agent, setAgent] = useState(AGENTS[0])
  const [remark, setRemark] = useState('')
  const [fileNames, setFileNames] = useState<Record<string, string>>({})

  const item = application?.works.find((entry) => entry.code === workCode)

  if (!application || !item) {
    return (
      <>
        <PageHeader title={t('work.notFound')} />
        <Empty>
          {t('work.notFoundBody')} <Link to="/applications">{t('work.backCases')}</Link>
        </Empty>
      </>
    )
  }

  const unlocked = isUnlocked(item, application.works)
  const blockers = blockingWorks(item, application.works)
  const journalEntries = application.journal.filter((entry) => entry.workCode === item.code)
  const title = work.title(application.kind, item)
  const note = work.note(application.kind, item)

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

      {item.remark ? <div className={styles.remark}>{t('work.remark', { text: text(item.remark) })}</div> : null}

      {note ? <Callout tone="quiet">{note}</Callout> : null}

      {item.portals && item.portals.length > 0 ? (
        <Card title={t('work.portals')}>
          <div className={uiStyles.list}>
            {item.portals.map((portal) => (
              <div key={portal.url} className={styles.portal}>
                <span className={styles.portalName}>{work.portalName(portal.url, portal.name)}</span>
                <span className={styles.portalMeta}>
                  {portal.when ? <span>{t('work.when', { when: work.portalWhen(portal.url, portal.when) ?? portal.when })}</span> : null}
                  {portal.fee ? <span>{t('work.fee', { fee: work.portalFee(portal.url, portal.fee) ?? portal.fee })}</span> : null}
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

      {item.code === '0.2' ? (
        <Card title={t('work.cardCheck')}>
          <CardCheckPanel application={application} />
        </Card>
      ) : null}

      {item.code === '0.2.1' ? (
        <Card title={t('work.registryPanel')}>
          <RegistryPanel application={application} />
        </Card>
      ) : null}

      {item.fields.length > 0 && item.code !== '0.2.1' ? (
        <Card title={t('work.fields')}>
          <div className={styles.fieldsGrid}>
            {item.fields.map((field) => (
              <label key={field.id} className={uiStyles.field}>
                <span>{work.fieldLabel(application.kind, item, field)}</span>
                {field.options ? (
                  <select
                    value={field.value}
                    onChange={(event) => setWorkField(application.id, item.code, field.id, event.target.value)}
                  >
                    <option value="">{t('work.notSelected')}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {work.option(option)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={field.value}
                    onChange={(event) => setWorkField(application.id, item.code, field.id, event.target.value)}
                  />
                )}
                {work.fieldHint(application.kind, item, field) ? (
                  <span className={uiStyles.formHint}>{work.fieldHint(application.kind, item, field)}</span>
                ) : null}
              </label>
            ))}
          </div>
        </Card>
      ) : null}

      {item.slots.length > 0 ? (
        <Card title={t('work.docs')}>
          <div className={styles.slotList}>
            {item.slots.map((slot) => {
              const slotName = work.slotTitle(application.kind, item, slot.id, slot.title)
              return (
                <div key={slot.id} className={`${styles.slot} ${slot.files.length > 0 ? styles.slotDone : ''}`}>
                  <div className={styles.slotHead}>
                    <div>
                      <div className={styles.slotTitle}>{slotName}</div>
                      {slot.requirement || work.slotRequirement(application.kind, item, slot.id, slot.requirement) ? (
                        <div className={styles.slotReq}>
                          {work.slotRequirement(application.kind, item, slot.id, slot.requirement)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.tags}>
                    <span className={styles.tag}>{t('work.prepares', { owner: owner(slot.preparedBy) })}</span>
                    {slot.needsNotary ? <span className={`${styles.tag} ${styles.tagWarn}`}>{t('legal.notary')}</span> : null}
                    {slot.needsApostille ? <span className={`${styles.tag} ${styles.tagWarn}`}>{t('legal.apostille')}</span> : null}
                    {slot.needsTranslation ? <span className={styles.tag}>{t('legal.translationRu')}</span> : null}
                    {slot.optional ? <span className={styles.tag}>{t('legal.optional')}</span> : null}
                  </div>

                  {slot.files.length > 0 ? (
                    <div className={styles.files}>
                      {slot.files.map((file) => (
                        <span key={`${file.name}-${file.at}`} className={styles.file}>
                          <FileText size={13} strokeWidth={1.75} aria-hidden="true" />
                          {file.name}
                          <span className={styles.fileMeta}>
                            · {expert(file.uploadedBy)}, {dateTime(file.at)}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className={styles.upload}>
                    <input
                      type="text"
                      value={fileNames[slot.id] ?? ''}
                      placeholder={t('work.fileNamePh')}
                      aria-label={t('work.fileAria', { title: slotName })}
                      onChange={(event) => setFileNames((prev) => ({ ...prev, [slot.id]: event.target.value }))}
                    />
                    <input
                      type="file"
                      aria-label={t('work.pickAria', { title: slotName })}
                      onChange={(event) => {
                        const picked = event.target.files?.[0]
                        if (picked) setFileNames((prev) => ({ ...prev, [slot.id]: picked.name }))
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!unlocked || !(fileNames[slot.id] ?? '').trim()}
                      onClick={() => {
                        addSlotFile(application.id, item.code, slot.id, (fileNames[slot.id] ?? '').trim())
                        setFileNames((prev) => ({ ...prev, [slot.id]: '' }))
                      }}
                    >
                      {t('work.attach')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}

      <Card title={t('work.execution')}>
        <div className={styles.agent}>
          <div className={styles.agentRow}>
            <label className={uiStyles.formHint} htmlFor="work-status">
              {t('work.status')}
            </label>
            <select
              id="work-status"
              value={EDITABLE_STATUSES.includes(item.status) ? item.status : ''}
              disabled={!unlocked}
              onChange={(event) => setWorkStatus(application.id, item.code, event.target.value as WorkStatus)}
            >
              <option value="" disabled>
                {workStatus(item.status)}
              </option>
              {EDITABLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {workStatus(status)}
                </option>
              ))}
            </select>
            <span className={uiStyles.formHint}>{t('work.responsible', { owner: owner(item.owner) })}</span>
          </div>

          <div className={styles.agentRow}>
            <select value={agent} onChange={(event) => setAgent(event.target.value)} aria-label={t('work.assigneeAria')}>
              {AGENTS.map((name) => (
                <option key={name} value={name}>
                  {expert(name)}
                </option>
              ))}
            </select>
            <Button
              type="button"
              disabled={!unlocked || item.status === 'done'}
              onClick={() => confirmWork(application.id, item.code, agent)}
            >
              {t('work.confirm')}
            </Button>
          </div>

          <div className={styles.agentRow}>
            <input
              value={remark}
              placeholder={t('work.remarkPh')}
              aria-label={t('work.remarkPh')}
              onChange={(event) => setRemark(event.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!unlocked}
              onClick={() => {
                setWorkRemark(application.id, item.code, remark.trim())
                setRemark('')
              }}
            >
              {item.remark ? t('work.remarkUpdate') : t('work.remarkAdd')}
            </Button>
          </div>

          {item.agentConfirmedBy ? (
            <span className={uiStyles.formHint}>
              {t('work.confirmedBy', { actor: expert(item.agentConfirmedBy) })}
              {item.agentConfirmedAt ? `, ${dateTime(item.agentConfirmedAt)}` : ''}
            </span>
          ) : null}
        </div>
      </Card>

      <Card title={t('work.journal')}>
        {journalEntries.length === 0 ? (
          <Empty>{t('work.journalEmpty')}</Empty>
        ) : (
          <div className={styles.journal}>
            {journalEntries.map((entry) => (
              <div key={entry.id} className={styles.journalItem}>
                <span className={styles.journalTime}>{dateTime(entry.at)}</span>
                <span>
                  {journal(entry, application.kind, title)}
                  <span className={styles.journalActor} style={{ display: 'block' }}>
                    {expert(entry.actor)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
