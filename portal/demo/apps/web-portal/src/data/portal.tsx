import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@demo/api-client'
import type { UploadRequest } from '@demo/api-client'
import type {
  CaseDetail,
  NodeMapItem,
  NodeOwner,
  RegistrationCase,
  StageKey,
} from '@demo/domain'
import { l10n, readPlaneEnabled } from '@demo/domain'
import type { Application } from './types'
import { DEFAULT_PROCEDURE } from './types'
import type { ProductKind, WorkItem, WorkStatus } from './work'
import { buildWorkPlan } from './work-plans'

/**
 * Порядок работ поверх карты кейса.
 *
 * Чеклисты, ссылки на государственные кабинеты и требования легализации —
 * статическая копия права из `work-plans.ts`. Состояние работы не хранится
 * здесь: оно проецируется из карты `M0`–`M12`, которую ведёт ядро. Так карта и
 * список задач не могут разойтись.
 */

/** Какой узел карты отвечает за работу порядка. */
const WORK_NODE: Record<string, string> = {
  '0.1': 'M0',
  '0.2': 'M0',
  '0.2.1': 'M0',
  '0.3.1': 'M0',
  '0.5': 'M1',
  '0.3': 'M2',
  '0.6': 'M2',
  '0.7': 'M2',
  '0.4': 'M3',
  '1': 'M4',
  '2': 'M4',
  '3': 'M5',
  '3.1': 'M5',
  '3.2': 'M7',
  '4': 'M8',
  '5': 'M8',
  '6': 'M9',
  '6.1': 'M10',
}

/** Стадия кейса из списка: карта приходит только в карточке. */
const STAGE_NODE: Record<StageKey, string> = {
  onboarding: 'M0',
  qualification: 'M0',
  case: 'M1',
  roadmap: 'M1',
  dossier: 'M2',
  samples: 'M4',
  filing: 'M8',
  expertise: 'M8',
  registry: 'M9',
  postreg: 'M12',
}

/** Узлы, у которых нет отдельной работы в порядке 0.1–6. */
export const NODES_WITHOUT_WORK = ['M6', 'M11', 'M12']

function nodeIndex(code: string): number {
  const value = Number.parseInt(code.replace(/^M/, ''), 10)
  return Number.isNaN(value) ? 99 : value
}

const OWNER_STATUS: Record<NodeOwner, WorkStatus> = {
  you: 'waiting_client',
  us: 'with_agent',
  contractor: 'in_review',
  gov: 'in_review',
}

function statusFromNode(node: NodeMapItem): WorkStatus {
  switch (node.status) {
    case 'done':
      return 'done'
    case 'in_progress':
      return OWNER_STATUS[node.owner]
    default:
      return 'not_started'
  }
}

/**
 * Работа без узла в карте не требуется по этому треку: инспекция `M7` для
 * класса 1 в карту не попадает, и работа 3.2 честно помечается ненужной.
 */
function projectFromNodeMap(works: WorkItem[], nodeMap: NodeMapItem[]): WorkItem[] {
  const byCode = new Map(nodeMap.map((node) => [node.code, node]))
  return works.map((work) => {
    const node = byCode.get(WORK_NODE[work.code] ?? '')
    if (!node) return { ...work, status: 'not_required' as WorkStatus }
    return { ...work, status: statusFromNode(node) }
  })
}

/** Список кейсов карту не отдаёт, поэтому статусы выводятся из стадии. */
function projectFromStage(works: WorkItem[], stage: StageKey): WorkItem[] {
  const current = nodeIndex(STAGE_NODE[stage])
  return works.map((work) => {
    const target = nodeIndex(WORK_NODE[work.code] ?? '')
    if (target < current) return { ...work, status: 'done' as WorkStatus }
    if (target === current) return { ...work, status: 'with_agent' as WorkStatus }
    return { ...work, status: 'not_started' as WorkStatus }
  })
}

/**
 * У кейса ядра нет разделения протеза и оборудования: это свойство продукта,
 * а не будущего удостоверения. Изделие ведём по треку оборудования.
 */
function productKind(kind: RegistrationCase['kind']): ProductKind {
  return kind === 'drug' ? 'drug' : 'equipment'
}

function toApplication(card: RegistrationCase, nodeMap?: NodeMapItem[]): Application {
  const kind = productKind(card.kind)
  const plan = buildWorkPlan(kind)
  const works = nodeMap && nodeMap.length > 0 ? projectFromNodeMap(plan, nodeMap) : projectFromStage(plan, card.currentStage)

  return {
    id: card.id,
    number: card.code,
    product: l10n(card.product, card.code).ru,
    form: '',
    kind,
    country: '',
    manufacturer: l10n(card.manufacturer).ru,
    sites: '',
    procedure: DEFAULT_PROCEDURE[kind],
    registry: { status: 'pending', sources: [] },
    works,
    journal: [],
    dueWorkingDays: card.dueWorkingDays,
    waitingFor: l10n(card.waitingFor).ru,
    expert: '',
    updatedAt: card.startedOn,
    createdAt: card.startedOn,
    owner: '',
  }
}

export const useCases = () => {
  const api = useApi()
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => (await api.listCases()).map((card) => toApplication(card)),
  })
}

export interface CaseView {
  application: Application
  detail: CaseDetail
}

export const useCase = (caseId: string) => {
  const api = useApi()
  return useQuery({
    queryKey: ['case', caseId],
    queryFn: async (): Promise<CaseView> => {
      const detail = await api.getCase(caseId)
      return { application: toApplication(detail.case, detail.nodeMap), detail }
    },
    enabled: Boolean(caseId),
  })
}

export const useCaseItems = (caseId: string) => {
  const api = useApi()
  return useQuery({
    queryKey: ['case-items', caseId],
    queryFn: () => api.listCaseItems(caseId),
    enabled: Boolean(caseId),
  })
}

/** Карточка продукта: значения распознал агент, источник обязателен. */
export const useProductDraft = (productId: string) => {
  const api = useApi()
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
    enabled: Boolean(productId),
  })
}

export const useRegistryLookup = (query: string, source: 'elk' | 'grls') => {
  const api = useApi()
  return useQuery({
    queryKey: ['registry', source, query],
    queryFn: () => api.searchRegistry(query, source),
    enabled: query.trim().length > 2,
  })
}

/** Файл уходит в хранилище по presigned URL, кабинет держит только метаданные. */
export const useUploadDossierItem = (caseId: string) => {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, itemType, title }: { file: File; itemType: string; title: string }) => {
      const usePlane = readPlaneEnabled()
      const request: UploadRequest = {
        itemType,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        title,
      }
      const ticket = await api.requestDossierUploadUrl(caseId, request)
      await api.putFile(ticket, file)
      const item = await api.confirmDossierUpload(caseId, ticket.itemId, { usePlane })
      if (usePlane) {
        try {
          await api.startCase(caseId)
        } catch {
          // Edge уже стартовал на confirm, или Plane недоступен — файл всё равно лежит.
        }
      }
      return item
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['case-items', caseId] }),
  })
}
