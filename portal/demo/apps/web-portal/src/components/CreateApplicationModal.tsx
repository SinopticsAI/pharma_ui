import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { usePortalStore } from '../data/store'
import { type ProductKind } from '../data/work'
import { useI18n } from '../i18n'
import { Modal } from './Modal'
import { Button } from './Ui'
import styles from '../styles/ui.module.css'

const KINDS: ProductKind[] = ['drug', 'prosthesis', 'equipment']

/** Работа 0.1: ввод продукта. От типа зависит весь дальнейший порядок работ. */
export function CreateApplicationModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { addApplication } = usePortalStore()
  const { t, kind: kindLabel } = useI18n()
  const [product, setProduct] = useState('')
  const [kind, setKind] = useState<ProductKind>('drug')
  const [country, setCountry] = useState('Китай')
  const [manufacturer, setManufacturer] = useState('')
  const [sites, setSites] = useState('')
  const [form, setForm] = useState('')

  const missing = [
    product.trim().length > 1 ? null : t('create.missing.product'),
    country.trim() ? null : t('create.missing.country'),
    manufacturer.trim().length > 1 ? null : t('create.missing.manufacturer'),
  ].filter((item): item is string => Boolean(item))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (missing.length > 0) return
    const created = addApplication({
      product: product.trim(),
      form: form.trim(),
      kind,
      country: country.trim(),
      manufacturer: manufacturer.trim(),
      sites: sites.trim(),
    })
    onClose()
    void navigate({ to: '/applications/$applicationId', params: { applicationId: created.id } })
  }

  return (
    <Modal title={t('create.title')} onClose={onClose}>
      <p className={styles.formHint} style={{ marginBottom: 14 }}>
        {t('create.lead')}
      </p>
      <form onSubmit={submit}>
        <label className={styles.field}>
          <span>{t('create.product')}</span>
          <input
            autoFocus
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            placeholder={t('create.productPh')}
          />
        </label>

        <fieldset className={styles.field} style={{ border: 0, margin: 0, padding: 0 }}>
          <span>{t('create.kind')}</span>
          <div className={styles.kindRow}>
            {KINDS.map((item) => (
              <label key={item} className={`${styles.kindOption} ${kind === item ? styles.kindOptionActive : ''}`}>
                <input
                  type="radio"
                  name="kind"
                  value={item}
                  checked={kind === item}
                  onChange={() => setKind(item)}
                />
                {kindLabel(item)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className={styles.field}>
          <span>{t('create.form')}</span>
          <input
            value={form}
            onChange={(event) => setForm(event.target.value)}
            placeholder={t(`create.formHint.${kind}` as 'create.formHint.drug' | 'create.formHint.prosthesis' | 'create.formHint.equipment')}
          />
        </label>

        <label className={styles.field}>
          <span>{t('create.country')}</span>
          <input value={country} onChange={(event) => setCountry(event.target.value)} />
        </label>

        <label className={styles.field}>
          <span>{t('create.manufacturer')}</span>
          <input
            value={manufacturer}
            onChange={(event) => setManufacturer(event.target.value)}
            placeholder={t('create.manufacturerPh')}
          />
        </label>

        <label className={styles.field}>
          <span>{t('create.sites')}</span>
          <input value={sites} onChange={(event) => setSites(event.target.value)} placeholder={t('create.sitesPh')} />
        </label>

        {missing.length > 0 ? <p className={styles.formHint}>{t('create.missing', { list: missing.join(', ') })}</p> : null}

        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('create.cancel')}
          </Button>
          <Button type="submit" disabled={missing.length > 0}>
            {t('create.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
