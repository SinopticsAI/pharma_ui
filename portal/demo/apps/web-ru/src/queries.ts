import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@demo/api-client'
import type { AddStatusInput, ApproveProductInput } from '@demo/api-client'

/** Консоль и кабинет читают одну базу: синхронизация вкладок больше не нужна. */

export const useCases = () => {
  const api = useApi()
  return useQuery({ queryKey: ['cases'], queryFn: () => api.listCases() })
}

export const useCase = (caseId: string) => {
  const api = useApi()
  return useQuery({
    queryKey: ['case', caseId],
    queryFn: () => api.getCase(caseId),
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

export const useCaseItems = (caseId: string) => {
  const api = useApi()
  return useQuery({
    queryKey: ['case-items', caseId],
    queryFn: () => api.listCaseItems(caseId),
    enabled: Boolean(caseId),
  })
}

export const useOrganizations = () => {
  const api = useApi()
  return useQuery({ queryKey: ['organizations'], queryFn: () => api.listOrganizations() })
}

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
  })
}

/** Реестр — источник истины по номерам, а ответ ядра лишь кэш. */
export const useRegistrySearch = (query: string, source: 'elk' | 'grls') => {
  const api = useApi()
  return useQuery({
    queryKey: ['registry', source, query],
    queryFn: () => api.searchRegistry(query, source),
    enabled: query.trim().length > 2,
  })
}

/**
 * Статус вносит человек и прикладывает артефакт. Коннекторы к госкабинетам
 * появятся позже и подменят источник данных, а не экран.
 */
export const useAddStatus = (caseId: string) => {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AddStatusInput) => api.addStatus(caseId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['statuses', caseId] })
      void queryClient.invalidateQueries({ queryKey: ['case', caseId] })
      void queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

/** Специалист подтверждает классификацию первым и обязан выбрать вариант. */
export const useApproveClassification = (productId: string) => {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ApproveProductInput) => api.approveProduct(productId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product', productId] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}
