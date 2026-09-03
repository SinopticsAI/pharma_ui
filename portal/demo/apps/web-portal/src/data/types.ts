import type { JournalEntry, ProductKind, RegistryCheck, WorkItem } from './work'

export type AppStatus = 'approved' | 'action_required' | 'in_review' | 'remarks' | 'draft'

export type ProcedureType =
  | 'drug-registration'
  | 'drug-variation'
  | 'drug-confirmation'
  | 'device-registration'
  | 'device-variation'

export const STATUS_LABEL: Record<AppStatus, string> = {
  approved: 'Одобрено',
  action_required: 'Требуется действие',
  in_review: 'На проверке',
  remarks: 'Есть замечания',
  draft: 'Черновик',
}

export const PROCEDURE_LABEL: Record<ProcedureType, string> = {
  'drug-registration': 'Регистрация лекарственного препарата',
  'drug-variation': 'Внесение изменений в регистрационное досье',
  'drug-confirmation': 'Подтверждение государственной регистрации',
  'device-registration': 'Регистрация медицинского изделия',
  'device-variation': 'Внесение изменений в регистрацию МИ',
}

export const DEFAULT_PROCEDURE: Record<ProductKind, ProcedureType> = {
  drug: 'drug-registration',
  prosthesis: 'device-registration',
  equipment: 'device-registration',
}

/**
 * Кейс — одно будущее регистрационное удостоверение: один продукт или одно
 * семейство моделей одного изготовителя. Его содержание — порядок работ.
 */
export interface Application {
  id: string
  number: string
  product: string
  form: string
  kind: ProductKind
  country: string
  manufacturer: string
  sites: string
  procedure: ProcedureType
  registry: RegistryCheck
  works: WorkItem[]
  journal: JournalEntry[]
  /** Нормативный отрезок в рабочих днях: ядро считает его, а не календарную дату. */
  dueWorkingDays: number
  waitingFor: string
  expert: string
  updatedAt: string
  createdAt: string
  owner: string
}

/** Инициалы для аватара: имя приходит из личности, а не из сида. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
