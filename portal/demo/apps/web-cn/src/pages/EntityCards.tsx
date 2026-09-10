import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Progress } from '@demo/ui/components/progress'
import { Link } from '@tanstack/react-router'
import type { CompanyCardView, ProductCardView } from '../demo/catalog'
import { Button, Card, KeyValue, StatusBadge } from '../kit'
import { productDisplayName } from '../live-cards'

export function CompanyCard({ item }: { item: CompanyCardView }) {
  const { t, text } = useI18n()
  const org = item.organization
  const approved = org.status === 'profile_approved'

  return (
    <Card
      title={text(l10n(org.name, org.id)).value}
      meta={`${item.docsDone}/${item.docsTotal} · ${org.completeness?.percent ?? 0}%`}
    >
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone={item.verified ? 'ok' : 'warm'}>
          {item.verified ? t('home.verified') : t('home.inReview')}
        </StatusBadge>
        <StatusBadge tone={item.riskLevel === 'low' ? 'ok' : 'warm'}>
          {t(`intake.card.risk.${item.riskLevel}`)}
        </StatusBadge>
        <StatusBadge tone="quiet">{t(`orgStatus.${org.status}`)}</StatusBadge>
      </div>
      <p className="text-sm text-muted-foreground">{text(item.riskExplain).value}</p>
      <KeyValue
        items={[
          { key: t('home.uscc'), value: <span className="font-mono text-xs">{item.uscc}</span> },
          { key: t('home.docProgress'), value: `${item.docsDone} / ${item.docsTotal}` },
          { key: t('home.apostilleProgress'), value: `${item.apostilleDone} / ${item.apostilleTotal}` },
          { key: t('home.productCount'), value: String(item.productCount) },
          { key: t('shell.nextAction'), value: text(item.nextStep).value },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <Link to="/intake/company/$organizationId" params={{ organizationId: org.id }}>
          <Button type="button">{t('portfolio.continueAgent')}</Button>
        </Link>
        {approved ? (
          <Link to="/companies/$organizationId" params={{ organizationId: org.id }} className="text-sm underline">
            {t('home.openRisk')} →
          </Link>
        ) : null}
      </div>
    </Card>
  )
}

export function ProductCard({ item }: { item: ProductCardView }) {
  const { t, text } = useI18n()
  const product = item.product
  const hasCase = Boolean(product.caseId)

  return (
    <Card
      title={text(productDisplayName(product, t('portfolio.untitledProduct'))).value}
      meta={text(item.companyName).value}
    >
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="quiet">{text(item.classLabel).value}</StatusBadge>
        <StatusBadge tone={hasCase ? 'accent' : 'warm'}>{text(item.nodeLabel).value}</StatusBadge>
        <StatusBadge>{text(item.caseStatus).value}</StatusBadge>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('portfolio.completeness')}</span>
          <span>{item.progress}%</span>
        </div>
        <Progress value={item.progress} />
      </div>
      <KeyValue
        items={[
          { key: t('shell.nextAction'), value: text(item.nextAction).value },
          { key: t('map.owner'), value: text(item.owner).value },
          { key: t('map.due'), value: text(item.deadline).value },
        ]}
      />
      {item.events.length > 0 ? (
        <div>
          <p className="text-xs text-muted-foreground">{t('home.autoEvents')}</p>
          <ul className="mt-1 list-disc pl-4 text-sm">
            {item.events.map((event) => (
              <li key={text(event).value}>{text(event).value}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Link to="/products/$productId" params={{ productId: product.id }}>
          <Button type="button">{t('home.openCabinet')}</Button>
        </Link>
        {hasCase ? (
          <Link to="/products/$productId/roadmap" params={{ productId: product.id }} className="text-sm underline">
            {t('home.openMap')} →
          </Link>
        ) : (
          <Link to="/products/$productId/classify" params={{ productId: product.id }} className="text-sm underline">
            {t('home.openClassify')} →
          </Link>
        )}
        <Link to="/intake/product/$productId" params={{ productId: product.id }} className="text-sm underline">
          {t('portfolio.continueAgent')} →
        </Link>
      </div>
    </Card>
  )
}
