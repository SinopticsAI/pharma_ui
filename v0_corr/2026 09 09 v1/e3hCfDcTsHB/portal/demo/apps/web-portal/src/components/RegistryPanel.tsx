import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { Application } from '../data/types'
import { useRegistryLookup } from '../data/portal'
import { Callout, Empty, KeyValue } from './Ui'
import { useI18n } from '../i18n'
import uiStyles from '../styles/ui.module.css'

/**
 * Реестр — источник истины по номерам. Ядро держит ссылку и кэш ответа, но не
 * заводит собственную копию, в которую кабинет начал бы верить.
 */
export function RegistryPanel({ application }: { application: Application }) {
  const { t } = useI18n()
  const [query, setQuery] = useState(application.product)
  const [source, setSource] = useState<'elk' | 'grls'>(application.kind === 'drug' ? 'grls' : 'elk')
  const search = useRegistryLookup(query, source)

  return (
    <div className={uiStyles.list}>
      <div className={uiStyles.kindRow}>
        <label className={uiStyles.field} style={{ flex: 1, minWidth: 220 }}>
          <span>{t('registry.query')}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className={uiStyles.field}>
          <span>{t('registry.source')}</span>
          <select value={source} onChange={(event) => setSource(event.target.value as 'elk' | 'grls')}>
            <option value="elk">{t('registry.sourceElk')}</option>
            <option value="grls">{t('registry.sourceGrls')}</option>
          </select>
        </label>
      </div>

      {search.isFetching ? <Empty>{t('session.loading')}</Empty> : null}
      {search.data && search.data.hits.length === 0 ? <Empty>{t('registry.searchEmpty')}</Empty> : null}
      {(search.data?.hits ?? []).map((hit, index) => (
        <KeyValue
          key={index}
          items={[
            { key: t('registry.number'), value: hit.number ?? t('common.dash') },
            { key: t('registry.holder'), value: hit.holder ?? t('common.dash') },
            { key: t('registry.models'), value: hit.title ?? t('common.dash') },
          ]}
        />
      ))}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <a href="https://elk.roszdravnadzor.gov.ru/widget/" target="_blank" rel="noreferrer">
          <ExternalLink size={12} strokeWidth={1.75} aria-hidden="true" /> {t('registry.sourceElk')}
        </a>
        <a href="https://grls.rosminzdrav.ru" target="_blank" rel="noreferrer">
          <ExternalLink size={12} strokeWidth={1.75} aria-hidden="true" /> {t('registry.sourceGrls')}
        </a>
      </div>

      <Callout tone="quiet">{t('registry.cache')}</Callout>
    </div>
  )
}
