import { Link } from '@tanstack/react-router'
import { MESSAGES } from '../data/seed'
import { usePortalStore } from '../data/store'
import { PageHeader } from '../components/Ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function MessagesPage() {
  const { applications } = usePortalStore()
  const { t, dateTime, message } = useI18n()
  const byId = Object.fromEntries(applications.map((item) => [item.id, item]))

  return (
    <>
      <PageHeader title={t('messages.title')} subtitle={t('messages.subtitle')} />
      <div className={styles.list}>
        {MESSAGES.map((item) => {
          const copy = message(item)
          return (
            <Link
              key={item.id}
              to="/applications/$applicationId"
              params={{ applicationId: item.applicationId }}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <article className={styles.card}>
                <div className={styles.featuredHead}>
                  <div>
                    <strong>
                      {item.from}
                      {item.unread ? ` · ${t('messages.unread')}` : ''}
                    </strong>
                    <div className={styles.formHint}>
                      {copy.role} · {byId[item.applicationId]?.number}
                    </div>
                  </div>
                  <span className={styles.formHint}>{dateTime(item.at)}</span>
                </div>
                <p>{copy.preview}</p>
              </article>
            </Link>
          )
        })}
      </div>
    </>
  )
}
