import { describeError, OFFLINE_DEMO, useIdentity } from '@demo/api-client'
import type { ClassificationVariant } from '@demo/domain'
import { l10n } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { Link, useNavigate } from '@tanstack/react-router'
import { type ReactNode, useEffect, useState } from 'react'
import { AddProductCard } from '../CreateActions'
import { classificationVariants } from '../demo/catalog'
import { useDemo } from '../demo/context'
import { DEMO_PRODUCT_RK30, isDemoId } from '../demo/ids'
import {
  ActorBadge,
  Benefit,
  Button,
  Callout,
  Card,
  DemoMark,
  Empty,
  KeyValue,
  NextAction,
  PageHeader,
  StatusBadge,
} from '../kit'
import { usePortfolioCards } from '../live-cards'
import { usePortfolioCreate } from '../portfolio-create'
import { useApproveProduct, useCase, useProduct, useProductVariants } from '../queries'
import { Shell } from '../Shell'
import {
  canSelectLiveVariant,
  classificationCheckedAgainst,
  classifyGateMissing,
  clientCanBuildMap,
  resolveVariants,
  variantIsChoosable,
} from './classify-live'
import { ProductCard } from './EntityCards'
import { MandateStepsTable } from './MandateSteps'

const GATE_FIELD_LABEL: Record<'name' | 'intendedUse', MessageKey> = {
  name: 'productField.name',
  intendedUse: 'productField.intendedUse',
}

export function ProductsPage() {
  const { t } = useI18n()
  const { state } = useDemo()
  const portfolio = usePortfolioCards(state)
  const { busy, failure, startProduct } = usePortfolioCreate()

  return (
    <Shell>
      <PageHeader eyebrow={t('eyebrow.product')} title={t('nav.products')} lead={t('home.lead')} />
      {OFFLINE_DEMO ? <DemoMark>{t('shell.demoMark')}</DemoMark> : null}
      {failure ? <Callout tone="deadline">{describeError(failure)}</Callout> : null}
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <AddProductCard
          titleKey="portfolio.addProduct"
          organizations={portfolio.organizations.data ?? []}
          busy={busy}
          onStart={startProduct}
        />
      </div>
      {portfolio.productsQuery.isLoading && portfolio.products.length === 0 ? (
        <Empty>{t('common.loading')}</Empty>
      ) : null}
      {!portfolio.productsQuery.isLoading && portfolio.products.length === 0 ? (
        <Empty>{t('portfolio.noProducts')}</Empty>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {portfolio.products.map((item) => (
          <ProductCard key={item.product.id} item={item} />
        ))}
      </div>
    </Shell>
  )
}

export function ClassificationPage({ productId }: { productId: string }) {
  if (OFFLINE_DEMO || isDemoId(productId)) {
    return <DemoClassificationPage productId={productId} />
  }
  return <LiveClassificationPage productId={productId} />
}

function DemoClassificationPage({ productId }: { productId: string }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { state, patch } = useDemo()
  const variants = classificationVariants(productId)
  const selected = state.rk30Selected
  const specialist = productId === DEMO_PRODUCT_RK30 ? state.rk30SpecialistApproved : true
  const client = productId === DEMO_PRODUCT_RK30 ? state.rk30ClientApproved : true
  const canBuild = specialist && client && selected !== null

  return (
    <ClassificationShell
      next={canBuild ? t('classify.buildMap') : t('classify.buildLocked')}
      specialist={specialist}
      client={client}
      demo
    >
      <VariantGrid
        variants={variants}
        selectedId={selected ? `${productId}-${selected}` : ''}
        onSelect={(variant) => {
          const letter = variant.id.slice(-1) as 'A' | 'B' | 'C'
          patch({ rk30Selected: letter === 'C' ? null : letter, rk30ClientApproved: false })
        }}
      />

      <Card title={t('classify.audit')} meta="A-2214 · 2026-09-06 14:10">
        <p className="text-sm">{t('classify.specialist')}: 李静 · 4н / ПП 1684</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={specialist}
            onClick={() => patch({ rk30SpecialistApproved: true })}
          >
            {t('classify.specialist')}
          </Button>
          <Button
            type="button"
            disabled={!specialist || client || !selected}
            onClick={() => patch({ rk30ClientApproved: true })}
          >
            {t('classify.client')}
          </Button>
          <Button
            type="button"
            disabled={!canBuild}
            onClick={() => {
              patch({ rk30MapBuilt: true })
              void navigate({ to: '/products/$productId/roadmap', params: { productId } })
            }}
          >
            {t('classify.buildMap')}
          </Button>
        </div>
        {!canBuild ? <p className="mt-2 text-sm text-muted-foreground">{t('classify.buildLocked')}</p> : null}
      </Card>
      <Benefit label={t('benefit.label')}>{t('benefit.classify')}</Benefit>
    </ClassificationShell>
  )
}

function LiveClassificationPage({ productId }: { productId: string }) {
  const { t, text } = useI18n()
  const navigate = useNavigate()
  const identity = useIdentity()
  const productQuery = useProduct(productId)
  const variantsQuery = useProductVariants(productId)
  const approve = useApproveProduct(productId)
  const product = productQuery.data
  const variants = resolveVariants(product, variantsQuery.data)
  const gateMissing = classifyGateMissing(product?.missing)
  const specialist = Boolean(product?.specialistApprovedAt)
  const client = Boolean(product?.clientApprovedAt)
  const canPick = canSelectLiveVariant({ canApproveAsSpecialist: identity.can.approveAsSpecialist, product })
  const canBuild = clientCanBuildMap(product)
  const selectedId = product?.selectedVariantId ?? ''
  const caseQuery = useCase(product?.caseId ?? '')
  const [pickedId, setPickedId] = useState(selectedId)

  useEffect(() => {
    if (selectedId) {
      setPickedId(selectedId)
      return
    }
    setPickedId((current) => {
      if (current) return current
      const recommended = variants.find((item) => item.variantType === 'recommended' && variantIsChoosable(item))
      return recommended?.id ?? variants.find((item) => variantIsChoosable(item))?.id ?? ''
    })
  }, [selectedId, variants])

  if (productQuery.isLoading) return <Empty>{t('common.loading')}</Empty>
  if (productQuery.isError) return <Callout tone="deadline">{describeError(productQuery.error)}</Callout>
  if (!product) return <Empty>{t('portfolio.noProducts')}</Empty>

  const openMap = () => {
    void navigate({ to: '/products/$productId/roadmap', params: { productId } })
  }

  const approveAsClient = () => {
    approve.mutate({ as: 'client' }, { onSuccess: openMap })
  }

  const chosen = variants.find((item) => item.id === pickedId) ?? variants.find((item) => item.selected)
  const chooseAndBuild = () => {
    if (!chosen || !variantIsChoosable(chosen)) return
    approve.mutate(
      { as: 'specialist', variantId: chosen.id, checkedAgainst: classificationCheckedAgainst(chosen) },
      { onSuccess: approveAsClient },
    )
  }

  const next = product.caseId
    ? t('classify.mapOpen')
    : variants.length === 0
      ? t('classify.waitingVariants')
      : canBuild
        ? t('classify.buildMap')
        : canPick
          ? t('classify.buildMap')
          : t('classify.buildLocked')

  return (
    <ClassificationShell next={next} specialist={specialist} client={client}>
      {variantsQuery.isError ? <Callout tone="deadline">{describeError(variantsQuery.error)}</Callout> : null}
      {!canPick && !specialist ? <Callout tone="quiet">{t('classify.clientOnly')}</Callout> : null}
      {chosen ? (
        <Callout tone="ok">
          {t('classify.selected')}: {text(l10n(chosen.title)).value} · {t(`track.${chosen.track}`)} · {chosen.riskClass}
        </Callout>
      ) : null}
      {variants.length === 0 ? (
        <Empty>
          <p>{t('classify.waitingVariants')}</p>
          {gateMissing.length > 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {t('product.missing')}: {gateMissing.map((key) => t(GATE_FIELD_LABEL[key])).join(', ')}
            </p>
          ) : null}
          <Link to="/intake/product/$productId" params={{ productId }} className="mt-2 inline-block text-sm underline">
            {t('portfolio.continueAgent')}
          </Link>
        </Empty>
      ) : (
        <VariantGrid
          variants={variants}
          selectedId={pickedId || selectedId}
          onSelect={canPick ? (variant) => setPickedId(variant.id) : undefined}
        />
      )}

      {product.caseId ? (
        <Card title={t('mandate.m1Title')}>
          <MandateStepsTable steps={caseQuery.data?.mandate?.steps} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={openMap}>
              {t('classify.openRoadmap')}
            </Button>
            <Link
              to="/products/$productId/nodes/$nodeCode"
              params={{ productId, nodeCode: 'M1' }}
              className="text-sm underline"
            >
              M1
            </Link>
            <Link to="/products/$productId/mandate" params={{ productId }} className="text-sm underline">
              {t('nav.mandate')}
            </Link>
          </div>
        </Card>
      ) : null}

      <Card title={t('classify.audit')}>
        <KeyValue
          items={[
            {
              key: t('classify.specialist'),
              value: specialist
                ? product.specialistApprovedBy || t('classify.specialistDone')
                : t('classify.specialistPending'),
            },
            {
              key: t('classify.client'),
              value: client ? product.clientApprovedBy || t('classify.clientDone') : t('classify.clientPending'),
            },
          ]}
        />
        {approve.isError ? <Callout tone="deadline">{describeError(approve.error)}</Callout> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {product.caseId ? (
            <Button type="button" onClick={openMap}>
              {t('classify.openRoadmap')}
            </Button>
          ) : canPick ? (
            <Button
              type="button"
              disabled={!chosen || !variantIsChoosable(chosen) || gateMissing.length > 0 || approve.isPending}
              onClick={chooseAndBuild}
            >
              {t('classify.buildMap')}
            </Button>
          ) : (
            <Button type="button" disabled={!canBuild || approve.isPending} onClick={approveAsClient}>
              {t('classify.buildMap')}
            </Button>
          )}
        </div>
        {gateMissing.length > 0 && !product.caseId ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t('product.missing')}: {gateMissing.map((key) => t(GATE_FIELD_LABEL[key])).join(', ')}
          </p>
        ) : null}
        {!product.caseId && !canBuild && !canPick ? (
          <p className="mt-2 text-sm text-muted-foreground">{t('classify.buildLocked')}</p>
        ) : null}
      </Card>
      <Benefit label={t('benefit.label')}>{t('benefit.classify')}</Benefit>
    </ClassificationShell>
  )
}

function ClassificationShell({
  next,
  specialist,
  client,
  demo = false,
  children,
}: {
  next: string
  specialist: boolean
  client: boolean
  demo?: boolean
  children: ReactNode
}) {
  const { t } = useI18n()

  return (
    <>
      <PageHeader eyebrow={t('eyebrow.classify')} title={t('classify.title')} lead={t('classify.lead')} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ActorBadge actor="you">{t('nodeOwner.you')}</ActorBadge>
        <ActorBadge actor="us">{t('nodeOwner.us')}</ActorBadge>
        <ActorBadge actor="agent">{t('classify.draft')}</ActorBadge>
      </div>
      {demo ? <DemoMark>{t('shell.demoMark')}</DemoMark> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge tone={specialist ? 'ok' : 'warm'}>
          {specialist ? t('classify.specialistDone') : t('classify.specialistPending')}
        </StatusBadge>
        <StatusBadge tone={client ? 'ok' : 'warm'}>
          {client ? t('classify.clientDone') : t('classify.clientPending')}
        </StatusBadge>
      </div>
      <NextAction label={t('shell.nextAction')}>{next}</NextAction>
      {children}
    </>
  )
}

function VariantGrid({
  variants,
  selectedId,
  onSelect,
}: {
  variants: ClassificationVariant[]
  selectedId: string
  onSelect?: (variant: ClassificationVariant) => void
}) {
  const { t, text } = useI18n()

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {variants.map((variant) => {
        const forbidden = variant.variantType === 'forbidden'
        const active = variant.selected || variant.id === selectedId
        const selectable = Boolean(onSelect) && !forbidden
        const pick = () => onSelect?.(variant)
        return (
          <article
            key={variant.id}
            className={`space-y-3 rounded-lg border bg-card p-4 ${
              forbidden
                ? 'border-muted-foreground/25 bg-muted/40'
                : active
                  ? 'border-primary ring-1 ring-primary/30'
                  : ''
            } ${selectable ? 'cursor-pointer' : ''}`}
            role={selectable ? 'button' : undefined}
            tabIndex={selectable ? 0 : undefined}
            onClick={selectable ? pick : undefined}
            onKeyDown={
              selectable
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      pick()
                    }
                  }
                : undefined
            }
          >
            <header className="space-y-1.5">
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                  variant.variantType === 'recommended'
                    ? 'bg-primary/12 text-primary'
                    : variant.variantType === 'alternative'
                      ? 'bg-actor-you text-actor-you-foreground'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                {variant.variantType === 'recommended'
                  ? t('classify.recommended')
                  : variant.variantType === 'alternative'
                    ? t('classify.alternative')
                    : t('classify.forbidden')}
              </span>
              <h2 className="text-sm font-semibold">{text(l10n(variant.title)).value}</h2>
            </header>
            <p className="text-sm">{text(l10n(variant.summary)).value}</p>
            <KeyValue
              items={[
                { key: t('case.track'), value: t(`track.${variant.track}`) },
                { key: t('case.class'), value: variant.riskClass },
              ]}
            />
            {variant.pros.length > 0 ? (
              <ul className="list-disc pl-4 text-sm">
                {variant.pros.map((item) => (
                  <li key={text(l10n(item)).value}>{text(l10n(item)).value}</li>
                ))}
              </ul>
            ) : null}
            {variant.cons.length > 0 ? (
              <ul className="list-disc pl-4 text-sm text-muted-foreground">
                {variant.cons.map((item) => (
                  <li key={text(l10n(item)).value}>{text(l10n(item)).value}</li>
                ))}
              </ul>
            ) : null}
            {forbidden ? <Callout tone="deadline">{t('classify.weDoNotFile')}</Callout> : null}
            {active && !forbidden ? <StatusBadge tone="accent">{t('classify.selected')}</StatusBadge> : null}
          </article>
        )
      })}
    </div>
  )
}
