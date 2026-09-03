import { useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import { l10n } from '@demo/domain'
import { Button, Callout, Card, KeyValue, PageHeader } from '../components/Ui'
import { LocaleSwitch } from '../components/LocaleSwitch'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function SettingsPage() {
  const identity = useIdentity()
  const { logout } = useAuth()
  const { t, text } = useI18n()

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className={styles.split}>
        <Card title={t('settings.profile')}>
          <KeyValue
            items={[
              { key: t('settings.name'), value: identity.displayName || t('common.unspecified') },
              { key: t('settings.role'), value: t(`role.${identity.role}`) },
              { key: t('settings.subject'), value: identity.subject },
            ]}
          />
        </Card>
        <Card title={t('settings.org')}>
          <KeyValue
            items={[
              { key: t('settings.legalEntity'), value: text(l10n(identity.account.name, identity.accountId).ru) },
              { key: t('settings.accountStatus'), value: identity.account.status },
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

      <Card title={t('settings.session')}>
        <div className={styles.list}>
          {/* Личностью владеет система входа, арендатором — продукт: роль меняет менеджер. */}
          <Callout tone="quiet">{t('settings.sessionHint')}</Callout>
          <div>
            <Button type="button" variant="secondary" onClick={logout}>
              {t('settings.logout')}
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
}
