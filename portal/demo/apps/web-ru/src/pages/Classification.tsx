import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { describeError, useIdentity } from '@demo/api-client'
import type { ClassificationVariant, Product } from '@demo/domain'
import { l10n } from '@demo/domain'
import { Button, Callout, Card, Empty, Estimate, KeyValue, PageHeader, StatusBadge, ui } from '@demo/ui'
import { Shell } from '../Shell'
import { TRACK_LABEL } from '../labels'
import { useAllProducts, useApproveClassification, useOrganizations, useProduct } from '../queries'

/**
 * Подтверждение трека и класса.
 *
 * Варианты предлагает агент, выбирает специалист, и только после клиентского
 * подтверждения ядро строит кейс с картой. Вариант `forbidden` существует, чтобы
 * его объяснить: выбрать его нельзя, ядро вернёт отказ.
 */

const VARIANT_TAG: Record<ClassificationVariant['variantType'], string> = {
  recommended: 'рекомендован агентом',
  alternative: 'альтернатива',
  forbidden: 'подавать нельзя',
}

function VariantRow({
  variant,
  disabled,
  onSelect,
}: {
  variant: ClassificationVariant
  disabled: boolean
  onSelect: (variantId: string) => void
}) {
  const forbidden = variant.variantType === 'forbidden'

  return (
    <Card
      soft={variant.variantType === 'recommended'}
      title={l10n(variant.title, variant.id).ru}
      meta={VARIANT_TAG[variant.variantType]}
    >
      <p>{l10n(variant.summary).ru}</p>
      <KeyValue
        items={[
          { key: 'Трек', value: TRACK_LABEL[variant.track] },
          { key: 'Класс риска', value: variant.riskClass },
          {
            key: 'Цикл',
            value: `${variant.cycleMonths[0]}–${variant.cycleMonths[1]} мес.`,
          },
        ]}
      />
      {variant.reason ? <Callout tone="deadline">{l10n(variant.reason).ru}</Callout> : null}
      {forbidden ? null : (
        <Button disabled={disabled} onClick={() => onSelect(variant.id)}>
          Подтвердить как специалист
        </Button>
      )}
    </Card>
  )
}

function ProductCard({ product }: { product: Product }) {
  const identity = useIdentity()
  const detail = useProduct(product.id)
  const approve = useApproveClassification(product.id)
  const [checkedAgainst, setCheckedAgainst] = useState('')

  const variants = detail.data?.variants ?? []

  return (
    <Card title={l10n(product.name, product.id).ru} meta={`комплектность ${product.completeness}%`}>
      <div className={ui.row}>
        <StatusBadge tone={product.specialistApprovedAt ? 'accent' : 'warm'}>
          Специалист: {product.specialistApprovedAt ? 'подтвердил' : 'ждёт'}
        </StatusBadge>
        <StatusBadge tone={product.clientApprovedAt ? 'accent' : 'quiet'}>
          Клиент: {product.clientApprovedAt ? 'подтвердил' : 'ждёт'}
        </StatusBadge>
        {product.caseId ? (
          <Link to="/case/$caseId" params={{ caseId: product.caseId }}>
            Кейс заведён →
          </Link>
        ) : null}
      </div>

      {detail.isLoading ? <Empty>Загружаем варианты</Empty> : null}
      {!detail.isLoading && variants.length === 0 ? (
        <Empty>Вариантов ещё нет: агент предлагает их при полной комплектности карточки.</Empty>
      ) : null}

      {variants.length > 0 && !product.specialistApprovedAt ? (
        <label className={ui.stack}>
          <span className={ui.muted}>С чем сверено: номенклатура, приказ, позиция реестра</span>
          <input
            value={checkedAgainst}
            placeholder="приказ № 4н, п. …"
            onChange={(event) => setCheckedAgainst(event.target.value)}
          />
        </label>
      ) : null}

      <div className={ui.grid2}>
        {variants.map((variant) => (
          <VariantRow
            key={variant.id}
            variant={variant}
            disabled={
              approve.isPending || !identity.can.approveAsSpecialist || Boolean(product.specialistApprovedAt)
            }
            onSelect={(variantId) => approve.mutate({ as: 'specialist', variantId, checkedAgainst })}
          />
        ))}
      </div>

      {!identity.can.approveAsSpecialist ? (
        <Empty>Классификацию подтверждает специалист. У этой роли маршрут закрыт.</Empty>
      ) : null}
      {approve.isError ? <Callout tone="deadline">{describeError(approve.error)}</Callout> : null}
    </Card>
  )
}

export function ClassificationPage() {
  const organizations = useOrganizations()
  const products = useAllProducts((organizations.data ?? []).map((item) => item.id))

  const pending = (products.data ?? []).filter((product) => !product.caseId)

  const nav = (
    <Link to="/" className={ui.navItem}>
      ← К портфелю оператора
    </Link>
  )

  return (
    <Shell nav={nav}>
      <PageHeader
        title="Подтверждение трека и класса"
        lead="Проверка вывода агента перед фиксацией в кейсе. Пограничный случай уходит юристу, а не закрывается автоответом."
      />

      {organizations.isError ? <Callout tone="deadline">{describeError(organizations.error)}</Callout> : null}
      {products.isLoading ? <Empty>Загружаем продукты</Empty> : null}
      {!products.isLoading && pending.length === 0 ? (
        <Empty>Продуктов, ждущих подтверждения, нет.</Empty>
      ) : null}

      <div className={ui.stack}>
        {pending.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Estimate>ориентир · 28.08.2026 · не оферта</Estimate>
    </Shell>
  )
}
