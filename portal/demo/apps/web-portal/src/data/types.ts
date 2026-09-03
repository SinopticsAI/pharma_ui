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
  nextDue: string
  expert: string
  updatedAt: string
  createdAt: string
  owner: string
}

export interface AttentionItem {
  id: string
  applicationId: string
  title: string
  detail: string
  due: string
  severity: 'action' | 'remarks' | 'review'
}

export interface PortalDocument {
  id: string
  applicationId: string
  name: string
  kind: string
  version: string
  updatedAt: string
  status: 'актуален' | 'ожидает загрузки' | 'на редактуре'
}

export interface Certificate {
  id: string
  number: string
  product: string
  registry: string
  issuedOn: string
  validUntil: string
  status: 'действует' | 'ожидает записи' | 'истекает'
}

export interface Task {
  id: string
  title: string
  applicationId: string
  assignee: string
  due: string
  status: 'открыта' | 'в работе' | 'закрыта'
}

export interface Message {
  id: string
  from: string
  role: string
  applicationId: string
  preview: string
  at: string
  unread: boolean
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  at: string
  unread: boolean
  applicationId?: string
}

export const USER = {
  firstName: 'Ирина',
  lastName: 'Волкова',
  fullName: 'Ирина Волкова',
  initials: 'ИВ',
  role: 'Руководитель регистрационного портфеля',
  email: 'i.volkova@nordpharm.ru',
}

export const ORGANIZATION = {
  name: 'ООО «НордФарм»',
  inn: '7708123456',
  short: 'НордФарм',
}
