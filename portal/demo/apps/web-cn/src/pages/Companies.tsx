import { describeError, OFFLINE_DEMO } from '@demo/api-client'
import { draftValue } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { RegisterCompanyCard } from '../CreateActions'
import { companyCards, riskChecks } from '../demo/catalog'
import { useDemo } from '../demo/context'
import { DEMO_ORG_MINGHU, isDemoId } from '../demo/ids'
import {
  ActorBadge,
  Benefit,
  Callout,
  Card,
  DemoMark,
  Empty,
  KeyValue,
  NextAction,
  PageHeader,
  StatusBadge,
  Table,
} from '../kit'
import { liveCompanyCard, usePortfolioCards } from '../live-cards'
import { usePortfolioCreate } from '../portfolio-create'
import { useOrganization } from '../queries'
import { Shell } from '../Shell'
import { CompanyCard } from './EntityCards'

export function CompaniesPage() {
  const { t } = useI18n()
  const { state } = useDemo()
  const portfolio = usePortfolioCards(state)
  const { busy, failure, startCompany } = usePortfolioCreate()
  const companies = portfolio.companies

  return (
    <Shell>
      <PageHeader eyebrow={t('eyebrow.home')} title={t('nav.companies')} lead={t('home.lead')} />
      {OFFLINE_DEMO ? <DemoMark>{t('shell.demoMark')}</DemoMark> : null}
      {failure ? <Callout tone="deadline">{describeError(failure)}</Callout> : null}
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <RegisterCompanyCard titleKey="portfolio.registerCompany" busy={busy} onStart={startCompany} />
      </div>
      {portfolio.organizations.isLoading && companies.length === 0 ? <Empty>{t('common.loading')}</Empty> : null}
      {!portfolio.organizations.isLoading && companies.length === 0 ? (
        <Empty>{t('portfolio.noCompanies')}</Empty>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {companies.map((item) => (
          <CompanyCard key={item.organization.id} item={item} />
        ))}
      </div>
    </Shell>
  )
}

export function CompanyRiskPage({ organizationId }: { organizationId: string }) {
  const { t, text, date } = useI18n()
  const { state } = useDemo()
  const live = useOrganization(organizationId)
  const card = isDemoId(organizationId)
    ? companyCards(state).find((item) => item.organization.id === organizationId)
    : live.data
      ? liveCompanyCard(live.data, [])
      : undefined

  if (!isDemoId(organizationId) && live.isLoading) return <Empty>{t('common.loading')}</Empty>
  if (!card && !live.data) return <Empty>{t('common.empty')}</Empty>

  return (
    <Shell>
      <PageHeader eyebrow={t('eyebrow.risk')} title={t('risk.title')} lead={t('risk.lead')} />
      <div className="mb-3">
        <ActorBadge actor="us">{t('nodeOwner.us')}</ActorBadge>
      </div>
      {OFFLINE_DEMO || isDemoId(organizationId) ? <DemoMark>{t('shell.demoMark')}</DemoMark> : null}
      {organizationId === DEMO_ORG_MINGHU || card?.verified ? (
        <>
          <Callout tone="ok">{t('risk.badge')}</Callout>
          <p className="mb-4 text-sm">{t('risk.why')}</p>
        </>
      ) : (
        <Callout tone="quiet">{t('intake.chat.progressAuto')}</Callout>
      )}
      <NextAction label={t('shell.nextAction')}>
        {card ? text(card.nextStep).value : t('portfolio.continueAgent')}
      </NextAction>

      {isDemoId(organizationId) ? (
        <Card>
          <Table head={[t('risk.check'), t('risk.status'), t('risk.source'), t('risk.updated'), t('risk.explain')]}>
            {riskChecks().map((row) => (
              <tr key={row.key}>
                <td>{text(row.name).value}</td>
                <td>
                  <StatusBadge tone={row.tone}>{text(row.result).value}</StatusBadge>
                </td>
                <td className="text-xs text-muted-foreground">{text(row.source).value}</td>
                <td className="whitespace-nowrap">{date(`${row.updated}T00:00:00`)}</td>
                <td className="text-sm">{text(row.detail).value}</td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : null}

      <Callout tone="quiet">{t('risk.disclaimer')}</Callout>
      <p className="text-sm text-muted-foreground">{t('risk.monitor')}</p>

      <Benefit label={t('benefit.label')}>{t('benefit.risk')}</Benefit>

      {live.data ? (
        <Card title={t('intake.company.profileTitle')}>
          <KeyValue
            items={[
              {
                key: t('orgField.legalName'),
                value: draftValue(live.data.profile, 'legalName') || draftValue(live.data.draft, 'legalName') || '—',
              },
              {
                key: t('home.uscc'),
                value:
                  draftValue(live.data.profile, 'registrationNumber') ||
                  draftValue(live.data.draft, 'registrationNumber') ||
                  '—',
              },
            ]}
          />
        </Card>
      ) : null}
    </Shell>
  )
}
