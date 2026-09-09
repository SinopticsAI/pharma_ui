import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Award,
  Building2,
  CheckSquare,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Settings,
  X,
} from 'lucide-react'
import { useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import { l10n } from '@demo/domain'
import { initialsOf } from '../data/types'
import { useI18n } from '../i18n'
import { LocaleSwitch } from './LocaleSwitch'
import styles from '../styles/shell.module.css'

const NAV = [
  { to: '/', key: 'nav.overview' as const, icon: LayoutDashboard, exact: true },
  { to: '/applications', key: 'nav.applications' as const, icon: FileText, exact: false },
  { to: '/documents', key: 'nav.documents' as const, icon: FolderOpen, exact: false },
  { to: '/certificates', key: 'nav.certificates' as const, icon: Award, exact: false },
  { to: '/tasks', key: 'nav.tasks' as const, icon: CheckSquare, exact: false },
  { to: '/messages', key: 'nav.messages' as const, icon: MessageSquare, exact: false },
  { to: '/settings', key: 'nav.settings' as const, icon: Settings, exact: false },
]

export function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const { t, text } = useI18n()
  const identity = useIdentity()
  const { logout } = useAuth()
  const [drawer, setDrawer] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDrawer(false)
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setDrawer(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const account = text(l10n(identity.account.name, identity.accountId).ru)
  const userName = identity.displayName || identity.subject

  return (
    <div className={styles.shell}>
      {drawer ? (
        <button type="button" className={styles.overlay} aria-label={t('app.closeMenu')} onClick={() => setDrawer(false)} />
      ) : null}

      <aside className={`${styles.sidebar} ${drawer ? styles.sidebarOpen : ''}`} id="app-sidebar">
        <Link to="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            pc
          </span>
          <span>
            <span className={styles.brandName}>pharma_cert</span>
            <span className={styles.brandHint}>{t('app.brandHint')}</span>
          </span>
        </Link>
        <nav className={styles.nav} aria-label={t('app.navAria')}>
          {NAV.map((item) => {
            const active = item.exact ? pathname === '/' : pathname.startsWith(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                {t(item.key)}
              </Link>
            )
          })}
        </nav>
        <p className={styles.sidebarFoot}>{t('app.sidebarFoot')}</p>
      </aside>

      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label={drawer ? t('app.closeNav') : t('app.openNav')}
          aria-controls="app-sidebar"
          aria-expanded={drawer}
          onClick={() => setDrawer((value) => !value)}
        >
          {drawer ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
        </button>

        <form
          className={styles.search}
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            void navigate({ to: '/applications', search: query.trim() ? { q: query.trim() } : {} })
          }}
        >
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            placeholder={t('app.searchPlaceholder')}
            aria-label={t('app.searchAria')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>

        <span className={styles.org}>
          <Building2 size={16} strokeWidth={1.75} aria-hidden="true" />
          {account}
        </span>

        <LocaleSwitch />

        <div className={styles.wrap} ref={menuRef}>
          <button
            type="button"
            className={styles.avatar}
            aria-label={t('app.userMenu', { name: userName })}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {initialsOf(userName)}
          </button>
          {menuOpen ? (
            <div className={styles.menu} role="menu" aria-label={t('app.userMenuAria')}>
              <div className={styles.popoverTitle}>
                {userName}
                <span className={styles.noteBody}>{t(`role.${identity.role}`)}</span>
              </div>
              <Link to="/settings" role="menuitem" className={styles.note}>
                {t('app.profileSettings')}
              </Link>
              <button type="button" role="menuitem" className={styles.note} onClick={logout}>
                {t('settings.logout')}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
