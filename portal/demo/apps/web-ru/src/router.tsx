import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { CaseLayout } from './CaseLayout'
import { CasePage } from './pages/Case'
import { ClassificationPage } from './pages/Classification'
import { LedgerPage } from './pages/Ledger'
import { MandatePage } from './pages/Mandate'
import { PortfolioPage } from './pages/Portfolio'

const rootRoute = createRootRoute({ component: () => <Outlet /> })

const portfolioRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: PortfolioPage })

// Кейс рождается из утверждённой классификации, поэтому её экран живёт в консоли.
const classificationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'classification',
  component: ClassificationPage,
})

const caseRoute = createRoute({ getParentRoute: () => rootRoute, path: 'case/$caseId', component: CaseLayout })

const routeTree = rootRoute.addChildren([
  portfolioRoute,
  classificationRoute,
  caseRoute.addChildren([
    createRoute({ getParentRoute: () => caseRoute, path: '/', component: CasePage }),
    createRoute({ getParentRoute: () => caseRoute, path: 'mandate', component: MandatePage }),
    createRoute({ getParentRoute: () => caseRoute, path: 'ledger', component: LedgerPage }),
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
