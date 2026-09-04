import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { useCaseId } from '../CaseLayout'
import { Callout, Card, Empty, Estimate, PageHeader } from '../kit'
import { NodeMapView } from '../NodeMap'
import { useCase } from '../queries'

/**
 * Карта M0–M12 из `node_map_items`. Статус кодируется подписью, а не цветом:
 * янтарный остаётся за дедлайном и незакрытым запросом.
 */
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
        {nodes.length === 0 ? <Empty>{t('map.empty')}</Empty> : <NodeMapView items={nodes} className="h-[520px]" />}
      </Card>

      <Estimate>{t('common.estimate')}</Estimate>
    </>
  )
}
