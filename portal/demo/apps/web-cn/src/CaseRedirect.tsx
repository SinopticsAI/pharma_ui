import { useI18n } from '@demo/i18n'
import { Link, Navigate, useParams } from '@tanstack/react-router'
import { Callout, Empty } from './kit'
import { useCase } from './queries'
import { Shell } from './Shell'

/**
 * Разделы кейса живут в кабинете продукта. Адреса `/case/*` остались, чтобы
 * прежние ссылки, закладки и уведомления вели туда же, а не в пустоту.
 */
const SECTION_PATH = {
  overview: '/products/$productId',
  roadmap: '/products/$productId/roadmap',
  dossier: '/products/$productId/dossier',
  ledger: '/products/$productId/ledger',
  inbox: '/products/$productId/inbox',
  chat: '/products/$productId/chat',
  mandate: '/products/$productId/mandate',
} as const

export type CaseSection = keyof typeof SECTION_PATH

export function CaseRedirect({ section, nodeCode }: { section?: CaseSection; nodeCode?: string }) {
  const { caseId } = useParams({ from: '/case/$caseId' })
  const { t } = useI18n()
  const caseQuery = useCase(caseId)
  const productId = caseQuery.data?.case.productId ?? ''

  if (productId) {
    return nodeCode ? (
      <Navigate to="/products/$productId/nodes/$nodeCode" params={{ productId, nodeCode }} replace />
    ) : (
      <Navigate to={SECTION_PATH[section ?? 'overview']} params={{ productId }} replace />
    )
  }

  return (
    <Shell>
      {caseQuery.isLoading ? (
        <Empty>{t('common.loading')}</Empty>
      ) : (
        <>
          <Callout tone="quiet">{t('common.empty')}</Callout>
          <Link to="/products">{t('nav.products')} →</Link>
        </>
      )}
    </Shell>
  )
}
