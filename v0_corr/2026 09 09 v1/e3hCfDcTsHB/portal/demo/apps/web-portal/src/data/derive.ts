import type { AppStatus, Application } from './types'
import { currentWork, isClosed, workProgress, type WorkItem } from './work'

/** Статус кейса не хранится, а выводится из работ: одна точка истины. */
export function caseStatus(item: Application): AppStatus {
  const works = item.works
  if (works.some((work) => work.status === 'remarks')) return 'remarks'
  if (works.every((work) => isClosed(work))) return 'approved'

  const current = currentWork(works)
  if (!current) return 'in_review'
  if (current.code === '0.1' && current.status === 'not_started') return 'draft'
  if (current.status === 'waiting_client' || current.status === 'not_started') {
    return current.owner === 'hq' || current.owner === 'ru' ? 'action_required' : 'in_review'
  }
  return 'in_review'
}

export function nextStepLabel(item: Application): string {
  const current = currentWork(item.works)
  if (!current) return 'Все работы закрыты'
  return `${current.code}. ${current.title}`
}

export function caseProgress(item: Application): { done: number; total: number } {
  return workProgress(item.works)
}

export function findWork(item: Application, code: string): WorkItem | undefined {
  return item.works.find((work) => work.code === code)
}

/** Работы, которые ждут действия клиента или агента: основа раздела «Задачи». */
export function openWorks(item: Application): WorkItem[] {
  return item.works.filter((work) => work.status === 'waiting_client' || work.status === 'with_agent' || work.status === 'remarks')
}
