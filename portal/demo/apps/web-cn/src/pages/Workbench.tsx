import { OFFLINE_DEMO } from '@demo/api-client'
import { draftValue, l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Link, Navigate } from '@tanstack/react-router'
import { useCabinetFocus } from '../cabinet-focus'
import { officialEvents } from '../demo/catalog'
import {
  ActorBadge,
  Benefit,
  Button,
  Callout,
  Card,
  DemoMark,
  Empty,
  Estimate,
  KeyValue,
  Metric,
  NextAction,
  PageHeader,
  StatusBadge,
  Table,
  Timeline,
  TimelineItem,
} from '../kit'
import { productDisplayName } from '../live-cards'
import { useCase, useOrganization, useProduct } from '../queries'
import { Shell } from '../Shell'
import { useWorkspace } from '../workspace'
import { CaseOverview } from './Dashboard'

const DRAFT_KEYS = ['name', 'intendedUse', 'manufacturer', 'sterile', 'nmpaNumber', 'measuring'] as const

export function WorkbenchRedirectPage() {
  const { t } = useI18n()
  const focus = useCabinetFocus()

  if (focus.loading) {
    return (
      <Shell>
        <Empty>{t('common.loading')}</Empty>
      </Shell>
    )
  }
  if (!focus.productId) {
    return (
      <Shell>
        <PageHeader eyebrow={t('eyebrow.official')} title={t('nav.workbench')} />
        <Empty>{t('portfolio.noProducts')}</Empty>
      </Shell>
    )
  }

  return <Navigate to="/products/$productId" params={{ productId: focus.productId }} replace />
}

/**
 * Обзор кабинета продукта: карточка продукта и состояние его кейса на одном
 * экране. Пока кейса нет, баннер ведёт к классификации — карту строит ядро
 * после её утверждения, а не пустые разделы на этом экране.
 */
export function ProductOverviewPage() {
  const { productId, caseId } = useWorkspace()
  const { t, text } = useI18n()
  const product = useProduct(productId).data
  const organization = useOrganization(product?.organizationId ?? '')
  const caseQuery = useCase(caseId)

  if (!product) return <Empty>{t('common.loading')}</Empty>

  const card = caseQuery.data?.case
  const companyName = organization.data ? text(l10n(organization.data.name, organization.data.id)).value : ''
  const productName = text(productDisplayName(product, t('portfolio.untitledProduct'))).value
  const docs = (product.documents ?? []).filter((item) => item.level !== 'company')

  return (
    <>
      <PageHeader
        eyebrow={t('nav.workbench')}
        title={card ? `${card.code} · ${productName}` : productName}
        lead={companyName || t('home.lead')}
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge tone={card ? 'accent' : 'warm'}>{card ? `#${card.code}` : t('hub.noCase')}</StatusBadge>
        <StatusBadge tone="quiet">{t(`productStatus.${product.status}`)}</StatusBadge>
        {card ? <StatusBadge tone="quiet">{t(`stage.${card.currentStage}`)}</StatusBadge> : null}
      </div>
      {OFFLINE_DEMO || productId.startsWith('demo-') ? <DemoMark>{t('shell.demoMark')}</DemoMark> : null}
      <NextAction
        label={t('shell.nextAction')}
        action={card ? undefined : <ClassifyCta productId={productId} />}
      >
        {card ? text(l10n(card.waitingFor)).value : t('hub.emptyChannel')}
      </NextAction>

      {caseId ? <CaseOverview /> : null}

      <Card title={t('hub.profile')}>
        <KeyValue
          items={DRAFT_KEYS.map((key) => ({
            key: t(`productField.${key}`),
            value: draftValue(product.draft, key) || '—',
          }))}
        />
      </Card>

      <Card title={t('hub.productDocs')}>
        {docs.length === 0 ? (
          <Empty>{t('common.empty')}</Empty>
        ) : (
          <Table head={[t('intake.documents.type'), t('intake.documents.file'), t('intake.documents.status')]}>
            {docs.map((item) => (
              <tr key={item.id}>
                <td>{text(l10n(item.title, item.fileName)).value}</td>
                <td className="text-sm">{item.fileName}</td>
                <td>
                  <StatusBadge tone="quiet">{t(`intake.itemStatus.${item.status}`)}</StatusBadge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {OFFLINE_DEMO ? <OfficialPostregFeed /> : null}

      <Estimate>{t('common.estimate')}</Estimate>
    </>
  )
}

function ClassifyCta({ productId }: { productId: string }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/products/$productId/classify" params={{ productId }}>
        <Button type="button">{t('home.openClassify')}</Button>
      </Link>
      <Link to="/intake/product/$productId" params={{ productId }} className="text-sm underline">
        {t('portfolio.continueAgent')} →
      </Link>
    </div>
  )
}

function OfficialPostregFeed() {
  const { t, text, date } = useI18n()
  const events = officialEvents()

  return (
    <>
      <PageHeader eyebrow={t('eyebrow.official')} title={t('official.title')} lead={t('official.lead')} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ActorBadge actor="us">{t('nodeOwner.us')}</ActorBadge>
        <ActorBadge actor="system">{t('nodeOwner.gov')}</ActorBadge>
      </div>
      <DemoMark>{t('shell.demoMark')} · M5 → M12</DemoMark>
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge tone="ok">{t('official.onMarket')}</StatusBadge>
        <StatusBadge tone="ok">{t('official.ruIssued')}</StatusBadge>
        <StatusBadge tone="ok">{t('official.importReady')}</StatusBadge>
        <StatusBadge tone="ok">{t('official.firstSale')}</StatusBadge>
      </div>
      <NextAction label={t('official.successMetric')}>{t('official.postreg')}</NextAction>

      <Card title={t('official.metricLead')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric accent value={t('official.metricMonths')} label={t('official.metricMonthsLabel')} />
          <Metric accent value={t('official.metricMarkup')} label={t('official.metricMarkupLabel')} />
          <Metric accent value={t('official.metricRounds')} label={t('official.metricRoundsLabel')} />
        </div>
      </Card>

      <Callout tone="quiet">{t('official.owner')}</Callout>

      <Card title={t('official.title')}>
        <Timeline>
          {events.map((event) => (
            <TimelineItem key={event.number} date={date(event.at)}>
              <p>{text(event.title).value}</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge>
                  {t('official.number')}: {event.number}
                </StatusBadge>
                <StatusBadge tone="quiet">
                  {t('official.source')}: {text(event.source).value}
                </StatusBadge>
              </div>
            </TimelineItem>
          ))}
        </Timeline>
      </Card>

      <Card title={t('official.postreg')}>
        <ul className="list-disc pl-4 text-sm">
          <li>{t('official.vigilance')}</li>
          <li>{t('official.uppRenew')}</li>
          <li>{t('official.changes')}</li>
        </ul>
      </Card>
      <Benefit label={t('benefit.label')}>{t('benefit.official')}</Benefit>
    </>
  )
}
