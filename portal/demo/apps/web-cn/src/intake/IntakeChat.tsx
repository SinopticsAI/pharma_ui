import { useMemo, useState } from 'react'
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
} from '@assistant-ui/react'
import type { CardPayload, ProgressSection } from '@demo/mock'
import { progressPercent } from '@demo/mock'
import { createIntakeAdapter } from './runtime'
import { IntakeCard } from './cards'
import styles from './intake.module.css'

/**
 * Экран интейка: слева нить диалога, справа прогресс профиля по разделам.
 *
 * Примитивы assistant-ui headless, поэтому стилизуются токенами кабинета —
 * Tailwind и shadcn-скаффолд здесь не нужны.
 */

const SECTION_LABEL: Record<ProgressSection['key'], string> = {
  identity: 'Реквизиты и реестр',
  documents: 'Документы компании',
  authority: 'Полномочия и подписи',
  banking: 'Банк и счета',
  risk: 'Проверка рисков',
}

function ProgressPanel({ sections, title }: { sections: ProgressSection[]; title: string }) {
  const percent = progressPercent(sections)
  return (
    <aside className={styles.panel}>
      <div className={styles.panelHead}>
        <span>{title}</span>
        <strong>{percent}%</strong>
      </div>
      <ul className={styles.sections}>
        {sections.map((section) => {
          const done = section.total > 0 && section.filled === section.total
          return (
            <li key={section.key} data-done={done}>
              <span>{SECTION_LABEL[section.key]}</span>
              <span className={styles.sectionCount}>
                {done ? 'готово' : `${section.filled} из ${section.total}`}
              </span>
            </li>
          )
        })}
      </ul>
      <p className={styles.panelNote}>
        Разделы отмечает агент по мере разбора документов, а не вы вручную.
      </p>
    </aside>
  )
}

function Thread({ cards, onApprove, onSelectVariant, onAttach, onAnswer }: {
  cards: CardPayload[]
  onApprove: () => void
  onSelectVariant: (id: string) => void
  onAttach: (itemType: string) => void
  onAnswer: (text: string) => void
}) {
  return (
    <ThreadPrimitive.Root className={styles.thread}>
      <ThreadPrimitive.Viewport className={styles.viewport}>
        <ThreadPrimitive.Empty>
          <p className={styles.empty}>
            Диалог примерно на пятнадцать минут. Агент заполнит профиль по вашим документам —
            анкету заполнять не нужно.
          </p>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage: () => (
              <MessagePrimitive.Root className={styles.msgUser} data-role="user">
                <MessagePrimitive.Parts />
              </MessagePrimitive.Root>
            ),
            AssistantMessage: () => (
              <MessagePrimitive.Root className={styles.msgAgent} data-role="assistant">
                <MessagePrimitive.Parts />
              </MessagePrimitive.Root>
            ),
          }}
        />

        {cards.map((card, index) => (
          <IntakeCard
            key={`${card.kind}-${index}`}
            card={card}
            onApprove={onApprove}
            onSelectVariant={onSelectVariant}
            onAttach={onAttach}
            onAnswer={onAnswer}
          />
        ))}

        {/* Ответ буферизован: без явного индикатора пауза читается как зависание. */}
        <ThreadPrimitive.If running>
          <div className={styles.thinking}>
            <span className={styles.spinner} aria-hidden="true" />
            Агент думает
          </div>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <ComposerPrimitive.Root className={styles.composer}>
        <ComposerPrimitive.Input
          className={styles.composerInput}
          placeholder="Напишите агенту или приложите документ"
          rows={1}
        />
        <ComposerPrimitive.Send className={styles.primary}>Отправить</ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
    </ThreadPrimitive.Root>
  )
}

export function IntakeChat({
  agentId,
  sessionId,
  title,
  sections,
}: {
  agentId: 'companyIntake' | 'productIntake'
  sessionId: string
  title: string
  sections: ProgressSection[]
}) {
  const [cards, setCards] = useState<CardPayload[]>([])

  const adapter = useMemo(
    () =>
      createIntakeAdapter({
        agentId,
        sessionId,
        onCard: (card) => setCards((prev) => [...prev, card]),
      }),
    [agentId, sessionId],
  )
  const runtime = useLocalRuntime(adapter)

  const append = (text: string) => {
    void runtime.thread.append({ role: 'user', content: [{ type: 'text', text }] })
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className={styles.layout}>
        <Thread
          cards={cards}
          onApprove={() => append('Одобряю данные')}
          onSelectVariant={(id) => append(`Выбираю вариант ${id}`)}
          onAttach={(itemType) => append(`Приложил документ: ${itemType}`)}
          onAnswer={(text) => append(text)}
        />
        <ProgressPanel sections={sections} title={title} />
      </div>
    </AssistantRuntimeProvider>
  )
}
