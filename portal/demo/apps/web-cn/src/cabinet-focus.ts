import { OFFLINE_DEMO } from '@demo/api-client'
import type { Product, RegistrationCase } from '@demo/domain'
import { DEMO_CASE_RU0417, DEMO_PRODUCT_MH200 } from './demo/ids'
import { useAllProducts, useCases, useOrganizations } from './queries'

/** Карта и рабочий стол берут живой кейс/продукт, не зашитый demo-ru-0417. */
export function pickCabinetFocus(
  products: Product[] | undefined,
  cases: RegistrationCase[] | undefined,
  offline: boolean,
): { caseId: string; productId: string } {
  if (offline) {
    return { caseId: DEMO_CASE_RU0417, productId: DEMO_PRODUCT_MH200 }
  }
  const list = products ?? []
  const rows = cases ?? []
  const withCase = list.find((item) => Boolean(item.caseId))
  if (withCase) return { productId: withCase.id, caseId: withCase.caseId }
  const open = rows.find((item) => item.productId) ?? rows[0]
  if (open) return { productId: open.productId || list[0]?.id || '', caseId: open.id }
  return { productId: list[0]?.id ?? '', caseId: '' }
}

export function useCabinetFocus() {
  const organizations = useOrganizations()
  const products = useAllProducts((organizations.data ?? []).map((item) => item.id))
  const cases = useCases()
  const focus = pickCabinetFocus(products.data, cases.data, OFFLINE_DEMO)
  const waiting = (organizations.isLoading || products.isLoading) && !products.data?.length
  return { ...focus, loading: waiting }
}
