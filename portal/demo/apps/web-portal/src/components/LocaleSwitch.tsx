import { LOCALES, LOCALE_LABEL, useI18n } from '../i18n'
import styles from '../styles/shell.module.css'

export function LocaleSwitch() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className={styles.locales} role="group" aria-label={t('app.languageAria')}>
      {LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          className={`${styles.localeBtn} ${locale === item ? styles.localeBtnActive : ''}`}
          aria-pressed={locale === item}
          onClick={() => setLocale(item)}
        >
          {LOCALE_LABEL[item]}
        </button>
      ))}
    </div>
  )
}
