import { useQuery } from '@tanstack/react-query'
import { getCase, getMandateFull, listAudit, listCases, listDocuments, listLedger, listStatuses } from '@demo/mock'

export const useCases = () => useQuery({ queryKey: ['cases'], queryFn: listCases })

export const useCase = (caseId: string) => useQuery({ queryKey: ['case', caseId], queryFn: () => getCase(caseId) })

export const useLedger = (caseId: string) =>
  useQuery({ queryKey: ['ledger', caseId], queryFn: () => listLedger(caseId) })

export const useStatuses = (caseId: string) =>
  useQuery({ queryKey: ['statuses', caseId], queryFn: () => listStatuses(caseId) })

export const useAudit = (caseId: string) => useQuery({ queryKey: ['audit', caseId], queryFn: () => listAudit(caseId) })

export const useDocuments = (caseId: string) =>
  useQuery({ queryKey: ['documents', caseId], queryFn: () => listDocuments(caseId) })

/** Только консоль оператора получает мандат вместе с ЕСИА, УКЭП и МЧД. */
export const useMandate = (caseId: string) =>
  useQuery({ queryKey: ['mandate-full', caseId], queryFn: () => getMandateFull(caseId) })
