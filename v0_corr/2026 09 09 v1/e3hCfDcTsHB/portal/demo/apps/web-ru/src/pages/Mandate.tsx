import { hasCredentials, l10n } from '@demo/domain'
import { ruFormat } from '@demo/i18n'
import { Callout, Card, Empty, KeyValue, PageHeader, StatusBadge, Table, ui } from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { CREDENTIAL_LABEL, MANDATE_STATUS_LABEL, MANDATE_STEP_LABEL } from '../labels'
import { useCase } from '../queries'

export function MandatePage() {
  const caseId = useCaseId()
  const caseQuery = useCase(caseId)

  const detail = caseQuery.data
  const mandate = detail?.mandate
  if (!detail || !mandate) return <Empty>Загружаем мандат</Empty>

  const steps = mandate.steps
  const mandateDone = mandate.complete ?? steps.every((step) => step.status === 'done')
  const today = new Date().toISOString().slice(0, 10)
  const credentials = hasCredentials(mandate) ? mandate.credentials : []
  const credentialsValid = credentials.length > 0 && credentials.every((item) => item.validUntil > today)

  return (
    <>
      <PageHeader
        title="Мандат и подпись"
        lead="Подать заявление из Китая напрямую нельзя. Заявитель — российская компания, и вход в государственные кабинеты принадлежит ей."
      />

      <Card title="Назначение представителя">
        <KeyValue
          items={[
            { key: 'Представитель', value: mandate.operator || '—' },
            {
              key: 'Роль',
              value:
                mandate.role === 'upp'
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
              <td>{step.note ? l10n(step.note).ru : ''}</td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Реквизиты приходят только в контуре РФ: в сборке кабинета КНР их нет. */}
      <Card title="Криптоконтур российской компании" meta="в кабинете производителя этих сущностей нет">
        {credentials.length === 0 ? (
          <Empty>Реквизиты подписи по кейсу ещё не заведены.</Empty>
        ) : (
          <Table head={['Сущность', 'Владелец', 'Действует до', 'Примечание']}>
            {credentials.map((credential) => (
              <tr key={credential.kind}>
                <td>{CREDENTIAL_LABEL[credential.kind]}</td>
                <td>{credential.holder}</td>
                <td>{ruFormat.date(credential.validUntil)}</td>
                <td>{credential.note}</td>
              </tr>
            ))}
          </Table>
        )}
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
            <StatusBadge tone={detail.case.modelsLocked ? 'accent' : 'warm'}>
              Список моделей: {detail.case.modelsLocked ? 'закрыт' : 'открыт'}
            </StatusBadge>
            <StatusBadge tone={credentialsValid ? 'accent' : 'warm'}>
              УКЭП и МЧД: {credentialsValid ? 'действуют' : 'требуют обновления'}
            </StatusBadge>
          </div>
          <span className={ui.muted}>
            Пока мандат не завершён и список моделей открыт, ядро отказывает в статусах от подачи и дальше. Юридически
            значимый канал остаётся государственным кабинетом.
          </span>
        </div>
      </Card>
    </>
  )
}
