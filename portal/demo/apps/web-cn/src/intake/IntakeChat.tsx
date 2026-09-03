import { useMemo, useRef, useState } from 'react'
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'
import { describeError, useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import type { ProgressSection } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { IntakeToolUIs } from './cards'
import { IntakeActionsProvider, type IntakeActions } from './context'
import { createIntakeTransport, type AgentId } from './transport'
import { useApproveCompanyProfile, useApproveProductData, useUploadOrgItem } from '../queries'
import styles from './intake.module.css'

/**
 * Экран интейка: слева нить диалога, справа комплектность по разделам.
 *
 * Примитивы assistant-ui headless, поэтому стилизуются токенами кабинета.
 * Разделы отмечает ядро по мере разбора документов — вручную их не двигают.
 */

const SECTION_LABEL: Record<ProgressSection['key'], string> = {
  identity: 'Реквизиты и реестр',
  documents: 'Документы компании',
  authority: 'Полномочия и подписи',
  banking: 'Банк и счета',
  risk: 'Проверка рисков',
}

function ProgressPanel({
  sections,
  missing,
  percent,
  title,
}: {
  sections: ProgressSection[]
  missing: string[]
  percent: number
  title: string
}) {
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
              <span>{SECTION_LABEL[section.key] ?? section.key}</span>
              <span className={styles.sectionCount}>
                {done ? 'готово' : `${section.filled} из ${section.total}`}
              </span>
            </li>
          )
        })}
        {/* У продукта разделов нет: ядро возвращает список незаполненных полей. */}
        {sections.length === 0
          ? missing.map((field) => (
              <li key={field} data-done={false}>
                <span>{field}</span>
                <span className={styles.sectionCount}>нужно</span>
              </li>
            ))
          : null}
      </ul>
      <p className={styles.panelNote}>
        Разделы отмечает агент по мере разбора документов, а не вы вручную.
      </p>
    </aside>
  )
}

function Thread() {
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

        {/* Потока нет: контейнер завершает ход до ответа, пауза читается как зависание. */}
        <ThreadPrimitive.If running>
          <div className={styles.thinking}>
            <span className={styles.spinner} aria-hidden="true" />
            Агент читает документ
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
  organizationId,
  productId,
  title,
  sections,
  missing = [],
  percent,
}: {
  agentId: AgentId
  sessionId: string
  organizationId: string
  productId?: string
  title: string
  sections: ProgressSection[]
  missing?: string[]
  percent: number
}) {
  const { locale } = useI18n()
  const identity = useIdentity()
  const { getAccessToken } = useAuth()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingType, setPendingType] = useState('other')

  const upload = useUploadOrgItem(organizationId, productId)
  const approveCompany = useApproveCompanyProfile(organizationId)
  const approveProduct = useApproveProductData(productId ?? '')

  const transport = useMemo(
    () =>
      createIntakeTransport({
        agentId,
        sessionId,
        accountId: identity.accountId,
        locale,
        getToken: getAccessToken,
      }),
    [agentId, sessionId, identity.accountId, locale, getAccessToken],
  )

  const runtime = useChatRuntime({ transport })

  const actions = useMemo<IntakeActions>(
    () => ({
      send: (text) => {
        void runtime.thread.append({ role: 'user', content: [{ type: 'text', text }] })
      },
      attach: (itemType) => {
        setPendingType(itemType)
        fileInput.current?.click()
      },
      approveDraft: (scope, _entityId) => {
        if (scope === 'company') approveCompany.mutate()
        else if (productId) approveProduct.mutate()
      },
      busy: upload.isPending || approveCompany.isPending || approveProduct.isPending,
    }),
    [runtime, upload.isPending, approveCompany, approveProduct, productId],
  )

  const failure = upload.error ?? approveCompany.error ?? approveProduct.error

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <IntakeActionsProvider value={actions}>
        <IntakeToolUIs />
        <div className={styles.layout}>
          <div>
            {failure ? <p className={styles.cardWhy}>{describeError(failure)}</p> : null}
            <Thread />
            <input
              ref={fileInput}
              type="file"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) upload.mutate({ file, itemType: pendingType })
              }}
            />
          </div>
          <ProgressPanel sections={sections} missing={missing} percent={percent} title={title} />
        </div>
      </IntakeActionsProvider>
    </AssistantRuntimeProvider>
  )
}
