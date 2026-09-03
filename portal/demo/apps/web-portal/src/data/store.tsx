import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { APPLICATIONS, FEATURED_ID } from './seed'
import { DEFAULT_PROCEDURE, type Application } from './types'
import { buildWorkPlan } from './work-plans'
import type { ProductKind, RegistryStatus, WorkItem, WorkStatus } from './work'
import { USER } from './types'

export interface NewCaseInput {
  product: string
  form: string
  kind: ProductKind
  country: string
  manufacturer: string
  sites: string
}

export interface RegistryResultInput {
  status: RegistryStatus
  number: string
  holder: string
  models: string
}

interface PortalStore {
  applications: Application[]
  addApplication: (input: NewCaseInput) => Application
  setWorkStatus: (caseId: string, code: string, status: WorkStatus) => void
  confirmWork: (caseId: string, code: string, actor: string) => void
  addSlotFile: (caseId: string, code: string, slotId: string, fileName: string) => void
  setWorkField: (caseId: string, code: string, fieldId: string, value: string) => void
  setWorkRemark: (caseId: string, code: string, remark: string) => void
  applyRegistryResult: (caseId: string, input: RegistryResultInput) => void
  resetDemo: () => void
}

const StoreContext = createContext<PortalStore | null>(null)

const now = () => new Date().toISOString().slice(0, 19)

const STORAGE_KEY = 'pharma-portal-cases-v2'

/** Состояние переживает перезагрузку страницы: демо не теряет введённое. */
function loadCases(): Application[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Application[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // Повреждённое состояние демо не должно ронять кабинет.
  }
  return APPLICATIONS
}

function nextNumber(list: Application[]): string {
  const numbers = list.map((item) => Number(item.number.split('-')[2] ?? '0'))
  const max = numbers.reduce((acc, value) => Math.max(acc, value), 148)
  return `CERT-2026-${String(max + 1).padStart(4, '0')}`
}

export function PortalStoreProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<Application[]>(loadCases)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications))
    } catch {
      // Приватный режим браузера: демо продолжает работать в памяти вкладки.
    }
  }, [applications])

  /** Любая правка проходит через журнал: история остаётся у клиента. */
  const patchCase = useCallback(
    (caseId: string, action: string, workCode: string | undefined, update: (item: Application) => Application) => {
      setApplications((previous) =>
        previous.map((item) => {
          if (item.id !== caseId) return item
          const updated = update(item)
          return {
            ...updated,
            updatedAt: now(),
            journal: [
              {
                id: `j-${Math.random().toString(36).slice(2, 9)}`,
                at: now(),
                actor: USER.fullName,
                action,
                workCode,
              },
              ...updated.journal,
            ],
          }
        }),
      )
    },
    [],
  )

  const patchWork = useCallback(
    (caseId: string, code: string, action: string, update: (work: WorkItem) => WorkItem) => {
      patchCase(caseId, action, code, (item) => ({
        ...item,
        works: item.works.map((work) => (work.code === code ? update(work) : work)),
      }))
    },
    [patchCase],
  )

  const value = useMemo<PortalStore>(
    () => ({
      applications,

      addApplication: (input) => {
        const created: Application = {
          id: `case-${Date.now()}`,
          number: nextNumber(applications),
          product: input.product,
          form: input.form,
          kind: input.kind,
          country: input.country,
          manufacturer: input.manufacturer,
          sites: input.sites,
          procedure: DEFAULT_PROCEDURE[input.kind],
          registry: { status: 'pending', sources: [] },
          works: buildWorkPlan(input.kind).map((work) =>
            work.code === '0.1'
              ? {
                  ...work,
                  status: 'done',
                  fields: work.fields.map((field) => {
                    if (field.id === 'name') return { ...field, value: input.product }
                    if (field.id === 'kind') return { ...field, value: input.kind }
                    if (field.id === 'country') return { ...field, value: input.country }
                    if (field.id === 'manufacturer') return { ...field, value: input.manufacturer }
                    if (field.id === 'sites') return { ...field, value: input.sites }
                    return field
                  }),
                }
              : work.code === '0.2'
                ? { ...work, status: 'waiting_client' }
                : work,
          ),
          journal: [
            {
              id: `j-${Math.random().toString(36).slice(2, 9)}`,
              at: now(),
              actor: USER.fullName,
              action: 'journal.caseCreated',
              workCode: '0.1',
            },
          ],
          nextDue: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          expert: '',
          updatedAt: now(),
          createdAt: now(),
          owner: USER.fullName,
        }
        setApplications((previous) => [created, ...previous])
        return created
      },

      setWorkStatus: (caseId, code, status) => {
        patchWork(caseId, code, `journal.statusChanged|${status}`, (work) => ({
          ...work,
          status,
        }))
      },

      confirmWork: (caseId, code, actor) => {
        patchWork(caseId, code, `journal.workConfirmed|${actor}`, (work) => ({
          ...work,
          status: 'done',
          agentConfirmedBy: actor,
          agentConfirmedAt: now(),
          remark: undefined,
        }))
      },

      addSlotFile: (caseId, code, slotId, fileName) => {
        patchWork(caseId, code, `journal.fileUploaded|${fileName}`, (work) => ({
          ...work,
          status: work.status === 'not_started' ? 'waiting_client' : work.status,
          slots: work.slots.map((slot) =>
            slot.id === slotId
              ? { ...slot, files: [...slot.files, { name: fileName, uploadedBy: USER.fullName, at: now() }] }
              : slot,
          ),
        }))
      },

      setWorkField: (caseId, code, fieldId, value) => {
        patchWork(caseId, code, `journal.fieldChanged|${fieldId}|${value || '—'}`, (work) => ({
          ...work,
          fields: work.fields.map((field) => (field.id === fieldId ? { ...field, value } : field)),
        }))
      },

      setWorkRemark: (caseId, code, remark) => {
        patchWork(caseId, code, remark ? `journal.remarkSet|${remark}` : 'journal.remarkCleared', (work) => ({
          ...work,
          status: remark ? 'remarks' : 'waiting_client',
          remark: remark || undefined,
        }))
      },

      resetDemo: () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY)
        } catch {
          // Достаточно вернуть состояние в памяти.
        }
        setApplications(APPLICATIONS)
      },

      applyRegistryResult: (caseId, input) => {
        const found = input.status === 'found'
        patchCase(
          caseId,
          found ? `journal.registryFound|${input.number || ''}` : 'journal.registryNotFound',
          '0.2.1',
          (item) => {
            const registryIndex = item.works.findIndex((work) => work.code === '0.2.1')
            return {
              ...item,
              registry: {
                status: input.status,
                sources: item.kind === 'drug' ? ['ГРЛС'] : ['Реестр медицинских изделий', 'ГРЛС'],
                number: input.number,
                holder: input.holder,
                models: input.models,
                checkedAt: now(),
                checkedBy: USER.fullName,
              },
              works: item.works.map((work, index) => {
                if (work.code === '0.2.1') {
                  return {
                    ...work,
                    status: 'done',
                    fields: work.fields.map((field) => {
                      if (field.id === 'result') return { ...field, value: found ? 'найден' : 'не найден' }
                      if (field.id === 'number') return { ...field, value: input.number }
                      if (field.id === 'holder') return { ...field, value: input.holder }
                      if (field.id === 'models') return { ...field, value: input.models }
                      return field
                    }),
                  }
                }
                if (index > registryIndex) {
                  // Продукт уже в реестре: новая подача не нужна, кейс идёт в сопровождение.
                  return { ...work, status: found ? 'not_required' : 'not_started' }
                }
                return work
              }),
            }
          },
        )
      },
    }),
    [applications, patchCase, patchWork],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function usePortalStore(): PortalStore {
  const value = useContext(StoreContext)
  if (!value) throw new Error('usePortalStore вызван вне PortalStoreProvider')
  return value
}

export function useApplication(id: string): Application | undefined {
  return usePortalStore().applications.find((item) => item.id === id)
}

export { FEATURED_ID }
