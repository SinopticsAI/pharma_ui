import { useI18n } from '@demo/i18n'
import { Card, Empty, Estimate, PageHeader, StatusBadge, Table } from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { useRoadmap } from '../queries'

export function RoadmapPage() {
  const caseId = useCaseId()
  const { t, text } = useI18n()
  const roadmap = useRoadmap(caseId)

  if (roadmap.isLoading) return <Empty>{t('common.loading')}</Empty>

  const project = (roadmap.data ?? []).filter((item) => item.kind === 'project')
  const normative = (roadmap.data ?? []).filter((item) => item.kind === 'normative')

  return (
    <>
      <PageHeader title={t('roadmap.title')} />

      <Card title={t('roadmap.projectTitle')} meta={t('roadmap.projectHint')}>
        <Table head={[t('roadmap.stage'), '', t('roadmap.owner'), t('common.months')]}>
          {project.map((item) => (
            <tr key={item.id}>
              <td>
                <StatusBadge tone="quiet">{t(`stage.${item.stage}`)}</StatusBadge>
              </td>
              <td>
                {text(item.title).value}
                {item.note ? <div>{text(item.note).value}</div> : null}
              </td>
              <td>{t(`actor.${item.owner}`)}</td>
              <td>{item.months ? `${item.months[0]}–${item.months[1]}` : '—'}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title={t('roadmap.normativeTitle')} meta={t('roadmap.normativeHint')}>
        <Table head={[t('roadmap.stage'), '', t('roadmap.owner'), t('common.workingDays')]}>
          {normative.map((item) => (
            <tr key={item.id}>
              <td>
                <StatusBadge tone="quiet">{t(`stage.${item.stage}`)}</StatusBadge>
              </td>
              <td>
                {text(item.title).value}
                {item.note ? <div>{text(item.note).value}</div> : null}
              </td>
              <td>{t(`actor.${item.owner}`)}</td>
              <td>
                <StatusBadge tone="accent">{item.workingDays}</StatusBadge>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Estimate>{t('common.estimate')}</Estimate>
    </>
  )
}
