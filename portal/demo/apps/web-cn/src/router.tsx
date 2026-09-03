import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { CaseLayout } from './CaseLayout'
import { ChatPage } from './pages/Chat'
import { DashboardPage } from './pages/Dashboard'
import { DossierPage } from './pages/Dossier'
import { InboxPage } from './pages/Inbox'
import { IntakeCompanyPage, IntakeProductPage } from './pages/Intake'
import { LedgerPage } from './pages/Ledger'
import { MandatePage } from './pages/Mandate'
import { PortfolioPage } from './pages/Portfolio'
import { RoadmapPage } from './pages/Roadmap'

const rootRoute = createRootRoute({ component: () => <Outlet /> })

const portfolioRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: PortfolioPage })

// Две точки входа: компания и продукт. Продукт всегда привязан к компании.
const intakeCompanyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'intake/company',
  component: IntakeCompanyPage,
})

const intakeProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'intake/product/$companyId',
  component: IntakeProductPage,
})

const caseRoute = createRoute({ getParentRoute: () => rootRoute, path: 'case/$caseId', component: CaseLayout })

const routeTree = rootRoute.addChildren([
  portfolioRoute,
  intakeCompanyRoute,
  intakeProductRoute,
  caseRoute.addChildren([
    createRoute({ getParentRoute: () => caseRoute, path: '/', component: DashboardPage }),
    createRoute({ getParentRoute: () => caseRoute, path: 'roadmap', component: RoadmapPage }),
    createRoute({ getParentRoute: () => caseRoute, path: 'dossier', component: DossierPage }),
    createRoute({ getParentRoute: () => caseRoute, path: 'ledger', component: LedgerPage }),
    createRoute({ getParentRoute: () => caseRoute, path: 'inbox', component: InboxPage }),
    createRoute({ getParentRoute: () => caseRoute, path: 'chat', component: ChatPage }),
    createRoute({ getParentRoute: () => caseRoute, path: 'mandate', component: MandatePage }),
  ]),
])

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL.replace(/\/$/, ''),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
