import type { ApproveProductInput, UploadRequest } from '@demo/api-client'
import { useApi } from '@demo/api-client'
import type { IntakeScope, ItemStatus, Locale } from '@demo/domain'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Все чтения идут в ядро кабинета. Мока нет: пустой портфель на пустой базе —
 * это ответ ядра, а не поломка экрана.
 */

/**
 * Разбор документа асинхронный: браузер подтверждает загрузку, дальше Plane
 * читает скан и присылает вебхук в ядро. Экрану об этом никто не сообщает,
 * поэтому пока есть неразобранный документ, чтения повторяются сами.
 */
const EXTRACTION_POLL_MS = 10_000
const SETTLED_ITEM_STATUSES: ItemStatus[] = ['parsed', 'rejected']

const isSettled = (item: { status: ItemStatus }) => SETTLED_ITEM_STATUSES.includes(item.status)

/** Разбор идёт: есть хотя бы один документ, по которому ядро ещё ждёт ответа. */
export const extractionPending = (items: { status: ItemStatus }[] | undefined): boolean =>
  Boolean(items?.some((item) => !isSettled(item)))

const pollWhile = (pending: boolean) => (pending ? EXTRACTION_POLL_MS : false)

export const useOrganizations = () => {
  const api = useApi()
  return useQuery({ queryKey: ['organizations'], queryFn: () => api.listOrganizations() })
}

export const useOrganization = (organizationId: string, awaitingExtraction = false) => {
  const api = useApi()
  return useQuery({
    queryKey: ['organization', organizationId],
    queryFn: () => api.getOrganization(organizationId),
    enabled: Boolean(organizationId),
    // Реквизиты и комплектность меняет вебхук Plane, а не действие человека.
    refetchInterval: pollWhile(awaitingExtraction),
  })
}

/** Документы интейка компании: и её собственные, и документы её продуктов. */
export const useOrganizationItems = (organizationId: string) => {
  const api = useApi()
  return useQuery({
    queryKey: ['organization-items', organizationId],
    queryFn: () => api.listOrganizationItems(organizationId),
    enabled: Boolean(organizationId),
    refetchInterval: (query) => pollWhile(extractionPending(query.state.data)),
  })
}

/** Продукты всех компаний аккаунта: главная показывает их одним списком. */
export const useAllProducts = (organizationIds: string[]) => {
  const api = useApi()
  return useQuery({
    queryKey: ['products', ...organizationIds],
    queryFn: async () => {
      const lists = await Promise.all(organizationIds.map((id) => api.listProducts(id)))
      return lists.flat()
    },
    enabled: organizationIds.length > 0,
  })
}

export const useProduct = (productId: string) => {
  const api = useApi()
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
    enabled: Boolean(productId),
    // Черновик и комплектность продукта дописывает разбор документов.
    refetchInterval: (query) => pollWhile(extractionPending(query.state.data?.documents)),
  })
}

export const useCases = () => {
  const api = useApi()
  return useQuery({ queryKey: ['cases'], queryFn: () => api.listCases() })
}

/** Карточка кейса вместе с картой M0–M12, мандатом и критическим узлом. */
export const useCase = (caseId: string) => {
  const api = useApi()
  return useQuery({
    queryKey: ['case', caseId],
    queryFn: () => api.getCase(caseId),
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

export const useStatuses = (caseId: string) => {
  const api = useApi()
  return useQuery({
    queryKey: ['statuses', caseId],
    queryFn: () => api.listStatuses(caseId),
    enabled: Boolean(caseId),
  })
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
      const request: UploadRequest = {
        itemType,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        title: file.name,
      }
      const ticket = await api.requestDossierUploadUrl(caseId, request)
      await api.putFile(ticket, file)
      return api.confirmDossierUpload(caseId, ticket.itemId)
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['case-items', caseId] }),
  })
}
