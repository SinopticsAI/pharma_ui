import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { useNavigate } from '@tanstack/react-router'
import { classificationVariants, productCards } from '../demo/catalog'
import { useDemo } from '../demo/context'
import { DEMO_CASE_RU0417, DEMO_PRODUCT_RK30, isDemoId } from '../demo/ids'
import { Button, Callout, Card, DemoMark, NextAction, PageHeader, StatusBadge } from '../kit'
import { Shell } from '../Shell'
import { ProductCard } from './EntityCards'

export function ProductsPage() {
  const { t } = useI18n()
  const { state } = useDemo()

  return (
    <Shell>
      <PageHeader title={t('nav.products')} lead={t('home.lead')} />
      <DemoMark>{t('shell.demoMark')}</DemoMark>
      <div className="grid gap-4 lg:grid-cols-2">
        {productCards(state).map((item) => (
          <ProductCard key={item.product.id} item={item} />
        ))}
      </div>
    </Shell>
  )
}

export function ClassificationPage({ productId }: { productId: string }) {
  const { t, text } = useI18n()
  const navigate = useNavigate()
  const { state, patch } = useDemo()
  const variants = classificationVariants(productId)
  const selected = state.rk30Selected
  const specialist = productId === DEMO_PRODUCT_RK30 ? state.rk30SpecialistApproved : true
  const client = productId === DEMO_PRODUCT_RK30 ? state.rk30ClientApproved : true
  const canBuild = specialist && client && selected !== null
  const demo = isDemoId(productId)

  return (
    <Shell>
      <PageHeader title={t('classify.title')} lead={t('classify.lead')} />
      <DemoMark>{t('shell.demoMark')}</DemoMark>
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge tone={specialist ? 'ok' : 'warm'}>
          {specialist ? t('classify.specialistDone') : t('classify.specialistPending')}
        </StatusBadge>
        <StatusBadge tone={client ? 'ok' : 'warm'}>
          {client ? t('classify.clientDone') : t('classify.clientPending')}
        </StatusBadge>
        <StatusBadge tone="quiet">{t('classify.draft')}</StatusBadge>
      </div>

      <NextAction label={t('shell.nextAction')}>
        {canBuild ? t('classify.buildMap') : t('classify.buildLocked')}
      </NextAction>

      <div className="grid gap-4 lg:grid-cols-3">
        {variants.map((variant) => {
          const letter = variant.id.slice(-1) as 'A' | 'B' | 'C'
          const forbidden = variant.variantType === 'forbidden'
          const active = selected === letter
          return (
            <article
              key={variant.id}
              className={`space-y-3 rounded-lg border bg-card p-4 ${
                forbidden ? 'border-destructive/50' : active ? 'border-primary' : ''
              }`}
            >
              <header>
                <p className="text-xs text-muted-foreground">
                  {variant.variantType === 'recommended'
                    ? t('classify.recommended')
                    : variant.variantType === 'alternative'
                      ? t('classify.alternative')
                      : t('classify.forbidden')}
                </p>
                <h2 className="text-sm font-semibold">{text(l10n(variant.title)).value}</h2>
              </header>
              <p className="text-sm">{text(l10n(variant.summary)).value}</p>
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
              {forbidden ? null : (
                <Button
                  type="button"
                  variant={active ? 'primary' : 'secondary'}
                  disabled={!demo}
                  onClick={() => patch({ rk30Selected: letter === 'C' ? null : letter, rk30ClientApproved: false })}
                >
                  {active ? t('classify.selected') : t('classify.choose')}
                </Button>
              )}
            </article>
          )
        })}
      </div>

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
              void navigate({ to: '/case/$caseId/roadmap', params: { caseId: DEMO_CASE_RU0417 } })
            }}
          >
            {t('classify.buildMap')}
          </Button>
        </div>
        {!canBuild ? <p className="mt-2 text-sm text-muted-foreground">{t('classify.buildLocked')}</p> : null}
      </Card>
    </Shell>
  )
}
