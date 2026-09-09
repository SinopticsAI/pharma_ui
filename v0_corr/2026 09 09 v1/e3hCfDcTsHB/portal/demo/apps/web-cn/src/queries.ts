import type { ApproveProductInput, UploadRequest } from '@demo/api-client'
import { OFFLINE_DEMO, useApi } from '@demo/api-client'
import type { IntakeScope, Locale } from '@demo/domain'
import { readPlaneEnabled } from '@demo/domain'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  demoCaseDetail,
  demoCaseItems,
  demoChat,
  demoDocuments,
  demoLedger,
  demoStatuses,
  getDemoOrganization,
  getDemoProduct,
  listDemoOrganizations,
  listDemoProducts,
} from './demo/catalog'
import { useDemo } from './demo/context'
import { isDemoId } from './demo/ids'
import { isExtractionPending } from './intake/extractionStatus'

/**
 * Чтения идут в ядро. Идентификаторы `demo-*` не зовут API: это walkthrough
 * MH-200, явно помеченный как иллюстрация.
 */

/**
 * Разбор документа асинхронный: без галочки кабинет зовёт POST /extract,
 * с галочкой Edge стартует Plane. Экрану об этом никто не сообщает, поэтому
 * пока есть неразобранный документ, чтения повторяются сами.
 */
const EXTRACTION_POLL_MS = 10_000

/** Разбор идёт: только uploaded/confirmed, и только до потолка. */
export const extractionPending = isExtractionPending

const pollWhile = (pending: boolean) => (pending ? EXTRACTION_POLL_MS : false)

function mergeById<T extends { id: string }>(demo: T[], live: T[] | undefined): T[] {
  const rows = live ?? []
  const ids = new Set(rows.map((row) => row.id))
  return [...demo.filter((row) => !ids.has(row.id)), ...rows]
}

/**
 * Витрина без ядра: списочные хуки всё равно зовут API, и в offline он
 * отвечает 404. Demo-строки уже подставлены через mergeById, поэтому ошибку
 * и состояние загрузки здесь гасим — экран показывает готовые demo-данные.
 */
function quietOffline<T extends { isError: boolean; isLoading: boolean; error: unknown }>(query: T): T {
  if (!OFFLINE_DEMO) return query
  return { ...query, isError: false, isLoading: false, error: null }
}

export const useOrganizations = () => {
  const api = useApi()
  const { state } = useDemo()
  const live = useQuery({ queryKey: ['organizations'], queryFn: () => api.listOrganizations() })
  return quietOffline({
    ...live,
    isLoading: live.isLoading && !live.data,
    data: mergeById(listDemoOrganizations(state), live.data),
  })
}

export const useOrganization = (organizationId: string, awaitingExtraction = false) => {
  const api = useApi()
  const { state } = useDemo()
  const demo = isDemoId(organizationId)
  const live = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: () => api.getOrganization(organizationId),
    enabled: Boolean(organizationId) && !demo,
    refetchInterval: pollWhile(awaitingExtraction && !demo),
  })
  if (demo) {
    return { ...live, data: getDemoOrganization(organizationId, state), isLoading: false, isError: false, error: null }
  }
  return quietOffline(live)
}

/** Документы интейка компании: и её собственные, и документы её продуктов. */
export const useOrganizationItems = (organizationId: string) => {
  const api = useApi()
  const demo = isDemoId(organizationId)
  const live = useQuery({
    queryKey: ['organization-items', organizationId],
    queryFn: () => api.listOrganizationItems(organizationId),
    enabled: Boolean(organizationId) && !demo,
    refetchInterval: (query) => pollWhile(!demo && extractionPending(query.state.data)),
  })
  if (demo) {
    const items = organizationId.includes('ruikang')
      ? demoDocuments().filter((item) => item.itemType === 'business-license' || item.itemType === 'iso-13485')
      : demoDocuments()
    return { ...live, data: items, isLoading: false, isError: false, error: null }
  }
  return quietOffline(live)
}

/** Продукты всех компаний аккаунта: главная показывает их одним списком. */
export const useAllProducts = (organizationIds: string[]) => {
  const api = useApi()
  const { state } = useDemo()
  const liveIds = organizationIds.filter((id) => !isDemoId(id))
  const live = useQuery({
    queryKey: ['products', ...liveIds],
    queryFn: async () => {
      const lists = await Promise.all(liveIds.map((id) => api.listProducts(id)))
      return lists.flat()
    },
    enabled: liveIds.length > 0,
  })
  return quietOffline({
    ...live,
    isLoading: liveIds.length > 0 && live.isLoading,
    data: mergeById(listDemoProducts(state), live.data),
  })
}

export const useProduct = (productId: string) => {
  const api = useApi()
  const { state } = useDemo()
  const demo = isDemoId(productId)
  const live = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
    enabled: Boolean(productId) && !demo,
    refetchInterval: (query) => pollWhile(!demo && extractionPending(query.state.data?.documents)),
  })
  if (demo) {
    return { ...live, data: getDemoProduct(productId, state), isLoading: false, isError: false, error: null }
  }
  return quietOffline(live)
}

export const useCases = () => {
  const api = useApi()
  const live = useQuery({ queryKey: ['cases'], queryFn: () => api.listCases() })
  return quietOffline({
    ...live,
    isLoading: live.isLoading && !live.data,
    data: mergeById([demoCaseDetail().case], live.data),
  })
}

/** Карточка кейса вместе с картой M0–M12, мандатом и критическим узлом. */
export const useCase = (caseId: string) => {
  const api = useApi()
  const demo = isDemoId(caseId)
  const live = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => api.getCase(caseId),
    enabled: Boolean(caseId) && !demo,
  })
  if (demo) {
    return { ...live, data: demoCaseDetail(), isLoading: false, isError: false, error: null }
  }
  return quietOffline(live)
}

export const useCaseItems = (caseId: string) => {
  const api = useApi()
  const demo = isDemoId(caseId)
  const live = useQuery({
    queryKey: ['case-items', caseId],
    queryFn: () => api.listCaseItems(caseId),
    enabled: Boolean(caseId) && !demo,
  })
  if (demo) return { ...live, data: demoCaseItems(), isLoading: false, isError: false, error: null }
  return quietOffline(live)
}

export const useStatuses = (caseId: string) => {
  const api = useApi()
  const demo = isDemoId(caseId)
  const live = useQuery({
    queryKey: ['statuses', caseId],
    queryFn: () => api.listStatuses(caseId),
    enabled: Boolean(caseId) && !demo,
  })
  if (demo) return { ...live, data: demoStatuses(), isLoading: false, isError: false, error: null }
  return quietOffline(live)
}

export const useLedger = (caseId: string) => {
  const api = useApi()
  const demo = isDemoId(caseId)
  const live = useQuery({
    queryKey: ['ledger', caseId],
    queryFn: () => api.listLedger(caseId),
    enabled: Boolean(caseId) && !demo,
  })
  if (demo) return { ...live, data: demoLedger(), isLoading: false, isError: false, error: null }
  return quietOffline(live)
}

export const useChat = (caseId: string) => {
  const api = useApi()
  const demo = isDemoId(caseId)
  const live = useQuery({
    queryKey: ['chat', caseId],
    queryFn: () => api.listChat(caseId),
    enabled: Boolean(caseId) && !demo,
  })
  if (demo) return { ...live, data: demoChat(), isLoading: false, isError: false, error: null }
  return quietOffline(live)
}

export const useIntakeMessages = (sessionId: string) => {
  const api = useApi()
  return useQuery({
    queryKey: ['intake-messages', sessionId],
    queryFn: () => api.listIntakeMessages(sessionId),
    enabled: Boolean(sessionId),
  })
}

// -------------------------------------------------------------------- записи --

export const useCreateOrganization = () => {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name?: string }) => api.createOrganization(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  })
}

export const useCreateProduct = () => {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, name }: { organizationId: string; name?: string }) =>
      api.createProduct(organizationId, { name }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export const useOpenIntakeSession = () => {
  const api = useApi()
  return useMutation({
    mutationFn: (input: { scope: IntakeScope; organizationId?: string; productId?: string; locale?: Locale }) =>
      api.createIntakeSession(input),
  })
}

/**
 * Документ интейка грузит адаптер вложений чата (`intake/attachments.ts`):
 * файл живёт в нити диалога, поэтому отдельной мутации на загрузку у экранов
 * интейка нет. Просмотр и подъём документа — обычные действия человека.
 */

/** Ссылка живёт час, поэтому запрашивается в момент клика, а не заранее. */
export const useOrgItemDownloadUrl = (organizationId: string) => {
  const api = useApi()
  return useMutation({
    mutationFn: (itemId: string) => api.requestOrgItemDownloadUrl(organizationId, itemId),
    onSuccess: (ticket) => {
      window.open(ticket.url, '_blank', 'noopener,noreferrer')
    },
  })
}

/** Документ продукта оказался документом компании: его увидят все продукты. */
export const usePromoteOrgItem = (organizationId: string) => {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => api.promoteOrgItem(organizationId, itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization-items', organizationId] })
      void queryClient.invalidateQueries({ queryKey: ['organization', organizationId] })
      // Документ уходит с уровня продукта, поэтому карточки продуктов устарели.
      void queryClient.invalidateQueries({ queryKey: ['product'] })
    },
  })
}

/** Профиль одобряет человек. Ядро проверит полноту и вердикт по рискам. */
export const useApproveCompanyProfile = (organizationId: string) => {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.patchOrganization(organizationId, { status: 'profile_approved' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization', organizationId] })
      void queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}

export const useApproveProductData = (productId: string) => {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.patchProduct(productId, { status: 'data_approved' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['product', productId] }),
  })
}

/** Клиентское утверждение классификации: специалист подтвердил её раньше. */
export const useApproveProduct = (productId: string) => {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ApproveProductInput) => api.approveProduct(productId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product', productId] })
      void queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

/**
 * Загрузка документа досье: presigned PUT в хранилище, затем подтверждение.
 * Содержимое файла через кабинет не проходит.
 */
export const useUploadDossierItem = (caseId: string) => {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, itemType }: { file: File; itemType: string }) => {
      const usePlane = readPlaneEnabled()
      const request: UploadRequest = {
        itemType,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        title: file.name,
      }
      const ticket = await api.requestDossierUploadUrl(caseId, request)
      await api.putFile(ticket, file)
      const item = await api.confirmDossierUpload(caseId, ticket.itemId, { usePlane })
      if (usePlane) {
        try {
          await api.startCase(caseId)
        } catch {
          // Edge уже стартовал на confirm, или Plane недос��упен — файл всё равно лежит.
        }
      }
      return item
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['case-items', caseId] }),
  })
}
