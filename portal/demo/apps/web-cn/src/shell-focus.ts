import type { Organization, Product, RegistrationCase } from '@demo/domain'

export interface ShellFocusInput {
  productId?: string
  caseId?: string
  products: Product[]
  cases: RegistrationCase[]
  organizations: Organization[]
}

export interface ShellFocus {
  product?: Product
  case?: RegistrationCase
  organization?: Organization
}

/**
 * Шапка смотрит на продукт из URL. Чужой кейс аккаунта (RU-0417) сюда
 * не подставляется: `#Кейс` только если кейс принадлежит этому продукту.
 */
export function resolveShellFocus({ productId, caseId, products, cases, organizations }: ShellFocusInput): ShellFocus {
  const product = productId ? products.find((item) => item.id === productId) : undefined
  const caseFromUrl = caseId ? cases.find((item) => item.id === caseId) : undefined

  const focusedProduct =
    product ?? (caseFromUrl && !productId ? products.find((item) => item.id === caseFromUrl.productId) : undefined)

  const ownCase = productId
    ? cases.find((item) => item.productId === productId || item.id === focusedProduct?.caseId)
    : caseFromUrl && (!focusedProduct || caseFromUrl.productId === focusedProduct.id)
      ? caseFromUrl
      : focusedProduct
        ? cases.find((item) => item.productId === focusedProduct.id || item.id === focusedProduct.caseId)
        : undefined

  const organization = focusedProduct
    ? organizations.find((item) => item.id === focusedProduct.organizationId)
    : ownCase
      ? organizations.find((item) => item.id === ownCase.organizationId)
      : undefined

  return { product: focusedProduct, case: ownCase, organization }
}

export function cabinetNavProductId(routeProductId: string | undefined, focusProductId: string): string {
  return routeProductId || focusProductId
}
