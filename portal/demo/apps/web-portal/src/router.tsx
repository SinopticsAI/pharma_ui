import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AppShell } from './components/AppShell'
import { ShellUiProvider } from './components/shell-ui'
import { PortalStoreProvider } from './data/store'
import { I18nProvider } from './i18n'
import { ApplicationDetailPage } from './pages/ApplicationDetail'
import { ApplicationsPage } from './pages/Applications'
import { CertificatesPage } from './pages/Certificates'
import { DocumentsPage } from './pages/Documents'
import { MessagesPage } from './pages/Messages'
import { OverviewPage } from './pages/Overview'
import { SettingsPage } from './pages/Settings'
import { TasksPage } from './pages/Tasks'
import { WorkDetailPage } from './pages/WorkDetail'

function Root() {
  return (
    <I18nProvider defaultLocale="ru">
      <PortalStoreProvider>
        <ShellUiProvider>
          <AppShell />
        </ShellUiProvider>
      </PortalStoreProvider>
    </I18nProvider>
  )
}

const rootRoute = createRootRoute({
  component: Root,
})

const overviewRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: OverviewPage })
const applicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/applications',
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  component: ApplicationsPage,
})
const applicationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/applications/$applicationId',
  component: ApplicationDetailPage,
})
const workRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/applications/$applicationId/works/$workCode',
  component: WorkDetailPage,
})
const documentsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/documents', component: DocumentsPage })
const certificatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/certificates',
  component: CertificatesPage,
})
const tasksRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tasks', component: TasksPage })
const messagesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/messages', component: MessagesPage })
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsPage })

const routeTree = rootRoute.addChildren([
  overviewRoute,
  applicationsRoute,
  applicationRoute,
  workRoute,
  documentsRoute,
  certificatesRoute,
  tasksRoute,
  messagesRoute,
  settingsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
