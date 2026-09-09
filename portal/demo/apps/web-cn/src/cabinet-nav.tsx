import { useI18n } from '@demo/i18n'
import { Link } from '@tanstack/react-router'
import { useCabinetFocus } from './cabinet-focus'
import { navItem, navItemActive } from './kit'

const BEFORE = [
  { to: '/', key: 'nav.home', exact: true },
  { to: '/companies', key: 'nav.companies', exact: false },
  { to: '/products', key: 'nav.products', exact: false },
] as const

const AFTER = [
  { to: '/documents', key: 'nav.documents', exact: false },
  { to: '/contractors', key: 'nav.contractors', exact: false },
  { to: '/payments', key: 'nav.payments', exact: false },
  { to: '/messages', key: 'nav.messages', exact: false },
  { to: '/automation', key: 'nav.automation', exact: false },
] as const

/** Левое меню кабинета: walkthrough IA, не список открытых дел. */
export function CabinetNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n()
  const { caseId, productId } = useCabinetFocus()

  return (
    <>
      {BEFORE.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          className={navItem}
          activeProps={{ className: `${navItem} ${navItemActive}` }}
          activeOptions={{ exact: item.exact }}
          onClick={onNavigate}
        >
          {t(item.key)}
        </Link>
      ))}

      {caseId ? (
        <Link
          to="/case/$caseId/roadmap"
          params={{ caseId }}
          className={navItem}
          activeProps={{ className: `${navItem} ${navItemActive}` }}
          onClick={onNavigate}
        >
          {t('nav.processMap')}
        </Link>
      ) : productId ? (
        <Link
          to="/products/$productId"
          params={{ productId }}
          className={navItem}
          activeProps={{ className: `${navItem} ${navItemActive}` }}
          activeOptions={{ exact: true }}
          onClick={onNavigate}
        >
          {t('nav.processMap')}
        </Link>
      ) : (
        <Link
          to="/workbench"
          className={navItem}
          activeProps={{ className: `${navItem} ${navItemActive}` }}
          onClick={onNavigate}
        >
          {t('nav.processMap')}
        </Link>
      )}

      {AFTER.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          className={navItem}
          activeProps={{ className: `${navItem} ${navItemActive}` }}
          activeOptions={{ exact: item.exact }}
          onClick={onNavigate}
        >
          {t(item.key)}
        </Link>
      ))}

      {productId ? (
        <Link
          to="/products/$productId"
          params={{ productId }}
          className={navItem}
          activeProps={{ className: `${navItem} ${navItemActive}` }}
          activeOptions={{ exact: true }}
          onClick={onNavigate}
        >
          {t('nav.workbench')}
        </Link>
      ) : (
        <Link
          to="/workbench"
          className={navItem}
          activeProps={{ className: `${navItem} ${navItemActive}` }}
          onClick={onNavigate}
        >
          {t('nav.workbench')}
        </Link>
      )}
    </>
  )
}
