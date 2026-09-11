import type { ClassificationVariant, Product } from '@demo/domain'

/**
 * Карту можно строить, когда выбран не-forbidden вариант и кейса ещё нет.
 * На время демо поставщик сам фиксирует выбор (роль specialist в ядре).
 */
export function clientCanBuildMap(product: Product | undefined): boolean {
  if (!product) return false
  if (product.caseId) return false
  if (product.clientApprovedAt) return false
  return Boolean(product.selectedVariantId)
}

export function variantIsChoosable(variant: ClassificationVariant): boolean {
  return variant.variantType !== 'forbidden'
}

/**
 * Строка аудита классификации. Кабинет не сверяет вид по приказу 4н, поэтому
 * пишет основание как есть: чей это черновик и что именно выбрано.
 */
export function classificationCheckedAgainst(variant: ClassificationVariant): string {
  const track = `${variant.kind}/${variant.riskClass}/${variant.track}`
  return `черновик агента ${variant.id} (${track}); вид НКМИ по приказу 4н не сверен`
}

export function canSelectLiveVariant(args: { canApproveAsSpecialist: boolean; product: Product | undefined }): boolean {
  if (!args.product) return false
  if (args.product.caseId) return false
  if (args.product.specialistApprovedAt) return false
  return args.canApproveAsSpecialist
}

export function resolveVariants(
  product: Product | undefined,
  listed: ClassificationVariant[] | undefined,
): ClassificationVariant[] {
  if (product?.variants && product.variants.length > 0) return product.variants
  return listed ?? []
}

const GATE_FIELDS = ['name', 'intendedUse'] as const

export function classifyGateMissing(missing: string[] | undefined): Array<(typeof GATE_FIELDS)[number]> {
  const out: Array<(typeof GATE_FIELDS)[number]> = []
  for (const key of missing ?? []) {
    if (key === 'name' || key === 'intendedUse') out.push(key)
  }
  return out
}
