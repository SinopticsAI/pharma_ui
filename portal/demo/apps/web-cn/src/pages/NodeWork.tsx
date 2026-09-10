import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Link } from '@tanstack/react-router'
import { m3Documents } from '../demo/catalog'
import { useDemo } from '../demo/context'
import {
  ActorBadge,
  Benefit,
  Button,
  Callout,
  Card,
  DemoMark,
  KeyValue,
  PageHeader,
  RiskTag,
  StatusBadge,
  Table,
} from '../kit'
import { useCase } from '../queries'
import { useWorkspace } from '../workspace'

const STEP_LABEL = { done: 'node.done', progress: 'node.weDoing', pending: 'node.fixWithAgent' } as const

export function NodeWorkPage({ nodeCode }: { nodeCode: string }) {
  const { productId, caseId } = useWorkspace()
  const { t, text } = useI18n()
  const { state, patch } = useDemo()
  const caseQuery = useCase(caseId)
  const node = caseQuery.data?.nodeMap.find((item) => item.code === nodeCode)
  const docs = nodeCode === 'M3' ? m3Documents() : []
  const done = docs.filter((doc) => doc.action === 'done' || (doc.id === 'poa' && state.poaDraftAccepted)).length

  if (!node) {
    return (
      <>
        <PageHeader title={nodeCode} />
        <p className="text-sm text-muted-foreground">{t('common.empty')}</p>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow.node')}
        title={`${node.code} · ${text(l10n(node.title)).value}`}
        lead={t('node.pageLead')}
        actions={
          <StatusBadge tone={node.critical ? 'warm' : node.status === 'done' ? 'ok' : 'quiet'}>
            {t(`nodeStatus.${node.status}`)}
          </StatusBadge>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ActorBadge actor="you">{t('nodeOwner.you')}</ActorBadge>
        <ActorBadge actor="us">{t('nodeOwner.us')}</ActorBadge>
        <ActorBadge actor="agent">{t('classify.draft')}</ActorBadge>
      </div>
      <DemoMark>{t('shell.demoMark')}</DemoMark>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Card>
          <KeyValue
            items={[
              { key: t('map.owner'), value: t(`nodeOwner.${node.owner}`) },
              { key: t('map.due'), value: node.dueHint ? text(l10n(node.dueHint)).value : '—' },
            ]}
          />
        </Card>
        <Card>
          <p className="text-sm">{node.note ? text(l10n(node.note)).value : t(`nodeStatus.${node.status}`)}</p>
        </Card>
        <Card>
          <p className="text-sm">{fillGroup(t('node.group'), done, docs.length || 1)}</p>
        </Card>
      </div>

      {docs.length > 0 ? (
        <Card title={t('node.pipeline')}>
          <Table
            head={[
              t('dossier.title'),
              t('node.version'),
              t('node.source'),
              t('node.translate'),
              t('node.notary'),
              t('node.apostille'),
              t('node.risk'),
              t('node.action'),
            ]}
          >
            {docs.map((doc) => (
              <tr key={doc.id} className={doc.risk === 'high' ? 'bg-destructive/5' : undefined}>
                <td>{text(doc.title).value}</td>
                <td>{doc.version}</td>
                <td className="text-xs">{text(doc.origin).value}</td>
                <td>
                  <StatusBadge tone={doc.translate === 'done' ? 'ok' : 'warm'}>
                    {t(STEP_LABEL[doc.translate])}
                  </StatusBadge>
                </td>
                <td>
                  <StatusBadge tone={doc.notary === 'done' ? 'ok' : 'quiet'}>{t(STEP_LABEL[doc.notary])}</StatusBadge>
                </td>
                <td>
                  <StatusBadge tone={doc.apostille === 'done' ? 'ok' : 'quiet'}>
                    {t(STEP_LABEL[doc.apostille])}
                  </StatusBadge>
                </td>
                <td>
                  <RiskTag level={doc.risk === 'high' ? 'high' : 'low'}>
                    {t(`intake.card.risk.${doc.risk === 'high' ? 'high' : 'low'}`)}
                  </RiskTag>
                  <div className="mt-1 text-xs text-muted-foreground">{text(doc.riskReason).value}</div>
                </td>
                <td className="text-sm">
                  {doc.action === 'done'
                    ? t('node.done')
                    : doc.action === 'we'
                      ? t('node.weDoing')
                      : t('node.fixWithAgent')}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <Card title={t('node.history')}>
          <p className="text-sm">{node.note ? text(l10n(node.note)).value : t(`nodeStatus.${node.status}`)}</p>
        </Card>
      )}

      {nodeCode === 'M3' ? (
        <>
          <Callout tone="deadline">
            {t('node.agentRec')}:{' '}
            {text(m3Documents().find((doc) => doc.id === 'poa')?.riskReason ?? { ru: '', zh: '', en: '' }).value}
          </Callout>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button type="button" disabled={state.poaDraftAccepted} onClick={() => patch({ poaDraftAccepted: true })}>
              {state.poaDraftAccepted ? t('node.draftConfirmed') : t('node.confirmDraft')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => patch({ weDoTranslation: true })}>
              {t('node.weDo')}
            </Button>
            <Link to="/contractors/$contractorId" params={{ contractorId: 'demo-testlab' }}>
              <Button type="button" variant="secondary">
                {t('node.partner')}
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">{t('node.weDoHint')}</p>
          <p className="text-sm text-muted-foreground">{t('node.partnerHint')}</p>
        </>
      ) : nodeCode === 'M5' ? (
        <div className="flex flex-wrap gap-2">
          <Link to="/intake/product/$productId" params={{ productId: 'demo-mh-200' }}>
            <Button type="button">{t('portfolio.continueAgent')}</Button>
          </Link>
          <Link to="/contractors/$contractorId" params={{ contractorId: 'demo-testlab' }} className="text-sm underline">
            {t('contractor.open')} →
          </Link>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">{t('node.forecast')}</p>
      <Benefit label={t('benefit.label')}>{t('benefit.node')}</Benefit>
      <Link to="/products/$productId/roadmap" params={{ productId }} className="mt-3 inline-block text-sm underline">
        {t('map.title')} →
      </Link>
    </>
  )
}

function fillGroup(template: string, done: number, total: number) {
  return template.replace('{done}', String(done)).replace('{total}', String(total))
}
