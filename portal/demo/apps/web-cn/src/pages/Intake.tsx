import { ApiError, describeError, useApi } from '@demo/api-client'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CabinetNav } from '../cabinet-nav'
import { isDemoId } from '../demo/ids'
import { DocumentsPanel } from '../intake/DocumentsPanel'
import { isDraftEmpty } from '../intake/extractionStatus'
import { IntakeChat } from '../intake/IntakeChat'
import { RequisitesPanel } from '../intake/RequisitesPanel'
import { Callout, Empty, PageHeader, PlaneToggle } from '../kit'
import { usePlaneEnabled } from '../planeToggle'
import { extractionPending, useOrganization, useOrganizationItems, useProduct } from '../queries'
import { Shell } from '../Shell'
import { DemoCompanyIntake, DemoProductIntake } from './DemoIntake'

/**
 * Диалог интейка.
 *
 * Сессия в адресе — ключ журнала. Если её нет (карточка с портфеля), сначала
 * ищем последнюю по компании или продукту, и только при 404 создаём новую.
 */
function useSessionId(
  current: string | undefined,
  input: { scope: 'organization' | 'product'; organizationId?: string; productId?: string },
): { sessionId: string; error: unknown } {
  const api = useApi()
  const navigate = useNavigate()
  const { locale } = useI18n()
  const ready = Boolean(input.organizationId || input.productId)
  const requested = useRef(false)
  const [resolved, setResolved] = useState('')
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (current) {
      setResolved(current)
      return
    }
    if (!ready || requested.current) return
    requested.current = true
    void (async () => {
      try {
        const latest = await api.findIntakeSession(input)
        setResolved(latest.id)
        await navigate({ to: '.', search: { session: latest.id }, replace: true })
      } catch (findError) {
        if (!(findError instanceof ApiError) || !findError.isNotFound) {
          requested.current = false
          setError(findError)
          return
        }
        try {
          const created = await api.createIntakeSession({ ...input, locale })
          setResolved(created.id)
          await navigate({ to: '.', search: { session: created.id }, replace: true })
        } catch (createError) {
          requested.current = false
          setError(createError)
        }
      }
    })()
    // Сессия открывается один раз на сущность: перезапуск по смене локали не нужен.
  }, [current, ready])

  return { sessionId: current ?? resolved, error }
}

export function IntakeCompanyPage() {
  const { organizationId } = useParams({ from: '/intake/company/$organizationId' })
  if (isDemoId(organizationId)) return <DemoCompanyIntake organizationId={organizationId} />
  return <LiveCompanyIntake organizationId={organizationId} />
}

function LiveCompanyIntake({ organizationId }: { organizationId: string }) {
  const { session } = useSearch({ from: '/intake/company/$organizationId' })
  const { t, text } = useI18n()
  const [usePlane, setUsePlane] = usePlaneEnabled()
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
    <Shell nav={<CabinetNav />}>
      <PageHeader
        eyebrow={t('eyebrow.intake')}
        title={t('intake.company.title')}
        lead={
          company
            ? `${text(l10n(company.name, organizationId)).value}. ${t('intake.company.leadNamed')}`
            : t('intake.company.lead')
        }
        actions={
          <PlaneToggle
            checked={usePlane}
            onChange={setUsePlane}
            label={t('intake.plane.toggle')}
            hint={t('intake.plane.toggleHint')}
          />
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
          title={t('intake.chat.progressTitle')}
          sections={completeness?.sections ?? []}
          percent={completeness?.percent ?? 0}
          draftEmpty={isDraftEmpty(company?.draft)}
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
      )}
    </Shell>
  )
}

export function IntakeProductPage() {
  const { productId } = useParams({ from: '/intake/product/$productId' })
  if (isDemoId(productId)) return <DemoProductIntake productId={productId} />
  return <LiveProductIntake productId={productId} />
}

function LiveProductIntake({ productId }: { productId: string }) {
  const { session } = useSearch({ from: '/intake/product/$productId' })
  const { t, text } = useI18n()
  const [usePlane, setUsePlane] = usePlaneEnabled()
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
    <Shell nav={<CabinetNav />}>
      <PageHeader
        eyebrow={t('eyebrow.product')}
        title={t('intake.product.title')}
        lead={
          card
            ? `${text(l10n(card.name, productId)).value}. ${t('intake.product.leadNamed')}`
            : t('intake.product.lead')
        }
        actions={
          <PlaneToggle
            checked={usePlane}
            onChange={setUsePlane}
            label={t('intake.plane.toggle')}
            hint={t('intake.plane.toggleHint')}
          />
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
          title={t('intake.product.completenessTitle')}
          sections={[]}
          missing={card?.missing ?? []}
          percent={card?.completeness ?? 0}
          draftEmpty={isDraftEmpty(card?.draft)}
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
      )}
    </Shell>
  )
}
