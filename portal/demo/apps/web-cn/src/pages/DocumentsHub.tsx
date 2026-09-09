import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { demoDocuments } from '../demo/catalog'
import { Card, DemoMark, PageHeader, StatusBadge, Table } from '../kit'
import { Shell } from '../Shell'

export function DocumentsHubPage() {
  const { t, text } = useI18n()
  const items = demoDocuments()
  const company = items.filter((item) => item.level === 'company')
  const product = items.filter((item) => item.level === 'product')

  return (
    <Shell>
      <PageHeader eyebrow={t('eyebrow.docs')} title={t('docs.title')} lead={t('docs.lead')} />
      <DemoMark>{t('shell.demoMark')}</DemoMark>
      <Card title={t('docs.companyLevel')}>
        <Table head={[t('intake.documents.type'), t('intake.documents.file'), t('intake.documents.status')]}>
          {company.map((item) => (
            <tr key={item.id}>
              <td>{text(l10n(item.title)).value}</td>
              <td className="text-sm">{item.fileName}</td>
              <td>
                <StatusBadge tone="ok">{t(`intake.itemStatus.${item.status}`)}</StatusBadge>
              </td>
            </tr>
          ))}
        </Table>
        <p className="text-xs text-muted-foreground">{t('docs.autoAdded')}</p>
      </Card>
      <Card title={t('docs.productLevel')}>
        <Table head={[t('intake.documents.type'), t('intake.documents.file'), t('docs.missing')]}>
          {product.map((item) => (
            <tr key={item.id}>
              <td>{text(l10n(item.title)).value}</td>
              <td className="text-sm">{item.fileName}</td>
              <td>—</td>
            </tr>
          ))}
          <tr>
            <td>{t('docs.missing')}</td>
            <td colSpan={2}>电安全试验协议</td>
          </tr>
        </Table>
      </Card>
    </Shell>
  )
}
