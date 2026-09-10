import { describeError } from '@demo/api-client'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Link, Outlet, useMatches, useParams } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Button, Callout, Empty, navItem, navItemActive } from './kit'
import { useOrganization, useProduct } from './queries'
import { Shell } from './Shell'
import { WorkspaceProvider } from './workspace'

export function useProductId(): string {
  const params = useParams({ from: '/products/$productId' })
  return params.productId
}

/** `needsCase` — раздел читает карту кейса, а её строит ядро после классификации. */
const SECTIONS = [
  { path: '/products/$productId', key: 'nav.dashboard', exact: true, needsCase: false },
  { path: '/products/$productId/roadmap', key: 'nav.roadmap', exact: false, needsCase: true },
  { path: '/products/$productId/dossier', key: 'nav.dossier', exact: false, needsCase: true },
  { path: '/products/$productId/ledger', key: 'nav.ledger', exact: false, needsCase: true },
  { path: '/products/$productId/inbox', key: 'nav.inbox', exact: false, needsCase: true },
  { path: '/products/$productId/chat', key: 'nav.chat', exact: false, needsCase: true },
  { path: '/products/$productId/mandate', key: 'nav.mandate', exact: false, needsCase: true },
  { path: '/products/$productId/classify', key: 'nav.classify', exact: false, needsCase: false },
] as const

const CASE_ROUTES = new Set<string>([
  '/products/$productId/roadmap',
  '/products/$productId/dossier',
  '/products/$productId/ledger',
  '/products/$productId/inbox',
  '/products/$productId/chat',
  '/products/$productId/mandate',
  '/products/$productId/nodes/$nodeCode',
])

const tab = `${navItem} rounded-md border-l-0 px-3 py-1.5`

/**
 * Кабинет продукта — единственное рабочее место: продукт и кейс связаны один к
 * одному, поэтому разделы кейса живут здесь же. Адреса `/case/*` остались
 * редиректом ради старых ссылок.
 */
export function ProductLayout() {
  const productId = useProductId()
  const { t, text } = useI18n()
  const productQuery = useProduct(productId)
  const product = productQuery.data
  const caseId = product?.caseId ?? ''
  const organization = useOrganization(product?.organizationId ?? '')
  const brandMeta = organization.data ? text(l10n(organization.data.name, organization.data.id)).value : undefined
  const matches = useMatches()
  const locked = !caseId && matches.some((match) => CASE_ROUTES.has(match.routeId))
  const workspace = useMemo(() => ({ productId, caseId }), [productId, caseId])

  return (
    <Shell brandMeta={brandMeta} wide>
      {productQuery.isLoading ? <Empty>{t('common.loading')}</Empty> : null}
      {productQuery.isError ? <Callout tone="deadline">{describeError(productQuery.error)}</Callout> : null}
      {!productQuery.isLoading && !productQuery.isError && !product ? <Empty>{t('portfolio.noProducts')}</Empty> : null}

      {product ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2 border-b pb-3">
            {SECTIONS.map((section) =>
              section.needsCase && !caseId ? (
                <span key={section.path} className={`${tab} opacity-50`} aria-disabled="true" title={t('hub.noCase')}>
                  {t(section.key)}
                </span>
              ) : (
                <Link
                  key={section.path}
                  to={section.path}
                  params={{ productId }}
                  className={tab}
                  activeProps={{ className: `${tab} ${navItemActive}` }}
                  activeOptions={{ exact: section.exact }}
                >
                  {t(section.key)}
                </Link>
              ),
            )}
            <Link to="/intake/product/$productId" params={{ productId }} className={tab}>
              {t('portfolio.continueAgent')}
            </Link>
          </div>

          {locked ? (
            <>
              <Callout tone="quiet">{t('hub.emptyChannel')}</Callout>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/products/$productId/classify" params={{ productId }}>
                  <Button type="button">{t('home.openClassify')}</Button>
                </Link>
                <Link to="/intake/product/$productId" params={{ productId }} className="text-sm underline">
                  {t('portfolio.continueAgent')} →
                </Link>
              </div>
            </>
          ) : (
            <WorkspaceProvider value={workspace}>
              <Outlet />
            </WorkspaceProvider>
          )}
        </>
      ) : null}
    </Shell>
  )
}
