import { describeError } from '@demo/api-client'
import type { Organization, OrganizationStatus, ProductStatus } from '@demo/domain'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Link, useNavigate } from '@tanstack/react-router'
import { Callout, Card, Empty, Estimate, KeyValue, navItem, navItemActive, PageHeader, StatusBadge } from '../kit'
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

const ORG_STATUS_LABEL: Record<OrganizationStatus, string> = {
  collecting: 'агент собирает документы',
  draft: 'черновик профиля',
  profile_approved: 'профиль одобрен',
}

const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  collecting: 'сбор данных',
  draft: 'черновик карточки',
  data_approved: 'карточка одобрена',
  variants_pending: 'ждёт выбора варианта',
  variant_selected: 'вариант выбран',
  ru_confirmed: 'трек подтверждён',
}

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

  const readyCompany = companies.find((item) => item.status === 'profile_approved')

  const nav = (cases.data ?? []).map((item) => (
    <Link
      key={item.id}
      to="/case/$caseId"
      params={{ caseId: item.id }}
      className={navItem}
      activeProps={{ className: `${navItem} ${navItemActive}` }}
    >
      {item.code} · {text(l10n(item.product)).value}
    </Link>
  ))

  return (
    <Shell nav={nav}>
      <PageHeader title={t('portfolio.title')} lead={t('portfolio.lead')} />

      {failure ? <Callout tone="deadline">{describeError(failure)}</Callout> : null}

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-4 text-left hover:border-primary disabled:opacity-50"
          onClick={() => void startCompany()}
          disabled={busy}
        >
          <strong>Зарегистрировать компанию</strong>
          <span className="text-sm text-muted-foreground">
            Диалог с агентом ≈ 15 минут — он заполнит профиль по вашим документам
          </span>
        </button>
        <button
          type="button"
          className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-4 text-left hover:border-primary disabled:opacity-50"
          disabled={busy || !readyCompany}
          onClick={() => readyCompany && void startProduct(readyCompany)}
        >
          <strong>Добавить продукт</strong>
          <span className="text-sm text-muted-foreground">
            {readyCompany
              ? 'Агент соберёт данные, предложит классификацию и построит карту'
              : 'Доступно после того, как профиль компании одобрен'}
          </span>
        </button>
      </div>

      {organizations.isError ? <Callout tone="deadline">{describeError(organizations.error)}</Callout> : null}

      <h3 className="mb-2 mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Компании</h3>
      {organizations.isLoading ? <Empty>{t('common.loading')}</Empty> : null}
      {!organizations.isLoading && companies.length === 0 ? (
        <Empty>Компаний пока нет. Начните с диалога — агент заполнит профиль.</Empty>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {companies.map((company) => (
          <Card
            key={company.id}
            title={text(l10n(company.name, company.id)).value}
            meta={company.completeness ? `${company.completeness.percent}%` : undefined}
          >
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={company.status === 'profile_approved' ? 'accent' : 'quiet'}>
                {ORG_STATUS_LABEL[company.status]}
              </StatusBadge>
            </div>
            {company.status !== 'profile_approved' ? (
              <Link to="/intake/company/$organizationId" params={{ organizationId: company.id }} search={{}}>
                Продолжить с агентом →
              </Link>
            ) : null}
          </Card>
        ))}
      </div>

      <h3 className="mb-2 mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Продукты</h3>
      {products.isLoading ? <Empty>{t('common.loading')}</Empty> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {(products.data ?? []).map((product) => (
          <Card
            key={product.id}
            title={text(l10n(product.name, product.id)).value}
            meta={`Комплектность ${product.completeness}%`}
          >
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={product.caseId ? 'accent' : 'quiet'}>
                {PRODUCT_STATUS_LABEL[product.status]}
              </StatusBadge>
            </div>
            {product.caseId ? (
              <Link to="/case/$caseId" params={{ caseId: product.caseId }}>
                Открыть кейс →
              </Link>
            ) : (
              <Link to="/intake/product/$productId" params={{ productId: product.id }} search={{}}>
                Продолжить с агентом →
              </Link>
            )}
          </Card>
        ))}
      </div>

      <h3 className="mb-2 mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Кейсы</h3>
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
