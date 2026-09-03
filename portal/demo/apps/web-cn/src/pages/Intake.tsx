import { useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { describeError } from '@demo/api-client'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Callout, Empty, PageHeader } from '@demo/ui'
import { Shell } from '../Shell'
import { IntakeChat } from '../intake/IntakeChat'
import { useOpenIntakeSession, useOrganization, useProduct } from '../queries'

/**
 * Диалог интейка.
 *
 * Идентификатор сессии живёт в адресе: у ядра нет маршрута «найди диалог по
 * компании», а новая сессия на каждый визит теряла бы нить. Поэтому при
 * отсутствии `session` он создаётся один раз и подставляется в URL.
 */
function useSessionId(
  current: string | undefined,
  input: { scope: 'organization' | 'product'; organizationId?: string; productId?: string },
): { sessionId: string; error: unknown } {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const openSession = useOpenIntakeSession()
  const ready = Boolean(input.organizationId || input.productId)
  // Двойной прогон эффекта в StrictMode иначе открыл бы две сессии.
  const requested = useRef(false)

  useEffect(() => {
    if (current || !ready || requested.current) return
    requested.current = true
    openSession
      .mutateAsync({ ...input, locale })
      .then((session) => navigate({ to: '.', search: { session: session.id }, replace: true }))
      .catch(() => {
        requested.current = false
      })
    // Сессия открывается один раз на сущность: перезапуск по смене локали не нужен.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, ready])

  return { sessionId: current ?? openSession.data?.id ?? '', error: openSession.error }
}

export function IntakeCompanyPage() {
  const { organizationId } = useParams({ from: '/intake/company/$organizationId' })
  const { session } = useSearch({ from: '/intake/company/$organizationId' })
  const { t, text } = useI18n()
  const organization = useOrganization(organizationId)
  const { sessionId, error } = useSessionId(session, { scope: 'organization', organizationId })

  const company = organization.data
  const completeness = company?.completeness

  return (
    <Shell nav={null}>
      <PageHeader
        title="Регистрация компании"
        lead={
          company
            ? `${text(l10n(company.name, organizationId)).value}. Диалог с агентом примерно на 15 минут: он заполнит профиль по вашим документам.`
            : 'Диалог с агентом примерно на 15 минут. Он заполнит профиль по вашим документам.'
        }
      />
      {error ? <Callout tone="deadline">{describeError(error)}</Callout> : null}
      {organization.isError ? <Callout tone="deadline">{describeError(organization.error)}</Callout> : null}
      {!sessionId ? (
        <Empty>{t('common.loading')}</Empty>
      ) : (
        <IntakeChat
          agentId="companyIntake"
          sessionId={sessionId}
          organizationId={organizationId}
          title="Профиль компании"
          sections={completeness?.sections ?? []}
          percent={completeness?.percent ?? 0}
        />
      )}
    </Shell>
  )
}

export function IntakeProductPage() {
  const { productId } = useParams({ from: '/intake/product/$productId' })
  const { session } = useSearch({ from: '/intake/product/$productId' })
  const { t, text } = useI18n()
  const product = useProduct(productId)
  const { sessionId, error } = useSessionId(session, { scope: 'product', productId })

  const card = product.data
  const organizationId = card?.organizationId ?? ''

  return (
    <Shell nav={null}>
      <PageHeader
        title="Новый продукт"
        lead={
          card
            ? `${text(l10n(card.name, productId)).value}. Документы компании уже подтянуты — повторно загружать их не нужно.`
            : 'Агент соберёт данные, предложит классификацию и построит карту процесса.'
        }
      />
      {error ? <Callout tone="deadline">{describeError(error)}</Callout> : null}
      {product.isError ? <Callout tone="deadline">{describeError(product.error)}</Callout> : null}
      {!sessionId || !organizationId ? (
        <Empty>{t('common.loading')}</Empty>
      ) : (
        <IntakeChat
          agentId="productIntake"
          sessionId={sessionId}
          organizationId={organizationId}
          productId={productId}
          title="Комплектность продукта"
          sections={[]}
          missing={card?.missing ?? []}
          percent={card?.completeness ?? 0}
        />
      )}
    </Shell>
  )
}
