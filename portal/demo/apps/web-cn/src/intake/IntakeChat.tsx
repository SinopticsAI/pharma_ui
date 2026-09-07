import {
  AssistantRuntimeProvider,
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'
import { describeError, useApi, useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import type { IntakeMessage, ProgressSection } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Empty } from '../kit'
import {
  useApproveCompanyProfile,
  useApproveProductData,
  useIntakeMessages,
  useOrganizationItems,
  useProduct,
} from '../queries'
import { createIntakeAttachmentAdapter, pickIntakeFile } from './attachments'
import { IntakeToolUIs } from './cards'
import { type IntakeActions, IntakeActionsProvider, useIntakeActions } from './context'
import {
  EXTRACTION_SLOW_MS,
  type ExtractionBanner,
  type ExtractionItem,
  extractionBanner,
  extractionReadyIdsFromTexts,
  formatExtractionReady,
  nextAutoTurnItem,
  nextPendingSeen,
  readAutoturnFired,
  scopeExtractionItems,
  shouldAutoTurn,
  textsFromUnknownMessages,
  userMessagePresentation,
  writeAutoturnFired,
} from './extractionStatus'
import {
  JOURNAL_ASSISTANT_ROLES,
  JOURNAL_USER_ROLES,
  type JournalUiRole,
  journalPersistedIds,
  journalText,
  journalToolFallbackKey,
  journalToUiMessages,
  normalizeUiMessages,
  uiMessagesToRepository,
  unpersistedAppends,
} from './history'
import { type AgentId, createIntakeTransport } from './transport'

const ExtractionUiContext = createContext<{ banner: ExtractionBanner | null }>({ banner: null })

/**
 * Экран интейка: слева нить диалога и загрузки, справа комплектность по разделам.
 *
 * Окно рисует журнал Edge (`GET .../messages`), не память Mastra. User пишется
 * в журнал сразу после Send, assistant — только после успешного `/chat`.
 *
 * Документ прикладывается скрепкой в самом композере: файл становится вложением
 * сообщения, а не отдельной загрузкой рядом с чатом.
 */

const SECTION_KEY: Record<ProgressSection['key'], MessageKey> = {
  identity: 'intake.section.identity',
  documents: 'intake.section.documents',
  authority: 'intake.section.authority',
  banking: 'intake.section.banking',
  risk: 'intake.section.risk',
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
  const { t } = useI18n()

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
              <span>{t(SECTION_KEY[section.key])}</span>
              <span className="text-muted-foreground">
                {done
                  ? t('intake.chat.progressDone')
                  : `${section.filled} ${t('intake.chat.progressOf')} ${section.total}`}
              </span>
            </li>
          )
        })}
        {sections.length === 0
          ? missing.map((field) => (
              <li key={field} className="flex items-center justify-between gap-2">
                <span>{field}</span>
                <span className="text-muted-foreground">{t('intake.chat.progressNeeded')}</span>
              </li>
            ))
          : null}
      </ul>
      <p className="text-xs text-muted-foreground">{t('intake.chat.progressHint')}</p>
    </aside>
  )
}

function bannerText(banner: ExtractionBanner, t: (key: MessageKey) => string): string {
  if (banner.kind === 'slow') return t('intake.chat.extractingSlow').replace('{name}', banner.fileName)
  if (banner.kind === 'filling') return t('intake.chat.fillingCard')
  return t('intake.chat.extracting').replace('{name}', banner.fileName)
}

function UserText({ text }: { text: string }) {
  const { t } = useI18n()
  if (userMessagePresentation(text) === 'extraction-ready') {
    return <span data-extraction-ready>{t('intake.chat.extractionReady')}</span>
  }
  return <span>{text}</span>
}

function UserMessage() {
  return (
    <MessagePrimitive.Root
      className="max-w-[80%] space-y-1 rounded-lg px-3 py-2 text-sm [&:has([data-extraction-ready])]:bg-transparent [&:has([data-extraction-ready])]:text-muted-foreground [&:not(:has([data-extraction-ready]))]:ml-auto [&:not(:has([data-extraction-ready]))]:bg-primary [&:not(:has([data-extraction-ready]))]:text-primary-foreground"
      data-role="user"
    >
      <MessagePrimitive.Parts components={{ Text: ({ text }) => <UserText text={text} /> }} />
      <MessagePrimitive.Attachments>
        {() => (
          <AttachmentPrimitive.Root className="flex items-center gap-2 text-xs opacity-80">
            <AttachmentPrimitive.Name />
          </AttachmentPrimitive.Root>
        )}
      </MessagePrimitive.Attachments>
    </MessagePrimitive.Root>
  )
}

function Thread() {
  const { t } = useI18n()
  const { setItemType, composerItemType } = useIntakeActions()
  const { banner } = useContext(ExtractionUiContext)

  return (
    <ThreadPrimitive.Root className="flex h-[min(72vh,720px)] flex-col rounded-lg border bg-card">
      <ThreadPrimitive.Viewport className="flex-1 space-y-3 overflow-y-auto p-4">
        <ThreadPrimitive.Empty>
          <p className="text-sm text-muted-foreground">{t('intake.chat.empty')}</p>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
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

        {banner ? (
          <div className="text-sm text-muted-foreground">{bannerText(banner, t)}</div>
        ) : (
          <ThreadPrimitive.If running>
            <div className="text-sm text-muted-foreground">{t('intake.chat.reading')}</div>
          </ThreadPrimitive.If>
        )}
      </ThreadPrimitive.Viewport>

      <ComposerPrimitive.Root className="space-y-2 border-t p-3">
        <div className="flex flex-wrap gap-2 empty:hidden">
          <ComposerPrimitive.Attachments>
            {() => (
              <AttachmentPrimitive.Root className="inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs">
                <AttachmentPrimitive.Name />
                <AttachmentPrimitive.Remove
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={t('intake.chat.removeAttachment')}
                >
                  ×
                </AttachmentPrimitive.Remove>
              </AttachmentPrimitive.Root>
            )}
          </ComposerPrimitive.Attachments>
        </div>

        <div className="flex items-end gap-2">
          <ComposerPrimitive.Input
            className="min-h-9 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            placeholder={t('intake.chat.placeholder')}
            rows={1}
          />
          <ComposerPrimitive.AddAttachment
            multiple={false}
            onClick={() => setItemType(composerItemType)}
            className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm hover:bg-accent"
          >
            {t('intake.chat.attach')}
          </ComposerPrimitive.AddAttachment>
          <ComposerPrimitive.Send className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm text-primary-foreground">
            {t('intake.chat.send')}
          </ComposerPrimitive.Send>
        </div>
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
  aside,
}: {
  agentId: AgentId
  sessionId: string
  organizationId: string
  productId?: string
  title: string
  sections: ProgressSection[]
  missing?: string[]
  percent: number
  /** Реквизиты и документы: иначе они уезжают под чат и их не видно. */
  aside?: ReactNode
}) {
  const { t } = useI18n()
  const journal = useIntakeMessages(sessionId)

  if (journal.isLoading) {
    return <Empty>{t('common.loading')}</Empty>
  }

  return (
    <IntakeChatRuntime
      key={sessionId}
      agentId={agentId}
      sessionId={sessionId}
      organizationId={organizationId}
      productId={productId}
      title={title}
      sections={sections}
      missing={missing}
      percent={percent}
      aside={aside}
      journalRows={journal.data ?? []}
      journalFailed={journal.isError}
      journalLoadError={journal.error}
    />
  )
}

function IntakeChatRuntime({
  agentId,
  sessionId,
  organizationId,
  productId,
  title,
  sections,
  missing = [],
  percent,
  aside,
  journalRows,
  journalFailed,
  journalLoadError,
}: {
  agentId: AgentId
  sessionId: string
  organizationId: string
  productId?: string
  title: string
  sections: ProgressSection[]
  missing?: string[]
  percent: number
  aside?: ReactNode
  journalRows: IntakeMessage[]
  journalFailed: boolean
  journalLoadError: unknown
}) {
  const api = useApi()
  const queryClient = useQueryClient()
  const identity = useIdentity()
  const { locale, t } = useI18n()
  const { getAccessToken } = useAuth()
  const [uploadError, setUploadError] = useState<unknown>(null)
  const [journalError, setJournalError] = useState<unknown>(null)
  const persisted = useRef(journalPersistedIds(journalRows))
  const seed = useMemo(() => journalToUiMessages(journalRows, locale), [journalRows, locale])
  const seedRepository = useMemo(() => (seed.length > 0 ? uiMessagesToRepository(seed) : undefined), [seed])

  // Тип документа называет карточка `ask-document` перед выбором файла, а нужен
  // он адаптеру в момент отправки — поэтому не состояние, а ссылка.
  const composerItemType = agentId === 'companyIntake' ? 'business-license' : 'other'
  const itemType = useRef(composerItemType)

  const approveCompany = useApproveCompanyProfile(organizationId)
  const approveProduct = useApproveProductData(productId ?? '')
  const orgItems = useOrganizationItems(organizationId)
  const product = useProduct(productId ?? '')
  const extractionItems = useMemo<ExtractionItem[]>(() => {
    const rows = productId ? (product.data?.documents ?? []) : (orgItems.data ?? [])
    return scopeExtractionItems(rows, productId)
  }, [orgItems.data, product.data?.documents, productId])
  const pendingSeen = useRef(new Set<string>())
  const firedIds = useRef(new Set<string>())
  const fillingRef = useRef(false)
  const [filling, setFilling] = useState(false)
  const [fillingFileName, setFillingFileName] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [threadRunning, setThreadRunning] = useState(false)

  const transport = useMemo(
    () =>
      createIntakeTransport({
        agentId,
        sessionId,
        accountId: identity.accountId,
        locale,
        organizationId,
        productId,
        getToken: getAccessToken,
      }),
    [agentId, sessionId, identity.accountId, locale, organizationId, productId, getAccessToken],
  )

  const attachments = useMemo(
    () =>
      createIntakeAttachmentAdapter({
        api,
        queryClient,
        organizationId,
        productId,
        sessionId,
        itemType: () => itemType.current,
        onError: (error) => setUploadError(() => error),
        uploadedText: ({ name, organizationId: orgId, itemType: type, itemId }) =>
          t('intake.chat.uploaded')
            .replace('{name}', name)
            .replace('{organizationId}', orgId)
            .replace('{itemType}', type)
            .replace('{itemId}', itemId),
      }),
    [api, queryClient, organizationId, productId, sessionId, t],
  )

  const persistJournal = useCallback(
    (messages: ReturnType<typeof normalizeUiMessages>, roles: ReadonlySet<JournalUiRole>) => {
      // User — как только пузырь в нити (Subscribe, до /chat). Assistant — только onFinish.
      const writes = unpersistedAppends(messages, persisted.current, roles, (toolName) =>
        t(journalToolFallbackKey(toolName)),
      )
      for (const body of writes) {
        persisted.current.add(body.payload.clientMessageId)
        void api.appendIntakeMessage(sessionId, body).catch((error: unknown) => {
          persisted.current.delete(body.payload.clientMessageId)
          setJournalError(() => error)
        })
      }
    },
    [api, sessionId, t],
  )
  const persistJournalRef = useRef(persistJournal)
  persistJournalRef.current = persistJournal

  const runtime = useChatRuntime({
    transport,
    adapters: { attachments },
    messages: seed,
    ...(seedRepository ? { messageRepository: seedRepository } : {}),
    onFinish: ({ messages }) => {
      persistJournalRef.current(messages, JOURNAL_ASSISTANT_ROLES)
    },
  })

  useEffect(() => {
    const thread = runtime.thread as {
      getState?: () => { isRunning?: boolean; messages?: unknown }
      subscribe?: (listener: () => void) => () => void
    }
    let seenRunning = false
    const sync = () => {
      const state = thread.getState?.()
      const running = Boolean(state?.isRunning)
      setThreadRunning(running)
      persistJournalRef.current(normalizeUiMessages(state?.messages), JOURNAL_USER_ROLES)
      if (running) {
        seenRunning = true
        return
      }
      if (!seenRunning || !fillingRef.current) return
      fillingRef.current = false
      setFilling(false)
    }
    sync()
    return thread.subscribe?.(sync)
  }, [runtime])

  useEffect(() => {
    const flying = extractionItems.filter((item) => item.status === 'uploaded' || item.status === 'confirmed')
    if (flying.length === 0) return
    const oldest = flying.reduce((min, item) => {
      const ts = Date.parse(item.updatedAt)
      return Number.isFinite(ts) && ts < min ? ts : min
    }, Number.POSITIVE_INFINITY)
    const wait = Math.max(0, EXTRACTION_SLOW_MS - (Date.now() - (Number.isFinite(oldest) ? oldest : Date.now())))
    const timer = window.setTimeout(() => setNowMs(Date.now()), wait + 50)
    return () => window.clearTimeout(timer)
  }, [extractionItems])

  useEffect(() => {
    const fromThread = extractionReadyIdsFromTexts(
      textsFromUnknownMessages((runtime.thread as { getState?: () => { messages?: unknown } }).getState?.().messages),
    )
    const fromJournal = extractionReadyIdsFromTexts(journalRows.map((message) => journalText(message, locale)))
    for (const item of extractionItems) {
      if (fromThread.has(item.id) || fromJournal.has(item.id) || readAutoturnFired(sessionId, item.id)) {
        firedIds.current.add(item.id)
      }
    }

    const candidate = nextAutoTurnItem(pendingSeen.current, extractionItems, firedIds.current)
    pendingSeen.current = nextPendingSeen(pendingSeen.current, extractionItems, firedIds.current)
    if (!shouldAutoTurn(threadRunning, candidate) || !candidate) return
    if (candidate.status !== 'parsed' && candidate.status !== 'rejected') return

    firedIds.current.add(candidate.id)
    writeAutoturnFired(sessionId, candidate.id)
    fillingRef.current = true
    setFillingFileName(candidate.fileName)
    setFilling(true)
    void runtime.thread.append({
      role: 'user',
      content: [
        {
          type: 'text',
          text: formatExtractionReady({
            itemId: candidate.id,
            status: candidate.status,
            organizationId,
          }),
        },
      ],
    })
  }, [extractionItems, journalRows, locale, organizationId, runtime, sessionId, threadRunning])

  useEffect(() => {
    if (!filling) return
    const timer = window.setTimeout(() => {
      fillingRef.current = false
      setFilling(false)
    }, EXTRACTION_SLOW_MS)
    return () => window.clearTimeout(timer)
  }, [filling])

  const banner = extractionBanner(extractionItems, nowMs, filling, fillingFileName)

  const actions = useMemo<IntakeActions>(
    () => ({
      send: (text) => {
        void runtime.thread.append({ role: 'user', content: [{ type: 'text', text }] })
      },
      composerItemType,
      setItemType: (value) => {
        itemType.current = value
      },
      attachDocument: (value) => {
        itemType.current = value
        void pickIntakeFile().then((file) => {
          if (!file) return
          setUploadError(null)
          return runtime.thread.composer.addAttachment(file).catch((error: unknown) => {
            setUploadError(() => error)
          })
        })
      },
      approveDraft: (scope, _entityId) => {
        if (scope === 'company') approveCompany.mutate()
        else if (productId) approveProduct.mutate()
      },
      busy: approveCompany.isPending || approveProduct.isPending,
    }),
    [runtime, approveCompany, approveProduct, productId, composerItemType],
  )

  // Загрузка падает вне нити: сообщение агенту не уходит, вложение остаётся в
  // композере. Показываем причину рядом с чатом, чтобы можно было повторить.
  const failure = uploadError ?? approveCompany.error ?? approveProduct.error ?? journalError

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <IntakeActionsProvider value={actions}>
        <ExtractionUiContext.Provider value={{ banner }}>
          <IntakeToolUIs />
          <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
            <div className="space-y-2">
              {failure ? <p className="text-sm text-destructive">{describeError(failure)}</p> : null}
              {journalFailed ? <p className="text-sm text-destructive">{describeError(journalLoadError)}</p> : null}
              <Thread />
            </div>
            <div className="max-h-[min(72vh,720px)] space-y-4 overflow-y-auto">
              <ProgressPanel sections={sections} missing={missing} percent={percent} title={title} />
              {aside}
            </div>
          </div>
        </ExtractionUiContext.Provider>
      </IntakeActionsProvider>
    </AssistantRuntimeProvider>
  )
}
