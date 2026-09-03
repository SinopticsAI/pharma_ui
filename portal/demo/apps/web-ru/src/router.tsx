import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { CaseLayout } from './CaseLayout'
import { CasePage } from './pages/Case'
import { LedgerPage } from './pages/Ledger'
import { MandatePage } from './pages/Mandate'
import { PortfolioPage } from './pages/Portfolio'

const rootRoute = createRootRoute({ component: () => <Outlet /> })

const portfolioRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: PortfolioPage })

const caseRoute = createRoute({ getParentRoute: () => rootRoute, path: 'case/$caseId', component: CaseLayout })

const routeTree = rootRoute.addChildren([
  portfolioRoute,
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
