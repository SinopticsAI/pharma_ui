import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Link } from '@tanstack/react-router'
import { navItem, navItemActive } from './kit'
import { useCases } from './queries'

/** Левое меню кабинета вне кейса: портфель и ярлыки открытых дел. */
export function CabinetNav() {
  const { t, text } = useI18n()
  const cases = useCases()

  return (
    <>
      <Link to="/" className={navItem} activeProps={{ className: `${navItem} ${navItemActive}` }} activeOptions={{ exact: true }}>
        {t('nav.home')}
      </Link>
      {(cases.data ?? []).map((item) => (
        <Link
          key={item.id}
          to="/case/$caseId"
          params={{ caseId: item.id }}
          className={navItem}
          activeProps={{ className: `${navItem} ${navItemActive}` }}
        >
          {item.code} · {text(l10n(item.product)).value}
        </Link>
      ))}
    </>
  )
}
