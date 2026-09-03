import { Link, Outlet, useParams } from '@tanstack/react-router'
import { describeError } from '@demo/api-client'
import { l10n } from '@demo/domain'
import { Callout, Empty, ui } from '@demo/ui'
import { Shell } from './Shell'
import { useCase } from './queries'

export function useCaseId(): string {
  const params = useParams({ strict: false }) as { caseId?: string }
  return params.caseId ?? ''
}

const SECTIONS = [
  { path: '/case/$caseId', label: 'Кейс и статусы', exact: true },
  { path: '/case/$caseId/mandate', label: 'Мандат и подпись', exact: false },
  { path: '/case/$caseId/ledger', label: 'Счета и платежи', exact: false },
] as const

export function CaseLayout() {
  const caseId = useCaseId()
  const caseQuery = useCase(caseId)

  const nav = (
    <>
      <Link to="/" className={ui.navItem}>
        ← К портфелю оператора
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
          {section.label}
        </Link>
      ))}
    </>
  )

  const card = caseQuery.data?.case
  const brandMeta = card ? `Кейс ${card.code} · ${l10n(card.product).ru}` : undefined

  return (
    <Shell nav={nav} brandMeta={brandMeta}>
      {caseQuery.isLoading ? <Empty>Загружаем кейс</Empty> : null}
      {caseQuery.isError ? <Callout tone="deadline">{describeError(caseQuery.error)}</Callout> : null}
      {caseQuery.data ? <Outlet /> : null}
    </Shell>
  )
}
