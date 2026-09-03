import { l10n } from '@demo/domain'
import type { NodeMapItem } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Callout, Card, Empty, Estimate, PageHeader, StatusBadge, Table, ui } from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { useCase } from '../queries'

/**
 * Карта M0–M12 из `node_map_items`. Статус кодируется подписью, а не цветом:
 * янтарный остаётся за дедлайном и незакрытым запросом.
 */
function statusTone(node: NodeMapItem): 'accent' | 'warm' | 'quiet' | 'neutral' {
  if (node.critical) return 'warm'
  if (node.status === 'done') return 'accent'
  if (node.status === 'later') return 'quiet'
  return 'neutral'
}

export function RoadmapPage() {
  const caseId = useCaseId()
  const { t, text } = useI18n()
  const caseQuery = useCase(caseId)

  if (caseQuery.isLoading) return <Empty>{t('common.loading')}</Empty>

  const nodes = caseQuery.data?.nodeMap ?? []
  const critical = caseQuery.data?.criticalNode ?? null

  return (
    <>
      <PageHeader title={t('map.title')} lead={t('map.lead')} />

      {critical ? (
        <Callout tone="deadline">
          <strong>{t('map.critical')}:</strong> {critical.code} · {text(l10n(critical.title)).value} ·{' '}
          {t(`nodeOwner.${critical.owner}`)}
        </Callout>
      ) : null}

      <Card>
        {nodes.length === 0 ? (
          <Empty>{t('map.empty')}</Empty>
        ) : (
          <Table head={[t('map.node'), '', t('map.owner'), t('map.due'), '']}>
            {nodes.map((node) => (
              <tr key={node.code}>
                <td>
                  <StatusBadge tone={node.critical ? 'warm' : 'quiet'}>{node.code}</StatusBadge>
                </td>
                <td>
                  {text(l10n(node.title)).value}
                  {node.note ? <div className={ui.muted}>{text(l10n(node.note)).value}</div> : null}
                  {node.blockedBy.length > 0 ? (
                    <div className={ui.muted}>
                      {t('map.blocked')}: {node.blockedBy.join(', ')}
                    </div>
                  ) : null}
                </td>
                <td>{t(`nodeOwner.${node.owner}`)}</td>
                <td>{node.dueHint ? text(l10n(node.dueHint)).value : '—'}</td>
                <td>
                  <StatusBadge tone={statusTone(node)}>{t(`nodeStatus.${node.status}`)}</StatusBadge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Estimate>{t('common.estimate')}</Estimate>
    </>
  )
}
