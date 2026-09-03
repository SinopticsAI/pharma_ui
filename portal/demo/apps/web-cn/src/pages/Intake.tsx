import { useMemo } from 'react'
import { useParams } from '@tanstack/react-router'
import { PageHeader } from '@demo/ui'
import { mockCompanies, openIntakeSession, type ProgressSection } from '@demo/mock'
import { Shell } from '../Shell'
import { IntakeChat } from '../intake/IntakeChat'

const EMPTY_SECTIONS: ProgressSection[] = [
  { key: 'identity', filled: 0, total: 2 },
  { key: 'documents', filled: 0, total: 2 },
  { key: 'authority', filled: 0, total: 2 },
  { key: 'banking', filled: 0, total: 1 },
  { key: 'risk', filled: 0, total: 1 },
]

export function IntakeCompanyPage() {
  // Одна сессия на монтирование экрана: возврат в диалог продолжает её, а не
  // начинает заново.
  const sessionId = useMemo(() => openIntakeSession('company', 'org-new'), [])

  return (
    <Shell nav={null}>
      <PageHeader
        title="Регистрация компании"
        lead="Диалог с агентом примерно на 15 минут. Он заполнит профиль по вашим документам."
      />
      <IntakeChat
        agentId="companyIntake"
        sessionId={sessionId}
        title="Профиль компании"
        sections={EMPTY_SECTIONS}
      />
    </Shell>
  )
}

export function IntakeProductPage() {
  const { companyId } = useParams({ from: '/intake/product/$companyId' })
  const sessionId = useMemo(() => openIntakeSession('product', 'prd-new'), [])
  const company = mockCompanies().find((item) => item.id === companyId)

  return (
    <Shell nav={null}>
      <PageHeader
        title="Новый продукт"
        lead={
          company
            ? `Компания: ${company.name}. Её документы уже подтянуты — повторно загружать не нужно.`
            : 'Агент соберёт данные, предложит классификацию и построит карту процесса.'
        }
      />
      <IntakeChat
        agentId="productIntake"
        sessionId={sessionId}
        title="Комплектность продукта"
        sections={company?.sections ?? EMPTY_SECTIONS}
      />
    </Shell>
  )
}
