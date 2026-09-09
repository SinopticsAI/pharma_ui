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
  const withCase = list.find((item) => Boolean(item.caseId))
  const product = withCase ?? list[0]
  const matched = (cases ?? []).find((item) => item.productId === product?.id)
  return {
    productId: product?.id ?? '',
    caseId: product?.caseId || matched?.id || (cases ?? [])[0]?.id || '',
  }
}

export function useCabinetFocus() {
  const organizations = useOrganizations()
  const products = useAllProducts((organizations.data ?? []).map((item) => item.id))
  const cases = useCases()
  const focus = pickCabinetFocus(products.data, cases.data, OFFLINE_DEMO)
  const waiting = (organizations.isLoading || products.isLoading) && !products.data?.length
  return { ...focus, loading: waiting }
}
