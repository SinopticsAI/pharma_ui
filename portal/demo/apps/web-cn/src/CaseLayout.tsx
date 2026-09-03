import { Link, Outlet, useParams } from '@tanstack/react-router'
import { describeError } from '@demo/api-client'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Callout, Empty, ui } from '@demo/ui'
import { Shell } from './Shell'
import { useCase } from './queries'

export function useCaseId(): string {
  const params = useParams({ strict: false }) as { caseId?: string }
  return params.caseId ?? ''
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

  const nav = (
    <>
      <Link to="/" className={ui.navItem}>
        ← {t('common.back')}
      </Link>
      {SECTIONS.map((section) => (
        <Link
          key={section.path}
          to={section.path}
          params={{ caseId }}
          className={ui.navItem}
          activeProps={{ className: `${ui.navItem} ${ui.navItemActive}` }}
          activeOptions={{ exact: section.exact }}
        >
          {t(section.key)}
        </Link>
      ))}
    </>
  )

  const card = caseQuery.data?.case
  const brandMeta = card ? `${t('app.caseCode')} ${card.code} · ${text(l10n(card.product)).value}` : undefined

  return (
    <Shell nav={nav} brandMeta={brandMeta}>
      {caseQuery.isLoading ? <Empty>{t('common.loading')}</Empty> : null}
      {caseQuery.isError ? <Callout tone="deadline">{describeError(caseQuery.error)}</Callout> : null}
      {caseQuery.data ? <Outlet /> : null}
    </Shell>
  )
}
