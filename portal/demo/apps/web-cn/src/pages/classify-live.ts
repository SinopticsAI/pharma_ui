import type { ClassificationVariant, Product } from '@demo/domain'

/**
 * Клиент утверждает уже выбранный специалистом вариант. Ядро строит кейс
 * только на этом вызове — не на выборе карточки в браузере.
 */
export function clientCanBuildMap(product: Product | undefined): boolean {
  if (!product) return false
  if (product.caseId) return false
  if (!product.specialistApprovedAt) return false
  if (product.clientApprovedAt) return false
  return Boolean(product.selectedVariantId)
}

export function resolveVariants(
  product: Product | undefined,
  listed: ClassificationVariant[] | undefined,
): ClassificationVariant[] {
  if (product?.variants && product.variants.length > 0) return product.variants
  return listed ?? []
}
