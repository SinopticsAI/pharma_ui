import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Award,
  Bell,
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
import { NOTIFICATIONS } from '../data/seed'
import { ORGANIZATION, USER } from '../data/types'
import { useI18n } from '../i18n'
import { CreateApplicationModal } from './CreateApplicationModal'
import { LocaleSwitch } from './LocaleSwitch'
import { useShellUi } from './shell-ui'
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
  const { createOpen, closeCreate } = useShellUi()
  const { t, dateTime, notification } = useI18n()
  const [drawer, setDrawer] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const notesRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDrawer(false)
    setNotesOpen(false)
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (notesRef.current && !notesRef.current.contains(target)) setNotesOpen(false)
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotesOpen(false)
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

  const unread = NOTIFICATIONS.some((item) => item.unread)

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
          {ORGANIZATION.name}
        </span>

        <LocaleSwitch />

        <div className={styles.wrap} ref={notesRef}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t('app.notifications')}
            aria-expanded={notesOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setNotesOpen((value) => !value)
              setMenuOpen(false)
            }}
          >
            <Bell size={18} strokeWidth={1.75} />
            {unread ? <span className={styles.dot} aria-hidden="true" /> : null}
          </button>
          {notesOpen ? (
            <div className={styles.popover} role="dialog" aria-label={t('app.notifications')}>
              <div className={styles.popoverTitle}>{t('app.notifications')}</div>
              {NOTIFICATIONS.map((item) => {
                const copy = notification(item)
                return (
                  <Link
                    key={item.id}
                    to={item.applicationId ? '/applications/$applicationId' : '/'}
                    params={item.applicationId ? { applicationId: item.applicationId } : undefined}
                    className={`${styles.note} ${item.unread ? styles.unread : ''}`}
                  >
                    <span className={styles.noteTitle}>{copy.title}</span>
                    <span className={styles.noteBody}>{copy.body}</span>
                    <span className={styles.noteTime}>{dateTime(item.at)}</span>
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>

        <div className={styles.wrap} ref={menuRef}>
          <button
            type="button"
            className={styles.avatar}
            aria-label={t('app.userMenu', { name: USER.fullName })}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => {
              setMenuOpen((value) => !value)
              setNotesOpen(false)
            }}
          >
            {USER.initials}
          </button>
          {menuOpen ? (
            <div className={styles.menu} role="menu" aria-label={t('app.userMenuAria')}>
              <div className={styles.popoverTitle}>
                {USER.fullName}
                <span className={styles.noteBody}>{t('user.role')}</span>
              </div>
              <Link to="/settings" role="menuitem" className={styles.note}>
                {t('app.profileSettings')}
              </Link>
              <button type="button" role="menuitem" disabled>
                {t('app.switchOrg')}
              </button>
              <button type="button" role="menuitem" disabled>
                {t('app.logout')}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      {createOpen ? <CreateApplicationModal onClose={closeCreate} /> : null}
    </div>
  )
}
