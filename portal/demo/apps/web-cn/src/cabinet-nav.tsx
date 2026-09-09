import { useI18n } from '@demo/i18n'
import { Link } from '@tanstack/react-router'
import { DEMO_CASE_RU0417 } from './demo/ids'
import { navItem, navItemActive } from './kit'

const ITEMS = [
  { to: '/', key: 'nav.home', exact: true },
  { to: '/companies', key: 'nav.companies', exact: false },
  { to: '/products', key: 'nav.products', exact: false },
  { to: '/case/$caseId/roadmap', key: 'nav.processMap', exact: false, params: { caseId: DEMO_CASE_RU0417 } },
  { to: '/documents', key: 'nav.documents', exact: false },
  { to: '/contractors', key: 'nav.contractors', exact: false },
  { to: '/payments', key: 'nav.payments', exact: false },
  { to: '/messages', key: 'nav.messages', exact: false },
  { to: '/automation', key: 'nav.automation', exact: false },
  { to: '/workbench', key: 'nav.workbench', exact: false },
] as const

/** Левое меню кабинета: walkthrough IA, не список открытых дел. */
export function CabinetNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n()

  return (
    <>
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          params={'params' in item ? item.params : undefined}
          className={navItem}
          activeProps={{ className: `${navItem} ${navItemActive}` }}
          activeOptions={{ exact: item.exact }}
          onClick={onNavigate}
        >
          {t(item.key)}
        </Link>
      ))}
    </>
  )
}
