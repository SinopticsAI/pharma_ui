import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../i18n'
import { Button } from './Ui'
import styles from '../styles/ui.module.css'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const { t } = useI18n()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div className={styles.modalRoot} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h2 id="modal-title">{title}</h2>
          <Button variant="ghost" type="button" onClick={onClose} aria-label={t('create.close')}>
            <X size={18} strokeWidth={1.75} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
