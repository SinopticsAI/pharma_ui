import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { StageKey } from '@demo/domain'
import { STAGE_ORDER, nextStage, stagePosition } from '@demo/domain'
import { ruFormat } from '@demo/i18n'
import { addStatus } from '@demo/mock'
import {
  Button,
  Callout,
  Card,
  Empty,
  Field,
  KeyValue,
  PageHeader,
  StagePills,
  StatusBadge,
  Timeline,
  TimelineItem,
  ui,
} from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { ACTOR_LABEL, OPERATORS, STAGE_LABEL, TRACK_LABEL } from '../labels'
import { useAudit, useCase, useStatuses } from '../queries'

const SUGGESTION: Partial<Record<StageKey, string>> = {
  dossier: 'Комплект досье проверен, расхождений между инструкцией, маркировкой и протоколами нет',
  samples: 'Образцы приняты лабораторией, программа испытаний согласована',
  filing: 'Протокол испытаний получен, пакет подписан и отправлен через государственный кабинет',
  expertise: 'Поступил запрос экспертизы, срок ответа взят на контроль',
  registry: 'Реестровая запись опубликована, сверяем поля с досье',
  postreg: 'Заведены пострегистрационные обязательства и календарь vigilance',
}

export function CasePage() {
  const caseId = useCaseId()
  const queryClient = useQueryClient()
  const caseQuery = useCase(caseId)
  const statuses = useStatuses(caseId)
  const audit = useAudit(caseId)

  const suggestedStage = useMemo<StageKey | undefined>(
    () => (caseQuery.data ? (nextStage(caseQuery.data.currentStage) ?? caseQuery.data.currentStage) : undefined),
    [caseQuery.data],
  )

  const [stage, setStage] = useState<StageKey | ''>('')
  const [text, setText] = useState('')
  const [artifact, setArtifact] = useState('')
  const [author, setAuthor] = useState(OPERATORS[0])
  const [saved, setSaved] = useState(false)

  const effectiveStage = (stage || suggestedStage) as StageKey | undefined
  const effectiveText = text || (effectiveStage ? (SUGGESTION[effectiveStage] ?? '') : '')

  const mutation = useMutation({
    mutationFn: addStatus,
    onSuccess: async () => {
      setSaved(true)
      setText('')
      setArtifact('')
      setStage('')
      await queryClient.invalidateQueries()
    },
  })

  if (!caseQuery.data) return <Empty>Загружаем кейс</Empty>
  const current = caseQuery.data

  return (
    <>
      <PageHeader title={`${current.code} · ${current.product.ru}`} lead={current.manufacturer.ru} />

      <Card>
        <StagePills
          stages={STAGE_ORDER.map((item) => ({
            key: item,
            label: STAGE_LABEL[item],
            position: stagePosition(item, current.currentStage),
          }))}
        />
        <KeyValue
          items={[
            { key: 'Правовой трек', value: TRACK_LABEL[current.track] },
            { key: 'Класс риска', value: current.riskClass },
            { key: 'Ждём', value: current.waitingFor.ru },
            {
              key: 'Следующий шаг за',
              value: (
                <StatusBadge tone={current.dueWorkingDays <= 10 ? 'warm' : 'neutral'}>
                  {ACTOR_LABEL[current.nextActor]} · {current.dueWorkingDays} р.д.
                </StatusBadge>
              ),
            },
          ]}
        />
      </Card>

      {!current.mandateComplete ? (
        <Callout tone="deadline">
          Мандат не завершён. Кейс не переходит к подаче: заявителем выступает российская компания, и это условие права,
          а не настройка портала.
        </Callout>
      ) : null}

      <div className={ui.split}>
        <Card title="Внести статус как в государственном кабинете">
          <form
            className={ui.stack}
            onSubmit={(event) => {
              event.preventDefault()
              if (!effectiveStage || !effectiveText || !artifact) return
              mutation.mutate({
                caseId,
                stage: effectiveStage,
                text: effectiveText,
                artifact,
                enteredBy: author,
              })
            }}
          >
            <Field label="Этап кейса">
              <select value={effectiveStage ?? ''} onChange={(event) => setStage(event.target.value as StageKey)}>
                {STAGE_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {STAGE_LABEL[item]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Статус" hint="Формулировка повторяет запись государственного кабинета, а не пересказывает её.">
              <textarea value={effectiveText} onChange={(event) => setText(event.target.value)} />
            </Field>

            <Field
              label="Артефакт"
              hint="Выписка, скан или квитанция. Без приложенного документа статус не сохраняется."
            >
              <input
                value={artifact}
                placeholder="vniiimt-test-report.pdf"
                onChange={(event) => setArtifact(event.target.value)}
              />
            </Field>

            <Field label="Файл с рабочего места" hint="Файл не загружается в демо: берём только имя.">
              <input
                type="file"
                onChange={(event) => {
                  const picked = event.target.files?.[0]
                  if (picked) setArtifact(picked.name)
                }}
              />
            </Field>

            <Field label="Внёс">
              <select value={author} onChange={(event) => setAuthor(event.target.value)}>
                {OPERATORS.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
            </Field>

            <div className={ui.row}>
              <Button type="submit" disabled={!artifact || !effectiveText || mutation.isPending}>
                {mutation.isPending ? 'Сохраняем…' : 'Внести статус'}
              </Button>
              <span className={ui.muted}>Сначала человек, потом коннектор.</span>
            </div>
          </form>

          {saved ? (
            <Callout>
              Статус внесён и зеркалирован в кабинет производителя. Если кабинет открыт в соседней вкладке, он уже
              обновился.
            </Callout>
          ) : null}
        </Card>

        <div className={ui.stack}>
          <Card title="История статусов">
            {(statuses.data ?? []).length === 0 ? (
              <Empty>Статусов пока нет</Empty>
            ) : (
              <Timeline>
                {(statuses.data ?? []).slice(0, 5).map((entry) => (
                  <TimelineItem key={entry.id} date={ruFormat.dateTime(entry.enteredAt)}>
                    <span>{entry.text.ru}</span>
                    <div className={ui.row}>
                      <StatusBadge tone="quiet">{STAGE_LABEL[entry.stage]}</StatusBadge>
                      <StatusBadge>{entry.artifact}</StatusBadge>
                    </div>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Card>

          <Card title="Журнал аудита" meta="выгружается клиенту целиком">
            <Timeline>
              {(audit.data ?? []).slice(0, 6).map((event) => (
                <TimelineItem key={event.id} date={ruFormat.dateTime(event.at)}>
                  <span>{event.action.ru}</span>
                  <span className={ui.muted}>{event.actor}</span>
                </TimelineItem>
              ))}
            </Timeline>
          </Card>
        </div>
      </div>
    </>
  )
}
