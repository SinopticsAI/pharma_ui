import { AssistantRuntimeProvider, ComposerPrimitive, MessagePrimitive, ThreadPrimitive } from '@assistant-ui/react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'
import { describeError, useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import type { ProgressSection } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Button } from '@demo/ui/components/button'
import { Input } from '@demo/ui/components/input'
import { useMemo, useRef, useState } from 'react'
import { useApproveCompanyProfile, useApproveProductData, useUploadOrgItem } from '../queries'
import { IntakeToolUIs } from './cards'
import { type IntakeActions, IntakeActionsProvider, useIntakeActions } from './context'
import { type AgentId, createIntakeTransport } from './transport'

/**
 * Экран интейка: слева нить диалога, справа комплектность по разделам.
 *
 * Примитивы assistant-ui остаются теми же, что ставит регистр thread:
 * транспорт и версии пакетов уже живые, UI собирается из shadcn.
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
    <aside className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span>{title}</span>
        <strong>{percent}%</strong>
      </div>
      <ul className="space-y-2 text-sm">
        {sections.map((section) => {
          const done = section.total > 0 && section.filled === section.total
          return (
            <li key={section.key} className="flex items-center justify-between gap-2">
              <span>{SECTION_LABEL[section.key] ?? section.key}</span>
              <span className="text-muted-foreground">{done ? 'готово' : `${section.filled} из ${section.total}`}</span>
            </li>
          )
        })}
        {sections.length === 0
          ? missing.map((field) => (
              <li key={field} className="flex items-center justify-between gap-2">
                <span>{field}</span>
                <span className="text-muted-foreground">нужно</span>
              </li>
            ))
          : null}
      </ul>
      <p className="text-xs text-muted-foreground">
        Разделы отмечает агент по мере разбора документов, а не вы вручную.
      </p>
    </aside>
  )
}

function Thread() {
  const { attach, busy } = useIntakeActions()

  return (
    <ThreadPrimitive.Root className="flex h-[560px] flex-col rounded-lg border bg-card">
      <ThreadPrimitive.Viewport className="flex-1 space-y-3 overflow-y-auto p-4">
        <ThreadPrimitive.Empty>
          <p className="text-sm text-muted-foreground">
            Приложите документ компании — агент разберёт его и заполнит карточку. Анкету писать не нужно.
          </p>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage: () => (
              <MessagePrimitive.Root
                className="ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                data-role="user"
              >
                <MessagePrimitive.Parts />
              </MessagePrimitive.Root>
            ),
            AssistantMessage: () => (
              <MessagePrimitive.Root
                className="max-w-[90%] space-y-2 rounded-lg bg-muted px-3 py-2 text-sm"
                data-role="assistant"
              >
                <MessagePrimitive.Parts />
              </MessagePrimitive.Root>
            ),
          }}
        />

        <ThreadPrimitive.If running>
          <div className="text-sm text-muted-foreground">Агент читает документ</div>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <ComposerPrimitive.Root className="flex items-end gap-2 border-t p-3">
        <ComposerPrimitive.Input
          className="min-h-9 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          placeholder="Напишите агенту"
          rows={1}
        />
        <Button type="button" variant="outline" disabled={busy} onClick={() => attach('other')}>
          Приложить документ
        </Button>
        <ComposerPrimitive.Send className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm text-primary-foreground">
          Отправить
        </ComposerPrimitive.Send>
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
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-2">
            {failure ? <p className="text-sm text-destructive">{describeError(failure)}</p> : null}
            <Thread />
            <Input
              ref={fileInput}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff,.doc,.docx,.xls,.xlsx"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                upload.mutate(
                  { file, itemType: pendingType },
                  {
                    onSuccess: () => {
                      actions.send(`Приложил документ: ${file.name}`)
                    },
                  },
                )
              }}
            />
          </div>
          <ProgressPanel sections={sections} missing={missing} percent={percent} title={title} />
        </div>
      </IntakeActionsProvider>
    </AssistantRuntimeProvider>
  )
}
