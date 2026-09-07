import { describeError } from '@demo/api-client'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { DocumentsPanel } from '../intake/DocumentsPanel'
import { IntakeChat } from '../intake/IntakeChat'
import { RequisitesPanel } from '../intake/RequisitesPanel'
import { Callout, Empty, PageHeader } from '../kit'
import { extractionPending, useOpenIntakeSession, useOrganization, useOrganizationItems, useProduct } from '../queries'
import { Shell } from '../Shell'

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
  }, [current, ready])

  return { sessionId: current ?? openSession.data?.id ?? '', error: openSession.error }
}

export function IntakeCompanyPage() {
  const { organizationId } = useParams({ from: '/intake/company/$organizationId' })
  const { session } = useSearch({ from: '/intake/company/$organizationId' })
  const { t, text } = useI18n()
  // Реквизиты дописывает разбор документов, поэтому карточка перечитывается,
  // пока хотя бы по одному документу ядро ещё ждёт ответа от Plane.
  const items = useOrganizationItems(organizationId)
  const organization = useOrganization(organizationId, extractionPending(items.data))
  const { sessionId, error } = useSessionId(session, { scope: 'organization', organizationId })

  const company = organization.data
  const completeness = company?.completeness
  const listed = Array.isArray(items.data) ? items.data : []
  const companyDocuments = listed.filter((item) => item.level === 'company')

  return (
    <Shell nav={null}>
      <PageHeader
        title={t('intake.company.title')}
        lead={
          company
            ? `${text(l10n(company.name, organizationId)).value}. ${t('intake.company.leadNamed')}`
            : t('intake.company.lead')
        }
      />
      {error ? <Callout tone="deadline">{describeError(error)}</Callout> : null}
      {organization.isError ? <Callout tone="deadline">{describeError(organization.error)}</Callout> : null}
      {!sessionId ? (
        <Empty>{t('common.loading')}</Empty>
      ) : (
        <>
          <IntakeChat
            agentId="companyIntake"
            sessionId={sessionId}
            organizationId={organizationId}
            title={t('intake.company.profileTitle')}
            sections={completeness?.sections ?? []}
            percent={completeness?.percent ?? 0}
            aside={
              <>
                <RequisitesPanel
                  scope="company"
                  draft={company?.draft}
                  profile={company?.profile}
                  approved={company?.status === 'profile_approved'}
                />
                {items.isError ? <Callout tone="deadline">{describeError(items.error)}</Callout> : null}
                <DocumentsPanel
                  organizationId={organizationId}
                  items={companyDocuments}
                  title="intake.documents.companyTitle"
                />
              </>
            }
          />
        </>
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
  // Ядро отдаёт вместе с продуктом и его документы, и документы компании:
  // второй запрос за инвентарём здесь не нужен.
  const documents = card?.documents ?? []
  const ownDocuments = documents.filter((item) => item.level === 'product')
  const inheritedDocuments = documents.filter((item) => item.level === 'company')

  return (
    <Shell nav={null}>
      <PageHeader
        title={t('intake.product.title')}
        lead={
          card
            ? `${text(l10n(card.name, productId)).value}. ${t('intake.product.leadNamed')}`
            : t('intake.product.lead')
        }
      />
      {error ? <Callout tone="deadline">{describeError(error)}</Callout> : null}
      {product.isError ? <Callout tone="deadline">{describeError(product.error)}</Callout> : null}
      {!sessionId || !organizationId ? (
        <Empty>{t('common.loading')}</Empty>
      ) : (
        <>
          <IntakeChat
            agentId="productIntake"
            sessionId={sessionId}
            organizationId={organizationId}
            productId={productId}
            title={t('intake.product.completenessTitle')}
            sections={[]}
            missing={card?.missing ?? []}
            percent={card?.completeness ?? 0}
            aside={
              <>
                <RequisitesPanel scope="product" draft={card?.draft} />
                <DocumentsPanel
                  organizationId={organizationId}
                  items={ownDocuments}
                  title="intake.documents.productTitle"
                  canPromote
                />
                <DocumentsPanel
                  organizationId={organizationId}
                  items={inheritedDocuments}
                  title="intake.documents.inheritedTitle"
                  lead="intake.documents.inheritedLead"
                />
              </>
            }
          />
        </>
      )}
    </Shell>
  )
}
