import { useMemo, useState } from 'react'
import { describeError, useIdentity } from '@demo/api-client'
import type { StageKey } from '@demo/domain'
import { STAGE_ORDER, l10n, nextStage, stagePosition } from '@demo/domain'
import { ruFormat } from '@demo/i18n'
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
import { ACTOR_LABEL, NODE_OWNER_LABEL, NODE_STATUS_LABEL, STAGE_LABEL, TRACK_LABEL } from '../labels'
import { useAddStatus, useCase, useRegistrySearch, useStatuses } from '../queries'

const SUGGESTION: Partial<Record<StageKey, string>> = {
  dossier: 'Комплект досье проверен, расхождений между инструкцией, маркировкой и протоколами нет',
  samples: 'Образцы приняты лабораторией, программа испытаний согласована',
  filing: 'Протокол испытаний получен, пакет подписан и отправлен через государственный кабинет',
  expertise: 'Поступил запрос экспертизы, срок ответа взят на контроль',
  registry: 'Реестровая запись опубликована, сверяем поля с досье',
  postreg: 'Заведены пострегистрационные обязательства и календарь vigilance',
}

function RegistryCheck({ initial }: { initial: string }) {
  const [query, setQuery] = useState(initial)
  const [source, setSource] = useState<'elk' | 'grls'>('elk')
  const search = useRegistrySearch(query, source)

  return (
    <Card title="Сверка реестров" meta="кэш ответа, не истина">
      <div className={ui.row}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Что искать" />
        <select value={source} onChange={(event) => setSource(event.target.value as 'elk' | 'grls')}>
          <option value="elk">Реестр медицинских изделий</option>
          <option value="grls">ГРЛС</option>
        </select>
      </div>

      {search.isFetching ? <Empty>Спрашиваем ядро</Empty> : null}
      {search.data && search.data.hits.length === 0 ? (
        <Empty>Ядро вернуло пустой ответ. Запись сверяется вручную по ссылке на реестр.</Empty>
      ) : null}
      {(search.data?.hits ?? []).map((hit, index) => (
        <KeyValue
          key={index}
          items={[
            { key: 'Номер', value: hit.number ?? '—' },
            { key: 'Владелец', value: hit.holder ?? '—' },
            { key: 'Запись', value: hit.title ?? '—' },
          ]}
        />
      ))}

      <div className={ui.row}>
        <a href="https://elk.roszdravnadzor.gov.ru/widget/" target="_blank" rel="noreferrer">
          Виджет Росздравнадзора
        </a>
        <a href="https://grls.rosminzdrav.ru" target="_blank" rel="noreferrer">
          ГРЛС
        </a>
      </div>
      <span className={ui.muted}>
        Расхождение реестровой записи и досье — блокирующий алерт, а не предупреждение в углу.
      </span>
    </Card>
  )
}

export function CasePage() {
  const caseId = useCaseId()
  const identity = useIdentity()
  const caseQuery = useCase(caseId)
  const statuses = useStatuses(caseId)
  const addStatus = useAddStatus(caseId)

  const detail = caseQuery.data
  const current = detail?.case

  const suggestedStage = useMemo<StageKey | undefined>(
    () => (current ? (nextStage(current.currentStage) ?? current.currentStage) : undefined),
    [current],
  )

  const [stage, setStage] = useState<StageKey | ''>('')
  const [text, setText] = useState('')
  const [artifact, setArtifact] = useState('')

  if (!detail || !current) return <Empty>Загружаем кейс</Empty>

  const effectiveStage = (stage || suggestedStage) as StageKey | undefined
  const effectiveText = text || (effectiveStage ? (SUGGESTION[effectiveStage] ?? '') : '')
  const critical = detail.criticalNode

  return (
    <>
      <PageHeader title={`${current.code} · ${l10n(current.product).ru}`} lead={l10n(current.manufacturer).ru} />

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
            { key: 'Ждём', value: l10n(current.waitingFor).ru },
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

      {critical ? (
        <Callout tone="deadline">
          <strong>Следующий узел карты:</strong> {critical.code} · {l10n(critical.title).ru} ·{' '}
          {NODE_OWNER_LABEL[critical.owner]}
        </Callout>
      ) : null}

      {!current.mandateComplete ? (
        <Callout tone="deadline">
          Мандат не завершён. Кейс не переходит к подаче: заявителем выступает российская компания, и это условие права,
          а не настройка портала.
        </Callout>
      ) : null}

      <div className={ui.split}>
        {identity.can.operate ? (
          <Card title="Внести статус как в государственном кабинете">
            <form
              className={ui.stack}
              onSubmit={(event) => {
                event.preventDefault()
                if (!effectiveStage || !effectiveText || !artifact) return
                addStatus.mutate(
                  {
                    stage: effectiveStage,
                    text: effectiveText,
                    artifact,
                    enteredBy: identity.displayName || identity.subject,
                  },
                  {
                    onSuccess: () => {
                      setText('')
                      setArtifact('')
                      setStage('')
                    },
                  },
                )
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
                hint="Выписка, скан или квитанция. Без приложенного документа ядро статус не примет."
              >
                <input
                  value={artifact}
                  placeholder="vniiimt-test-report.pdf"
                  onChange={(event) => setArtifact(event.target.value)}
                />
              </Field>

              <div className={ui.row}>
                <Button type="submit" disabled={!artifact || !effectiveText || addStatus.isPending}>
                  {addStatus.isPending ? 'Сохраняем…' : 'Внести статус'}
                </Button>
                <span className={ui.muted}>Сначала человек, потом коннектор.</span>
              </div>
            </form>

            {addStatus.isError ? <Callout tone="deadline">{describeError(addStatus.error)}</Callout> : null}
            {addStatus.isSuccess ? (
              <Callout>Статус внесён. Кабинет производителя увидит его при следующем запросе.</Callout>
            ) : null}
          </Card>
        ) : (
          <Card title="Внести статус">
            {/* Право решает сервер: маршрут ввода статуса открыт только оператору. */}
            <Empty>Статус вносит оператор. У этой роли маршрут закрыт, и ядро вернёт отказ.</Empty>
          </Card>
        )}

        <div className={ui.stack}>
          <Card title="История статусов">
            {(statuses.data ?? []).length === 0 ? (
              <Empty>Статусов пока нет</Empty>
            ) : (
              <Timeline>
                {(statuses.data ?? []).slice(0, 5).map((entry) => (
                  <TimelineItem key={entry.id} date={ruFormat.dateTime(entry.enteredAt)}>
                    <span>{l10n(entry.text).ru}</span>
                    <div className={ui.row}>
                      <StatusBadge tone="quiet">{STAGE_LABEL[entry.stage]}</StatusBadge>
                      <StatusBadge>{entry.artifact}</StatusBadge>
                      <StatusBadge tone="quiet">{entry.enteredBy}</StatusBadge>
                    </div>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Card>

          <Card title="Карта процесса">
            <div className={ui.stack}>
              {detail.nodeMap.map((node) => (
                <div key={node.code} className={ui.cardHeader}>
                  <span>
                    {node.code} · {l10n(node.title).ru}
                  </span>
                  <StatusBadge tone={node.critical ? 'warm' : node.status === 'done' ? 'accent' : 'quiet'}>
                    {NODE_STATUS_LABEL[node.status]}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <RegistryCheck initial={l10n(current.product).ru} />
    </>
  )
}
