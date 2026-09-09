import type { ProgressSection, SlotSection } from '@demo/domain'

/** Порядок правой панели на слайде 4: реквизиты → документы → полномочия → банк → риски. */
export const COMPANY_SECTION_ORDER: readonly SlotSection[] = ['identity', 'documents', 'authority', 'banking', 'risk']

const ORDER_INDEX = new Map(COMPANY_SECTION_ORDER.map((key, index) => [key, index]))

export type SectionProgressKind = 'done' | 'partial' | 'left' | 'auto'

/**
 * Ядро может отдать секции в любом порядке (на проде banking шёл первым).
 * Незнакомый ключ оставляем после канона, в исходном относительном порядке.
 */
export function sortCompanySections(sections: ProgressSection[]): ProgressSection[] {
  return sections
    .map((section, index) => ({ section, index }))
    .sort((a, b) => {
      const rankA = ORDER_INDEX.get(a.section.key) ?? COMPANY_SECTION_ORDER.length + a.index
      const rankB = ORDER_INDEX.get(b.section.key) ?? COMPANY_SECTION_ORDER.length + b.index
      return rankA - rankB
    })
    .map(({ section }) => section)
}

export function sectionProgressKind(section: ProgressSection): SectionProgressKind {
  if (section.total > 0 && section.filled === section.total) return 'done'
  if (section.key === 'risk' && section.filled === 0) return 'auto'
  if (section.filled === 0) return 'left'
  return 'partial'
}
