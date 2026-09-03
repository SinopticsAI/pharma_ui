import { ruFormat } from '@demo/i18n'
import { Callout, Card, Empty, KeyValue, PageHeader, StatusBadge, Table, ui } from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { CREDENTIAL_LABEL, MANDATE_STATUS_LABEL, MANDATE_STEP_LABEL } from '../labels'
import { useCase, useLedger, useMandate } from '../queries'

export function MandatePage() {
  const caseId = useCaseId()
  const mandate = useMandate(caseId)
  const ledger = useLedger(caseId)
  const caseQuery = useCase(caseId)

  if (!mandate.data || !caseQuery.data) return <Empty>Загружаем мандат</Empty>

  const steps = mandate.data.steps
  const mandateDone = steps.every((step) => step.status === 'done')
  const dutyPaid = (ledger.data ?? []).some(
    (line) => line.purpose.ru.toLowerCase().includes('пошлина') && (line.status === 'paid' || line.status === 'closed'),
  )
  const today = new Date().toISOString().slice(0, 10)
  const credentialsValid = mandate.data.credentials.every((credential) => credential.validUntil > today)

  return (
    <>
      <PageHeader
        title="Мандат и подпись"
        lead="Подать заявление из Китая напрямую нельзя. Заявитель — российская компания, и вход в государственные кабинеты принадлежит ей."
      />

      <Card title="Назначение представителя">
        <KeyValue
          items={[
            { key: 'Представитель', value: mandate.data.operator },
            {
              key: 'Роль',
              value:
                mandate.data.role === 'upp'
                  ? 'Уполномоченный представитель производителя'
                  : 'Представитель держателя регистрационного удостоверения',
            },
          ]}
        />
        <Table head={['Шаг', 'Статус', 'Дата', 'Примечание']}>
          {steps.map((step) => (
            <tr key={step.key}>
              <td>{MANDATE_STEP_LABEL[step.key]}</td>
              <td>
                <StatusBadge tone={step.status === 'done' ? 'accent' : step.status === 'in-progress' ? 'warm' : 'quiet'}>
                  {MANDATE_STATUS_LABEL[step.status]}
                </StatusBadge>
              </td>
              <td>{step.date ? ruFormat.date(step.date) : '—'}</td>
              <td>{step.note?.ru ?? ''}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Криптоконтур российской компании" meta="в кабинете производителя этих сущностей нет">
        <Table head={['Сущность', 'Владелец', 'Действует до', 'Примечание']}>
          {mandate.data.credentials.map((credential) => (
            <tr key={credential.kind}>
              <td>{CREDENTIAL_LABEL[credential.kind]}</td>
              <td>{credential.holder}</td>
              <td>{ruFormat.date(credential.validUntil)}</td>
              <td>{credential.note}</td>
            </tr>
          ))}
        </Table>
        <Callout tone="quiet">
          Ключи и криптооперации остаются на рабочем месте оператора. Портал хранит подписанный пакет и квитанции, а не
          сертификат и не контейнер.
        </Callout>
      </Card>

      <Card title="Предподачный чеклист">
        <div className={ui.stack}>
          <div className={ui.row}>
            <StatusBadge tone={mandateDone ? 'accent' : 'warm'}>
              Мандат: {mandateDone ? 'завершён' : 'не завершён'}
            </StatusBadge>
            <StatusBadge tone={caseQuery.data.modelsLocked ? 'accent' : 'warm'}>
              Список моделей: {caseQuery.data.modelsLocked ? 'закрыт' : 'открыт'}
            </StatusBadge>
            <StatusBadge tone={dutyPaid ? 'accent' : 'warm'}>
              Государственная пошлина: {dutyPaid ? 'уплачена' : 'не уплачена'}
            </StatusBadge>
            <StatusBadge tone={credentialsValid ? 'accent' : 'warm'}>
              УКЭП и МЧД: {credentialsValid ? 'действуют' : 'требуют обновления'}
            </StatusBadge>
          </div>
          <span className={ui.muted}>
            Пока хотя бы один пункт открыт, кейс не переходит к подаче: юридически значимый канал остаётся
            государственным кабинетом, и пакет должен быть полным до отправки.
          </span>
        </div>
      </Card>
    </>
  )
}
