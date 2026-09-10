import { describeError, OFFLINE_DEMO } from '@demo/api-client'
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
import { useCase, useCaseItems, useLedger, useOrganization, useProduct } from '../queries'
import { Shell } from '../Shell'

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

export function ProductHubPage({ productId }: { productId: string }) {
  const { t, text } = useI18n()
  const productQuery = useProduct(productId)
  const product = productQuery.data
  const organization = useOrganization(product?.organizationId ?? '')
  const caseId = product?.caseId ?? ''
  const caseQuery = useCase(caseId)
  const items = useCaseItems(caseId)
  const ledger = useLedger(caseId)

  if (productQuery.isLoading) {
    return (
      <Shell>
        <Empty>{t('common.loading')}</Empty>
      </Shell>
    )
  }
  if (productQuery.isError) {
    return (
      <Shell>
        <Callout tone="deadline">{describeError(productQuery.error)}</Callout>
      </Shell>
    )
  }
  if (!product) {
    return (
      <Shell>
        <Empty>{t('portfolio.noProducts')}</Empty>
      </Shell>
    )
  }

  const hasCase = Boolean(caseId)
  const card = caseQuery.data?.case
  const critical = caseQuery.data?.criticalNode
  const companyName = organization.data ? text(l10n(organization.data.name, organization.data.id)).value : ''
  const productName = text(productDisplayName(product, t('portfolio.untitledProduct'))).value
  const caseLabel = card ? `#${card.code}` : t('hub.noCase')
  const docs = (product.documents ?? []).filter((item) => item.level !== 'company')
  const dossierCount = items.data?.length ?? 0
  const payCount = ledger.data?.length ?? 0
  const next = card ? text(l10n(card.waitingFor)).value : t('hub.emptyChannel')

  return (
    <Shell>
      <PageHeader eyebrow={t('nav.workbench')} title={productName} lead={companyName || t('home.lead')} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge tone={hasCase ? 'accent' : 'warm'}>{caseLabel}</StatusBadge>
        <StatusBadge tone="quiet">{t(`productStatus.${product.status}`)}</StatusBadge>
        {card ? <StatusBadge tone="quiet">{t(`stage.${card.currentStage}`)}</StatusBadge> : null}
      </div>
      {OFFLINE_DEMO || productId.startsWith('demo-') ? <DemoMark>{t('shell.demoMark')}</DemoMark> : null}
      <NextAction label={t('shell.nextAction')}>{next}</NextAction>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hasCase ? (
          <Link to="/case/$caseId/roadmap" params={{ caseId }} className="block text-inherit no-underline">
            <Card title={t('nav.processMap')} meta={critical?.code ?? card?.currentStage}>
              <p className="text-sm">
                {critical
                  ? `${critical.code} · ${text(l10n(critical.title)).value}`
                  : card
                    ? text(l10n(card.waitingFor)).value
                    : t('nav.processMap')}
              </p>
              <p className="text-sm text-primary">{t('home.openMap')} →</p>
            </Card>
          </Link>
        ) : (
          <Card title={t('nav.processMap')}>
            <Empty>{t('hub.emptyChannel')}</Empty>
            <ClassifyCta productId={productId} />
          </Card>
        )}

        {hasCase ? (
          <Link to="/case/$caseId/dossier" params={{ caseId }} className="block text-inherit no-underline">
            <Card title={t('nav.dossier')} meta={String(dossierCount)}>
              {dossierCount === 0 ? <p className="text-sm text-muted-foreground">{t('dossier.empty')}</p> : null}
              <p className="text-sm text-primary">{t('nav.documents')} →</p>
            </Card>
          </Link>
        ) : (
          <Card title={t('nav.dossier')}>
            <Empty>{t('hub.emptyChannel')}</Empty>
            <ClassifyCta productId={productId} />
          </Card>
        )}

        {hasCase ? (
          <Link to="/case/$caseId/ledger" params={{ caseId }} className="block text-inherit no-underline">
            <Card title={t('nav.ledger')} meta={String(payCount)}>
              {payCount === 0 ? <p className="text-sm text-muted-foreground">{t('ledger.empty')}</p> : null}
              <p className="text-sm text-primary">{t('nav.payments')} →</p>
            </Card>
          </Link>
        ) : (
          <Card title={t('nav.ledger')}>
            <Empty>{t('hub.emptyChannel')}</Empty>
            <ClassifyCta productId={productId} />
          </Card>
        )}

        <Link to="/products/$productId/classify" params={{ productId }} className="block text-inherit no-underline">
          <Card title={t('classify.title')}>
            <p className="text-sm text-muted-foreground">{t('classify.lead')}</p>
            <p className="text-sm text-primary">{t('home.openClassify')} →</p>
          </Card>
        </Link>

        <Link to="/intake/product/$productId" params={{ productId }} className="block text-inherit no-underline">
          <Card title={t('nav.chat')}>
            <p className="text-sm text-muted-foreground">{t('intake.product.lead')}</p>
            <p className="text-sm text-primary">{t('portfolio.continueAgent')} →</p>
          </Card>
        </Link>
      </div>

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
    </Shell>
  )
}

function ClassifyCta({ productId }: { productId: string }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap gap-2">
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
