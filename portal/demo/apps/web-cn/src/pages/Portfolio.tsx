import { describeError } from '@demo/api-client'
import type { Organization } from '@demo/domain'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Link, useNavigate } from '@tanstack/react-router'
import { CabinetNav } from '../cabinet-nav'
import { Callout, Card, Empty, Estimate, KeyValue, PageHeader, StatusBadge } from '../kit'
import { productDisplayName } from '../live-cards'
import { eligibleOrganizations } from '../portfolio-create'
import {
  useAllProducts,
  useCases,
  useCreateOrganization,
  useCreateProduct,
  useOpenIntakeSession,
  useOrganizations,
} from '../queries'
import { Shell } from '../Shell'

/**
 * Главная отвечает на вопрос «что делать дальше» по каждому объекту. Отсюда два
 * входа: компания и продукт — продукт всегда принадлежит ровно одной компании.
 */

export function PortfolioPage() {
  const { t, text } = useI18n()
  const navigate = useNavigate()
  const organizations = useOrganizations()
  const companies = organizations.data ?? []
  const products = useAllProducts(companies.map((item) => item.id))
  const cases = useCases()

  const createOrganization = useCreateOrganization()
  const createProduct = useCreateProduct()
  const openSession = useOpenIntakeSession()

  const busy = createOrganization.isPending || createProduct.isPending || openSession.isPending
  const failure = createOrganization.error ?? createProduct.error ?? openSession.error

  /** Компания и её диалог создаются вместе: анкету пользователь не заполняет. */
  const startCompany = async () => {
    const organization = await createOrganization.mutateAsync({})
    const session = await openSession.mutateAsync({ scope: 'organization', organizationId: organization.id })
    void navigate({
      to: '/intake/company/$organizationId',
      params: { organizationId: organization.id },
      search: { session: session.id },
    })
  }

  const startProduct = async (organization: Organization) => {
    const product = await createProduct.mutateAsync({ organizationId: organization.id })
    const session = await openSession.mutateAsync({ scope: 'product', productId: product.id })
    void navigate({
      to: '/intake/product/$productId',
      params: { productId: product.id },
      search: { session: session.id },
    })
  }

  const readyCompany = eligibleOrganizations(companies)[0]

  return (
    <Shell nav={<CabinetNav />}>
      <PageHeader title={t('portfolio.title')} lead={t('portfolio.lead')} />

      {failure ? <Callout tone="deadline">{describeError(failure)}</Callout> : null}

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-4 text-left hover:border-primary disabled:opacity-50"
          onClick={() => void startCompany()}
          disabled={busy}
        >
          <strong>{t('portfolio.registerCompany')}</strong>
          <span className="text-sm text-muted-foreground">{t('portfolio.registerCompanyLead')}</span>
        </button>
        <button
          type="button"
          className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-4 text-left hover:border-primary disabled:opacity-50"
          disabled={busy || !readyCompany}
          onClick={() => readyCompany && void startProduct(readyCompany)}
        >
          <strong>{t('portfolio.addProduct')}</strong>
          <span className="text-sm text-muted-foreground">
            {readyCompany ? t('portfolio.addProductLead') : t('portfolio.addProductLocked')}
          </span>
        </button>
      </div>

      {organizations.isError ? <Callout tone="deadline">{describeError(organizations.error)}</Callout> : null}

      <h3 className="mb-2 mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t('portfolio.companies')}
      </h3>
      {organizations.isLoading ? <Empty>{t('common.loading')}</Empty> : null}
      {!organizations.isLoading && companies.length === 0 ? <Empty>{t('portfolio.noCompanies')}</Empty> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {companies.map((company) => (
          <Card
            key={company.id}
            title={text(l10n(company.name, company.id)).value}
            meta={company.completeness ? `${company.completeness.percent}%` : undefined}
          >
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={company.status === 'profile_approved' ? 'accent' : 'quiet'}>
                {t(`orgStatus.${company.status}`)}
              </StatusBadge>
            </div>
            {company.status !== 'profile_approved' ? (
              <Link to="/intake/company/$organizationId" params={{ organizationId: company.id }}>
                {t('portfolio.continueAgent')} →
              </Link>
            ) : null}
          </Card>
        ))}
      </div>

      <h3 className="mb-2 mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t('portfolio.products')}
      </h3>
      {products.isLoading ? <Empty>{t('common.loading')}</Empty> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {(products.data ?? []).map((product) => (
          <Card
            key={product.id}
            title={text(productDisplayName(product, t('portfolio.untitledProduct'))).value}
            meta={`${t('portfolio.completeness')} ${product.completeness}%`}
          >
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={product.caseId ? 'accent' : 'quiet'}>
                {t(`productStatus.${product.status}`)}
              </StatusBadge>
            </div>
            {product.caseId ? (
              <Link to="/case/$caseId" params={{ caseId: product.caseId }}>
                {t('portfolio.open')} →
              </Link>
            ) : (
              <Link to="/intake/product/$productId" params={{ productId: product.id }}>
                {t('portfolio.continueAgent')} →
              </Link>
            )}
          </Card>
        ))}
      </div>

      <h3 className="mb-2 mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t('portfolio.cases')}
      </h3>
      {cases.isLoading ? <Empty>{t('common.loading')}</Empty> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {(cases.data ?? []).map((item) => (
          <Card
            key={item.id}
            title={`${item.code} · ${text(l10n(item.product)).value}`}
            meta={text(l10n(item.manufacturer)).value}
          >
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="accent">{t(`stage.${item.currentStage}`)}</StatusBadge>
              <StatusBadge>{t(`track.${item.track}`)}</StatusBadge>
              <StatusBadge tone="quiet">
                {t('case.class')}: {item.riskClass}
              </StatusBadge>
            </div>
            <KeyValue
              items={[
                { key: t('portfolio.waiting'), value: text(l10n(item.waitingFor)).value },
                {
                  key: t('portfolio.due'),
                  value: (
                    <StatusBadge tone={item.dueWorkingDays <= 10 ? 'warm' : 'neutral'}>
                      {item.dueWorkingDays} {t('common.workingDays')}
                    </StatusBadge>
                  ),
                },
                {
                  key: t('case.cycle'),
                  value: `${item.cycleMonths[0]}–${item.cycleMonths[1]} ${t('common.months')}`,
                },
              ]}
            />
            <Link to="/case/$caseId" params={{ caseId: item.id }}>
              {t('portfolio.open')} →
            </Link>
          </Card>
        ))}
      </div>

      <Estimate>{t('common.estimate')}</Estimate>
    </Shell>
  )
}
