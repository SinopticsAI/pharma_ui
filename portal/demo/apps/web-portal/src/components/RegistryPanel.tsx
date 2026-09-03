import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { usePortalStore } from '../data/store'
import type { Application } from '../data/types'
import type { RegistryStatus } from '../data/work'
import { Button, Callout } from './Ui'
import { useI18n } from '../i18n'
import uiStyles from '../styles/ui.module.css'
import styles from '../styles/work.module.css'

/**
 * Результат проверки реестра вводит человек. Портал хранит артефакт и ссылку,
 * а источником истины остаётся государственный реестр.
 */
export function RegistryPanel({ application }: { application: Application }) {
  const { applyRegistryResult } = usePortalStore()
  const { t, dateTime, expert } = useI18n()
  const registry = application.registry
  const [result, setResult] = useState<RegistryStatus>(registry.status === 'pending' ? 'not_found' : registry.status)
  const [number, setNumber] = useState(registry.number ?? '')
  const [holder, setHolder] = useState(registry.holder ?? '')
  const [models, setModels] = useState(registry.models ?? '')

  const saved = registry.status !== 'pending'
  const registryNumber = registry.number || t('case.numberMissing')

  return (
    <div className={uiStyles.list}>
      {saved ? (
        <Callout tone={registry.status === 'found' ? 'info' : 'quiet'}>
          {registry.status === 'found' ? t('registry.found', { number: registryNumber }) : t('registry.notFound')}
          {registry.checkedAt
            ? t('registry.checked', {
                when: dateTime(registry.checkedAt),
                who: registry.checkedBy ? expert(registry.checkedBy) : '',
              })
            : ''}
        </Callout>
      ) : null}

      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className={uiStyles.formHint} style={{ marginBottom: 6 }}>
          {t('registry.result')}
        </legend>
        <div className={uiStyles.kindRow}>
          {(
            [
              { value: 'not_found', label: t('registry.notFoundOpt') },
              { value: 'found', label: t('registry.foundOpt') },
            ] as { value: RegistryStatus; label: string }[]
          ).map((option) => (
            <label
              key={option.value}
              className={`${uiStyles.kindOption} ${result === option.value ? uiStyles.kindOptionActive : ''}`}
            >
              <input
                type="radio"
                name="registry-result"
                checked={result === option.value}
                onChange={() => setResult(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {result === 'found' ? (
        <div className={styles.registryResult}>
          <label className={uiStyles.field}>
            <span>{t('registry.number')}</span>
            <input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="ЛП-№000000" />
          </label>
          <label className={uiStyles.field}>
            <span>{t('registry.holder')}</span>
            <input value={holder} onChange={(event) => setHolder(event.target.value)} />
          </label>
          <label className={uiStyles.field}>
            <span>{t('registry.models')}</span>
            <input value={models} onChange={(event) => setModels(event.target.value)} />
          </label>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          type="button"
          onClick={() => applyRegistryResult(application.id, { status: result, number, holder, models })}
        >
          {t('registry.save')}
        </Button>
        <span className={uiStyles.formHint}>
          <ExternalLink size={12} strokeWidth={1.75} aria-hidden="true" /> {t('registry.links')}
        </span>
      </div>
    </div>
  )
}
