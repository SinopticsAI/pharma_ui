import { Link } from '@tanstack/react-router'
import { ruFormat } from '@demo/i18n'
import { Card, Empty, Estimate, KeyValue, PageHeader, StatusBadge, ui } from '@demo/ui'
import { Shell } from '../Shell'
import { STAGE_LABEL, TRACK_LABEL } from '../labels'
import { useCases } from '../queries'

export function PortfolioPage() {
  const cases = useCases()

  const sorted = [...(cases.data ?? [])].sort((a, b) => a.dueWorkingDays - b.dueWorkingDays)

  const nav = sorted.map((item) => (
    <Link
      key={item.id}
      to="/case/$caseId"
      params={{ caseId: item.id }}
      className={ui.navItem}
      activeProps={{ className: `${ui.navItem} ${ui.navItemActive}` }}
    >
      {item.code} · {item.product.ru}
    </Link>
  ))

  return (
    <Shell nav={nav}>
      <PageHeader
        title="Портфель оператора"
        lead="Кейсы российской компании как уполномоченного представителя. Сверху — ближайший нормативный дедлайн."
      />

      {cases.isLoading ? <Empty>Загружаем портфель</Empty> : null}

      <div className={ui.grid2}>
        {sorted.map((item) => (
          <Card key={item.id} title={`${item.code} · ${item.product.ru}`} meta={item.manufacturer.ru}>
            <div className={ui.row}>
              <StatusBadge tone="accent">{STAGE_LABEL[item.currentStage]}</StatusBadge>
              <StatusBadge>{TRACK_LABEL[item.track]}</StatusBadge>
              <StatusBadge tone="quiet">класс {item.riskClass}</StatusBadge>
              {!item.mandateComplete ? <StatusBadge tone="warm">мандат не завершён</StatusBadge> : null}
            </div>
            <KeyValue
              items={[
                { key: 'Ждём', value: item.waitingFor.ru },
                {
                  key: 'Остаётся',
                  value: (
                    <StatusBadge tone={item.dueWorkingDays <= 10 ? 'warm' : 'neutral'}>
                      {item.dueWorkingDays} р.д.
                    </StatusBadge>
                  ),
                },
                { key: 'Проект начат', value: ruFormat.date(item.startedOn) },
              ]}
            />
            <Link to="/case/$caseId" params={{ caseId: item.id }}>
              Открыть кейс →
            </Link>
          </Card>
        ))}
      </div>

      <Estimate>ориентир · 28.08.2026 · не оферта</Estimate>
    </Shell>
  )
}
