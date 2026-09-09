import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useCaseId } from '../CaseLayout'
import { filingProgressPercent, nodesDoneCount } from '../demo/catalog'
import { Benefit, Button, Callout, Card, Empty, fill, NextAction, PageHeader, StatusBadge, Table } from '../kit'
import { NodeMapView } from '../NodeMap'
import { useCase } from '../queries'

export function RoadmapPage() {
  const caseId = useCaseId()
  const { t, text } = useI18n()
  const navigate = useNavigate()
  const caseQuery = useCase(caseId)
  const [view, setView] = useState<'map' | 'list'>('map')

  if (caseQuery.isLoading) return <Empty>{t('common.loading')}</Empty>

  const nodes = caseQuery.data?.nodeMap ?? []
  const critical = caseQuery.data?.criticalNode ?? null
  const open = (code: string) => {
    void navigate({ to: '/case/$caseId/nodes/$nodeCode', params: { caseId, nodeCode: code } })
  }

  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow.map')}
        title={t('map.title')}
        lead={t('map.lead')}
        actions={
          <div className="flex gap-2">
            <Button type="button" variant={view === 'map' ? 'primary' : 'secondary'} onClick={() => setView('map')}>
              {t('map.viewMap')}
            </Button>
            <Button type="button" variant={view === 'list' ? 'primary' : 'secondary'} onClick={() => setView('list')}>
              {t('map.viewList')}
            </Button>
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge tone="ok">
          {fill(t('map.readyOf'), { done: nodesDoneCount(), total: nodes.length || 13 })}
        </StatusBadge>
        <StatusBadge tone="accent">{fill(t('map.toFiling'), { percent: filingProgressPercent() })}</StatusBadge>
      </div>

      {critical ? (
        <NextAction
          label={t('map.criticalPath')}
          action={
            <Button type="button" onClick={() => open(critical.code)}>
              {t('map.goAction')}
            </Button>
          }
        >
          {critical.code} · {text(l10n(critical.title)).value}
          {critical.dueHint ? ` · ${text(l10n(critical.dueHint)).value}` : ''}
        </NextAction>
      ) : null}

      <Callout tone="quiet">{t('map.uppAnchor')}</Callout>

      {view === 'map' ? (
        <Card>
          {nodes.length === 0 ? (
            <Empty>{t('map.empty')}</Empty>
          ) : (
            <>
              <NodeMapView items={nodes} className="h-[560px]" onOpen={open} />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                {(['done', 'in_progress', 'planned', 'later', 'goal'] as const).map((status) => (
                  <StatusBadge
                    key={status}
                    tone={
                      status === 'done'
                        ? 'ok'
                        : status === 'in_progress'
                          ? 'risk'
                          : status === 'planned'
                            ? 'warm'
                            : status === 'goal'
                              ? 'accent'
                              : 'quiet'
                    }
                  >
                    {t(`nodeStatus.${status}`)}
                  </StatusBadge>
                ))}
                {(['you', 'us', 'contractor', 'gov'] as const).map((owner) => (
                  <span
                    key={owner}
                    className={
                      owner === 'you'
                        ? 'rounded-md bg-actor-you px-1.5 py-0.5 text-actor-you-foreground'
                        : owner === 'us'
                          ? 'rounded-md bg-actor-us px-1.5 py-0.5 text-actor-us-foreground'
                          : owner === 'contractor'
                            ? 'rounded-md bg-actor-contractor px-1.5 py-0.5 text-actor-contractor-foreground'
                            : 'rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground'
                    }
                  >
                    {t(`nodeOwner.${owner}`)}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>
      ) : (
        <Card>
          <Table head={[t('map.node'), t('ledger.status'), t('map.owner'), t('map.due'), t('map.depends'), '']}>
            {nodes.map((node) => (
              <tr key={node.code} className={node.critical ? 'bg-warning/10' : undefined}>
                <td>
                  <strong>{node.code}</strong> {text(l10n(node.title)).value}
                  {node.note ? (
                    <div className="text-xs text-muted-foreground">{text(l10n(node.note)).value}</div>
                  ) : null}
                </td>
                <td>
                  <StatusBadge tone={node.status === 'done' ? 'ok' : node.critical ? 'warm' : 'quiet'}>
                    {t(`nodeStatus.${node.status}`)}
                  </StatusBadge>
                </td>
                <td>{t(`nodeOwner.${node.owner}`)}</td>
                <td>{node.dueHint ? text(l10n(node.dueHint)).value : '—'}</td>
                <td className="text-xs">{node.blockedBy.join(', ') || '—'}</td>
                <td>
                  <button type="button" className="text-sm underline" onClick={() => open(node.code)}>
                    {t('map.openNode')}
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Benefit label={t('benefit.label')}>{t('benefit.map')}</Benefit>

      <Link to="/case/$caseId" params={{ caseId }} className="mt-4 inline-block text-sm underline">
        {t('nav.dashboard')} →
      </Link>
    </>
  )
}
