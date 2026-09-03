import { Link } from '@tanstack/react-router'
import { useI18n } from '@demo/i18n'
import { Card, Empty, Estimate, KeyValue, PageHeader, StatusBadge, ui } from '@demo/ui'
import { mockCompanies, mockProducts, progressPercent } from '@demo/mock'
import { Shell } from '../Shell'
import { useCases } from '../queries'
import styles from './portfolio.module.css'

/**
 * Главная отвечает на вопрос «что делать дальше» по каждому объекту, а не
 * показывает общий inbox. Отсюда два входа: компания и продукт — продукт
 * всегда принадлежит ровно одной компании.
 */
export function PortfolioPage() {
  const { t, text } = useI18n()
  const cases = useCases()
  const companies = mockCompanies()
  const products = mockProducts()

  const nav = (cases.data ?? []).map((item) => (
    <Link
      key={item.id}
      to="/case/$caseId"
      params={{ caseId: item.id }}
      className={ui.navItem}
      activeProps={{ className: `${ui.navItem} ${ui.navItemActive}` }}
    >
      {item.code} · {text(item.product).value}
    </Link>
  ))

  const firstCompany = companies[0]

  return (
    <Shell nav={nav}>
      <PageHeader title={t('portfolio.title')} lead={t('portfolio.lead')} />

      <div className={styles.cta}>
        <Link to="/intake/company" className={styles.ctaCard}>
          <strong>Зарегистрировать компанию</strong>
          <span>Диалог с агентом ≈ 15 минут — он заполнит профиль по вашим документам</span>
        </Link>
        <Link
          to="/intake/product/$companyId"
          params={{ companyId: firstCompany?.id ?? 'org-demo' }}
          className={styles.ctaCard}
          // Продукт без компании завести нельзя: профиль должен быть одобрен.
          aria-disabled={!firstCompany || firstCompany.status !== 'profile_approved'}
        >
          <strong>Добавить продукт</strong>
          <span>Агент соберёт данные, предложит классификацию и построит карту</span>
        </Link>
      </div>

      <h3 className={styles.sectionTitle}>Компании</h3>
      <div className={ui.grid2}>
        {companies.map((company) => {
          const percent = progressPercent(company.sections)
          const done = percent === 100
          return (
            <Card key={company.id} title={company.name} meta={company.registrationNumber}>
              <div className={ui.row}>
                <StatusBadge tone={company.riskLevel === 'low' ? 'accent' : 'warm'}>
                  {company.riskLevel === 'low' ? 'риск низкий · берём в работу' : 'проверка рисков'}
                </StatusBadge>
                <StatusBadge tone="quiet">{company.productIds.length} продукт(а)</StatusBadge>
              </div>
              <KeyValue
                items={[
                  { key: 'Профиль', value: `${percent}%` },
                  {
                    key: 'Документы',
                    value: done ? 'собраны' : 'агент продолжает собирать',
                  },
                ]}
              />
              {/* Незавершённая компания остаётся карточкой с кнопкой возврата в диалог. */}
              {!done ? (
                <Link to="/intake/company">Продолжить с агентом →</Link>
              ) : null}
            </Card>
          )
        })}
      </div>

      <h3 className={styles.sectionTitle}>Продукты</h3>
      <div className={ui.grid2}>
        {products.map((product) => (
          <Card key={product.id} title={product.name} meta={`Комплектность ${product.completeness}%`}>
            <div className={ui.row}>
              <StatusBadge tone={product.status === 'variant_selected' ? 'accent' : 'neutral'}>
                {product.status === 'variant_selected' ? 'вариант выбран' : 'сбор данных'}
              </StatusBadge>
            </div>
            {product.caseId ? (
              <Link to="/case/$caseId" params={{ caseId: product.caseId }}>
                Открыть кейс →
              </Link>
            ) : (
              <Link to="/intake/product/$companyId" params={{ companyId: product.companyId }}>
                Продолжить с агентом →
              </Link>
            )}
          </Card>
        ))}
      </div>

      {cases.isLoading ? <Empty>{t('common.loading')}</Empty> : null}

      <h3 className={styles.sectionTitle}>Кейсы</h3>
      <div className={ui.grid2}>
        {(cases.data ?? []).map((item) => (
          <Card key={item.id} title={`${item.code} · ${text(item.product).value}`} meta={text(item.manufacturer).value}>
            <div className={ui.row}>
              <StatusBadge tone="accent">{t(`stage.${item.currentStage}`)}</StatusBadge>
              <StatusBadge>{t(`track.${item.track}`)}</StatusBadge>
              <StatusBadge tone="quiet">
                {t('case.class')}: {item.riskClass}
              </StatusBadge>
            </div>
            <KeyValue
              items={[
                { key: t('portfolio.waiting'), value: text(item.waitingFor).value },
                {
                  key: t('portfolio.due'),
                  value: (
                    <StatusBadge tone={item.dueWorkingDays <= 10 ? 'warm' : 'neutral'}>
                      {item.dueWorkingDays} {t('common.workingDays')}
                    </StatusBadge>
                  ),
                },
                {
                  key: t('case.cycle'),
                  value: `${item.cycleMonths[0]}–${item.cycleMonths[1]} ${t('common.months')}`,
                },
              ]}
            />
            <Link to="/case/$caseId" params={{ caseId: item.id }}>
              {t('portfolio.open')} →
            </Link>
          </Card>
        ))}
      </div>

      <Estimate>{t('common.estimate')}</Estimate>
    </Shell>
  )
}
