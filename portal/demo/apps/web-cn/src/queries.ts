import { useQuery } from '@tanstack/react-query'
import {
  getCase,
  getMandateSteps,
  listCases,
  listChat,
  listDocuments,
  listLedger,
  listRoadmap,
  listStatuses,
} from '@demo/mock'

export const useCases = () => useQuery({ queryKey: ['cases'], queryFn: listCases })

export const useCase = (caseId: string) => useQuery({ queryKey: ['case', caseId], queryFn: () => getCase(caseId) })

export const useRoadmap = (caseId: string) =>
  useQuery({ queryKey: ['roadmap', caseId], queryFn: () => listRoadmap(caseId) })

export const useDocuments = (caseId: string) =>
  useQuery({ queryKey: ['documents', caseId], queryFn: () => listDocuments(caseId) })

export const useLedger = (caseId: string) =>
  useQuery({ queryKey: ['ledger', caseId], queryFn: () => listLedger(caseId) })

export const useStatuses = (caseId: string) =>
  useQuery({ queryKey: ['statuses', caseId], queryFn: () => listStatuses(caseId) })

export const useChat = (caseId: string) => useQuery({ queryKey: ['chat', caseId], queryFn: () => listChat(caseId) })

/** Кабинет производителя запрашивает только шаги мандата, без криптосущностей. */
export const useMandateSteps = (caseId: string) =>
  useQuery({ queryKey: ['mandate-steps', caseId], queryFn: () => getMandateSteps(caseId) })
