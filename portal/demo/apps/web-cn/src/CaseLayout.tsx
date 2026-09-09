import { describeError } from '@demo/api-client'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Link, Outlet, useParams } from '@tanstack/react-router'
import { Callout, Empty, navItem, navItemActive } from './kit'
import { useCase } from './queries'
import { Shell } from './Shell'

export function useCaseId(): string {
  const params = useParams({ from: '/case/$caseId' })
  return params.caseId
}

const SECTIONS = [
  { path: '/case/$caseId', key: 'nav.dashboard', exact: true },
  { path: '/case/$caseId/roadmap', key: 'nav.roadmap', exact: false },
  { path: '/case/$caseId/dossier', key: 'nav.dossier', exact: false },
  { path: '/case/$caseId/ledger', key: 'nav.ledger', exact: false },
  { path: '/case/$caseId/inbox', key: 'nav.inbox', exact: false },
  { path: '/case/$caseId/chat', key: 'nav.chat', exact: false },
  { path: '/case/$caseId/mandate', key: 'nav.mandate', exact: false },
] as const

export function CaseLayout() {
  const caseId = useCaseId()
  const { t, text } = useI18n()
  const caseQuery = useCase(caseId)
  const card = caseQuery.data?.case
  const brandMeta = card ? `${text(l10n(card.manufacturer)).value}` : undefined

  return (
    <Shell brandMeta={brandMeta} wide>
      {caseQuery.isLoading ? <Empty>{t('common.loading')}</Empty> : null}
      {caseQuery.isError ? <Callout tone="deadline">{describeError(caseQuery.error)}</Callout> : null}
      {card ? (
        <div className="mb-4 flex flex-wrap gap-2 border-b pb-3">
          {SECTIONS.map((section) => (
            <Link
              key={section.path}
              to={section.path}
              params={{ caseId }}
              className={`${navItem} rounded-md border-l-0 px-3 py-1.5`}
              activeProps={{ className: `${navItem} ${navItemActive} rounded-md border-l-0 px-3 py-1.5` }}
              activeOptions={{ exact: section.exact }}
            >
              {t(section.key)}
            </Link>
          ))}
        </div>
      ) : null}
      {caseQuery.data ? <Outlet /> : null}
    </Shell>
  )
}
