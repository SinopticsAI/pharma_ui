import { ApiError, describeError, useApi } from '@demo/api-client'
import type { Product } from '@demo/domain'
import { draftValue, l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { type ErrorComponentProps, Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { Component, type ReactNode, useEffect, useRef, useState } from 'react'
import { CabinetNav } from '../cabinet-nav'
import { isDemoId } from '../demo/ids'
import { DocumentsPanel } from '../intake/DocumentsPanel'
import { isDraftEmpty } from '../intake/extractionStatus'
import { IntakeChat } from '../intake/IntakeChat'
import { productFieldKey } from '../intake/product-fields'
import { RequisitesPanel } from '../intake/RequisitesPanel'
import { Button, Callout, Empty, NextAction, PageHeader } from '../kit'
import { productDisplayName } from '../live-cards'
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

class IntakeTreeError extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) return <IntakeRenderFallback error={this.state.error} />
    return this.props.children
  }
}

function IntakeRenderFallback({ error }: { error: Error }) {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <Callout tone="deadline">{describeError(error)}</Callout>
      <Button type="button" onClick={() => window.location.reload()}>
        {t('common.retry')}
      </Button>
    </div>
  )
}

/** TanStack default is a blank “Something went wrong!” with no cabinet chrome. */
export function IntakeRouteError({ error, reset }: ErrorComponentProps) {
  const { t } = useI18n()
  return (
    <Shell nav={<CabinetNav />}>
      <PageHeader eyebrow={t('eyebrow.intake')} title={t('intake.company.title')} lead={t('intake.company.lead')} />
      <Callout tone="deadline">{describeError(error)}</Callout>
      <Button type="button" onClick={reset}>
        {t('common.retry')}
      </Button>
    </Shell>
  )
}

export function IntakeCompanyPage() {
  const { organizationId } = useParams({ from: '/intake/company/$organizationId' })
  if (isDemoId(organizationId)) return <DemoCompanyIntake organizationId={organizationId} />
  return <LiveCompanyIntake organizationId={organizationId} />
}

function LiveCompanyIntake({ organizationId }: { organizationId: string }) {
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
    <Shell nav={<CabinetNav />}>
      <PageHeader
        eyebrow={t('eyebrow.intake')}
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
        <IntakeTreeError>
          <IntakeChat
            agentId="companyIntake"
            sessionId={sessionId}
            organizationId={organizationId}
            title={t('intake.chat.progressTitle')}
            sections={Array.isArray(completeness?.sections) ? completeness.sections : []}
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
        </IntakeTreeError>
      )}
    </Shell>
  )
}

function ProductIntakeNext({ product }: { product: Product }) {
  const { t } = useI18n()
  if (product.caseId) {
    return (
      <NextAction
        label={t('shell.nextAction')}
        action={
          <Link to="/products/$productId/roadmap" params={{ productId: product.id }}>
            <Button type="button">{t('intake.chat.openRoadmap')}</Button>
          </Link>
        }
      >
        {t('intake.next.roadmap')}
      </NextAction>
    )
  }

  const missing = (Array.isArray(product.missing) ? product.missing : [])
    .map((field) => {
      const key = productFieldKey(field)
      return key ? t(key) : field
    })
    .filter(Boolean)
  const gateOpen = Boolean(draftValue(product.draft, 'name') && draftValue(product.draft, 'intendedUse'))
  if (missing.length > 0 || !gateOpen) {
    return (
      <NextAction label={t('shell.nextAction')}>
        {missing.length > 0
          ? t('intake.next.missing').replace('{fields}', missing.join(', '))
          : t('intake.next.upload')}
      </NextAction>
    )
  }

  return (
    <NextAction
      label={t('shell.nextAction')}
      action={
        <Link to="/products/$productId/classify" params={{ productId: product.id }}>
          <Button type="button">{t('nav.classify')}</Button>
        </Link>
      }
    >
      {t('intake.next.classify')}
    </NextAction>
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
        title={card ? text(productDisplayName(card, t('portfolio.untitledProduct'))).value : t('intake.product.title')}
        lead={
          card
            ? `${text(productDisplayName(card, t('portfolio.untitledProduct'))).value}. ${t('intake.product.leadNamed')}`
            : t('intake.product.lead')
        }
      />
      {error ? <Callout tone="deadline">{describeError(error)}</Callout> : null}
      {product.isError ? <Callout tone="deadline">{describeError(product.error)}</Callout> : null}
      {card ? <ProductIntakeNext product={card} /> : null}
      {!sessionId || !organizationId ? (
        <Empty>{t('common.loading')}</Empty>
      ) : (
        <IntakeTreeError>
          <IntakeChat
            agentId="productIntake"
            sessionId={sessionId}
            organizationId={organizationId}
            productId={productId}
            title={t('intake.product.completenessTitle')}
            sections={[]}
            missing={Array.isArray(card?.missing) ? card.missing : []}
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
        </IntakeTreeError>
      )}
    </Shell>
  )
}
