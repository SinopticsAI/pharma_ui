import { describeError, OFFLINE_DEMO } from '@demo/api-client'
import type { Organization } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { useNavigate } from '@tanstack/react-router'
import { useDemo } from '../demo/context'
import { Callout, Card, DemoMark, Empty, Metric, NextAction, PageHeader } from '../kit'
import { usePortfolioCards } from '../live-cards'
import { useCreateOrganization, useCreateProduct, useOpenIntakeSession } from '../queries'
import { Shell } from '../Shell'
import { CompanyCard, ProductCard } from './EntityCards'

export function HomePage() {
  const { t, text } = useI18n()
  const navigate = useNavigate()
  const { state, pending, reset } = useDemo()
  const portfolio = usePortfolioCards(state)
  const createOrganization = useCreateOrganization()
  const createProduct = useCreateProduct()
  const openSession = useOpenIntakeSession()
  const companies = portfolio.companies
  const products = portfolio.products
  const busy = createOrganization.isPending || createProduct.isPending || openSession.isPending
  const failure = createOrganization.error ?? createProduct.error ?? openSession.error
  const liveReady = (portfolio.organizations.data ?? []).find(
    (item) => item.status === 'profile_approved' && !item.id.startsWith('demo-'),
  )

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

  const next = products[0]
  const waiting = OFFLINE_DEMO ? pending : portfolio.pendingLive

  return (
    <Shell>
      <PageHeader eyebrow={t('eyebrow.home')} title={t('home.title')} lead={t('home.lead')} />
      {OFFLINE_DEMO ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <DemoMark>{t('shell.demoMark')}</DemoMark>
          <button type="button" className="text-xs underline" onClick={reset}>
            reset demo
          </button>
        </div>
      ) : null}

      {next ? (
        <NextAction
          label={t('shell.nextAction')}
          action={
            <a
              href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/intake/product/${next.product.id}`}
              className="text-sm underline"
            >
              {t('portfolio.continueAgent')} →
            </a>
          }
        >
          {text(next.nextAction).value}
        </NextAction>
      ) : null}

      {failure ? <Callout tone="deadline">{describeError(failure)}</Callout> : null}
      {portfolio.organizations.isError ? (
        <Callout tone="deadline">{describeError(portfolio.organizations.error)}</Callout>
      ) : null}

      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('home.summary')}</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <Metric value={companies.length} label={t('home.companiesCount')} />
        </Card>
        <Card>
          <Metric value={products.filter((item) => item.product.caseId).length} label={t('home.activeProducts')} />
        </Card>
        <Card>
          <Metric
            value={products.filter((item) => !item.product.caseId || item.progress < 100).length}
            label={t('home.inProgress')}
          />
        </Card>
        <Card>
          <Metric value={next ? text(next.deadline).value : '—'} label={t('home.nextDeadline')} />
        </Card>
        <Card>
          <Metric accent value={`${portfolio.saleProgress}%`} label={t('home.saleProgress')} />
        </Card>
        <Card>
          <Metric accent value={waiting} label={t('home.pendingUser')} />
        </Card>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-4 text-left hover:border-primary disabled:opacity-50"
          onClick={() => void startCompany()}
          disabled={busy}
        >
          <strong>{t('home.registerCompany')}</strong>
          <span className="text-sm text-muted-foreground">{t('portfolio.registerCompanyLead')}</span>
        </button>
        <button
          type="button"
          className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-4 text-left hover:border-primary disabled:opacity-50"
          disabled={busy || !liveReady}
          onClick={() => liveReady && void startProduct(liveReady)}
        >
          <strong>{t('home.addProduct')}</strong>
          <span className="text-sm text-muted-foreground">
            {liveReady ? t('portfolio.addProductLead') : t('portfolio.addProductLocked')}
          </span>
        </button>
      </div>

      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t('portfolio.companies')}
      </h2>
      {portfolio.organizations.isLoading && companies.length === 0 ? <Empty>{t('common.loading')}</Empty> : null}
      {!portfolio.organizations.isLoading && companies.length === 0 ? (
        <Empty>{t('portfolio.noCompanies')}</Empty>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {companies.map((item) => (
          <CompanyCard key={item.organization.id} item={item} />
        ))}
      </div>

      <h2 className="mt-6 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t('portfolio.products')}
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {products.map((item) => (
          <ProductCard key={item.product.id} item={item} />
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{t('common.estimate')}</p>
    </Shell>
  )
}
