import { describeError, OFFLINE_DEMO } from '@demo/api-client'
import { useI18n } from '@demo/i18n'
import { AddProductCard, RegisterCompanyCard } from '../CreateActions'
import { useDemo } from '../demo/context'
import { Callout, Card, DemoMark, Empty, Metric, NextAction, PageHeader } from '../kit'
import { usePortfolioCards } from '../live-cards'
import { usePortfolioCreate } from '../portfolio-create'
import { Shell } from '../Shell'
import { CompanyCard, ProductCard } from './EntityCards'

export function HomePage() {
  const { t, text } = useI18n()
  const { state, pending, reset } = useDemo()
  const portfolio = usePortfolioCards(state)
  const { busy, failure, startCompany, startProduct } = usePortfolioCreate()
  const companies = portfolio.companies
  const products = portfolio.products

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
        <RegisterCompanyCard titleKey="home.registerCompany" busy={busy} onStart={startCompany} />
        <AddProductCard
          titleKey="home.addProduct"
          organizations={portfolio.organizations.data ?? []}
          busy={busy}
          onStart={startProduct}
        />
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
