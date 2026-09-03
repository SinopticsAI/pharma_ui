import { ORGANIZATION, USER } from '../data/types'
import { usePortalStore } from '../data/store'
import { Button, Callout, Card, KeyValue, PageHeader } from '../components/Ui'
import { LocaleSwitch } from '../components/LocaleSwitch'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function SettingsPage() {
  const { resetDemo } = usePortalStore()
  const { t } = useI18n()

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className={styles.split}>
        <Card title={t('settings.profile')}>
          <KeyValue
            items={[
              { key: t('settings.name'), value: USER.fullName },
              { key: t('settings.role'), value: t('user.role') },
              { key: t('settings.email'), value: USER.email },
            ]}
          />
          <div style={{ marginTop: 16 }}>
            <Button type="button" variant="secondary" disabled>
              {t('settings.editProfile')}
            </Button>
          </div>
        </Card>
        <Card title={t('settings.org')}>
          <KeyValue
            items={[
              { key: t('settings.legalEntity'), value: ORGANIZATION.name },
              { key: t('settings.inn'), value: ORGANIZATION.inn },
              { key: t('settings.regRole'), value: t('settings.regRoleValue') },
            ]}
          />
        </Card>
      </div>

      <Card title={t('settings.language')}>
        <div className={styles.list}>
          <p className={styles.formHint}>{t('settings.languageHint')}</p>
          <LocaleSwitch />
        </div>
      </Card>

      <Card title={t('settings.demo')}>
        <div className={styles.list}>
          <Callout tone="quiet">{t('settings.demoHint')}</Callout>
          <div>
            <Button type="button" variant="secondary" onClick={resetDemo}>
              {t('settings.reset')}
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
}
