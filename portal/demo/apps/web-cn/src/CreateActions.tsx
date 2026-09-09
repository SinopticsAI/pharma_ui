import type { Organization } from '@demo/domain'
import { l10n } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { useState } from 'react'
import { eligibleOrganizations } from './portfolio-create'

const cardClass =
  'flex flex-col gap-1 rounded-lg border bg-card px-4 py-4 text-left hover:border-primary disabled:opacity-50'

export function RegisterCompanyCard({
  titleKey,
  busy,
  onStart,
}: {
  titleKey: MessageKey
  busy: boolean
  onStart: () => void | Promise<void>
}) {
  const { t } = useI18n()
  return (
    <button type="button" className={cardClass} onClick={() => void onStart()} disabled={busy}>
      <strong>{t(titleKey)}</strong>
      <span className="text-sm text-muted-foreground">{t('portfolio.registerCompanyLead')}</span>
    </button>
  )
}

export function AddProductCard({
  titleKey,
  organizations,
  busy,
  onStart,
}: {
  titleKey: MessageKey
  organizations: Organization[]
  busy: boolean
  onStart: (organization: Organization) => void | Promise<void>
}) {
  const { t, text } = useI18n()
  const ready = eligibleOrganizations(organizations)
  const [picking, setPicking] = useState(false)
  const locked = ready.length === 0

  if (picking && !locked) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-4">
        <strong>{t('portfolio.chooseCompany')}</strong>
        {ready.map((organization) => (
          <button
            type="button"
            key={organization.id}
            className="rounded-md border px-3 py-2 text-left text-sm hover:border-primary disabled:opacity-50"
            disabled={busy}
            onClick={() => void onStart(organization)}
          >
            {text(l10n(organization.name, organization.id)).value}
          </button>
        ))}
      </div>
    )
  }

  return (
    <button type="button" className={cardClass} disabled={busy || locked} onClick={() => setPicking(true)}>
      <strong>{t(titleKey)}</strong>
      <span className="text-sm text-muted-foreground">
        {locked ? t('portfolio.addProductLocked') : t('portfolio.addProductLead')}
      </span>
    </button>
  )
}
